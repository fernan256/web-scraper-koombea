const { DataTypes } = require('sequelize');
const sequelizePaginate = require('sequelize-paginate');
const sequelize = require('../config/database');

const Link = sequelize.define('Link', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  url: {
    type: DataTypes.STRING(2048),
    allowNull: false
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Pages',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['pageId']
    }
  ]
});

sequelizePaginate.paginate(Link);

module.exports = Link;
