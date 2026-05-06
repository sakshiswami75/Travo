const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Alert = require('./models/Alert');
const Route = require('./models/Route');

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB Connected for seeding');
};

const seedData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Alert.deleteMany();
    await Route.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password,
      safetyScore: 92,
      avgSpeed: 45,
      routesSafePercentage: 88
    });

    await Alert.insertMany([
      { title: 'Severe Pothole', description: 'Deep pothole reported on Main St.', severity: 'High', location: 'Main St', distance: '0.5 km away' },
      { title: 'Road Work', description: 'Construction ahead, expect delays.', severity: 'Moderate', location: '5th Avenue', distance: '1.2 km away' },
      { title: 'Slippery Road', description: 'Recent rain caused slippery conditions.', severity: 'Low', location: 'Highway 1', distance: '3.4 km away' }
    ]);

    await Route.insertMany([
      { startPoint: 'Home', endPoint: 'Work', safetyLevel: 'High', trafficLevel: 'Light' },
      { startPoint: 'Home', endPoint: 'Gym', safetyLevel: 'Moderate', trafficLevel: 'Moderate' }
    ]);

    console.log('Data seeded successfully');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
