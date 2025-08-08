const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'default-secret-key',
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
};

module.exports = {
  generateToken,
  verifyToken
};
