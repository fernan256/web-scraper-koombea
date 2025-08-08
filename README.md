# Web Scraper Application

A full-stack web application that allows users to scrape web pages and extract all links. Users can register, add URLs to scrape, and view the extracted links from each page.

## Features

- User registration and authentication
- Add URLs to scrape
- Asynchronous web scraping
- View scraped pages with link counts
- View detailed link information for each page
- Delete scraped pages (cascades to delete all associated links)
- Delete individual links from scraped pages
- Pagination support for both pages and links
- Real-time status updates for scraping progress

## Architecture

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Frontend**: Plain HTML, CSS, and vanilla JavaScript
- **Authentication**: JWT tokens
- **Web Scraping**: Cheerio library

## Prerequisites

- Docker and Docker Compose (for Docker setup)
- OR
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm

## Installation and Setup

This application can be run in two ways: with Docker (recommended) or locally.

### Option 1: Running with Docker (Recommended)

#### Prerequisites
- Docker and Docker Compose installed

#### Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd web-scraper-koombea
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and set:
   - `POSTGRES_PASSWORD` - a secure password
   - `JWT_SECRET` - a secure random string

4. Start all services:
   ```bash
   docker-compose up --build
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Option 2: Running Locally

#### Prerequisites
- Node.js 18+ installed
- PostgreSQL installed and running
- Database `web_scraper` created

#### Backend Setup

1. Clone the repository and navigate to backend:
   ```bash
   git clone <repository-url>
   cd web-scraper-koombea/backend
   ```

2. Copy the local environment file:
   ```bash
   cp .env.local.example .env
   ```

3. Edit `.env` and update:
   - `DB_HOST=localhost`
   - `DB_PORT=5432`
   - `DB_NAME=web_scraper`
   - `DB_USER=your_postgres_user`
   - `DB_PASSWORD=your_postgres_password`
   - `JWT_SECRET=your_secure_jwt_secret_here`

4. Create PostgreSQL database (if not exists):
   ```bash
   Create the corresponding web_scraper database
   ```

5. Install dependencies:
   ```bash
   npm install
   ```

6. Start the backend server:
   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:5000`

#### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start the frontend server:
   ```bash
   node server.js
   ```

   The frontend will run on `http://localhost:3000`

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Register a new account or login with existing credentials
3. Add URLs to scrape using the form on the dashboard
4. View the scraping progress (pending → processing → completed)
5. Click "View Links" to see all extracted links from a completed page
6. Use pagination to navigate through multiple pages or links

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Pages (Protected)
- `GET /api/pages` - Get user's scraped pages
- `POST /api/pages` - Add new URL to scrape
- `GET /api/pages/:id` - Get page details
- `GET /api/pages/:pageId/links` - Get links for a specific page
- `DELETE /api/pages/:id` - Delete a page and all its links
- `DELETE /api/pages/links/:linkId` - Delete a specific link

## How the Scraper and Queue System Works

### Web Scraper

The scraper (`backend/src/services/scraper.js`) uses the following approach:

1. **HTTP Request**: Uses Axios to fetch the web page with browser-like headers to avoid being blocked
2. **HTML Parsing**: Uses Cheerio (jQuery-like server-side DOM manipulation) to parse the HTML
3. **Link Extraction**:
   - Finds all `<a>` tags with `href` attributes
   - Skips `javascript:` and `mailto:` links
   - Extracts link text with fallbacks (text content → image alt → title attribute)
   - Converts relative URLs to absolute URLs
4. **Data Storage**: Saves extracted links to the database with the page reference
5. **Error Handling**: Updates page status to 'failed' with error message if scraping fails

### Queue System

The queue system (`backend/src/services/scraperQueue.js`) manages scraping jobs asynchronously:

1. **Job Queue**: Maintains an in-memory array of pending scraping jobs
2. **Concurrent Processing**: Processes up to 3 URLs simultaneously (configurable via `MAX_CONCURRENT_SCRAPERS`)
3. **Job Lifecycle**:
   - `pending` → Job added to queue
   - `processing` → Job being scraped
   - `completed` → Successfully scraped with links extracted
   - `failed` → Error occurred (rate limiting, network issues, etc.)
4. **Automatic Processing**: Starts processing immediately when jobs are added
5. **Error Recovery**: Failed jobs are marked but don't stop the queue
6. **History Tracking**: Keeps last 100 completed/failed jobs for monitoring

### Workflow

1. User adds URL → Creates Page record with status 'pending'
2. Page is added to the scraper queue
3. Queue processor picks up the job when a slot is available
4. Scraper fetches and parses the page
5. Links are extracted and saved to database
6. Page status updated to 'completed' or 'failed'
7. Frontend polls for updates every 5 seconds

## Project Structure

```
web-scraper-koombea/
├── backend/
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── middleware/    # Authentication middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   │   ├── scraper.js      # Web scraping logic
│   │   │   └── scraperQueue.js # Queue management
│   │   ├── utils/         # Utility functions
│   │   └── index.js       # Main server file
│   ├── tests/             # Test files
│   ├── Dockerfile         # Docker configuration for backend
│   ├── package.json
│   ├── .env.example       # Example environment variables
│   └── .env.local.example # Example for local development
├── frontend/
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   ├── index.html         # Dashboard
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── page-details.html  # Page details view
│   ├── Dockerfile         # Docker configuration for frontend
│   └── server.js          # Static file server
├── docker-compose.yml     # Docker Compose configuration
├── .env.example           # Example environment variables for Docker
├── .gitignore            # Git ignore file
└── README.md             # Project documentation
```

## Testing

### Backend Tests

Run the test suite:

```bash
cd backend && npm run test
```

Run tests with coverage:

```bash
cd backend && npm  run test -- --coverage
```
