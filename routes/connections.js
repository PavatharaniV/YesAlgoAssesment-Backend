const router = require('express').Router();
const User = require('../models/user');
const auth = require('../middlewares/authMiddleware');
const Notification = require('../models/notification')

router.post('/request/:id', auth, async (req, res) => {
  try {
    const receiver = await User.findById(req.params.id);
    const sender = await User.findById(req.user._id);

    if (!receiver || !sender) return res.status(404).send('User not found');

    if (!receiver.connectionRequests.includes(sender._id)) {
      receiver.connectionRequests.push(sender._id);
      await receiver.save();

      await Notification.create({
        user: receiver._id, 
        from: sender._id,  
        type: 'connection_request',
        message: `${sender.name} sent you a connection request`,
      });
    }

    res.send('Request sent');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/connected', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('connections', 'name designation');
    if (!user) return res.status(404).send('User not found');
    res.json(user.connections);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


router.get('/requested', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate('connectionRequests', 'name designation');

    if (!currentUser) return res.status(404).send('User not found');

    res.json(currentUser.connectionRequests); 
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
router.post('/accept/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const sender = await User.findById(req.params.id);

    if (!user || !sender) return res.status(404).send('User not found');

    if (!user.connections.includes(sender._id)) {
      user.connections.push(sender._id);
      sender.connections.push(user._id);
      user.connectionRequests.pull(sender._id);
      await user.save();
      await sender.save();

      await Notification.create({
        user: sender._id,
        from: user._id,
        type: 'connection_accepted',
        message: `${user.name} accepted your connection request`,
      });
    }

    res.send('Connection accepted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


router.post('/remove/:id', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  const other = await User.findById(req.params.id);
  user.connections.pull(other._id);
  other.connections.pull(user._id);
  await user.save();
  await other.save();
  res.send('Connection removed');
});

router.post('/cancel-request/:id', auth, async (req, res) => {
  const receiver = await User.findById(req.params.id);
  receiver.connectionRequests.pull(req.user._id);
  await receiver.save();
  res.send('Request canceled');
});

module.exports = router;
