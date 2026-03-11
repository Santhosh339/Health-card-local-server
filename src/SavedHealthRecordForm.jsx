'use client';

import React, { useState } from 'react';
import './StudentHealthCard.css'; // Reusing the same CSS for the grid layouts
import {
    Activity, Info, Brain,
    Save, ShieldAlert, Award,
    Stethoscope, Dumbbell, Apple,
    Clipboard, Zap
} from 'lucide-react';
import { useNotification } from './context/NotificationContext';
import { validatePhone, validateFullName } from './utils/validation';

const SavedHealthRecordForm = ({ emergencyContact, vajraLogo, secondLogo, initialData, readOnly, schoolInfo, classInfo, onSaveSuccess }) => {
    const { showAlert } = useNotification();
    // Use local time for correct today string formatting, avoiding UTC drift issues
    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    const today = todayObj.toLocaleDateString('en-IN');

    const [formData, setFormData] = useState({
        age: '', dob: '', date: todayStr, name: '', sonOf: '',
        studentClass: '', rollNo: '', bloodGroup: '',
        schoolEnvelope: '', schoolPhone: '', principalName: '', schoolAddress: '',

        height: '', weight: '',

        specs: '', eyeRtLt: '', ears: '', nose: '', teeth: '', skin: '', digestive: '',

        activeness: 'Normal',

        fear: '', phobia: '',

        richMindSet: '', poorMindSet: '', bodyMature: '', mindMature: '', dualMature: '',

        responsibility: 'Self',

        descriptionMonth: '',

        healthCondition: 'Good',
        underMedication: '',
        seasonal: '', chronic: '', hereditary: '', previousHealth: '',
        nutritionDeficiency: '', drugAllergies: '', foodAllergies: '', otherDefects: '',

        suggestivePhysical: '', nutrition: '',

        readingSkill: '', observationSkill: '', listeningSkill: '',
        writingSkill: '', presentingSkill: '', analyticalSkill: '',
        debatingSkill: '', judgementSkill: '', reasoningSkill: '',
        forecastingSkill: '', leadershipSkill: '', diplomaticSkill: '',
        creativeSkill: '', memoryRecall: '', discipline: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const resetForm = () => {
        setFormData({
            age: '', dob: '', date: todayStr, name: '', sonOf: '',
            studentClass: '', rollNo: '', bloodGroup: '',
            schoolEnvelope: '', schoolPhone: '', principalName: '', schoolAddress: '',
            height: '', weight: '',
            specs: '', eyeRtLt: '', ears: '', nose: '', teeth: '', skin: '', digestive: '',
            activeness: 'Normal',
            fear: '', phobia: '',
            richMindSet: '', poorMindSet: '', bodyMature: '', mindMature: '', dualMature: '',
            responsibility: 'Self',
            descriptionMonth: '',
            healthCondition: 'Good',
            underMedication: '',
            seasonal: '', chronic: '', hereditary: '', previousHealth: '',
            nutritionDeficiency: '', drugAllergies: '', foodAllergies: '', otherDefects: '',
            suggestivePhysical: '', nutrition: '',
            readingSkill: '', observationSkill: '', listeningSkill: '',
            writingSkill: '', presentingSkill: '', analyticalSkill: '',
            debatingSkill: '', judgementSkill: '', reasoningSkill: '',
            forecastingSkill: '', leadershipSkill: '', diplomaticSkill: '',
            creativeSkill: '', memoryRecall: '', discipline: ''
        });
    };

    React.useEffect(() => {
        if (initialData) {
            // Merge initial data ensuring all fields exist
            setFormData(prev => {
                const merged = { ...prev, ...initialData };

                // On load, if dob exists but age doesn't, calculate age
                if (merged.dob && !merged.age) {
                    const birthDate = new Date(merged.dob);
                    const today = new Date();
                    if (!isNaN(birthDate.getTime())) {
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                        }
                        merged.age = age >= 0 ? age.toString() : '0';
                    }
                }
                // On load, if age exists but dob doesn't, estimate dob
                else if (merged.age && !merged.dob) {
                    const numAge = parseInt(merged.age);
                    if (!isNaN(numAge) && numAge >= 0) {
                        const today = new Date();
                        const birthYear = today.getFullYear() - numAge;
                        merged.dob = `${birthYear}-01-01`;
                    }
                }

                return merged;
            });
        } else {
            resetForm();
        }

        if (schoolInfo || classInfo) {
            setFormData(prev => ({
                ...prev,
                studentClass: prev.studentClass || classInfo || '',
                schoolEnvelope: prev.schoolEnvelope || schoolInfo?.schoolName || schoolInfo?.schoolEnvelope || '',
                schoolPhone: prev.schoolPhone || schoolInfo?.phoneNumber || schoolInfo?.schoolPhone || '',
                principalName: prev.principalName || schoolInfo?.principal?.name || schoolInfo?.principalName || 'Not assigned',
                schoolAddress: prev.schoolAddress || (schoolInfo?.address
                    ? (() => {
                        const { addressLine, area, city } = schoolInfo.address;
                        const parts = [];
                        if (addressLine) parts.push(addressLine.trim());
                        if (area && !addressLine?.toLowerCase().includes(area.toLowerCase())) parts.push(area.trim());
                        if (city && !addressLine?.toLowerCase().includes(city.toLowerCase()) && !area?.toLowerCase().includes(city.toLowerCase())) parts.push(city.trim());
                        return parts.filter(Boolean).join(', ');
                    })()
                    : schoolInfo?.schoolAddress || '')
            }));
        }
    }, [initialData, schoolInfo, classInfo]);

    const handleChange = (e) => {
        if (readOnly) return;
        const { name, value } = e.target;

        setFormData(prev => {
            let updatedData = { ...prev, [name]: value };

            // Auto-calculate Age from DOB or clear if empty
            if (name === 'dob') {
                if (value) {
                    const birthDate = new Date(value);
                    const today = new Date();
                    if (!isNaN(birthDate.getTime())) {
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                        }
                        updatedData.age = age >= 0 ? age.toString() : '0';
                        // Clear age error if it exists
                        if (errors.age) {
                            setErrors(prevErr => {
                                const newErrs = { ...prevErr };
                                delete newErrs.age;
                                return newErrs;
                            });
                        }
                    }
                } else {
                    updatedData.age = ''; // Clear age when dob is removed
                }
            }

            // Auto-estimate DOB from Age or clear if empty
            if (name === 'age') {
                if (value) {
                    const numAge = parseInt(value);
                    if (!isNaN(numAge) && numAge >= 0) {
                        const today = new Date();
                        const birthYear = today.getFullYear() - numAge;
                        // Format to YYYY-MM-DD for date input
                        const estimatedDOB = `${birthYear}-01-01`;
                        updatedData.dob = estimatedDOB;
                        // Clear dob error if it exists
                        if (errors.dob) {
                            setErrors(prevErr => {
                                const newErrs = { ...prevErr };
                                delete newErrs.dob;
                                return newErrs;
                            });
                        }
                    }
                } else {
                    updatedData.dob = ''; // Clear dob when age is removed
                }
            }

            return updatedData;
        });

        // Clear current field's error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation logic
        const excludedFields = ['descriptionMonth', 'activeness', 'responsibility', 'healthCondition']; // Optional or defaulted fields
        const isEmpty = (val) => val === undefined || val === null || (typeof val === 'string' && val.trim() === '');

        const newErrors = {};
        Object.keys(formData).forEach(key => {
            if (!excludedFields.includes(key) && isEmpty(formData[key])) {
                newErrors[key] = 'Empty field';
            }
        });

        // Specific Phone Validation
        if (formData.schoolPhone && !validatePhone(formData.schoolPhone)) {
            newErrors.schoolPhone = 'Invalid format (10 digits starting 6-9)';
        }

        // Specific Name Validation
        if (formData.name && !validateFullName(formData.name)) {
            newErrors.name = 'Invalid name (min 4 characters)';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Scroll to first error
            const firstErrorField = Object.keys(newErrors)[0];
            const element = document.getElementById(`input-${firstErrorField}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
            }
            return; // Prevent submission
        }

        setErrors({});
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/health-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                showAlert('Health Record Saved Successfully', 'success', 'Success');
                if (onSaveSuccess) onSaveSuccess(formData);
                else {
                    resetForm();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
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
        <div className="health-card-container fade-in">
            <header className="health-card-header">
                <h1>Comprehensive Student Health Record</h1>
                <p>Complete medical, psychological, and skill assessment form</p>
            </header>

            <form className="health-card-form" onSubmit={handleSubmit}>
                <section className="card-section bg-blue-theme">
                    <div className="form-grid">
                        <div className={`input-group ${errors.age ? 'has-error' : ''}`}>
                            <label htmlFor="input-age">Age :</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <input id="input-age" type="text" name="age" value={formData.age} onChange={handleChange} autoComplete="off" />
                                {errors.age && <span className="error-message">{errors.age}</span>}
                            </div>
                        </div>
                        <div className={`input-group ${errors.dob ? 'has-error' : ''}`}>
                            <label htmlFor="input-dob">DOB:</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <input id="input-dob" type="date" name="dob" value={formData.dob} onChange={handleChange} autoComplete="off" />
                                {errors.dob && <span className="error-message">{errors.dob}</span>}
                            </div>
                        </div>
                        <div className={`input-group ${errors.date ? 'has-error' : ''}`}>
                            <label htmlFor="input-date">Date:</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <input id="input-date" type="date" name="date" value={formData.date} min={todayStr} onChange={handleChange} autoComplete="off" />
                                {errors.date && <span className="error-message">{errors.date}</span>}
                            </div>
                        </div>
                        <div className={`input-group full-width ${errors.name || (formData.name && formData.name.length < 4) ? 'has-error' : ''}`}>
                            <label htmlFor="input-name">Name :</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <input id="input-name" type="text" name="name" value={formData.name} onChange={handleChange} autoComplete="off" />
                                {(errors.name || (formData.name && formData.name.length < 4)) && <span className="error-message">{errors.name || 'invalid (Min 4 chars)'}</span>}
                            </div>
                        </div>
                        <div className={`input-group full-width ${errors.sonOf ? 'has-error' : ''}`}>
                            <label htmlFor="input-sonOf">S/o:</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <input id="input-sonOf" type="text" name="sonOf" value={formData.sonOf} onChange={handleChange} autoComplete="off" />
                                {errors.sonOf && <span className="error-message">{errors.sonOf}</span>}
                            </div>
                        </div>
                        <div className={`input-group ${errors.studentClass ? 'has-error' : ''}`}>
                            <label htmlFor="input-studentClass">Class :</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <input id="input-studentClass" type="text" name="studentClass" value={formData.studentClass} onChange={handleChange} autoComplete="off" />
                                {errors.studentClass && <span className="error-message">{errors.studentClass}</span>}
                            </div>
                        </div>
                        <div className={`input-group ${errors.rollNo ? 'has-error' : ''}`}>
                            <label htmlFor="input-rollNo">Roll No :</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <input id="input-rollNo" type="text" name="rollNo" value={formData.rollNo} onChange={handleChange} autoComplete="off" />
                                {errors.rollNo && <span className="error-message">{errors.rollNo}</span>}
                            </div>
                        </div>
                        <div className={`input-group ${errors.bloodGroup ? 'has-error' : ''}`} style={{ maxWidth: '140px' }}>
                            <label htmlFor="input-bloodGroup">Blood Group :</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: '40px' }}>
                                <input id="input-bloodGroup" type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} autoComplete="off" />
                                {errors.bloodGroup && <span className="error-message">{errors.bloodGroup}</span>}
                            </div>
                        </div>

                        <div className="full-width" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                            <div className={`input-group ${errors.schoolEnvelope ? 'has-error' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
                                <label htmlFor="input-schoolEnvelope" style={{ fontSize: '0.7rem' }}>School Name on Envelope:</label>
                                <input id="input-schoolEnvelope" type="text" name="schoolEnvelope" value={formData.schoolEnvelope} onChange={handleChange} placeholder="e.g. St. Xavier's High School" style={{ width: '100%' }} autoComplete="off" />
                                {errors.schoolEnvelope && <span className="error-message">{errors.schoolEnvelope}</span>}
                            </div>
                            <div className={`input-group ${errors.schoolPhone ? 'has-error' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
                                <label htmlFor="input-schoolPhone" style={{ fontSize: '0.7rem' }}>Phone Number:</label>
                                <input id="input-schoolPhone" type="text" name="schoolPhone" value={formData.schoolPhone} onChange={handleChange} placeholder="e.g. +91 9876543210" style={{ width: '100%' }} autoComplete="off" />
                                {errors.schoolPhone && <span className="error-message">{errors.schoolPhone}</span>}
                            </div>
                            <div className={`input-group ${errors.principalName ? 'has-error' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
                                <label htmlFor="input-principalName" style={{ fontSize: '0.7rem' }}>Correspondence / Principal Name:</label>
                                <input id="input-principalName" type="text" name="principalName" value={formData.principalName} onChange={handleChange} placeholder="e.g. Dr. A. Sharma" style={{ width: '100%' }} autoComplete="off" />
                                {errors.principalName && <span className="error-message">{errors.principalName}</span>}
                            </div>
                            <div className={`input-group ${errors.schoolAddress ? 'has-error' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
                                <label htmlFor="input-schoolAddress" style={{ fontSize: '0.7rem' }}>Address of the School:</label>
                                <input id="input-schoolAddress" type="text" name="schoolAddress" value={formData.schoolAddress} onChange={handleChange} placeholder="e.g. 123 Main St, Tech City" style={{ width: '100%' }} autoComplete="off" />
                                {errors.schoolAddress && <span className="error-message">{errors.schoolAddress}</span>}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="card-section bg-green-theme">
                    <div className="card-section-title">
                        <Activity size={12} />
                        <h2>Monthly Growth Improvement : Investigation entry:</h2>
                    </div>
                    <div className="form-grid">
                        <div className={`input-group full-width ${errors.height ? 'has-error' : ''}`}>
                            <label htmlFor="input-height">Height :</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <input id="input-height" type="text" name="height" value={formData.height} onChange={handleChange} autoComplete="off" />
                                {errors.height && <span className="error-message">{errors.height}</span>}
                            </div>
                        </div>
                        <div className={`input-group full-width ${errors.weight ? 'has-error' : ''}`}>
                            <label htmlFor="input-weight">Weight:</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <input id="input-weight" type="text" name="weight" value={formData.weight} onChange={handleChange} autoComplete="off" />
                                {errors.weight && <span className="error-message">{errors.weight}</span>}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="card-section bg-yellow-theme">
                    <div className="card-section-title">
                        <Stethoscope size={12} />
                        <h2>ENT.</h2>
                    </div>
                    <div className="form-grid">
                        {[
                            { name: 'specs', label: 'Specs:' },
                            { name: 'eyeRtLt', label: 'Eye Rt & Lt:' },
                            { name: 'ears', label: 'Ears:' },
                            { name: 'nose', label: 'Nose:' },
                            { name: 'teeth', label: 'Teeth:' },
                            { name: 'skin', label: 'Skin:' },
                            { name: 'digestive', label: 'Digestive system:' }
                        ].map(field => (
                            <div key={field.name} className={`input-group full-width ${errors[field.name] ? 'has-error' : ''}`}>
                                <label htmlFor={`input-${field.name}`}>{field.label}</label>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <input id={`input-${field.name}`} type="text" name={field.name} value={formData[field.name]} onChange={handleChange} autoComplete="off" />
                                    {errors[field.name] && <span className="error-message">{errors[field.name]}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="card-section bg-orange-theme">
                    <div className="card-section-title">
                        <Zap size={12} />
                        <h2>Activeness : Organs Function</h2>
                    </div>
                    <div className="radio-group-horizontal">
                        {['Normal', 'Active', 'Pro-active', 'Super', 'Dull'].map(lvl => (
                            <label key={lvl} htmlFor={`activeness-${lvl}`} className="radio-option">
                                <input id={`activeness-${lvl}`} type="radio" name="activeness" value={lvl} checked={formData.activeness === lvl} onChange={handleChange} />
                                {lvl}:
                            </label>
                        ))}
                    </div>

                    <div className="card-section-title" style={{ marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.25rem' }}>
                        <Brain size={12} />
                        <h2>Sharpness through sense & observation</h2>
                    </div>
                    <div className="form-grid">
                        <div className={`input-group full-width ${errors.fear ? 'has-error' : ''}`}>
                            <label htmlFor="input-fear">Fear:</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <input id="input-fear" type="text" name="fear" value={formData.fear} onChange={handleChange} autoComplete="off" />
                                {errors.fear && <span className="error-message">{errors.fear}</span>}
                            </div>
                        </div>
                        <div className={`input-group full-width ${errors.phobia ? 'has-error' : ''}`}>
                            <label htmlFor="input-phobia">Phobia:</label>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <input id="input-phobia" type="text" name="phobia" value={formData.phobia} onChange={handleChange} autoComplete="off" />
                                {errors.phobia && <span className="error-message">{errors.phobia}</span>}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="card-section bg-pink-theme">
                    <div className="card-section-title">
                        <Info size={12} />
                        <h2>Psychology : Maturity Levels %</h2>
                    </div>
                    <div className="form-grid">
                        {[
                            { name: 'richMindSet', label: 'a) Rich mind set:' },
                            { name: 'poorMindSet', label: 'b) Poor mind set :' },
                            { name: 'bodyMature', label: 'c) Body mature  :' },
                            { name: 'mindMature', label: 'd) Mind mature :' },
                            { name: 'dualMature', label: 'c) Dual mature :' }
                        ].map(field => (
                            <div key={field.name} className={`input-group full-width ${errors[field.name] ? 'has-error' : ''}`}>
                                <label htmlFor={`input-${field.name}`}>{field.label}</label>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <input id={`input-${field.name}`} type="text" name={field.name} value={formData[field.name]} onChange={handleChange} autoComplete="off" />
                                    {errors[field.name] && <span className="error-message">{errors[field.name]}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="card-section bg-cyan-theme">
                    <div className="card-section-title">
                        <Clipboard size={12} />
                        <h2>Activities levels on works execution ( Responsibility)</h2>
                    </div>
                    <div className="radio-group-horizontal">
                        {[
                            { val: 'Dependancy', label: 'a) Dependancy::' },
                            { val: 'Self', label: 'b) Self:' },
                            { val: 'Partial', label: 'c) Partial:' }
                        ].map(item => (
                            <label key={item.val} htmlFor={`responsibility-${item.val}`} className="radio-option">
                                <input id={`responsibility-${item.val}`} type="radio" name="responsibility" value={item.val} checked={formData.responsibility === item.val} onChange={handleChange} />
                                {item.label}
                            </label>
                        ))}
                    </div>
                    <div className="input-group full-width">
                        <label htmlFor="descriptionMonth">Description : Month &gt;&gt;&gt;&gt;</label>
                        <textarea id="descriptionMonth" name="descriptionMonth" value={formData.descriptionMonth} onChange={handleChange} rows="2"></textarea>
                    </div>
                </section>

                <section className="card-section bg-purple-theme">
                    <div className="card-section-title">
                        <ShieldAlert size={12} />
                        <h2>Health Conditions:</h2>
                    </div>
                    <div className="radio-group-horizontal">
                        {['Normal', 'Good', 'Sick'].map(lvl => (
                            <label key={lvl} htmlFor={`healthCondition-${lvl}`} className="radio-option">
                                <input id={`healthCondition-${lvl}`} type="radio" name="healthCondition" value={lvl} checked={formData.healthCondition === lvl} onChange={handleChange} />
                                {lvl.toLowerCase()}): {lvl}
                            </label>
                        ))}
                    </div>

                    <div className="form-grid">
                        {[
                            { name: 'underMedication', label: 'under medication:' },
                            { name: 'seasonal', label: 'I) Seasonal:' },
                            { name: 'chronic', label: 'ii) Chronic:' },
                            { name: 'hereditary', label: 'iii) Hereditary :' },
                            { name: 'previousHealth', label: 'iv) Previous health issues:' },
                            { name: 'nutritionDeficiency', label: 'v) Nutrition deficiency :' },
                            { name: 'drugAllergies', label: 'vi) Drug Allergies :' },
                            { name: 'foodAllergies', label: 'vii) Food Allergies:' },
                            { name: 'otherDefects', label: 'vii) Other defects if any:' }
                        ].map(field => (
                            <div key={field.name} className={`input-group full-width ${errors[field.name] ? 'has-error' : ''}`}>
                                <label htmlFor={`input-${field.name}`}>{field.label}</label>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <input id={`input-${field.name}`} type="text" name={field.name} value={formData[field.name]} onChange={handleChange} autoComplete="off" />
                                    {errors[field.name] && <span className="error-message">{errors[field.name]}</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card-section-title" style={{ marginTop: '0.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.25rem' }}>
                        <Dumbbell size={12} />
                        <h2>viii) Suggestive : Physical exercises:</h2>
                    </div>
                    <div className={`input-group full-width ${errors.suggestivePhysical ? 'has-error' : ''}`}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label htmlFor="input-suggestivePhysical" className="sr-only">Suggestive Physical Exercises</label>
                            <input id="input-suggestivePhysical" type="text" name="suggestivePhysical" value={formData.suggestivePhysical} onChange={handleChange} autoComplete="off" />
                            {errors.suggestivePhysical && <span className="error-message">{errors.suggestivePhysical}</span>}
                        </div>
                    </div>

                    <div className="card-section-title" style={{ marginTop: '0.1rem' }}>
                        <Apple size={12} />
                        <h2>ix) Nutrition :</h2>
                    </div>
                    <div className={`input-group full-width ${errors.nutrition ? 'has-error' : ''}`}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label htmlFor="input-nutrition" className="sr-only">Nutrition Suggestion</label>
                            <input id="input-nutrition" type="text" name="nutrition" value={formData.nutrition} onChange={handleChange} autoComplete="off" />
                            {errors.nutrition && <span className="error-message">{errors.nutrition}</span>}
                        </div>
                    </div>
                </section>

                <section className="card-section bg-gray-theme">
                    <div className="card-section-title">
                        <Award size={12} />
                        <h2>Parametric skill tests: Percentage &gt;&gt;&gt;&gt; Improved</h2>
                    </div>
                    <div className="skills-grid">
                        {[
                            { key: 'readingSkill', label: "1. Reading Skill:" },
                            { key: 'observationSkill', label: "2. Observation Skill" },
                            { key: 'listeningSkill', label: "3. Listening Skill" },
                            { key: 'writingSkill', label: "4. Writing Skill" },
                            { key: 'presentingSkill', label: "5. Presenting Skill" },
                            { key: 'analyticalSkill', label: "6. Analytical Skill" },
                            { key: 'debatingSkill', label: "7. Debating Skill" },
                            { key: 'judgementSkill', label: "8. Judgement Skill" },
                            { key: 'reasoningSkill', label: "9. Reasoning Skill" },
                            { key: 'forecastingSkill', label: "10. Forecasting Skill" },
                            { key: 'leadershipSkill', label: "11. Leadership Skill" },
                            { key: 'diplomaticSkill', label: "12. Diplomatic Skill" },
                            { key: 'creativeSkill', label: "13. Creative Skill" },
                            { key: 'memoryRecall', label: "14. Memory Recall" },
                            { key: 'discipline', label: "15. Discipline" }
                        ].map((skillObj, index) => {
                            const { key, label } = skillObj;
                            return (
                                <div key={index} className={`skill-input-item ${errors[key] ? 'has-error' : ''}`}>
                                    <label htmlFor={`input-${key}`}>{label}</label>
                                    <div className="percentage-input">
                                        <input id={`input-${key}`} type="text" name={key} value={formData[key] || ''} onChange={handleChange} autoComplete="off" />
                                        <span>%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {!readOnly && (
                    <div className="submit-btn-container">
                        <button type="submit" className="btn-premium-save" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving System...' : <><Save size={16} /> Save Record</>}
                        </button>
                        {emergencyContact && (
                            <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Emergency Assistance: <strong>{emergencyContact}</strong></p>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};

export default SavedHealthRecordForm;
