const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const {
  MAX_NAME_LENGTH,
  MAX_BIO_LENGTH,
  MAX_EXPERIENCE_LENGTH,
  MAX_SKILLS_COUNT,
  MAX_SKILL_LENGTH,
  MAX_USERS_PER_PAGE,
  DEFAULT_USERS_PER_PAGE,
  VALID_ROLES
} = require('../config/constants');

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
    
    // Validate and update profile fields
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length > MAX_NAME_LENGTH) {
        return res.status(400).json({ error: `Invalid name (max ${MAX_NAME_LENGTH} characters)` });
      }
      user.profile.name = name.trim();
    }
    
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      user.profile.role = role;
    }
    
    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({ error: 'Skills must be an array' });
      }
      if (skills.length > MAX_SKILLS_COUNT) {
        return res.status(400).json({ error: `Too many skills (max ${MAX_SKILLS_COUNT})` });
      }
      user.profile.skills = skills.map(s => String(s).trim().substring(0, MAX_SKILL_LENGTH)).filter(s => s.length > 0);
    }
    
    if (experience !== undefined) {
      if (typeof experience !== 'string' || experience.length > MAX_EXPERIENCE_LENGTH) {
        return res.status(400).json({ error: `Invalid experience (max ${MAX_EXPERIENCE_LENGTH} characters)` });
      }
      user.profile.experience = experience.trim();
    }
    
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > MAX_BIO_LENGTH) {
        return res.status(400).json({ error: `Invalid bio (max ${MAX_BIO_LENGTH} characters)` });
      }
      user.profile.bio = bio.trim();
    }
    
    if (lookingForTeam !== undefined) {
      user.profile.lookingForTeam = Boolean(lookingForTeam);
    }
    
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
    const { lookingForTeam, role, page = 1, limit = DEFAULT_USERS_PER_PAGE } = req.query;
    
    const filter = { _id: { $ne: req.session.userId } };
    
    if (lookingForTeam === 'true') {
      filter['profile.lookingForTeam'] = true;
    }
    
    if (role) {
      filter['profile.role'] = role;
    }
    
    // Validate pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
    
    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'Invalid limit' });
    }
    
    const validatedLimit = Math.min(limitNum, MAX_USERS_PER_PAGE);
    
    const users = await User.find(filter)
      .select('username firstName lastName profile')
      .skip((pageNum - 1) * validatedLimit)
      .limit(validatedLimit);
    
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
