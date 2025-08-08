const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .isLength({ min: 3, max: 50 })
      .withMessage('Email must be between 3 and 50 characters'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, email, password } = req.body;

      const existingUser = await User.findOne({ 
        where: { 
          [Op.or]: [
            { username },
            { email }
          ]
        } 
      });
      
      if (existingUser) {
        if (existingUser.username === username) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        if (existingUser.email === email) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }

      const user = await User.create({ username, email, password });
      
      const token = generateToken(user.id);

      res.status(201).json({
        user: user.toJSON(),
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

router.post('/login',
  [
    body('username').trim().notEmpty().withMessage('Username or email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await User.findOne({ 
        where: { 
          [Op.or]: [
            { username },
            { email: username }
          ]
        } 
      });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user.id);

      res.json({
        user: user.toJSON(),
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
);

module.exports = router;
