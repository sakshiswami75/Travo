const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Route files
const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const reportRoutes = require('./routes/reports');
const mapRoutes = require('./routes/maps');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/maps', mapRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Travo API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Nodemon restarted successfully');
});
// Nodemon restart again
