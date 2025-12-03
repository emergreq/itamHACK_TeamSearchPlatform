const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyAuthCode } = require('../config/telegramBot');

// Verify auth code and create session
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Auth code is required' });
    }
    
    const telegramId = verifyAuthCode(code);
    
    if (!telegramId) {
      return res.status(401).json({ error: 'Invalid or expired auth code' });
    }
    
    const user = await User.findOne({ telegramId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create session
    req.session.userId = user._id.toString();
    req.session.telegramId = telegramId;
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = await User.findById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profile: user.profile
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

module.exports = router;
