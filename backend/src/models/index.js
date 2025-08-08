const sequelize = require('../config/database');
const User = require('./User');
const Page = require('./Page');
const Link = require('./Link');

User.hasMany(Page, {
  foreignKey: 'userId',
  as: 'pages',
  onDelete: 'CASCADE'
});

Page.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Page.hasMany(Link, {
  foreignKey: 'pageId',
  as: 'links',
  onDelete: 'CASCADE'
});

Link.belongsTo(Page, {
  foreignKey: 'pageId',
  as: 'page'
});

module.exports = {
  sequelize,
  User,
  Page,
  Link
};
