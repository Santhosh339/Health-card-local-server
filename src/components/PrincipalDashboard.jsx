'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    FileCheck,
    FileClock,
    Info,
    LogOut,
    Search,
    RefreshCw,
    Filter,
    CheckCircle2,
    XCircle,
    User,
    Mail,
    Upload,
    Plus,
    ArrowLeft
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import '../app/admin/admin.css';
import '../StudentHealthRecord.css'; // Inherit exact envelope styles
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { validatePhone, validateFullName } from '../utils/validation';

export default function PrincipalDashboard({ principalData, onLogout }) {
    const { showAlert } = useNotification();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({
        totalStudents: 0,
        cardsIssued: 0,
        cardsPending: 0,
        recentCheckups: 0
    });

    // Students Data State
    const [allStudents, setAllStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);

    // Filters State for Students View
    const [filterSearch, setFilterSearch] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [filterRollNo, setFilterRollNo] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'issued', 'not-issued'

    // Class Envelope & Bulk Upload States
    const [studentsViewMode, setStudentsViewMode] = useState('envelopes'); // 'envelopes' or 'class-list'
    const [selectedStudentsClass, setSelectedStudentsClass] = useState(null);
    const [customEnvelopes, setCustomEnvelopes] = useState([]);

    // Manual upload states
    const [isUploadingBulk, setIsUploadingBulk] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualStudent, setManualStudent] = useState({ studentName: '', section: '', rollNo: '', contactNumber: '', parentName: '', dob: '' });

    const fetchStudentsData = async () => {
        if (!principalData?.schoolName) return;
        setStudentsLoading(true);
        try {
            const [recordsRes, cardsRes, staticRes, envelopesRes] = await Promise.all([
                fetch(`/api/health-records?school=${encodeURIComponent(principalData.schoolName)}`, { cache: 'no-store' }),
                fetch(`/api/health-cards?school=${encodeURIComponent(principalData.schoolName)}`, { cache: 'no-store' }),
                fetch(`/api/students?school=${encodeURIComponent(principalData.schoolName)}`, { cache: 'no-store' }),
                fetch(`/api/envelopes?school=${encodeURIComponent(principalData.schoolName)}`, { cache: 'no-store' })
            ]);
            const recordsData = await recordsRes.json();
            const cardsData = await cardsRes.json();
            const staticData = staticRes.ok ? await staticRes.json() : [];
            const envelopesData = envelopesRes.ok ? await envelopesRes.json() : [];

            const myRecords = Array.isArray(recordsData) ? recordsData : [];
            const myCards = Array.isArray(cardsData) ? cardsData : [];

            // Build a unique student map 
            const studentMap = {};

            // 1. Process Static Students
            if (Array.isArray(staticData)) {
                staticData.forEach(s => {
                    const key = `${s.studentName?.trim().toLowerCase()}-${s.className}`;
                    studentMap[key] = {
                        id: s._id,
                        name: s.studentName,
                        class: s.className || 'N/A',
                        section: s.section || 'N/A',
                        rollNo: s.rollNo || 'N/A',
                        parentName: s.parentName || 'N/A',
                        parentPhone: s.contactNumber || 'N/A',
                        dob: s.dob || 'N/A',
                        status: 'not-issued',
                        sourceStatic: s
                    };
                });
            }

            // 2. Process Medical Records
            myRecords.forEach(r => {
                const key = `${r.name?.trim().toLowerCase()}-${r.class}`;
                if (studentMap[key]) {
                    studentMap[key].sourceRecord = r;
                    studentMap[key].section = r.section || studentMap[key].section;
                    if (r.fatherName || r.motherName) studentMap[key].parentName = r.fatherName || r.motherName;
                    if (r.parentContact) studentMap[key].parentPhone = r.parentContact;
                } else {
                    studentMap[key] = {
                        id: r._id,
                        name: r.name,
                        class: r.class || 'N/A',
                        section: r.section || 'N/A',
                        rollNo: 'N/A',
                        parentName: r.fatherName || r.motherName || 'N/A',
                        parentPhone: r.parentContact || 'N/A',
                        dob: r.data?.dob || r.dob || 'N/A',
                        status: 'not-issued',
                        sourceRecord: r
                    };
                }
            });

            // 3. Process Medical Cards
            myCards.forEach(c => {
                const key = `${c.name?.trim().toLowerCase()}-${c.studentClass}`;
                if (studentMap[key]) {
                    studentMap[key].status = 'issued';
                    studentMap[key].rollNo = c.rollNo || studentMap[key].rollNo;
                    studentMap[key].idNo = c.idNo;
                    if (c.fatherName || c.motherName) studentMap[key].parentName = c.fatherName || c.motherName;
                    if (c.mobileNo || c.parentContact) studentMap[key].parentPhone = c.mobileNo || c.parentContact;
                    studentMap[key].sourceCard = c;
                } else {
                    studentMap[key] = {
                        id: c._id,
                        name: c.name,
                        class: c.studentClass || 'N/A',
                        section: 'N/A',
                        rollNo: c.rollNo || 'N/A',
                        idNo: c.idNo,
                        parentName: c.fatherName || c.motherName || 'N/A',
                        parentPhone: c.mobileNo || c.parentContact || 'N/A',
                        dob: c.dob || 'N/A',
                        status: 'issued',
                        sourceCard: c
                    };
                }
            });

            const studentsList = Object.values(studentMap);
            setAllStudents(studentsList);

            // Extract unique classes from students in DB
            const dbClassesFromStudents = [...new Set(studentsList.map(s => s.class).filter(c => c && c !== 'N/A'))];
            // Extract classes from specialized envelopes table
            const explicitEnvelopes = envelopesData.map(e => e.className);

            setCustomEnvelopes([...new Set([...dbClassesFromStudents, ...explicitEnvelopes])]);

            setStats({
                totalStudents: studentsList.length,
                cardsIssued: studentsList.filter(s => s.status === 'issued').length,
                cardsPending: studentsList.filter(s => s.status === 'not-issued').length,
                recentCheckups: myRecords.length // Simple metric to use
            });

        } catch (err) {
            console.error("Error fetching students data", err);
        } finally {
            setStudentsLoading(false);
        }
    };

    useEffect(() => {
        if (principalData) {
            fetchStudentsData();
        }
    }, [principalData]);

    // Refresh when changing tabs
    useEffect(() => {
        if (principalData) {
            fetchStudentsData();
        }
    }, [activeTab]);

    // Polling and focus refresh
    useEffect(() => {
        if (!principalData) return;

        const handleFocus = () => fetchStudentsData();
        window.addEventListener('focus', handleFocus);

        const interval = setInterval(() => {
            fetchStudentsData();
        }, 30000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [principalData]);

    const handleAddEnvelope = async () => {
        const cl = prompt("Enter Class Name for the Envelope (e.g. 1st, 2nd, LKG):");
        if (cl && cl.trim()) {
            const className = cl.trim();
            try {
                const res = await fetch('/api/envelopes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ school: principalData.schoolName, className })
                });
                if (res.ok) {
                    const newEnvs = [...new Set([...customEnvelopes, className])];
                    setCustomEnvelopes(newEnvs);
                }
            } catch (err) {
                console.error("Error saving envelope", err);
            }
        }
    };

    const handleBulkUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploadingBulk(true);

        const parseAndUpload = async (parsedData) => {
            const data = parsedData.map(row => ({
                school: principalData.schoolName?.trim(),
                className: selectedStudentsClass?.trim(),
                studentName: (row['Student Name'] || row['Name'] || row['studentName'] || row['Student Name/Name'] || row['student_name'] || row['name'] || row['Student name'] || row['student name'])?.toString().trim(),
                section: (row['Section'] || row['section'] || row['Sec'] || row['sec'] || 'A')?.toString().trim(),
                rollNo: (row['Roll No'] || row['rollNo'] || row['Roll Number'] || row['roll_no'] || row['Roll no'] || row['roll no'] || '')?.toString().trim(),
                gender: (row['Gender'] || row['gender'] || '')?.toString().trim(),
                dob: (row['DOB'] || row['dob'] || '')?.toString().trim(),
                bloodGroup: (row['Blood Group'] || row['bloodGroup'] || row['blood group'] || '')?.toString().trim(),
                parentName: (row['Parent Name'] || row['parentName'] || row['Father Name'] || row['Mother Name'] || row['parent name'] || '')?.toString().trim(),
                contactNumber: (row['Contact Number'] || row['contactNumber'] || row['Phone Number'] || row['Mobile'] || row['contact number'] || '')?.toString().trim(),
                address: (row['Address'] || row['address'] || '')?.toString().trim()
            })).filter(s => s.studentName);

            if (data.length === 0) {
                showAlert("No valid rows found. Please check Excel/CSV headers (Need columns like 'Student Name', 'Section', 'Roll No').", 'warning', 'Import Failed');
                setIsUploadingBulk(false);
                event.target.value = '';
                return;
            }

            try {
                // Validate phone numbers in bulk data
                const validatedData = data.map(s => {
                    if (s.contactNumber && !validatePhone(s.contactNumber)) {
                        console.warn(`Invalid phone for ${s.studentName}: ${s.contactNumber}. Clearing field.`);
                        return { ...s, contactNumber: '' };
                    }
                    return s;
                });

                const res = await fetch('/api/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(validatedData)
                });
                if (res.ok) {
                    showAlert(`Successfully imported ${validatedData.length} students into Class ${selectedStudentsClass}!`, 'success', 'Import Success');
                    fetchStudentsData();
                } else {
                    const err = await res.json();
                    showAlert(err.message || 'Error occurred during import', 'error', 'Error');
                }
            } catch (e) {
                showAlert("Network error during bulk import.", 'error', 'Network Error');
            } finally {
                setIsUploadingBulk(false);
                event.target.value = '';
            }
        };

        if (file.name.toLowerCase().endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => parseAndUpload(results.data)
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                parseAndUpload(json);
            };
            reader.readAsArrayBuffer(file);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualStudent.studentName) return;
        if (!validateFullName(manualStudent.studentName)) {
            showAlert("Student Full Name must be at least 4 characters.", 'warning', 'Invalid Name');
            return;
        }
        if (manualStudent.contactNumber && !validatePhone(manualStudent.contactNumber)) {
            showAlert("Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9.", 'warning', 'Invalid Phone');
            return;
        }

        try {
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    school: principalData.schoolName?.trim(),
                    className: selectedStudentsClass?.trim(),
                    ...manualStudent,
                    studentName: manualStudent.studentName?.trim()
                })
            });
            if (res.ok) {
                showAlert("Student added manually!", 'success', 'Success');
                setManualStudent({ studentName: '', section: '', rollNo: '', contactNumber: '', parentName: '', dob: '' });
                setShowManualForm(false);
                fetchStudentsData();
            } else {
                showAlert("Error adding student.", 'error', 'Error');
            }
        } catch (err) {
            showAlert("Error adding student.", 'error', 'Error');
        }
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'cards-issued', label: 'Health Card Issued', icon: FileCheck },
        { id: 'cards-pending', label: 'Health Card Pending', icon: FileClock },
        { id: 'health-info', label: 'Health Information', icon: Info },
    ];

    const renderDashboard = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-view">
            <div className="admin-header" style={{ marginBottom: '1.5rem', background: 'none' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3154c4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                        {principalData?.fullName?.charAt(0) || 'P'}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.2rem', margin: 0 }}>Welcome back, {principalData?.fullName || 'Principal'}</h1>
                        <p style={{ margin: 0, color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>{principalData?.schoolName || 'Campus Admin'}</p>
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Students</h3>
                    <div className="value">{stats.totalStudents}</div>
                </div>
                <div className="stat-card">
                    <h3>Health Cards Issued</h3>
                    <div className="value">{stats.cardsIssued}</div>
                </div>
                <div className="stat-card">
                    <h3>Cards Pending</h3>
                    <div className="value">{stats.cardsPending}</div>
                </div>
                <div className="stat-card">
                    <h3>Assessments Done</h3>
                    <div className="value">{stats.recentCheckups}</div>
                </div>
            </div>

            <div className="records-table-container" style={{ marginTop: '2.5rem' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--admin-text-primary)' }}>Quick Overview</h3>
                    <button className="action-btn view-btn" style={{ margin: 0 }} onClick={() => setActiveTab('students')}>View All Students</button>
                </div>
                <table className="records-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Class/Section</th>
                            <th>Status/Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsLoading ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : allStudents.slice(0, 5).map((s, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: '600' }}>{s.name}</td>
                                <td>Class {s.class} {s.section !== 'N/A' ? `- Sec ${s.section}` : ''}</td>
                                <td>
                                    {s.status === 'issued' ? (
                                        <span style={{ color: 'var(--admin-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} /> Issued</span>
                                    ) : (
                                        <span style={{ color: 'var(--admin-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><XCircle size={16} /> Not Issued</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );

    const renderStudents = () => {
        if (studentsViewMode === 'envelopes' && activeTab === 'students') {
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-view">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Mail size={24} /> Student Class Envelopes
                        </h2>
                        <button onClick={handleAddEnvelope} style={{ background: '#3b82f6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                            <Plus size={18} /> Add Class Envelope
                        </button>
                    </div>

                    {customEnvelopes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No class envelopes found for your school. Click "Add Class Envelope" to start!</p>
                        </div>
                    ) : (
                        <div className="envelope-classes-grid" style={{ justifyContent: 'flex-start', alignContent: 'flex-start' }}>
                            {customEnvelopes.map(cls => (
                                <button
                                    key={cls}
                                    className="class-select-card"
                                    onClick={() => {
                                        setSelectedStudentsClass(cls);
                                        setFilterClass(cls);
                                        setStudentsViewMode('class-list');
                                    }}
                                >
                                    <div style={{ backgroundColor: '#facc15', padding: '4px', borderRadius: '6px', border: '1px solid #1e3a8a', display: 'flex' }}>
                                        <Mail size={20} color="#1e3a8a" />
                                    </div>
                                    {cls}
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            );
        }

        let effectiveStatus = filterStatus;
        if (activeTab === 'cards-issued') effectiveStatus = 'issued';
        if (activeTab === 'cards-pending') effectiveStatus = 'not-issued';

        // Derive unique sections for the filter dropdown
        const availableSections = [...new Set(allStudents.map(s => s.section).filter(sec => sec && sec !== 'N/A'))].sort();

        // Unified Filter logic
        const filteredStudents = allStudents.filter(s => {
            // Search by Name
            if (filterSearch && !s.name?.toString().toLowerCase().includes(filterSearch.toLowerCase())) return false;

            // Class Filter
            if (activeTab === 'students') {
                // If in students tab, we are primarily governed by the selected envelope
                // BUT if the user uses the dropdown filter, they can narrow it down or jump
                const targetClass = filterClass || selectedStudentsClass;
                if (targetClass && s.class !== targetClass) return false;
            } else {
                // In other tabs (Issued/Pending), use the filterClass dropdown
                if (filterClass && s.class !== filterClass) return false;
            }

            // Section Filter
            if (filterSection && s.section !== filterSection) return false;

            // Roll No Filter
            if (filterRollNo && s.rollNo?.toString().toLowerCase() !== filterRollNo.toLowerCase()) return false;

            // Status Filter (Effective status already accounts for tab context)
            if (effectiveStatus !== 'all' && s.status !== effectiveStatus) return false;

            return true;
        });

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-view">

                {activeTab === 'students' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Class {selectedStudentsClass} Students
                        </h2>
                        <button onClick={() => { setStudentsViewMode('envelopes'); setFilterClass(''); }} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <ArrowLeft size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Back to Envelopes
                        </button>
                    </div>
                )}

                {/* ONE LINE FILTERS */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    background: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '1rem',
                    border: '1px solid var(--admin-border)',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 auto', minWidth: '200px' }}>
                        <Search size={18} color="var(--admin-text-secondary)" />
                        <input
                            type="text"
                            placeholder="Search by Name..."
                            className="admin-input"
                            style={{ flex: 1, border: 'none', background: '#f8fafc' }}
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                        />
                    </div>

                    <select
                        className="admin-input"
                        style={{ width: '130px', background: '#f8fafc', fontWeight: 'bold' }}
                        value={filterClass}
                        onChange={(e) => {
                            setFilterClass(e.target.value);
                            if (activeTab === 'students' && e.target.value) {
                                setSelectedStudentsClass(e.target.value);
                            }
                        }}
                    >
                        <option value="">Class</option>
                        {customEnvelopes.sort().map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>

                    <select
                        className="admin-input"
                        style={{ width: '120px', background: '#f8fafc', fontWeight: 'bold' }}
                        value={filterSection}
                        onChange={(e) => setFilterSection(e.target.value)}
                    >
                        <option value="">Section</option>
                        {availableSections.map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Roll No"
                        className="admin-input"
                        style={{ width: '100px', background: '#f8fafc' }}
                        value={filterRollNo}
                        onChange={(e) => setFilterRollNo(e.target.value)}
                    />

                    {activeTab === 'students' && (
                        <select
                            className="admin-input"
                            style={{ width: '160px', background: '#f8fafc', fontWeight: 'bold' }}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="issued">Healthcard Issued</option>
                            <option value="not-issued">Not Issued</option>
                        </select>
                    )}

                    <button type="button" className="action-btn view-btn" style={{ margin: 0, padding: '0.6rem 1rem' }} onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFilterSearch('');
                        setFilterClass('');
                        setFilterSection('');
                        setFilterRollNo('');
                        setFilterStatus('all');
                    }}>Clear</button>
                </div>

                <div className="records-table-container">
                    {/* Add Students Section inside envelope */}
                    {activeTab === 'students' && (
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--admin-border)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <label style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                    <Upload size={18} /> {isUploadingBulk ? 'Uploading...' : 'Bulk Import (CSV/Excel)'}
                                    <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleBulkUpload} style={{ display: 'none' }} disabled={isUploadingBulk} />
                                </label>
                                <button onClick={() => setShowManualForm(!showManualForm)} style={{ background: 'white', color: '#3b82f6', border: '1px solid #3b82f6', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                    <User size={18} /> Add Student Manually
                                </button>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Upload CSV/Excel with headers: Student Name, Section, Roll No, DOB, Parent Name, Contact Number</span>
                        </div>
                    )}

                    {showManualForm && activeTab === 'students' && (
                        <form onSubmit={handleManualSubmit} style={{ padding: '1.5rem', background: '#eff6ff', borderBottom: '1px solid var(--admin-border)', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: '#1e3a8a' }}>Student Name *</label>
                                <input type="text" className="admin-input" value={manualStudent.studentName} onChange={(e) => setManualStudent({ ...manualStudent, studentName: e.target.value })} required style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: '0 1 100px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: '#1e3a8a' }}>Section</label>
                                <input type="text" className="admin-input" value={manualStudent.section} onChange={(e) => setManualStudent({ ...manualStudent, section: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: '0 1 100px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: '#1e3a8a' }}>Roll No</label>
                                <input type="text" className="admin-input" value={manualStudent.rollNo} onChange={(e) => setManualStudent({ ...manualStudent, rollNo: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: '1 1 150px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: '#1e3a8a' }}>Parent Name</label>
                                <input type="text" className="admin-input" value={manualStudent.parentName} onChange={(e) => setManualStudent({ ...manualStudent, parentName: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: '1 1 150px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: '#1e3a8a' }}>Emergency Phone</label>
                                <input type="text" className="admin-input" placeholder="10 digits (6-9)" value={manualStudent.contactNumber} onChange={(e) => setManualStudent({ ...manualStudent, contactNumber: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: '1 1 120px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: '#1e3a8a' }}>DOB</label>
                                <input type="date" className="admin-input" value={manualStudent.dob} onChange={(e) => setManualStudent({ ...manualStudent, dob: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <button type="submit" style={{ background: 'var(--admin-success)', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '42px' }}>
                                Save Student
                            </button>
                        </form>
                    )}

                    <div className="table-responsive">
                        <table className="records-table">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Class & Section</th>
                                    <th>Roll No</th>
                                    <th>DOB</th>
                                    <th>Parent Name</th>
                                    <th>Parent Phone Number</th>
                                    <th>Health Card Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentsLoading ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading students...</td></tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No students found matching your filters.</td></tr>
                                ) : (
                                    filteredStudents.map((s, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: '600' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    {s.sourceCard?.photoBase64 ? (
                                                        <img src={s.sourceCard.photoBase64} alt="Student" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <User size={16} color="#94a3b8" />
                                                        </div>
                                                    )}
                                                    {s.name}
                                                </div>
                                            </td>
                                            <td>Class {s.class} {s.section !== 'N/A' ? `(${s.section})` : ''}</td>
                                            <td>{s.rollNo}</td>
                                            <td>{s.dob}</td>
                                            <td>{s.parentName || 'N/A'}</td>
                                            <td>{s.parentPhone || 'N/A'}</td>
                                            <td>
                                                {s.status === 'issued' ? (
                                                    <span style={{ color: '#059669', background: '#d1fae5', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700', display: 'inline-block' }}>
                                                        ISSUED
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#e11d48', background: '#ffe4e6', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700', display: 'inline-block' }}>
                                                        PENDING
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderPlaceholder = (title) => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="placeholder-view">
            <div style={{ background: 'rgba(49, 84, 196, 0.05)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                {React.createElement(menuItems.find(i => i.id === activeTab).icon, { size: 48, color: '#3154c4' })}
            </div>
            <h2>{title} View</h2>
            <p>This section is currently being updated with real-time database synchronization for your campus.</p>
        </motion.div>
    );

    const renderHealthInfo = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-view">
            <div className="records-table-container">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--admin-text-primary)' }}>Health Assessment Logs</h3>
                </div>
                <table className="records-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>General Health</th>
                            <th>Vision/Dental Status</th>
                            <th>Assessment Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allStudents.filter(s => s.sourceRecord).length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No medical assessments recorded yet.</td></tr>
                        ) : (
                            allStudents.filter(s => s.sourceRecord).map((s, idx) => {
                                const data = s.sourceRecord?.data || {};
                                return (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: '600' }}>{s.name} <br /><span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>Class {s.class}</span></td>
                                        <td>
                                            Height: {data.general?.height || '--'} cm<br />
                                            Weight: {data.general?.weight || '--'} kg
                                        </td>
                                        <td>
                                            Vision: {data.systemic?.eyeVision || 'Normal'}<br />
                                            Dental: {data.systemic?.dentalHygiene || 'Normal'}
                                        </td>
                                        <td>{new Date(s.sourceRecord.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-brand">
                    Children Health <span style={{ color: 'var(--admin-sidebar-active)' }}>Principal</span>
                </div>
                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>
                <div style={{ padding: '1rem', marginTop: 'auto' }}>
                    <button
                        onClick={onLogout}
                        className="nav-item"
                        style={{
                            width: '100%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ff8080',
                            border: 'none'
                        }}
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
                <div style={{ padding: '1rem 2rem', fontSize: '0.75rem', opacity: 0.5 }}>
                    © 2026 Vajra Principal Portal
                </div>
            </aside>

            <main className="admin-main" style={['students', 'cards-issued', 'cards-pending', 'health-info'].includes(activeTab) ? { paddingTop: '1rem' } : {}}>
                {!['dashboard', 'students', 'cards-issued', 'cards-pending', 'health-info'].includes(activeTab) && (
                    <header className="admin-header">
                        <div>
                            <h1>{menuItems.find(i => i.id === activeTab)?.label}</h1>
                            <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.875rem' }}>School Health Intelligence System</p>
                        </div>
                        <button className="action-btn view-btn" title="Refresh Data" onClick={fetchStudentsData} aria-label="Refresh student data">
                            <RefreshCw size={18} className={studentsLoading ? 'animate-spin' : ''} />
                        </button>
                    </header>
                )}

                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {(activeTab === 'students' || activeTab === 'cards-issued' || activeTab === 'cards-pending') && renderStudents()}
                    {activeTab === 'health-info' && renderHealthInfo()}
                </AnimatePresence>
            </main>
        </div>
    );
}
