require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const jobRoutes = require('./routes/jobs');
const connectionRoutes = require('./routes/connections');

app.use(express.json());
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URI, ).then(()=>{
    console.log('db is connected');
}).catch(err=>console.log(err.message))

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/connections', connectionRoutes);

app.get('/', (req, res) => {
  res.send('Hello from the root route!');
});

console.log(process.env.MONGODB_URI);

app.listen(3000, () => console.log('Server running on port 3000'));
