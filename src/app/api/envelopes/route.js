import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import mongoose from 'mongoose';

const envelopeSchema = new mongoose.Schema({
    school: { type: String, required: true },
    className: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

if (mongoose.models.Envelope) {
    delete mongoose.models.Envelope;
}
const Envelope = mongoose.model('Envelope', envelopeSchema, 'envelopes');

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const school = searchParams.get('school');

        if (!school) {
            return NextResponse.json({ message: "School name is required" }, { status: 400 });
        }

        const envelopes = await Envelope.find({
            school: { $regex: new RegExp(`^${school.trim()}$`, 'i') }
        }).sort({ className: 1 });
        return NextResponse.json(envelopes);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const { school, className } = await request.json();

        if (!school || !className) {
            return NextResponse.json({ message: "School and Class name are required" }, { status: 400 });
        }

        // Check if exists
        const exists = await Envelope.findOne({ school, className });
        if (exists) {
            return NextResponse.json({ message: "Envelope already exists" }, { status: 200 });
        }

        const newEnvelope = new Envelope({ school, className });
        const saved = await newEnvelope.save();
        return NextResponse.json(saved, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
