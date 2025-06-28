const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const Post = require('../models/post');
const multer = require('multer');
const User = require('../models/user')
const Notification = require('../models/notification')

const upload = multer({ dest: 'uploads/' });

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { description, locked, isDraft } = req.body;
    const imagePath = req.file?.path;

    const post = new Post({
      user: req.user._id,
      image: imagePath,
      description,
      locked: locked || false,
      isDraft: isDraft === 'true' || false,
    });

    await post.save();

    if (!post.isDraft) {
      const currentUser = await User.findById(req.user._id);
      const connections = currentUser.connections;

      for (const connId of connections) {
        await Notification.create({
          user: connId,
          from: req.user._id,
          type: 'new_post',
          message: `${currentUser.name} posted a new update`,
        });
      }
    }

    res.send(post);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/myposts', auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/feed', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('connections');
    const posts = await Post.find({ user: { $in: user.connections } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name');
    res.json(posts);
  } catch (err) {
    console.error(err);

    res.status(500).send('Server error');
  }
});


router.get('/draft', auth, async (req, res) => {
  const draft = await Post.findOne({ user: req.user._id, isDraft: true }).sort({ createdAt: -1 });
  if (!draft) return res.status(204).send();
  res.send(draft);
});

router.post('/:id/comment', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.comments.push({ user: req.user._id, text: req.body.text });
  await post.save();
  res.send(post);
});

router.post('/:id/like', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post.likes.includes(req.user._id)) {
    post.likes.push(req.user._id);
  } else {
    post.likes.pull(req.user._id);
  }
  await post.save();
  res.send(post);
});

router.post('/:id/save', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.savedPosts.includes(req.params.id)) {
    user.savedPosts.push(req.params.id);
  } else {
    user.savedPosts.pull(req.params.id);
  }
  await user.save();
  res.send(user);
});

module.exports = router;
