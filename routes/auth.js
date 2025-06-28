const router = require('express').Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');
const Notification = require('../models/notification')

router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      phone,
      password: hash,
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send('User not found');
  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) return res.status(400).send('Invalid password');

  const token = jwt.sign(
    { _id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      userid: user._id,
      updated: user.updated,
      role:user.role
    },
  });
});

router.get('/limited-users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name designation connections connectionRequests')
      .limit(5);
    res.json(users);
  } catch (err) {
    res.status(500).send('Server error');
  }
});



router.put('/update-profile', authMiddleware, async (req, res) => {
  const { id, description, major, designation, education, currentlyWorking, company } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    user.id = id || user.id;
    user.description = description || user.description;
    user.education = education || user.profileducatione;
    user.designation = designation || user.designation;
    user.major = major || user.major;
    user.updated = true,
      user.currentlyWorking = currentlyWorking,
      user.company = company


    user.education = education,
      user.major = major

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).send('User not found');

    res.json(user);
  } catch (error) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/search/users', async (req, res) => {
  try {
    const keyword = req.body.search || '';
    const users = await User.find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ],
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/all_notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('from', 'message');
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
