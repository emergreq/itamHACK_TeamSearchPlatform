const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  photoUrl: String,
  authDate: Date,
  profile: {
    name: String,
    role: {
      type: String,
      enum: ['frontend', 'backend', 'fullstack', 'designer', 'project-manager', 'data-scientist', 'mobile', 'other'],
      default: 'other'
    },
    skills: [String],
    experience: String,
    bio: String,
    lookingForTeam: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
