const connectDB = require('../db/connect');
const mongoose = require('mongoose');
require("dotenv").config();

before(async function() {
  if (mongoose.connection.readyState === 0) {
    await connectDB(process.env.MONGO_URI_TEST);
  }
});

after(async function() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});