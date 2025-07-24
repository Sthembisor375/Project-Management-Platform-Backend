const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDb = require('./config/dbConnection');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5005;

// Connect to MongoDB
connectDb();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Project Manager Backend API');
});
app.use('/api/auth', authRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
