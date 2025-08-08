const { Sequelize } = require('sequelize');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'web_scraper',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
};

const config = {
  development: getDatabaseConfig(),
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: getDatabaseConfig()
};

let sequelize;
if (env === 'test') {
  sequelize = new Sequelize(config[env]);
} else {
  const dbConfig = getDatabaseConfig();
  if (typeof dbConfig === 'string') {
    sequelize = new Sequelize(dbConfig, {
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  } else {
    sequelize = new Sequelize(dbConfig);
  }
}

module.exports = sequelize;
