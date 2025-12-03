const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyAuthCode } = require('../config/telegramBot');

// Track auth code attempts per IP to prevent brute force
const authAttempts = new Map();

// Clean up old attempts every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of authAttempts.entries()) {
    if (now - data.timestamp > 15 * 60 * 1000) {
      authAttempts.delete(ip);
    }
  }
}, 60 * 1000);

// Verify auth code and create session
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Auth code is required' });
    }
    
    // Check for too many failed attempts from this IP
    const clientIp = req.ip || req.connection.remoteAddress;
    const attempts = authAttempts.get(clientIp);
    
    if (attempts && attempts.count >= 10 && Date.now() - attempts.timestamp < 15 * 60 * 1000) {
      return res.status(429).json({ error: 'Too many failed attempts. Please try again later.' });
    }
    
    const telegramId = verifyAuthCode(code);
    
    if (!telegramId) {
      // Track failed attempt
      if (attempts) {
        attempts.count++;
        attempts.timestamp = Date.now();
      } else {
        authAttempts.set(clientIp, { count: 1, timestamp: Date.now() });
      }
      return res.status(401).json({ error: 'Invalid or expired auth code' });
    }
    
    // Clear failed attempts on success
    authAttempts.delete(clientIp);
    
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
