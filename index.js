import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Student Health Record Schema
const healthRecordSchema = new mongoose.Schema({
    name: String,
    class: String,
    section: String,
    age: Number,
    gender: String,
    school: String,
    parentContact: String,
    // Add other fields from sections A, B, C as needed
    // You can also use a mixed type if the sections vary significantly
    data: mongoose.Schema.Types.Mixed,
    sectionType: { type: String, enum: ['A', 'B', 'C'] },
    createdAt: { type: Date, default: Date.now }
});

const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);

// Routes
app.post('/api/health-records', async (req, res) => {
    try {
        const newRecord = new HealthRecord(req.body);
        const savedRecord = await newRecord.save();
        res.status(201).json(savedRecord);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/health-records', async (req, res) => {
    try {
        const records = await HealthRecord.find().sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
