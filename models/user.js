const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  id: String,
  description: String,
  profile: String,
  password: String,
  email: {
    type: String,
    unique: true
  },
  designation: String,
  role: {
    type:String,
    default:'User'
  },
  phone: String,
  updated: {
    type: Boolean,
    default: false
  },
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'Post'
  }],
  connections: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  }],
  connectionRequests: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  }],
  education: String,
  major: String,
  currentlyWorking: {
    type: Boolean,
    default: false
  },
  company: String

});

module.exports = mongoose.model('User', userSchema);
