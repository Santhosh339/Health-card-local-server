import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import mongoose from 'mongoose';

// Define the Schema
const healthRecordSchema = new mongoose.Schema({
    name: String,
    class: String,
    section: String,
    age: Number,
    gender: String,
    school: String,
    parentContact: String,
    data: mongoose.Schema.Types.Mixed,
    sectionType: { type: String, enum: ['A', 'B', 'C', 'HEALTH_CARD'] },
    createdAt: { type: Date, default: Date.now }
}, { strict: false });

const HealthRecord = mongoose.models.HealthRecord || mongoose.model('HealthRecord', healthRecordSchema);

export async function GET(request) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const school = searchParams.get('school');
        const studentClass = searchParams.get('class');

        let query = {};
        if (school) {
            query.$or = [
                { school: { $regex: new RegExp(`^${school.trim()}$`, 'i') } },
                { schoolEnvelope: { $regex: new RegExp(`^${school.trim()}$`, 'i') } }
            ];
        }
        if (studentClass) {
            query.studentClass = { $regex: new RegExp(`^${studentClass.trim()}$`, 'i') };
        }

        const records = await HealthRecord.find(query).sort({ createdAt: -1 }).lean();
        return NextResponse.json(records);
    } catch (error) {
        console.error('Error fetching health records:', error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        console.log('Saving Health Record Payload:', body);
        const newRecord = new HealthRecord(body);
        const savedRecord = await newRecord.save();
        console.log('Record saved successfully:', savedRecord._id);
        return NextResponse.json(savedRecord, { status: 201 });
    } catch (error) {
        console.error('Error saving record API:', error.message);
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
export async function DELETE(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID is required' }, { status: 400 });
        }

        const deletedRecord = await HealthRecord.findByIdAndDelete(id);

        if (!deletedRecord) {
            return NextResponse.json({ message: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Record deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
