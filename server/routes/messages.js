const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { sendMessageNotification } = require('../config/telegramBot');

// Get conversations (list of users with whom current user has exchanged messages)
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Get unique users from messages
    const messages = await Message.find({
      $or: [{ from: userId }, { to: userId }]
    })
    .populate('from', 'username firstName lastName')
    .populate('to', 'username firstName lastName')
    .sort({ createdAt: -1 });
    
    // Extract unique conversation partners
    const conversationMap = new Map();
    
    for (const msg of messages) {
      const partnerId = msg.from._id.toString() === userId 
        ? msg.to._id.toString() 
        : msg.from._id.toString();
      
      if (!conversationMap.has(partnerId)) {
        const partner = msg.from._id.toString() === userId ? msg.to : msg.from;
        
        // Count unread messages from this partner
        const unreadCount = await Message.countDocuments({
          from: partnerId,
          to: userId,
          read: false
        });
        
        conversationMap.set(partnerId, {
          userId: partnerId,
          username: partner.username,
          firstName: partner.firstName,
          lastName: partner.lastName,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount
        });
      }
    }
    
    res.json(Array.from(conversationMap.values()));
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages with a specific user
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const otherUserId = req.params.userId;
    
    const messages = await Message.find({
      $or: [
        { from: currentUserId, to: otherUserId },
        { from: otherUserId, to: currentUserId }
      ]
    })
    .populate('from', 'username firstName lastName')
    .populate('to', 'username firstName lastName')
    .sort({ createdAt: 1 });
    
    // Mark messages as read
    await Message.updateMany(
      { from: otherUserId, to: currentUserId, read: false },
      { read: true }
    );
    
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a message
router.post('/', requireAuth, async (req, res) => {
  try {
    const { to, content } = req.body;
    
    if (!to || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }
    
    const fromUserId = req.session.userId;
    
    // Check if recipient exists
    const recipient = await User.findById(to);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    // Get sender info
    const sender = await User.findById(fromUserId);
    
    // Create message
    const message = new Message({
      from: fromUserId,
      to,
      content,
      read: false
    });
    
    await message.save();
    
    // Populate sender and recipient info
    await message.populate('from', 'username firstName lastName');
    await message.populate('to', 'username firstName lastName');
    
    // Send Telegram notification to recipient
    const senderName = sender.firstName || sender.username;
    const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
    sendMessageNotification(recipient.telegramId, senderName, messagePreview);
    
    res.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get unread message count
router.get('/unread/count', requireAuth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      to: req.session.userId,
      read: false
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
