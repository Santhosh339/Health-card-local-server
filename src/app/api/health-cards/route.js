import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import mongoose from 'mongoose';

// Define the Schema for Health Card
const healthCardSchema = new mongoose.Schema({
    name: String,
    age: String,
    dob: String,
    dobOrAge: String,
    date: String,
    sonOf: String,
    studentClass: String,
    rollNo: String,
    idNo: String,
    lFileNo: String,
    bloodGroup: String,
    school: String,
    address: String,
    address1: String,
    address2: String,
    dateOfIssue: String,
    validity: String,
    photoBase64: String, // To store the student's photo
    formData: mongoose.Schema.Types.Mixed, // Stores the full medical/skill form data
    createdAt: { type: Date, default: Date.now }
});

// Use a separate collection named 'healthcards'
const HealthCardModel = mongoose.models.HealthCard || mongoose.model('HealthCard', healthCardSchema, 'healthcards');

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        console.log('Saving to HealthCard collection:', body);

        const newRecord = new HealthCardModel(body);
        const savedRecord = await newRecord.save();

        return NextResponse.json(savedRecord, { status: 201 });
    } catch (error) {
        console.error('Error saving to healthcard collection:', error.message);
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}

export async function PUT(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { _id, ...updateData } = body;

        if (!_id) {
            return NextResponse.json({ message: 'Record ID is required for updating' }, { status: 400 });
        }

        const updatedRecord = await HealthCardModel.findByIdAndUpdate(_id, updateData, { new: true });

        if (!updatedRecord) {
            return NextResponse.json({ message: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json(updatedRecord, { status: 200 });
    } catch (error) {
        console.error('Error updating healthcard collection:', error.message);
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}

export async function GET(request) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const school = searchParams.get('school');
        const studentClass = searchParams.get('class');

        let query = {};
        if (school) {
            // Fuzzy match: ignore dots, multiple spaces, and case
            const fuzzySchool = school.replace(/\./g, '\\.?').replace(/\s+/g, '\\s+');
            query.school = { $regex: new RegExp(`^${fuzzySchool}$`, 'i') };
        }
        if (studentClass) {
            query.studentClass = { $regex: new RegExp(`^${studentClass}$`, 'i') };
        }

        const records = await HealthCardModel.find(query).sort({ createdAt: -1 }).lean();
        return NextResponse.json(records);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
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

        const deletedRecord = await HealthCardModel.findByIdAndDelete(id);

        if (!deletedRecord) {
            return NextResponse.json({ message: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Record deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
