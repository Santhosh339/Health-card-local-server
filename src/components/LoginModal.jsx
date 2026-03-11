'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Phone, MapPin, Building2, ShieldCheck, ArrowRight, Loader2, X, CheckCircle2, XCircle, Eye, EyeOff, Hash, Globe } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import './LoginModal.css';
import { validatePhone, validateEmail, validateFullName } from '../utils/validation';
import { statesData } from '../utils/statesData';

// ── Reusable password requirements checker ──────────────────────────────────
function PasswordRequirements({ password, isTyping }) {
    if (!password) return null;
    const rules = [
        { label: 'At least 6 characters', ok: password.length >= 6 },
        { label: 'One uppercase letter (A–Z)', ok: /[A-Z]/.test(password) },
        { label: 'One number (0–9)', ok: /\d/.test(password) },
        { label: 'One special character (!@#$…)', ok: /[\W_]/.test(password) },
    ];
    const allMet = rules.every(r => r.ok);

    if (!isTyping) {
        if (allMet) {
            const isVeryStrong = password.length >= 10;
            return (
                <div className={`pw-strength-msg ${isVeryStrong ? 'very-strong' : 'strong'}`}>
                    {isVeryStrong ? '✨ Very Strong Password' : '✅ Strong Password'}
                </div>
            );
        } else {
            return (
                <div className="pw-strength-msg weak">
                    <div className="weak-title">⚠️ Weak Password. Needs:</div>
                    <div className="pw-rules inline-rules">
                        {rules.map((r, i) => !r.ok && (
                            <div key={r.label} className="pw-rule fail">
                                <XCircle size={13} />
                                <span>{r.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="pw-rules">
            {rules.map((r) => (
                <div key={r.label} className={`pw-rule ${r.ok ? 'ok' : 'fail'}`}>
                    {r.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>{r.label}</span>
                </div>
            ))}
        </div>
    );
}

// ── Confirm password row ────────────────────────────────────────────────────
function ConfirmPasswordField({ password, confirm, onChange }) {
    const [show, setShow] = useState(false);
    const matches = confirm.length > 0 && password === confirm;
    const mismatch = confirm.length > 0 && password !== confirm;
    return (
        <div className="input-modal-group">
            <label>Confirm Password</label>
            <div className={`input-modal-wrapper ${matches ? 'pw-match' : mismatch ? 'pw-mismatch' : ''}`}>
                <Lock className="input-modal-icon" size={18} />
                <input
                    type={show ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={onChange}
                    required
                />
                <button type="button" className="pw-eye-btn" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {matches && <CheckCircle2 size={18} className="pw-match-icon" />}
            </div>
            {mismatch && <span className="pw-mismatch-msg">Passwords do not match</span>}
        </div>
    );
}

// ── Shared password field with show/hide ──────────────────────────────────
function PasswordField({ value, onChange, placeholder = 'Create Password', showRequirements = true }) {
    const [show, setShow] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!showRequirements) return;
        setIsTyping(true);
        const timer = setTimeout(() => {
            setIsTyping(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [value, showRequirements]);

    return (
        <div className="input-modal-group">
            <label>Password</label>
            <div className="input-modal-wrapper">
                <Lock className="input-modal-icon" size={18} />
                <input
                    type={show ? 'text' : 'password'}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onFocus={() => showRequirements && setIsTyping(true)}
                    required
                />
                <button type="button" className="pw-eye-btn" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {showRequirements && <PasswordRequirements password={value} isTyping={isTyping} />}
        </div>
    );
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess, onPrincipalLoginSuccess }) {
    const { showAlert } = useNotification();
    const [activeTab, setActiveTab] = useState('healthAssistant');
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Health Assistant
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [signupForm, setSignupForm] = useState({
        fullName: '', email: '', phone: '', state: '', district: '', idNumber: '', password: ''
    });
    const [haConfirm, setHaConfirm] = useState('');

    // Principal
    const [principalLoginForm, setPrincipalLoginForm] = useState({ email: '', password: '' });
    const [principalSignupForm, setPrincipalSignupForm] = useState({
        fullName: '', email: '', phone: '', schoolName: '', schoolCode: '', password: ''
    });
    const [pConfirm, setPConfirm] = useState('');

    const resetForms = (toSignUp) => {
        setLoginForm({ email: '', password: '' });
        setSignupForm({ fullName: '', email: '', phone: '', state: '', district: '', idNumber: '', password: '' });
        setHaConfirm('');
        setPrincipalLoginForm({ email: '', password: '' });
        setPrincipalSignupForm({ fullName: '', email: '', phone: '', schoolName: '', schoolCode: '', password: '' });
        setPConfirm('');
        if (toSignUp !== undefined) {
            setIsSignUp(toSignUp);
        }
    };

    useEffect(() => {
        if (isOpen) resetForms();
    }, [isOpen]);

    if (!isOpen) return null;

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/health-assistants/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('isHealthAssistantAuthenticated', 'true');
                localStorage.setItem('healthAssistantData', JSON.stringify(data.healthAssistant));
                alert('✅ Successful Login!');
                if (onLoginSuccess) onLoginSuccess();
                onClose();
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch { alert('An error occurred during login'); }
        finally { setIsLoading(false); }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        if (!validateFullName(signupForm.fullName)) { showAlert('Full Name must be at least 4 characters.', 'warning', 'Invalid Name'); return; }
        if (!validateEmail(signupForm.email)) { showAlert('Please check the email format.', 'warning', 'Invalid Email'); return; }
        if (!validatePhone(signupForm.phone)) { showAlert('Phone number must be 10 digits starting with 6, 7, 8, or 9.', 'warning', 'Invalid Phone'); return; }
        const cleanPhone = signupForm.phone.replace(/^\+91/, '').replace(/\s+/g, '');
        setIsLoading(true);
        try {
            const res = await fetch('/api/health-assistants', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...signupForm, phone: cleanPhone })
            });
            if (res.ok) { showAlert('Account created successfully! Please log in.', 'success', 'Welcome!'); setIsSignUp(false); setHaConfirm(''); }
            else { const err = await res.json(); showAlert(err.message || 'Signup failed', 'error', 'Error'); }
        } catch { showAlert('An error occurred during registration', 'error', 'Error'); }
        finally { setIsLoading(false); }
    };

    const handlePrincipalLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/principals/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(principalLoginForm)
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('isPrincipalAuthenticated', 'true');
                localStorage.setItem('principalData', JSON.stringify(data.principal));
                showAlert('Principal Login Successful!', 'success', 'Welcome');
                if (onPrincipalLoginSuccess) onPrincipalLoginSuccess(data.principal);
                onClose();
            } else { const err = await res.json(); showAlert(err.message || 'Login failed', 'error', 'Error'); }
        } catch { showAlert('An error occurred during login', 'error', 'Error'); }
        finally { setIsLoading(false); }
    };

    const handlePrincipalSignupSubmit = async (e) => {
        e.preventDefault();
        if (!validateFullName(principalSignupForm.fullName)) { showAlert('Full Name must be at least 4 characters.', 'warning', 'Invalid Name'); return; }
        if (!validateEmail(principalSignupForm.email)) { showAlert('Please check the email format.', 'warning', 'Invalid Email'); return; }
        if (!validatePhone(principalSignupForm.phone)) { showAlert('Phone number must be 10 digits starting with 6, 7, 8, or 9.', 'warning', 'Invalid Phone'); return; }
        if (principalSignupForm.password !== pConfirm) { showAlert('Passwords do not match.', 'warning', 'Mismatch'); return; }
        setIsLoading(true);
        try {
            const res = await fetch('/api/principals', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(principalSignupForm)
            });
            if (res.ok) { showAlert('Principal account created! Please log in.', 'success', 'Success'); setIsSignUp(false); setPConfirm(''); }
            else { const err = await res.json(); showAlert(err.message || 'Registration failed', 'error', 'Error'); }
        } catch { showAlert('An error occurred during registration', 'error', 'Error'); }
        finally { setIsLoading(false); }
    };



    return (
        <AnimatePresence>
            <div className="login-modal-overlay">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    className="login-modal-card"
                >
                    <button className="login-modal-close" onClick={onClose} aria-label="Close login modal"><X size={24} /></button>

                    <div className="login-modal-left">
                        <ShieldCheck size={48} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                        <h1>Healthcare Portal</h1>
                        <p>Secure access for specialized campus staff.</p>
                    </div>

                    <div className="login-modal-right">

                        <div className="login-modal-tabs">
                            <div className={`login-modal-tab ${activeTab === 'healthAssistant' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('healthAssistant'); resetForms(false); }}>Health Assistant</div>
                            <div className={`login-modal-tab ${activeTab === 'principal' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('principal'); resetForms(false); }}>Principal</div>
                        </div>

                        <div className="login-modal-body">
                            <AnimatePresence mode="wait">

                                {/* ── HA LOGIN ── */}
                                {activeTab === 'healthAssistant' && !isSignUp && (
                                    <motion.form key="ha-login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="auth-modal-form" onSubmit={handleLoginSubmit}>
                                        <div className="input-modal-group">
                                            <label>Email Address</label>
                                            <div className="input-modal-wrapper">
                                                <Mail className="input-modal-icon" size={18} />
                                                <input type="email" placeholder="assistant@campus.edu" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required />
                                            </div>
                                        </div>
                                        <PasswordField
                                            value={loginForm.password}
                                            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                                            placeholder="••••••••"
                                            showRequirements={false}
                                        />
                                        <button type="submit" className="btn-modal-submit" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Log In <ArrowRight size={18} /></>}
                                        </button>
                                        <div className="auth-modal-switch">Don't have an account? <button type="button" onClick={() => resetForms(true)}>Sign Up</button></div>
                                    </motion.form>
                                )}

                                {/* ── HA SIGNUP ── */}
                                {activeTab === 'healthAssistant' && isSignUp && (
                                    <motion.form key="ha-signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="auth-modal-form signup-form" onSubmit={handleSignupSubmit}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="input-modal-group">
                                                <label>Full Name</label>
                                                <div className={`input-modal-wrapper ${signupForm.fullName && signupForm.fullName.length < 4 ? 'input-invalid' : ''}`}>
                                                    <User className="input-modal-icon" size={18} />
                                                    <input type="text" placeholder="Full Name" value={signupForm.fullName} onChange={e => setSignupForm({ ...signupForm, fullName: e.target.value })} required />
                                                </div>
                                                {signupForm.fullName && signupForm.fullName.length < 4 && <span className="invalid-msg">invalid (Min 4 chars)</span>}
                                            </div>
                                            <div className="input-modal-group">
                                                <label>Phone</label>
                                                <div className="input-modal-wrapper"><Phone className="input-modal-icon" size={18} /><input type="text" placeholder="10-digit number" value={signupForm.phone} onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })} required /></div>
                                            </div>
                                        </div>
                                        <div className="input-modal-group">
                                            <label>Email Address</label>
                                            <div className="input-modal-wrapper"><Mail className="input-modal-icon" size={18} /><input type="email" placeholder="Email Address" value={signupForm.email} onChange={e => setSignupForm({ ...signupForm, email: e.target.value })} required /></div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="input-modal-group">
                                                <label>State</label>
                                                <div className="input-modal-wrapper">
                                                    <Globe className="input-modal-icon" size={18} />
                                                    <select
                                                        value={signupForm.state}
                                                        onChange={e => setSignupForm({ ...signupForm, state: e.target.value, district: '' })}
                                                        required
                                                    >
                                                        <option value="">Select State</option>
                                                        {Object.keys(statesData).sort().map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="input-modal-group">
                                                <label>District</label>
                                                <div className="input-modal-wrapper">
                                                    <MapPin className="input-modal-icon" size={18} />
                                                    <select
                                                        value={signupForm.district}
                                                        onChange={e => setSignupForm({ ...signupForm, district: e.target.value })}
                                                        required
                                                        disabled={!signupForm.state}
                                                    >
                                                        <option value="">Select District</option>
                                                        {signupForm.state && statesData[signupForm.state]?.sort().map(d => (
                                                            <option key={d} value={d}>{d}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="input-modal-group">
                                            <label>ID Number</label>
                                            <div className="input-modal-wrapper"><Hash className="input-modal-icon" size={18} /><input type="text" placeholder="ID Number" value={signupForm.idNumber} onChange={e => setSignupForm({ ...signupForm, idNumber: e.target.value })} required /></div>
                                        </div>
                                        <PasswordField value={signupForm.password} onChange={e => setSignupForm({ ...signupForm, password: e.target.value })} />
                                        <ConfirmPasswordField password={signupForm.password} confirm={haConfirm} onChange={e => setHaConfirm(e.target.value)} />
                                        <button type="submit" className="btn-modal-submit" disabled={isLoading || signupForm.password !== haConfirm}>
                                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Create Account <ArrowRight size={18} /></>}
                                        </button>
                                        <div className="auth-modal-switch">Already have an account? <button type="button" onClick={() => resetForms(false)}>Log In</button></div>
                                    </motion.form>
                                )}

                                {/* ── PRINCIPAL LOGIN ── */}
                                {activeTab === 'principal' && !isSignUp && (
                                    <motion.form key="p-login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="auth-modal-form" onSubmit={handlePrincipalLoginSubmit}>
                                        <div className="input-modal-group">
                                            <label>Principal Email</label>
                                            <div className="input-modal-wrapper">
                                                <Mail className="input-modal-icon" size={18} />
                                                <input type="email" placeholder="principal@school.edu" value={principalLoginForm.email} onChange={e => setPrincipalLoginForm({ ...principalLoginForm, email: e.target.value })} required />
                                            </div>
                                        </div>
                                        <PasswordField
                                            value={principalLoginForm.password}
                                            onChange={e => setPrincipalLoginForm({ ...principalLoginForm, password: e.target.value })}
                                            placeholder="••••••••"
                                            showRequirements={false}
                                        />
                                        <button type="submit" className="btn-modal-submit principal-btn" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Access Dashboard <ArrowRight size={18} /></>}
                                        </button>
                                        <div className="auth-modal-switch">New principal? <button type="button" onClick={() => resetForms(true)}>Register Here</button></div>
                                    </motion.form>
                                )}

                                {/* ── PRINCIPAL SIGNUP ── */}
                                {activeTab === 'principal' && isSignUp && (
                                    <motion.form key="p-signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="auth-modal-form signup-form" onSubmit={handlePrincipalSignupSubmit}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="input-modal-group">
                                                <label>Full Name</label>
                                                <div className={`input-modal-wrapper ${principalSignupForm.fullName && principalSignupForm.fullName.length < 4 ? 'input-invalid' : ''}`}>
                                                    <User className="input-modal-icon" size={18} />
                                                    <input type="text" placeholder="Full Name" value={principalSignupForm.fullName} onChange={e => setPrincipalSignupForm({ ...principalSignupForm, fullName: e.target.value })} required />
                                                </div>
                                                {principalSignupForm.fullName && principalSignupForm.fullName.length < 4 && <span className="invalid-msg">invalid (Min 4 chars)</span>}
                                            </div>
                                            <div className="input-modal-group">
                                                <label>Phone</label>
                                                <div className="input-modal-wrapper"><Phone className="input-modal-icon" size={18} /><input type="text" placeholder="Phone Number" value={principalSignupForm.phone} onChange={e => setPrincipalSignupForm({ ...principalSignupForm, phone: e.target.value })} required /></div>
                                            </div>
                                        </div>
                                        <div className="input-modal-group">
                                            <label>Email Address</label>
                                            <div className="input-modal-wrapper"><Mail className="input-modal-icon" size={18} /><input type="email" placeholder="principal@school.edu" value={principalSignupForm.email} onChange={e => setPrincipalSignupForm({ ...principalSignupForm, email: e.target.value })} required /></div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="input-modal-group">
                                                <label>School Name</label>
                                                <div className="input-modal-wrapper"><Building2 className="input-modal-icon" size={18} /><input type="text" placeholder="School Full Name" value={principalSignupForm.schoolName} onChange={e => setPrincipalSignupForm({ ...principalSignupForm, schoolName: e.target.value })} required /></div>
                                            </div>
                                            <div className="input-modal-group">
                                                <label>School Code</label>
                                                <div className="input-modal-wrapper"><ShieldCheck className="input-modal-icon" size={18} /><input type="text" placeholder="School Code" value={principalSignupForm.schoolCode} onChange={e => setPrincipalSignupForm({ ...principalSignupForm, schoolCode: e.target.value })} /></div>
                                            </div>
                                        </div>
                                        <PasswordField value={principalSignupForm.password} onChange={e => setPrincipalSignupForm({ ...principalSignupForm, password: e.target.value })} />
                                        <ConfirmPasswordField password={principalSignupForm.password} confirm={pConfirm} onChange={e => setPConfirm(e.target.value)} />
                                        <button type="submit" className="btn-modal-submit principal-btn" disabled={isLoading || principalSignupForm.password !== pConfirm}>
                                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Register as Principal <ArrowRight size={18} /></>}
                                        </button>
                                        <div className="auth-modal-switch">Already registered? <button type="button" onClick={() => resetForms(false)}>Log In</button></div>
                                    </motion.form>
                                )}

                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
