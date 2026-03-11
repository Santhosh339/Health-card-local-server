import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import mongoose from 'mongoose';

// Define the HealthAssistant Schema
const healthAssistantSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    state: String,
    district: String,
    assignedCampus: String, // Made optional, collected during daily intialization
    idNumber: String, // Optional ID Number, collected initially or later
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

if (mongoose.models.HealthAssistant) {
    delete mongoose.models.HealthAssistant;
}
const HealthAssistant = mongoose.model('HealthAssistant', healthAssistantSchema, 'nurses');

export async function GET() {
    try {
        await connectToDatabase();
        const healthAssistants = await HealthAssistant.find().sort({ createdAt: -1 });
        return NextResponse.json(healthAssistants);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        // Server-Side Validations
        const { password, phone } = body;

        // Password Validation: 6 chars, Capital, Special Char, Number
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
        if (!password || !passwordRegex.test(password)) {
            return NextResponse.json({
                message: 'Password must be at least 6 characters long, and contain at least one capital letter, one number, and one special character.'
            }, { status: 400 });
        }

        // Phone Number Validation & Cleaning
        if (!phone) {
            return NextResponse.json({ message: 'Phone number is required.' }, { status: 400 });
        }
        // Remove +91 (if exists) at the start and any spaces
        const cleanPhone = phone.replace(/^\+91/, '').replace(/\s+/g, '');
        if (!/^\d{10}$/.test(cleanPhone)) {
            return NextResponse.json({
                message: 'Invalid phone number. Must be a valid 10-digit number.'
            }, { status: 400 });
        }
        body.phone = cleanPhone;

        const { default: bcrypt } = await import('bcryptjs');
        const salt = await bcrypt.genSalt(12);
        body.password = await bcrypt.hash(password, salt);

        const newHealthAssistant = new HealthAssistant(body);
        const savedHealthAssistant = await newHealthAssistant.save();

        // Don't return the hashed password
        const responseData = savedHealthAssistant.toObject();
        delete responseData.password;

        return NextResponse.json(responseData, { status: 201 });
    } catch (error) {
        console.error('Error saving healthAssistant:', error.message);
        // Handle duplicate email error gracefully
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            return NextResponse.json({ message: 'A healthAssistant with this email is already registered.' }, { status: 400 });
        }
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
