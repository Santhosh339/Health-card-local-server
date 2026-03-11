import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    school: { type: String, required: true },
    className: { type: String, required: true },
    studentName: { type: String, required: true },
    section: { type: String, default: 'A' },
    rollNo: { type: String, default: '' },
    gender: { type: String, default: '' },
    dob: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    parentName: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

if (mongoose.models.Student) {
    delete mongoose.models.Student;
}
const Student = mongoose.model('Student', studentSchema, 'students');

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const school = searchParams.get('school');
        const className = searchParams.get('class');

        let query = {};
        if (school) {
            query.school = { $regex: new RegExp(`^${school.trim()}$`, 'i') };
        }
        if (className) {
            query.className = { $regex: new RegExp(`^${className.trim()}$`, 'i') };
        }

        const students = await Student.find(query).lean();

        // Custom sort to handle roll numbers numerically
        students.sort((a, b) => {
            const rollA = parseInt(a.rollNo) || 0;
            const rollB = parseInt(b.rollNo) || 0;
            if (rollA !== rollB) return rollA - rollB;
            return a.studentName.localeCompare(b.studentName);
        });

        return NextResponse.json(students);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        // Check if it's an array for bulk import
        if (Array.isArray(body)) {
            const result = await Student.insertMany(body);
            return NextResponse.json({ message: `${result.length} students added successfully.`, insertedCount: result.length }, { status: 201 });
        } else {
            const newStudent = new Student(body);
            const savedStudent = await newStudent.save();
            return NextResponse.json(savedStudent, { status: 201 });
        }
    } catch (error) {
        console.error('Error saving student(s):', error.message);
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

        const deletedStudent = await Student.findByIdAndDelete(id);

        if (!deletedStudent) {
            return NextResponse.json({ message: 'Student not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Student deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
