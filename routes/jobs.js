const router = require('express').Router();
const Job = require('../models/jobs');
const auth = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const User = require('../models/user')
const Notification = require('../models/notification')

router.post('/create', auth, async (req, res) => {
  console.log('Token Received:', req.header('Authorization'));
  console.log('User from Token:', req.user);

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).send('User not found');

    if (user.role !== 'Admin') return res.status(403).send('Not authorized');

    const job = new Job({
      postedBy: user._id,
      isHiring: true,
      description: req.body.description,
      title: req.body.title,
    });

    await job.save();

    const nonAdminUsers = await User.find({ role: { $ne: 'admin' } });

    await Promise.ay
    (nonAdminUsers.map((u) =>
      Notification.create({
        user: u._id,
        type: 'job_posted',
        message: `New job posted: ${job.title}`,
      })
    ));

    res.send(job);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/user/all', auth, async (req, res) => {
  const jobs = await Job.find({ isHiring: true }).populate('postedBy', 'name email');
  res.json(jobs);
});

router.get('/admin/all', auth, async (req, res) => {
  const jobs = await Job.find({ postedBy: req.user._id });
  res.json(jobs);
});

router.post('/:id/apply', upload.single('resume'), async (req, res) => {
  const job = await Job.findById(req.params.id);
  job.applicants.push({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    workExperience: req.body.workExperience,
    resume: req.file.path,
  });
  await job.save();
  res.send(job);
});

router.post('/:id/archive', auth, async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (job.postedBy.toString() !== req.user._id.toString()) return res.status(403).send('Forbidden');
  job.isHiring = false;
  await job.save();
  res.send('Archived');
});

router.post('/:id/unarchive', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).send('Job not found');

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('Forbidden: You are not the poster of this job');
    }

    job.isHiring = true;
    await job.save();
    res.send('Job reposted successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (job.postedBy.toString() !== req.user._id.toString()) return res.status(403).send('Forbidden');
  await job.remove();
  res.send('Deleted');
});

router.post('/search/jobs', async (req, res) => {
  try {
    const keyword = req.body.search || '';
    const jobs = await Job.find({
      title: { $regex: keyword, $options: 'i' },
    });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
