'use client';

import React, { useState } from 'react';
import { useNotification } from './context/NotificationContext';
import './StudentIdentityCard.css';
import { Upload, ArrowLeft, Save } from 'lucide-react';
import trustCareLogo from './assets/trust_care_logo.png';
import vajraLogoJpg from './assets/vajra_logo.jpg';
import vajraSealSigned from './assets/vajra_seal_signed.png';

const EditableIdentityCard = ({ onBack, vajraLogo, secondLogo, schoolInfo, classInfo }) => {
    const { showAlert } = useNotification();
    // Determine the initialized school name correctly
    const defaultSchoolName = schoolInfo?.schoolName || schoolInfo?.schoolEnvelope || '';

    const [healthCardForm, setHealthCardForm] = useState({
        photoBase64: '',
        lFileNo: '',
        dateOfIssue: new Date().toISOString().split('T')[0],
        validity: '1 Year',
        name: '',
        dobOrAge: '',
        bloodGroup: '',
        studentClass: classInfo || '',
        rollNo: '',
        school: defaultSchoolName,
        address1: '',
        address2: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setHealthCardForm({ ...healthCardForm, photoBase64: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/health-cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(healthCardForm),
            });

            if (response.ok) {
                showAlert('Health card record saved to database successfully.', 'success', 'Success!');
                if (onBack) onBack(); // Automatically return to envelopes if inside record viewer
            } else {
                const errorData = await response.json();
                showAlert(errorData.message || 'Failed to save record', 'error', 'Error');
            }
        } catch (error) {
            console.error('Error saving:', error);
            showAlert('Network error. Please check your connection.', 'error', 'Network Error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card-editor-container fade-in">
            {onBack && (
                <button
                    onClick={onBack}
                    style={{
                        position: 'absolute', top: '1rem', right: '2rem', zIndex: 100,
                        backgroundColor: '#1e293b', color: '#fff', border: 'none',
                        padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                >
                    <ArrowLeft size={18} /> Back
                </button>
            )}

            <form onSubmit={handleSubmit} className="identity-card-form-wrapper">
                {/* The Editable Physical Card */}
                <div className="id-card-physical">
                    <div className="id-card-inner">

                        {/* Top Header Row */}
                        <div className="id-header-row">
                            <div className="id-logo-left">
                                {/* Intentionally left empty since school logo is missing */}
                            </div>
                            <div className="header-school-center">
                                <label htmlFor="header-school-input" className="sr-only">School Name</label>
                                <input
                                    id="header-school-input"
                                    name="school"
                                    className="header-school-input"
                                    value={healthCardForm.school}
                                    onChange={(e) => setHealthCardForm({ ...healthCardForm, school: e.target.value.replace(/\n/g, ' ') })}
                                    placeholder="ENTER SCHOOL NAME"
                                    autoComplete="off"
                                />
                            </div>
                            <div className="id-logo-right">
                                {/* 25-years-logo.png removed */}
                                <div className="red-cross-logo"></div>
                            </div>
                        </div>

                        {/* Blue Banner */}
                        <div className="id-blue-banner">STUDENT MEDICAL & PREVENTIVE HEALTH<br />CARE AWARENESS IDENTITY CARD</div>

                        {/* Photo and Top Details */}
                        <div className="id-middle-section">
                            <div className="id-photo-box" onClick={() => document.getElementById('card-photo-upload').click()}>
                                {healthCardForm.photoBase64 ? (
                                    <img src={healthCardForm.photoBase64} alt="Student" />
                                ) : (
                                    <span>Photo<br />Tap to Upload</span>
                                )}
                                <input id="card-photo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                            </div>

                            <div className="id-top-fields">
                                <div className="dotted-row red-row">
                                    <label className="row-label" htmlFor="lFileNo">FILE No:</label>
                                    <input id="lFileNo" name="lFileNo" className="dotted-input" type="text" value={healthCardForm.lFileNo} onChange={(e) => setHealthCardForm({ ...healthCardForm, lFileNo: e.target.value })} required autoComplete="off" />
                                </div>
                                <div className="dotted-row red-row">
                                    <label className="row-label" htmlFor="dateOfIssue">Date of Issue:</label>
                                    <input id="dateOfIssue" name="dateOfIssue" className="dotted-input" type="text" value={healthCardForm.dateOfIssue} onChange={(e) => setHealthCardForm({ ...healthCardForm, dateOfIssue: e.target.value })} required autoComplete="off" />
                                </div>
                                <div className="dotted-row red-row">
                                    <label className="row-label" htmlFor="validity">Validity:</label>
                                    <input id="validity" name="validity" className="dotted-input" type="text" value={healthCardForm.validity} onChange={(e) => setHealthCardForm({ ...healthCardForm, validity: e.target.value })} required autoComplete="off" />
                                </div>
                            </div>
                        </div>

                        {/* Main Student Info Fields */}
                        <div className="id-student-info">
                            <div className="dotted-row blue-row">
                                <label className="row-label" htmlFor="name">NAME:</label>
                                <input id="name" name="name" className="dotted-input" type="text" value={healthCardForm.name} onChange={(e) => setHealthCardForm({ ...healthCardForm, name: e.target.value })} required autoComplete="off" />
                            </div>
                            <div className="dotted-row blue-row">
                                <label className="row-label" htmlFor="dobOrAge">DOB/ AGE:</label>
                                <input id="dobOrAge" name="dobOrAge" className="dotted-input" type="text" value={healthCardForm.dobOrAge} onChange={(e) => setHealthCardForm({ ...healthCardForm, dobOrAge: e.target.value })} required autoComplete="off" />
                            </div>
                            <div className="dotted-row blue-row">
                                <label className="row-label" htmlFor="bloodGroup">BLOOD GROUP:</label>
                                <input id="bloodGroup" name="bloodGroup" className="dotted-input" type="text" value={healthCardForm.bloodGroup} onChange={(e) => setHealthCardForm({ ...healthCardForm, bloodGroup: e.target.value })} required autoComplete="off" />
                            </div>
                            <div className="dotted-row blue-row split-row">
                                <label className="row-label" htmlFor="studentClass">CLASS :</label>
                                <input id="studentClass" name="studentClass" className="dotted-input" type="text" value={healthCardForm.studentClass} onChange={(e) => setHealthCardForm({ ...healthCardForm, studentClass: e.target.value })} required autoComplete="off" />
                                <label className="row-label ml-2" htmlFor="rollNo">ROLL No:</label>
                                <input id="rollNo" name="rollNo" className="dotted-input" type="text" value={healthCardForm.rollNo} onChange={(e) => setHealthCardForm({ ...healthCardForm, rollNo: e.target.value })} required autoComplete="off" />
                            </div>
                            <div className="dotted-row blue-row">
                                <label className="row-label" htmlFor="school">SCHL:</label>
                                <input id="school" name="school" className="dotted-input" type="text" value={healthCardForm.school} onChange={(e) => setHealthCardForm({ ...healthCardForm, school: e.target.value })} required autoComplete="off" />
                            </div>
                            <div className="dotted-row blue-row" style={{ alignItems: 'flex-start' }}>
                                <label className="row-label" htmlFor="address1-editable" style={{ marginTop: '0.1rem' }}>ADDRESS:</label>
                                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.9rem' }}>
                                    <input
                                        id="address1-editable"
                                        name="address1"
                                        className="dotted-input"
                                        type="text"
                                        value={healthCardForm.address1 !== undefined ? healthCardForm.address1 : healthCardForm.address || ''}
                                        onChange={(e) => {
                                            setHealthCardForm({ ...healthCardForm, address1: e.target.value });
                                            if (e.target.value.length >= 35) {
                                                const addr2 = document.getElementById('address2-editable');
                                                if (addr2) addr2.focus();
                                            }
                                        }}
                                        maxLength={38}
                                        required
                                        style={{ width: '100%', paddingLeft: '5px' }}
                                        autoComplete="off"
                                    />
                                    <input
                                        id="address2-editable"
                                        name="address2"
                                        className="dotted-input"
                                        type="text"
                                        value={healthCardForm.address2 || ''}
                                        onChange={(e) => setHealthCardForm({ ...healthCardForm, address2: e.target.value })}
                                        style={{ width: '100%', marginLeft: '0' }}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Divider removed as per request */}

                        {/* Footer Logos & Sigs */}
                        <div className="id-footer-logos">
                            <div className="left-maintenance">
                                <span className="tiny-label">Maintained by</span>
                                <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '5px' }}>
                                    <img src={vajraLogoJpg.src || vajraLogoJpg} alt="Vajra" style={{ height: '75px', objectFit: 'contain' }} />
                                </div>
                            </div>
                            <div className="center-supported">
                                <span className="tiny-label">Supported by</span>
                                <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '5px' }}>
                                    <img src={trustCareLogo.src || trustCareLogo} alt="Trust Care" style={{ height: '45px', objectFit: 'contain' }} />
                                </div>
                            </div>
                            <div className="right-signature" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '5px' }}>
                                <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={vajraSealSigned.src || vajraSealSigned} alt="Seal" style={{ height: '75px', width: '75px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Strips */}
                        <div className="id-bottom-strips">
                            <div className="strip-red">
                                www.doctorswebworld.com<br />Ph: +91 9948533625,
                            </div>
                            <div className="strip-blue">
                                www.vajrabluezonehospitals.com<br />+91 7349525471, +91 7799799261
                            </div>
                        </div>

                    </div>
                </div>

                {/* Save Button */}
                <div className="card-editor-actions">
                    <button type="submit" className="btn-save-card" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : <><Save size={20} /> Save Health Card</>}
                    </button>
                    <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center', lineHeight: '1.4' }}>
                        <div>Vajra preventive healthcare for children is a part of vajra blue zone hospitals private limited.</div>
                        <div>© vajra blue zone hospital private limited .</div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditableIdentityCard;
