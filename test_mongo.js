require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
}).then(() => {
    console.log('Successfully connected to MongoDB!');
    process.exit(0);
}).catch(err => {
    console.error('Connection error:', err.message);
    process.exit(1);
});
