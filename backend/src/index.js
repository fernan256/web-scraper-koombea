const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize, Page } = require('./models');
const authRoutes = require('./routes/auth');
const pagesRoutes = require('./routes/pages');
const scraperQueue = require('./services/scraperQueue');

const app = express();
const PORT = process.env.PORT || 5000;

let server;

// Middleware for security
app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiter
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api', limiter);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Load routes
app.use('/api/auth', authRoutes);
app.use('/api/pages', pagesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            error: 'Validation error',
            details: err.errors 
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ 
            error: 'Resource already exists' 
        });
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(err.statusCode || 500).json({ 
        error: isDevelopment ? err.message : 'Internal server error',
        ...(isDevelopment && { stack: err.stack })
    });
});

// Database connection and server initiation
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connection successful');

        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
        } else {
            await sequelize.sync();
        }
        console.log('Database models synced');

        const pendingPages = await Page.findAll({
            where: { status: 'pending' },
            order: [['createdAt', 'ASC']]
        });
        
        if (pendingPages.length > 0) {
            console.log(`Found ${pendingPages.length} pending pages, adding to queue...`);
            for (const page of pendingPages) {
                await scraperQueue.add(page.url, page.userId, page.id);
            }
        }

        server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Queue status:`, scraperQueue.getStatus());
        });
    } catch(error) {
        console.error('Something is wrong with the server, error: ', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    try {
        if (server) {
            console.log('Closing HTTP server...');
            await new Promise((resolve) => {
                server.close(resolve);
            });
            console.log('HTTP server closed');
        }

        const queueStatus = scraperQueue.getStatus();
        if (queueStatus.activeJobs > 0) {
            console.log(`Waiting for ${queueStatus.activeJobs} active jobs to complete...`);
            const timeout = setTimeout(() => {
                console.log('Timeout waiting for jobs to complete');
            }, 30000); // 30 second timeout
            
            while (scraperQueue.getStatus().activeJobs > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            clearTimeout(timeout);
        }

        console.log('Closing database connection...');
        await sequelize.close();
        console.log('Database connection closed');

        console.log('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
