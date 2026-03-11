'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import '../admin.css';

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const validate = () => {
        const newErrors = {};
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.success) {
                // Persistent authentication simulation
                localStorage.setItem('isAdminAuthenticated', 'true');
                router.push('/admin');
            } else {
                setServerError(data.message || 'Invalid email or password');
            }
        } catch (error) {
            setServerError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-layout" style={{ justifyContent: 'center', alignItems: 'center', background: '#f1f5f9' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="stat-card"
                style={{ width: '100%', maxWidth: '450px', padding: '3rem' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        background: '#3154c4',
                        width: '60px',
                        height: '60px',
                        borderRadius: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: 'white'
                    }}>
                        <Lock size={30} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Admin Portal</h1>
                    <p style={{ color: 'var(--admin-text-secondary)' }}>Sign in to manage Children Health</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-secondary)' }} />
                            <input
                                type="email"
                                className="admin-input"
                                style={{ width: '100%', paddingLeft: '2.5rem' }}
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {errors.email && (
                            <div style={{ color: 'var(--admin-danger)', fontSize: '0.75rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={12} /> {errors.email}
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-secondary)' }} />
                            <input
                                type="password"
                                className="admin-input"
                                style={{ width: '100%', paddingLeft: '2.5rem' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {errors.password && (
                            <div style={{ color: 'var(--admin-danger)', fontSize: '0.75rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={12} /> {errors.password}
                            </div>
                        )}
                    </div>

                    {serverError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--admin-danger)',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                fontSize: '0.875rem',
                                textAlign: 'center'
                            }}
                        >
                            {serverError}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="nav-item active"
                        style={{
                            justifyContent: 'center',
                            padding: '1rem',
                            border: 'none',
                            fontSize: '1rem',
                            marginTop: '1rem',
                            background: '#3154c4',
                            color: 'white'
                        }}
                    >
                        {loading ? <Loader2 className="spinner" size={20} /> : 'Login to Dashboard'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
                        © 2026 Vajra Admin Security. All signals encrypted.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
