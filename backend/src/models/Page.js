const { DataTypes } = require('sequelize');
const sequelizePaginate = require('sequelize-paginate');
const sequelize = require('../config/database');

const Page = sequelize.define('Page', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  url: {
    type: DataTypes.STRING(2048),
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  linkCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  scrapedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    }
  ]
});

sequelizePaginate.paginate(Page);

module.exports = Page;
