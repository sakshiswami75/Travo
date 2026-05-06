require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function testConnection() {
  console.log('Testing connection to MongoDB...');
  console.log('URI:', process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected Successfully!');
    
    console.log('Testing User Creation...');
    const email = `test${Date.now()}@example.com`;
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({
      name: 'Test User',
      email: email,
      password: hashedPassword,
      role: 'Citizen'
    });
    
    console.log('User created successfully:', user);
    
    console.log('Testing User Login...');
    const foundUser = await User.findOne({ email }).select('+password');
    if (foundUser) {
      const isMatch = await bcrypt.compare(password, foundUser.password);
      console.log('Password match:', isMatch);
    }
    
    // Clean up
    await User.deleteOne({ email });
    console.log('Test user deleted.');
    
    process.exit(0);
  } catch (error) {
    console.error('MongoDB Error:', error);
    process.exit(1);
  }
}

testConnection();
