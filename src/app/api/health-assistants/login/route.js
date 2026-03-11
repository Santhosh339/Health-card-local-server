import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Simple in-memory rate limiter using Map (for MVP)
const rateLimitMap = new Map();

// HealthAssistant Schema reference to ensure we have it for login
const healthAssistantSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    assignedCampus: String,
    idNumber: String,
    password: { type: String, required: true }
}, { timestamps: true });

if (mongoose.models.HealthAssistant) {
    delete mongoose.models.HealthAssistant;
}
const HealthAssistant = mongoose.model('HealthAssistant', healthAssistantSchema, 'nurses');

export async function POST(req) {
    try {
        // IP-based Rate Limiting (blocks brute-force)
        const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
        const now = Date.now();
        const windowMs = 15 * 60 * 1000; // 15 minutes
        const maxAttempts = 5;

        let ipData = rateLimitMap.get(ip);
        if (!ipData) {
            ipData = { count: 1, resetTime: now + windowMs };
            rateLimitMap.set(ip, ipData);
        } else {
            if (now > ipData.resetTime) {
                ipData = { count: 1, resetTime: now + windowMs };
                rateLimitMap.set(ip, ipData);
            } else {
                ipData.count += 1;
                if (ipData.count > maxAttempts) {
                    return NextResponse.json(
                        { message: 'Too many attempts from this IP. Please try again in 15 minutes.' },
                        { status: 429 }
                    );
                }
            }
        }

        await connectDB();
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
        }

        // Find healthAssistant by email
        const healthAssistant = await HealthAssistant.findOne({ email });

        if (!healthAssistant) {
            return NextResponse.json({ message: 'Invalid credentials. HealthAssistant not found.' }, { status: 401 });
        }

        // Compare using bcrypt
        const isMatch = await bcrypt.compare(password, healthAssistant.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Invalid password.' }, { status: 401 });
        }

        // Reset rate limit on successful login
        rateLimitMap.delete(ip);

        // JWT (JSON Web Tokens) Implementation
        const secret = process.env.JWT_SECRET || 'healthcard_jwt_secret_key';
        const token = jwt.sign(
            { id: healthAssistant._id, email: healthAssistant.email },
            secret,
            { expiresIn: '1d' }
        );

        // Http-Only Cookie Implementation
        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 24 * 60 * 60 // 1 day
        });

        // Success - simple object response without returning the password
        return NextResponse.json({
            message: 'Login successful',
            healthAssistant: {
                id: healthAssistant._id,
                fullName: healthAssistant.fullName,
                email: healthAssistant.email,
                phone: healthAssistant.phone,
                state: healthAssistant.state,
                district: healthAssistant.district,
                assignedCampus: healthAssistant.assignedCampus,
                idNumber: healthAssistant.idNumber
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}
