import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const principalSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    schoolName: { type: String, required: true },
    schoolCode: { type: String },
    designation: { type: String, default: 'Principal' },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
if (mongoose.models.Principal) {
    delete mongoose.models.Principal;
}
const Principal = mongoose.model('Principal', principalSchema, 'principals');

export async function POST(request) {
    try {
        await connectToDatabase();
        const { email, password } = await request.json();

        const principal = await Principal.findOne({ email });
        if (!principal) {
            return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, principal.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
        }

        const { password: _, ...safeData } = principal.toObject();
        return NextResponse.json({ principal: safeData }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
