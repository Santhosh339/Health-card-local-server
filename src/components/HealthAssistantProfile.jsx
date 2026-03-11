'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, ShieldCheck, Building2, UploadCloud, Calendar, CheckCircle2, LogOut } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import './HealthAssistantProfile.css';
import { statesData } from '../utils/statesData';

export default function HealthAssistantProfile({ healthAssistantData, onLogout }) {
    const { showAlert } = useNotification();
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [initForm, setInitForm] = useState({
        assignedCampus: healthAssistantData?.assignedCampus || '',
        idNumber: healthAssistantData?.idNumber || '',
        state: healthAssistantData?.state || '',
        district: healthAssistantData?.district || '',
        date: new Date().toISOString().split('T')[0]
    });
    const [isInitComplete, setIsInitComplete] = useState(false);
    const [campuses, setCampuses] = useState([]);
    const hasFetchedRef = React.useRef(false);

    useEffect(() => {
        const fetchCampuses = async () => {
            try {
                const res = await fetch('/api/campuses');
                if (res.ok) {
                    const data = await res.json();
                    setCampuses(data);
                }
            } catch (err) {
                console.error('Error fetching campuses:', err);
            }
        };
        fetchCampuses();
    }, []);

    useEffect(() => {
        // Load existing saved photo if any
        const savedPhoto = localStorage.getItem(`healthAssistantPhoto_${healthAssistantData?.email}`);
        if (savedPhoto) setProfilePhoto(savedPhoto);

        const checkTodayShift = async () => {
            const today = new Date().toISOString().split('T')[0];
            try {
                const res = await fetch(`/api/health-assistants/shifts?email=${healthAssistantData?.email}&date=${today}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.shift) {
                        setIsInitComplete(true);
                        const serverData = { ...data.shift, dateCompleted: data.shift.timestamp };
                        setInitForm(serverData);
                        localStorage.setItem(`healthAssistantInit_${healthAssistantData?.email}`, JSON.stringify(serverData));
                        window.dispatchEvent(new Event('healthAssistantInitUpdated'));
                        return;
                    }
                }
            } catch (err) {
                console.error('Error fetching Shift DB:', err);
            }

            // Check if init form was already completed today
            const initStatus = localStorage.getItem(`healthAssistantInit_${healthAssistantData?.email}`);
            if (initStatus) {
                const data = JSON.parse(initStatus);
                if (data.date === today) {
                    setIsInitComplete(true);
                    setInitForm(data);
                }
            }
        };

        // Only trigger shift DB check if we haven't already marked as completed locally 
        if (healthAssistantData?.email && !isInitComplete && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            checkTodayShift();
        }
    }, [healthAssistantData]); // Restored dependency length to array of 1 to fix React Fast Refresh hook error

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setProfilePhoto(base64String);
                localStorage.setItem(`healthAssistantPhoto_${healthAssistantData?.email}`, base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInitSubmit = async (e) => {
        e.preventDefault();
        try {
            const today = new Date().toISOString().split('T')[0];
            const dataToSave = {
                ...initForm,
                location: initForm.district, // Syncing with schema
                dateCompleted: new Date().toISOString(),
                email: healthAssistantData.email,
                healthAssistantId: healthAssistantData.id || healthAssistantData._id || 'unknown',
                date: today
            };

            const res = await fetch('/api/health-assistants/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });

            if (res.ok) {
                localStorage.setItem(`healthAssistantInit_${healthAssistantData?.email}`, JSON.stringify(dataToSave));
                setIsInitComplete(true);
                // Also dispatch an event so the main app can update its state immediately
                window.dispatchEvent(new Event('healthAssistantInitUpdated'));
                showAlert('Daily shift initialization complete and logged to Database! You now have full access to student records.', 'success', 'Success');
            } else {
                showAlert('Failed to log shift in database.', 'error', 'Error');
            }
        } catch (error) {
            console.error(error);
            showAlert('Network error tracking daily shift.', 'error', 'Network Error');
        }
    };

    if (!healthAssistantData) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="profile-container"
        >
            <div className="profile-header">
                <h2>Health Assistant Profile Dashboard</h2>
                <button className="btn-logout" onClick={onLogout}>
                    <LogOut size={18} /> Logout
                </button>
            </div>

            <div className="profile-body">
                {/* Complete Profile Information Card */}
                <div className="profile-info-section">

                    {/* Left: Photo Holder (Clickable Circle only - No Button) */}
                    <div className="photo-upload-container" style={{ flexShrink: 0 }}>
                        <div
                            className="photo-holder-circle"
                            style={{
                                width: '130px', height: '130px', borderRadius: '50%', cursor: 'pointer',
                                overflow: 'hidden', border: '4px solid #f8fafc', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.08)', transition: 'transform 0.2s',
                                position: 'relative'
                            }}
                            onClick={() => document.getElementById('photo-upload').click()}
                        >
                            {profilePhoto ? (
                                <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={56} color="#94a3b8" />
                            )}

                            {/* Hover Overlay for Upload Icon */}
                            <div className="photo-overlay" style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                                background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', opacity: profilePhoto ? 0 : 1, transition: 'opacity 0.2s'
                            }}>
                                <UploadCloud size={24} color="white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            id="photo-upload"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Right: Profile Information Grid */}
                    <div className="profile-details-grid" style={{ flexGrow: 1, borderLeft: '1px solid #e2e8f0', paddingLeft: '3rem' }}>
                        <div className="profile-details-grid-inner">
                            {/* Column 1 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div className="detail-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <User size={20} color="#3b82f6" style={{ marginTop: '0.2rem' }} />
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Full Name</span>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, color: '#0f172a' }}>{healthAssistantData?.fullName}</p>
                                    </div>
                                </div>
                                <div className="detail-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <Phone size={20} color="#3b82f6" style={{ marginTop: '0.2rem' }} />
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Phone Number</span>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, color: '#0f172a' }}>{healthAssistantData?.phone || 'Not Provided'}</p>
                                    </div>
                                </div>
                                <div className="detail-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <MapPin size={20} color="#3b82f6" style={{ marginTop: '0.2rem' }} />
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Location</span>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, color: '#0f172a' }}>
                                            {isInitComplete ? `${initForm.district}, ${initForm.state}` : (healthAssistantData?.district ? `${healthAssistantData.district}, ${healthAssistantData.state}` : 'Not Provided')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div className="detail-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <Mail size={20} color="#3b82f6" style={{ marginTop: '0.2rem' }} />
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email Address</span>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, color: '#0f172a' }}>{healthAssistantData?.email}</p>
                                    </div>
                                </div>
                                <div className="detail-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <Building2 size={20} color="#3b82f6" style={{ marginTop: '0.2rem' }} />
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Assigned Campus</span>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, color: '#0f172a' }}>{(isInitComplete ? initForm.assignedCampus : healthAssistantData?.assignedCampus) || 'Not Set'}</p>
                                    </div>
                                </div>
                                <div className="detail-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <ShieldCheck size={20} color="#3b82f6" style={{ marginTop: '0.2rem' }} />
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>ID Number</span>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, color: '#0f172a' }}>{(isInitComplete ? initForm.idNumber : healthAssistantData?.idNumber) || 'Not Provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Initialization Form */}
                <div className="profile-action-card">
                    <div className="action-header">
                        <h3>Daily Shift Initialization</h3>
                        <p>This mandatory form must be completed daily before accessing protected student health modules.</p>
                    </div>

                    {isInitComplete ? (
                        <div className="init-success-banner" style={{ background: '#f0fdf4', borderRadius: '1rem', padding: '2rem', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <CheckCircle2 size={32} color="#10b981" />
                                <h4 style={{ margin: 0, color: '#166534', fontSize: '1.25rem' }}>Initialization Complete</h4>
                            </div>
                            <p style={{ color: '#15803d', margin: 0 }}>You have successfully logged your shift details for today. You now have full access to Student Health Records and Health Cards.</p>
                        </div>
                    ) : (
                        <form className="init-form" onSubmit={handleInitSubmit}>
                            <div className="init-form-group">
                                <label htmlFor="init-assignedCampus">Assigned Campus (School Name)</label>
                                <div className="init-input-wrapper">
                                    <Building2 className="init-input-icon" size={18} />
                                    <select
                                        id="init-assignedCampus"
                                        value={initForm.assignedCampus}
                                        onChange={(e) => setInitForm({ ...initForm, assignedCampus: e.target.value })}
                                        className="init-select-field"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 12px 12px 42px',
                                            borderRadius: '12px',
                                            border: '1.5px solid #e2e8f0',
                                            fontSize: '1rem',
                                            background: 'white',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="" disabled>Select School Name</option>
                                        {campuses.map((c, idx) => (
                                            <option key={c._id || idx} value={c.schoolName || c.schoolEnvelope}>
                                                {c.schoolName || c.schoolEnvelope}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="init-form-group">
                                <label htmlFor="init-idNumber">ID Number</label>
                                <div className="init-input-wrapper">
                                    <ShieldCheck className="init-input-icon" size={18} />
                                    <input
                                        id="init-idNumber"
                                        type="text"
                                        placeholder="ID Number"
                                        value={initForm.idNumber}
                                        onChange={(e) => setInitForm({ ...initForm, idNumber: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="init-form-group">
                                    <label htmlFor="init-state">State</label>
                                    <div className="init-input-wrapper">
                                        <MapPin className="init-input-icon" size={18} />
                                        <select
                                            id="init-state"
                                            value={initForm.state}
                                            onChange={(e) => setInitForm({ ...initForm, state: e.target.value, district: '' })}
                                            required
                                            style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}
                                        >
                                            <option value="">Select State</option>
                                            {Object.keys(statesData).sort().map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="init-form-group">
                                    <label htmlFor="init-district">District</label>
                                    <div className="init-input-wrapper">
                                        <MapPin className="init-input-icon" size={18} />
                                        <select
                                            id="init-district"
                                            value={initForm.district}
                                            onChange={(e) => setInitForm({ ...initForm, district: e.target.value })}
                                            required
                                            disabled={!initForm.state}
                                            style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}
                                        >
                                            <option value="">Select District</option>
                                            {initForm.state && statesData[initForm.state]?.sort().map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="init-form-group">
                                <label htmlFor="init-date">Date</label>
                                <div className="init-input-wrapper">
                                    <Calendar className="init-input-icon" size={18} />
                                    <input
                                        id="init-date"
                                        type="date"
                                        value={initForm.date}
                                        onChange={(e) => setInitForm({ ...initForm, date: e.target.value })}
                                        required
                                        readOnly // Prevents backdating in a simple way
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-init-submit">
                                Initialize Session Access
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
