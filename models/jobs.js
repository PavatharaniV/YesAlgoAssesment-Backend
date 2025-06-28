const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isHiring: Boolean,
  description: String,
  title: String,
  applicants: [
    {
      name: String,
      email: String,
      phone: String,
      workExperience: String,
      resume: String
    }
  ]
});

module.exports = mongoose.model('Job', jobSchema);
