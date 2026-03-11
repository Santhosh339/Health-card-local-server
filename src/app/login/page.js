'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Phone, MapPin, Building2, ShieldCheck, ChevronLeft, ArrowRight, Loader2, Clock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { NotificationProvider, useNotification } from '../../context/NotificationContext';
import './login.css';
import { validatePhone, validateEmail, validateFullName } from '../../utils/validation';
import { statesData } from '../../utils/statesData';

export default function LoginPortal() {
    return (
        <LoginPortalContent />
    );
}

function PasswordField({ value, onChange, placeholder = 'Password', label = 'Password' }) {
    const [show, setShow] = useState(false);
    return (
        <div className="input-group">
            <label>{label}</label>
            <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                    type={show ? 'text' : 'password'}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required
                />
                <button type="button" className="pw-eye-btn" onClick={() => setShow(!show)}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );
}

function LoginPortalContent() {
    const { showAlert } = useNotification();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('healthAssistant'); // 'healthAssistant' | 'principal'
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // HealthAssistant Forms
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [signupForm, setSignupForm] = useState({
        fullName: '', email: '', phone: '', state: '', district: '', assignedCampus: '', idNumber: '', password: ''
    });

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/health-assistants/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('isHealthAssistantAuthenticated', 'true');
                localStorage.setItem('healthAssistantData', JSON.stringify(data.healthAssistant));
                showAlert('Successful Login!', 'success', 'Success');
                setTimeout(() => router.push('/'), 1000); // Slight delay for the success modal to be seen
            } else {
                const errorData = await res.json();
                showAlert(errorData.message || 'Login failed', 'error', 'Error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('An error occurred during login', 'error', 'Error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        if (!validateFullName(signupForm.fullName)) { showAlert('Full Name must be at least 4 characters.', 'warning', 'Invalid Name'); return; }
        if (!validateEmail(signupForm.email)) { showAlert('Please check the email format.', 'warning', 'Invalid Email'); return; }
        if (!validatePhone(signupForm.phone)) { showAlert('Phone number must be 10 digits starting with 6, 7, 8, or 9.', 'warning', 'Invalid Phone'); return; }
        setIsLoading(true);
        try {
            const res = await fetch('/api/health-assistants', { // uses the endpoint created for Admin panel earlier
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signupForm)
            });

            if (res.ok) {
                showAlert('Account created successfully! Please log in.', 'success', 'Success');
                setIsSignUp(false); // Switch back to login
            } else {
                const errorData = await res.json();
                showAlert(errorData.message || 'Signup failed', 'error', 'Error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showAlert('An error occurred during registration', 'error', 'Error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="login-card"
            >
                <div style={{ padding: '1.5rem 2rem 0', background: '#3154c4' }}>
                    <Link href="/" className="back-link" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        <ChevronLeft size={16} /> Back to Home
                    </Link>
                </div>

                <div className="login-header">
                    <ShieldCheck size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                    <h1>Healthcare Portal</h1>
                    <p>Secure access for specialized campus staff.</p>
                </div>

                <div className="login-tabs">
                    <div
                        className={`login-tab ${activeTab === 'healthAssistant' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('healthAssistant'); setIsSignUp(false); }}
                    >
                        Health Assistant Staff
                    </div>
                    <div
                        className={`login-tab ${activeTab === 'principal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('principal')}
                    >
                        Principal
                    </div>
                </div>

                <div className="login-body">
                    <AnimatePresence mode="wait">
                        {activeTab === 'healthAssistant' && !isSignUp && (
                            <motion.form
                                key="healthAssistant-login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="auth-form"
                                onSubmit={handleLoginSubmit}
                            >
                                <div className="input-group">
                                    <label>Email Address</label>
                                    <div className="input-wrapper">
                                        <Mail className="input-icon" size={18} />
                                        <input type="email" placeholder="healthAssistant@campus.edu" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required />
                                    </div>
                                </div>
                                <PasswordField
                                    value={loginForm.password}
                                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                                <button type="submit" className="btn-submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Log In <ArrowRight size={18} /></>}
                                </button>
                                <div className="auth-switch">
                                    Don't have an account? <button type="button" onClick={() => setIsSignUp(true)}>Sign Up</button>
                                </div>
                            </motion.form>
                        )}

                        {activeTab === 'healthAssistant' && isSignUp && (
                            <motion.form
                                key="healthAssistant-signup"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="auth-form"
                                onSubmit={handleSignupSubmit}
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label>Full Name</label>
                                        <div className={`input-wrapper ${signupForm.fullName && signupForm.fullName.length < 4 ? 'input-invalid' : ''}`}>
                                            <User className="input-icon" size={18} />
                                            <input type="text" placeholder="Full Name" value={signupForm.fullName} onChange={e => setSignupForm({ ...signupForm, fullName: e.target.value })} required />
                                        </div>
                                        {signupForm.fullName && signupForm.fullName.length < 4 && <span className="invalid-msg" style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.2rem' }}>invalid (Min 4 chars)</span>}
                                    </div>
                                    <div className="input-group">
                                        <label>Phone</label>
                                        <div className="input-wrapper">
                                            <Phone className="input-icon" size={18} />
                                            <input type="text" placeholder="Phone Number" value={signupForm.phone} onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })} required />
                                        </div>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Email Address</label>
                                    <div className="input-wrapper">
                                        <Mail className="input-icon" size={18} />
                                        <input type="email" placeholder="Email Address" value={signupForm.email} onChange={e => setSignupForm({ ...signupForm, email: e.target.value })} required />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label>State</label>
                                        <div className="input-wrapper">
                                            <MapPin className="input-icon" size={18} />
                                            <select
                                                value={signupForm.state}
                                                onChange={e => setSignupForm({ ...signupForm, state: e.target.value, district: '' })}
                                                required
                                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1.5px solid #e2e8f0' }}
                                            >
                                                <option value="">Select State</option>
                                                {Object.keys(statesData).sort().map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>District</label>
                                        <div className="input-wrapper">
                                            <MapPin className="input-icon" size={18} />
                                            <select
                                                value={signupForm.district}
                                                onChange={e => setSignupForm({ ...signupForm, district: e.target.value })}
                                                required
                                                disabled={!signupForm.state}
                                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1.5px solid #e2e8f0' }}
                                            >
                                                <option value="">Select District</option>
                                                {signupForm.state && statesData[signupForm.state]?.sort().map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Assigned Campus (School Code)</label>
                                    <div className="input-wrapper">
                                        <Building2 className="input-icon" size={18} />
                                        <input type="text" placeholder="Valid School Code" value={signupForm.assignedCampus} onChange={e => setSignupForm({ ...signupForm, assignedCampus: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>ID Number</label>
                                    <div className="input-wrapper">
                                        <ShieldCheck className="input-icon" size={18} />
                                        <input type="text" placeholder="ID Number" value={signupForm.idNumber} onChange={e => setSignupForm({ ...signupForm, idNumber: e.target.value })} required />
                                    </div>
                                </div>
                                <PasswordField
                                    label="Password"
                                    value={signupForm.password}
                                    onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                                    placeholder="Create Password"
                                />
                                <button type="submit" className="btn-submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Create Account <ArrowRight size={18} /></>}
                                </button>
                                <div className="auth-switch">
                                    Already have an account? <button type="button" onClick={() => setIsSignUp(false)}>Log In</button>
                                </div>
                            </motion.form>
                        )}

                        {activeTab === 'principal' && (
                            <motion.div
                                key="principal-login"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="coming-soon-wrapper"
                            >
                                <Clock size={48} className="icon" />
                                <h2>Coming Soon</h2>
                                <p>The Principal dashboard and login portal is currently under active development. Please check back later.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
