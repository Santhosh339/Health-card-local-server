import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import mongoose from 'mongoose';

// Define the Campus Schema
const campusSchema = new mongoose.Schema({
    state: String,
    district: String,
    schoolName: { type: String, required: true },
    schoolCode: String,
    officialEmail: String,
    phoneNumber: String,
    address: {
        city: String,
        area: String,
        addressLine: String,
        pincode: String
    },
    principal: {
        name: String,
        phone: String,
        email: String
    },
    createdAt: { type: Date, default: Date.now }
});

if (mongoose.models.Campus) {
    delete mongoose.models.Campus;
}
const Campus = mongoose.model('Campus', campusSchema, 'campus');

export async function GET() {
    try {
        await connectToDatabase();
        const campuses = await Campus.find().sort({ createdAt: -1 });
        return NextResponse.json(campuses);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const newCampus = new Campus(body);
        const savedCampus = await newCampus.save();
        return NextResponse.json(savedCampus, { status: 201 });
    } catch (error) {
        console.error('Error saving campus:', error.message);
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
