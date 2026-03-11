import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '../../../../lib/mongodb';

const shiftSchema = new mongoose.Schema({
    // Using a flexible schema to avoid validation errors when fields change
}, { strict: false, timestamps: true });

// Force refresh model to apply schema changes
mongoose.models = {}; 

const Shift = mongoose.models.Shift || mongoose.model('Shift', shiftSchema, 'shifts');

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const date = searchParams.get('date');

        if (!email || !date) {
            return NextResponse.json({ message: 'Email and date are required' }, { status: 400 });
        }

        await connectToDatabase();
        const shift = await Shift.findOne({ email, date });

        return NextResponse.json({ shift });
    } catch (error) {
        console.error('Error fetching shift:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connectToDatabase();
        const body = await req.json();

        // Ensure location is present to satisfy any potential DB-level constraints
        if (!body.location) {
            body.location = body.district || body.assignedCampus || 'Unknown';
        }

        // Ensure they haven't already initialized this date to avoid duplicate entries
        const existingShift = await Shift.findOne({ email: body.email, date: body.date });
        if (existingShift) {
            return NextResponse.json({ message: 'Shift already initialized for today', shift: existingShift }, { status: 200 });
        }

        const newShift = new Shift(body);
        await newShift.save();

        return NextResponse.json({ success: true, shift: newShift }, { status: 201 });
    } catch (error) {
        console.error('Error saving shift:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error', errors: error.errors }, { status: 500 });
    }
}
