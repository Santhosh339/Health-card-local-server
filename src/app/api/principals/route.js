import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
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

// Reuse the Campus schema that admin already populates (includes principal.email)
const campusSchema = new mongoose.Schema({
    state: String,
    district: String,
    schoolName: String,
    schoolCode: String,
    officialEmail: String,
    phoneNumber: String,
    address: { city: String, area: String, addressLine: String, pincode: String },
    principal: { name: String, phone: String, email: String },
    createdAt: { type: Date, default: Date.now }
});

if (mongoose.models.Principal) {
    delete mongoose.models.Principal;
}
if (mongoose.models.Campus) {
    delete mongoose.models.Campus;
}
const Principal = mongoose.model('Principal', principalSchema, 'principals');
const Campus = mongoose.model('Campus', campusSchema, 'campus');

export async function GET() {
    try {
        await connectToDatabase();
        const principals = await Principal.find({}, '-password').sort({ createdAt: -1 });
        return NextResponse.json(principals);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const emailLower = body.email?.toLowerCase().trim();

        // Step 1: Check if this email was added by admin in any campus record
        // Escape special characters in regex so '.' is not treated as a wildcard
        const escapedEmail = emailLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const approvedCampus = await Campus.findOne({
            'principal.email': { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
        });

        if (!approvedCampus) {
            return NextResponse.json({
                message: 'Your email is not registered by the admin. Please contact your admin to get access.'
            }, { status: 403 });
        }

        // Step 2: Check if a principal account already exists for this email
        const existing = await Principal.findOne({ email: emailLower });
        if (existing) {
            return NextResponse.json({
                message: 'An account with this email already exists. Please log in instead.'
            }, { status: 400 });
        }

        // Step 3: Create the account
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const newPrincipal = new Principal({
            ...body,
            email: emailLower,
            // Auto-fill schoolName from campus if not provided
            schoolName: body.schoolName || approvedCampus.schoolName || '',
            password: hashedPassword
        });
        const saved = await newPrincipal.save();

        const { password: _, ...safeData } = saved.toObject();
        return NextResponse.json(safeData, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
