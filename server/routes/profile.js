const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// Get user profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profile: user.profile || {}
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/', requireAuth, async (req, res) => {
  try {
    const { name, role, skills, experience, bio, lookingForTeam } = req.body;
    
    const user = await User.findById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Initialize profile if it doesn't exist
    if (!user.profile) {
      user.profile = {};
    }
    
    // Update profile fields
    if (name !== undefined) user.profile.name = name;
    if (role !== undefined) user.profile.role = role;
    if (skills !== undefined) user.profile.skills = skills;
    if (experience !== undefined) user.profile.experience = experience;
    if (bio !== undefined) user.profile.bio = bio;
    if (lookingForTeam !== undefined) user.profile.lookingForTeam = lookingForTeam;
    
    await user.save();
    
    res.json({
      success: true,
      profile: user.profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (for finding teammates)
router.get('/users', requireAuth, async (req, res) => {
  try {
    const { lookingForTeam, role, page = 1, limit = 50 } = req.query;
    
    const filter = { _id: { $ne: req.session.userId } };
    
    if (lookingForTeam === 'true') {
      filter['profile.lookingForTeam'] = true;
    }
    
    if (role) {
      filter['profile.role'] = role;
    }
    
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100); // Max 100 per page
    
    const users = await User.find(filter)
      .select('username firstName lastName profile')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific user profile
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username firstName lastName profile');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
