'use client';

import React, { useState, useEffect } from 'react';
import './StudentHealthCard.css';
import { Mail, User, ClipboardPlus, Users, Shield, Search, MapPin, School, Hash, GraduationCap } from 'lucide-react';
import { useNotification } from './context/NotificationContext';
import SavedHealthRecordForm from './SavedHealthRecordForm';
import WeeklyHealthUpdate from './WeeklyHealthUpdate';
import { statesData } from './utils/statesData';

const StudentHealthRecord = ({ onRedirectToHealthCard, onBack, healthAssistantData }) => {
    const [campuses, setCampuses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { showAlert } = useNotification();
    // Using a map to track hover state per campus ID
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSchool, setSelectedSchool] = useState(null);

    // Viewing Cards States
    const [viewMode, setViewMode] = useState('form'); // 'form', 'list', 'view', 'weekly'
    const [savedCards, setSavedCards] = useState([]);
    const [viewingCardData, setViewingCardData] = useState(null);
    const [weeklyStudent, setWeeklyStudent] = useState(null); // student to show weekly report for
    const [isLoadingCards, setIsLoadingCards] = useState(false);
    const [dynamicEnvelopes, setDynamicEnvelopes] = useState([]);
    const [isFetchingEnvelopes, setIsFetchingEnvelopes] = useState(false);

    // Unified Filter logic to match StudentHealthCard as requested
    const [filterSearch, setFilterSearch] = useState('');
    const [filterSchool, setFilterSchool] = useState('');
    const [filterState, setFilterState] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterRollNo, setFilterRollNo] = useState('');

    const staticClassList = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

    useEffect(() => {
        const fetchCampuses = async () => {
            try {
                const res = await fetch('/api/campuses');
                if (res.ok) {
                    const data = await res.json();

                    // SHOW ALL CAMPUSES (User requested all be displayed)
                    setCampuses(data);
                }
            } catch (error) {
                console.error("Error fetching campuses:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCampuses();
    }, [healthAssistantData]);

    const handleCampusHover = async (index, school) => {
        // Force re-read the session init data to ensure we have the absolute latest shift assignment
        const storedAuthData = localStorage.getItem('healthAssistantData');
        const parsedAuth = storedAuthData ? JSON.parse(storedAuthData) : null;
        const initKey = parsedAuth ? `healthAssistantInit_${parsedAuth.email}` : '';
        const initDataRaw = initKey ? localStorage.getItem(initKey) : null;
        const initData = initDataRaw ? JSON.parse(initDataRaw) : null;
        const currentToday = new Date().toISOString().split('T')[0];

        const schName = (school.schoolName || school.schoolEnvelope || '').trim();
        // Priority: Daily shift campus, then registration campus (if initialization isn't required or daily is missing somehow)
        const initializedCampus = (initData?.date === currentToday ? initData.assignedCampus : (healthAssistantData?.assignedCampus || '')).trim();

        // STRICT ACCESS RESTRICTION: Once initialized, you can ONLY access your assigned campus.
        if (!initializedCampus) {
            showAlert('Please complete your Daily Shift Initialization on your profile page before opening any school records.', 'warning', 'Access Denied');
            return;
        }

        if (schName.toLowerCase() !== initializedCampus.toLowerCase()) {
            showAlert(`Your active shift is initialized for: "${initializedCampus}"\nYou are trying to open: "${schName}"`, 'warning', 'Access Denied');
            return;
        }

        setHoveredIndex(index);
        setIsFetchingEnvelopes(true);
        try {
            // Fetch both explicit envelopes and students to get all class names
            const [envRes, stdRes] = await Promise.all([
                fetch(`/api/envelopes?school=${encodeURIComponent(schName)}`),
                fetch(`/api/students?school=${encodeURIComponent(schName)}`)
            ]);

            const envs = envRes.ok ? await envRes.json() : [];
            const stds = stdRes.ok ? await stdRes.json() : [];

            // Normalize and unique class names case-insensitively
            const uniqueMap = new Map();

            // First add static classes as the base
            staticClassList.forEach(cls => uniqueMap.set(cls.toLowerCase(), cls));

            // Add dynamic classes, prioritizing the static casing if they match
            [...envs.map(e => e.className), ...stds.map(s => s.className)]
                .filter(Boolean)
                .forEach(cls => {
                    const key = cls.toLowerCase();
                    if (!uniqueMap.has(key)) {
                        uniqueMap.set(key, cls);
                    }
                });

            const allClassNames = Array.from(uniqueMap.values());
            setDynamicEnvelopes(allClassNames);
        } catch (error) {
            console.error("Error fetching school envelopes:", error);
            setDynamicEnvelopes(staticClassList);
        } finally {
            setIsFetchingEnvelopes(false);
        }
    };

    const fetchStudentsList = async (schoolObj, clsName) => {
        setIsLoadingCards(true);
        setViewMode('list');
        try {
            const targetSchool = schoolObj || selectedSchool;
            const targetClass = clsName || selectedClass;

            if (!targetSchool) {
                console.error("No school selected");
                return;
            }

            const schName = targetSchool.schoolName || targetSchool.schoolEnvelope;
            // Fetching for: schName, targetClass

            // Fetch raw students from the principals upload pool for the chosen class
            // And also fetch completed health records to know which are "View" vs "Fill"
            const [res, recRes] = await Promise.all([
                fetch(`/api/students?school=${encodeURIComponent(schName)}&class=${encodeURIComponent(targetClass)}`),
                fetch(`/api/health-records?school=${encodeURIComponent(schName)}&class=${encodeURIComponent(targetClass)}`)
            ]);

            if (res.ok && recRes.ok) {
                let data = await res.json();
                const records = await recRes.json();

                const recMap = new Map();
                records.forEach(r => {
                    if (r.rollNo) recMap.set(String(r.rollNo).trim(), r);
                });

                data = data.map(s => {
                    const existing = s.rollNo ? recMap.get(String(s.rollNo).trim()) : null;
                    if (existing) {
                        return { ...s, existingRecord: existing };
                    }
                    return s;
                });

                // Found students: data.length
                setSavedCards(data); // In list mode, savedCards now holds the joined students list for that class
            }
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setIsLoadingCards(false);
        }
    };

    const handleViewCardsClick = async () => {
        setIsLoadingCards(true);
        setViewMode('saved-list');
        try {
            const schName = selectedSchool.schoolName || selectedSchool.schoolEnvelope;
            const res = await fetch(`/api/health-records?school=${encodeURIComponent(schName)}&class=${encodeURIComponent(selectedClass)}`);
            if (res.ok) {
                const data = await res.json();
                // Filter only cards that have been completed
                setSavedCards(data);
            }
        } catch (error) {
            console.error("Error fetching cards:", error);
        } finally {
            setIsLoadingCards(false);
        }
    };

    if (selectedClass) {
        return (
            <div style={{ padding: '1rem', position: 'relative' }}>
                <h1 className="sr-only">Student Health Records Management</h1>
                <div style={{
                    position: 'absolute', top: '1rem', right: '2rem', zIndex: 100,
                    display: 'flex', gap: '10px'
                }}>
                    {viewMode === 'form' ? (
                        <>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    backgroundColor: '#64748b', color: '#fff', border: 'none',
                                    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                    fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}
                            >
                                &larr; Back to Class
                            </button>
                            <button
                                onClick={handleViewCardsClick}
                                style={{
                                    backgroundColor: '#2563eb', color: '#fff', border: 'none',
                                    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                    fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}
                            >
                                View Cards
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => { setViewMode('form'); setViewingCardData(null); }}
                            style={{
                                backgroundColor: '#10b981', color: '#fff', border: 'none',
                                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            &larr; Fill New Card
                        </button>
                    )}

                    {viewMode === 'view' && (
                        <button
                            onClick={() => setViewMode('saved-list')}
                            style={{
                                backgroundColor: '#3b82f6', color: '#fff', border: 'none',
                                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            &larr; Back to List
                        </button>
                    )}

                    {onBack && (
                        <button
                            onClick={() => {
                                setSelectedClass(null);
                                setSelectedSchool(null);
                                setViewMode('form');
                                setViewingCardData(null);
                                onBack();
                            }}
                            style={{
                                backgroundColor: '#1e293b', color: '#fff', border: 'none',
                                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            &larr; Back
                        </button>
                    )}
                </div>

                <div style={{ marginTop: '20px', paddingTop: '40px' }}>
                    {viewMode === 'form' && (
                        <SavedHealthRecordForm
                            schoolInfo={selectedSchool}
                            classInfo={selectedClass}
                            initialData={viewingCardData}
                            onSaveSuccess={(data) => {
                                // Re-fetch the student list with updated records so action buttons update
                                fetchStudentsList(selectedSchool, selectedClass);
                                setViewingCardData(null);
                                setViewMode('list');
                                if (onRedirectToHealthCard) {
                                    onRedirectToHealthCard(data, selectedSchool, selectedClass);
                                }
                            }}
                        />
                    )}

                    {viewMode === 'weekly' && (
                        <WeeklyHealthUpdate
                            schoolName={selectedSchool?.schoolName || selectedSchool?.schoolEnvelope || ''}
                            className={selectedClass}
                            student={weeklyStudent}
                            onBack={() => { setWeeklyStudent(null); setViewMode('list'); }}
                        />
                    )}

                    {viewMode === 'list' && (
                        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                                    Enrolled Students: <span style={{ color: '#3b82f6' }}>Class {selectedClass}</span>
                                </h2>
                                <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.9rem', fontWeight: '700' }}>
                                    {savedCards.length} Students Total
                                </span>
                            </div>

                            {/* Premium Unified Filter Bar for Student List */}
                            <h1 className="sr-only">School Campuses Health Portal</h1>
                            <div className="student-filter-bar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'flex-end', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', boxSizing: 'border-box', width: '100%', overflow: 'hidden' }}>
                                <div className="filter-item-group" style={{ flex: '1 1 auto', minWidth: '120px', maxWidth: '100%' }}>
                                    <label className="filter-label">Search Name</label>
                                    <div className="filter-input-wrapper">
                                        <Search className="filter-icon" size={16} />
                                        <input id="filterSearch" name="filterSearch" type="text" placeholder="Start typing name..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} autoComplete="off" />
                                    </div>
                                </div>

                                <div className="filter-item-group">
                                    <label className="filter-label">State</label>
                                    <div className="filter-input-wrapper">
                                        <MapPin className="filter-icon" size={16} />
                                        <select
                                            id="filterState"
                                            name="filterState"
                                            value={filterState}
                                            onChange={(e) => { setFilterState(e.target.value); setFilterDistrict(''); }}
                                            autoComplete="off"
                                        >
                                            <option value="">All States</option>
                                            {Object.keys(statesData).sort().map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="filter-item-group">
                                    <label className="filter-label">District</label>
                                    <div className="filter-input-wrapper">
                                        <MapPin className="filter-icon" size={16} />
                                        <select
                                            id="filterDistrict"
                                            name="filterDistrict"
                                            value={filterDistrict}
                                            onChange={(e) => setFilterDistrict(e.target.value)}
                                            disabled={!filterState}
                                        >
                                            <option value="">All Districts</option>
                                            {filterState && statesData[filterState]?.sort().map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="filter-item-group" style={{ minWidth: '120px', flex: '1 1 auto' }}>
                                    <label className="filter-label">School</label>
                                    <div className="filter-input-wrapper">
                                        <School className="filter-icon" size={16} />
                                        <select
                                            id="filterSchool"
                                            name="filterSchool"
                                            style={{ color: filterSchool ? 'black' : '#94a3b8' }}
                                            value={filterSchool}
                                            onChange={(e) => setFilterSchool(e.target.value)}
                                        >
                                            <option value="">Select School</option>
                                            {(campuses.length > 0 ? campuses : []).map((school, index) => {
                                                const name = school.schoolName || school.schoolEnvelope;
                                                return <option key={school._id || index} value={name}>{name}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div className="filter-item-group">
                                    <label className="filter-label">Class</label>
                                    <div className="filter-input-wrapper">
                                        <GraduationCap className="filter-icon" size={16} />
                                        <select
                                            id="filterClass"
                                            name="filterClass"
                                            style={{ color: filterClass ? 'black' : '#94a3b8' }}
                                            value={filterClass}
                                            onChange={(e) => setFilterClass(e.target.value)}
                                        >
                                            <option value="">All Classes</option>
                                            {staticClassList.map(cls => (
                                                <option key={cls} value={cls}>{cls}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="filter-item-group">
                                    <label className="filter-label">Section</label>
                                    <div className="filter-input-wrapper">
                                        <User className="filter-icon" size={16} />
                                        <select
                                            id="filterSection"
                                            name="filterSection"
                                            style={{ color: filterSection ? 'black' : '#94a3b8' }}
                                            value={filterSection}
                                            onChange={(e) => setFilterSection(e.target.value)}
                                        >
                                            <option value="">Section</option>
                                            {['A', 'B', 'C', 'D', 'E', 'F'].map(sec => (
                                                <option key={sec} value={sec}>{sec}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="filter-item-group">
                                    <label className="filter-label">Roll No</label>
                                    <div className="filter-input-wrapper">
                                        <Hash className="filter-icon" size={16} />
                                        <input id="filterRollNo" name="filterRollNo" type="text" placeholder="Roll No" value={filterRollNo} onChange={(e) => setFilterRollNo(e.target.value)} />
                                    </div>
                                </div>

                                <div className="filter-item-group">
                                    <label className="filter-label">Area</label>
                                    <div className="filter-input-wrapper">
                                        <MapPin className="filter-icon" size={16} />
                                        <input id="filterArea" name="filterArea" type="text" placeholder="Area/Addr..." value={filterArea} onChange={(e) => setFilterArea(e.target.value)} />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn-filter-clear"
                                    onClick={() => {
                                        setFilterSearch(''); setFilterSchool(''); setFilterState('');
                                        setFilterDistrict(''); setFilterClass(''); setFilterSection('');
                                        setFilterArea(''); setFilterRollNo('');
                                    }}
                                >
                                    Clear All
                                </button>
                            </div>

                            {isLoadingCards ? (
                                <div style={{ textAlign: 'center', padding: '4rem' }}>
                                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                                    <p style={{ color: '#64748b', fontWeight: '500' }}>Retrieving student roster...</p>
                                </div>
                            ) : (
                                savedCards.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#f8fafc', borderRadius: '1rem', border: '2px dashed #e2e8f0' }}>
                                        <Users size={48} color="#94a3b8" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                        <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>No Students Found</h3>
                                        <p style={{ color: '#64748b' }}>The Principal hasn't uploaded any students for Class {selectedClass} yet.</p>
                                    </div>
                                ) : (
                                    <div className="records-table-container" style={{ overflowX: 'auto' }}>
                                        <table className="records-table">
                                            <thead>
                                                <tr style={{ background: 'transparent' }}>
                                                    <th className="sticky-col sticky-col-1">Student Details</th>
                                                    <th className="sticky-col sticky-col-2">Section</th>
                                                    <th className="table-header-cell">Roll No</th>
                                                    <th className="table-header-cell">DOB</th>
                                                    <th className="table-header-cell">Parent Info</th>
                                                    <th className="table-header-cell">Action</th>
                                                    <th className="table-header-cell">Weekly Update</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {savedCards.filter(s => {
                                                    const name = (s.studentName || '').toLowerCase();
                                                    const section = (s.section || s.Section || s.className?.split('-')?.[1] || 'A').toLowerCase();
                                                    const roll = (s.rollNo || '').toString().toLowerCase();
                                                    const cls = (s.className || '').toLowerCase();
                                                    const school = (s.school || '').toLowerCase();
                                                    const area = (s.address || s.address1 || '').toLowerCase();

                                                    if (filterSearch && !name.includes(filterSearch.toLowerCase())) return false;
                                                    if (filterSection && section !== filterSection.toLowerCase()) return false;
                                                    if (filterRollNo && !roll.includes(filterRollNo.toLowerCase())) return false;
                                                    if (filterClass && cls !== filterClass.toLowerCase()) return false;
                                                    if (filterSchool && school !== filterSchool.toLowerCase()) return false;
                                                    if (filterArea && !area.includes(filterArea.toLowerCase())) return false;

                                                    // State and District filtering logic
                                                    if (filterState || filterDistrict) {
                                                        const matchingCampus = campuses.find(cp => {
                                                            const cpName = (cp.schoolName || '').trim().toLowerCase();
                                                            const cpEnv = (cp.schoolEnvelope || '').trim().toLowerCase();
                                                            return cpName === school || cpEnv === school;
                                                        });

                                                        if (filterState) {
                                                            const compState = (matchingCampus?.state || '').trim().toLowerCase();
                                                            if (compState !== filterState.toLowerCase()) return false;
                                                        }
                                                        if (filterDistrict) {
                                                            const compDistrict = (matchingCampus?.district || '').trim().toLowerCase();
                                                            if (compDistrict !== filterDistrict.toLowerCase()) return false;
                                                        }
                                                    }

                                                    return true;
                                                })
                                                    .map(s => (
                                                        <tr
                                                            key={s._id}
                                                            className="record-item-row"
                                                        >
                                                            <td className="sticky-col sticky-col-1">
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <User size={20} color="#3b82f6" />
                                                                    </div>
                                                                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.05rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{s.studentName || 'Unnamed Student'}</div>
                                                                        <div style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Class {s.className || selectedClass}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="sticky-col sticky-col-2">
                                                                <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700' }}>
                                                                    {s.section || 'A'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span style={{ fontWeight: '600', color: '#334155' }}>#{s.rollNo || 'N/A'}</span>
                                                            </td>
                                                            <td>
                                                                <span style={{ fontWeight: '500', color: '#334155', fontSize: '0.9rem' }}>{s.existingRecord?.dob || s.dob || 'N/A'}</span>
                                                            </td>
                                                            <td>
                                                                <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>{s.parentName || 'N/A'}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.contactNumber || 'No Contact'}</div>
                                                            </td>
                                                            <td style={{ textAlign: 'left' }}>
                                                                <button
                                                                    onClick={() => {
                                                                        if (s.existingRecord) {
                                                                            setViewingCardData(s.existingRecord);
                                                                        } else {
                                                                            setViewingCardData({
                                                                                name: s.studentName,
                                                                                studentClass: s.className,
                                                                                rollNo: s.rollNo,
                                                                                bloodGroup: s.bloodGroup,
                                                                                sonOf: s.parentName,
                                                                                schoolEnvelope: s.school,
                                                                                age: '',
                                                                                dob: s.dob,
                                                                            });
                                                                        }
                                                                        setViewMode('form');
                                                                    }}
                                                                    className="btn-filling-form"
                                                                    style={{
                                                                        background: s.existingRecord ? '#10b981' : '#3b82f6',
                                                                        boxShadow: s.existingRecord ? '0 4px 6px -1px rgba(16, 185, 129, 0.2)' : '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
                                                                    }}
                                                                >
                                                                    <ClipboardPlus size={16} /> {s.existingRecord ? 'Filled' : 'Fill Form'}
                                                                </button>
                                                            </td>
                                                            <td style={{ textAlign: 'left' }}>
                                                                <button
                                                                    onClick={() => { setWeeklyStudent(s); setViewMode('weekly'); }}
                                                                    className="btn-weekly-update"
                                                                    aria-label={`Weekly health update for ${s.name || 'this student'}`}
                                                                >
                                                                    <span role="img" aria-label="Calendar">📅</span> Weekly Update
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {viewMode === 'saved-list' && (
                        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                Saved Cards for Class {selectedClass}
                            </h2>
                            {isLoadingCards ? <p>Loading cards...</p> : (
                                savedCards.length === 0 ? <p style={{ color: '#64748b' }}>No health records found for this class.</p> :
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                        {savedCards.map(c => (
                                            <div
                                                key={c._id}
                                                onClick={() => { setViewingCardData(c); setViewMode('view'); }}
                                                style={{
                                                    border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem',
                                                    cursor: 'pointer', backgroundColor: '#f8fafc', transition: 'all 0.2s',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                            >
                                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: '#0f172a' }}>{c.name || 'Unnamed Student'}</h3>
                                                <p style={{ margin: '0 0 0.2rem', fontSize: '0.85rem', color: '#475569' }}>Roll No: <strong>{c.rollNo || 'N/A'}</strong></p>
                                                <p style={{ margin: '0 0 0.2rem', fontSize: '0.85rem', color: '#475569' }}>Date: <strong>{c.date || new Date().toISOString().split('T')[0]}</strong></p>
                                            </div>
                                        ))}
                                    </div>
                            )}
                        </div>
                    )}

                    {viewMode === 'view' && viewingCardData && (
                        <div>
                            {/* Re-use the SavedHealthRecordForm but in readOnly mode with initialData */}
                            <SavedHealthRecordForm initialData={viewingCardData} readOnly={true} />
                        </div>
                    )}
                </div>
            </div >
        );
    }


    return (
        <div className="health-card-container fade-in" style={{ padding: '0 1rem', maxWidth: '100%', boxSizing: 'border-box' }}>
            <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
                {/* Premium Filter Bar as requested */}
                <div className="campus-filter-bar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', width: '100%', overflow: 'hidden' }}>
                    <input
                        type="text"
                        placeholder="Search Name..."
                        aria-label="Search by student name"
                        style={{ flex: '2 1 auto', minWidth: '120px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                    />

                    <select
                        style={{ flex: '1 1 auto', minWidth: '100px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white' }}
                        value={filterState}
                        aria-label="Filter by state"
                        onChange={(e) => { setFilterState(e.target.value); setFilterDistrict(''); }}
                    >
                        <option value="">All States</option>
                        {Object.keys(statesData).sort().map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select
                        style={{ flex: '1 1 auto', minWidth: '100px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white' }}
                        value={filterDistrict}
                        aria-label="Filter by district"
                        onChange={(e) => setFilterDistrict(e.target.value)}
                        disabled={!filterState}
                    >
                        <option value="">All Districts</option>
                        {filterState && statesData[filterState]?.sort().map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select
                        style={{ flex: '1 1 auto', minWidth: '120px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white', color: filterSchool ? 'black' : '#94a3b8' }}
                        value={filterSchool}
                        aria-label="Filter by school"
                        onChange={(e) => {
                            const val = e.target.value;
                            setFilterSchool(val);
                            const found = (campuses.length > 0 ? campuses : []).find(s => (s.schoolName || s.schoolEnvelope) === val);
                            if (found) {
                                setSelectedSchool(found);
                                // If they select a school, they might want to see the grid for it or just filter it
                            }
                        }}
                    >
                        <option value="">Select School</option>
                        {(campuses.length > 0 ? campuses : []).map((school, index) => {
                            const name = school.schoolName || school.schoolEnvelope;
                            return <option key={school._id || index} value={name}>{name}</option>;
                        })}
                    </select>

                    <select
                        style={{ flex: '1 1 auto', minWidth: '90px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white', color: filterClass ? 'black' : '#94a3b8' }}
                        value={filterClass}
                        aria-label="Filter by class"
                        onChange={(e) => setFilterClass(e.target.value)}
                    >
                        <option value="">All Classes</option>
                        {staticClassList.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>

                    <select
                        style={{ flex: '1 1 auto', minWidth: '80px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white', color: filterSection ? 'black' : '#94a3b8' }}
                        value={filterSection}
                        aria-label="Filter by section"
                        onChange={(e) => setFilterSection(e.target.value)}
                    >
                        <option value="">Section</option>
                        {['A', 'B', 'C', 'D', 'E', 'F'].map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Roll No"
                        aria-label="Filter by roll number"
                        style={{ flex: '1 1 auto', minWidth: '70px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        value={filterRollNo}
                        onChange={(e) => setFilterRollNo(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Area/Addr..."
                        aria-label="Filter by area or address"
                        style={{ flex: '1 1 auto', minWidth: '90px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        value={filterArea}
                        onChange={(e) => setFilterArea(e.target.value)}
                    />

                    <button
                        type="button"
                        onClick={() => {
                            setFilterSearch(''); setFilterSchool(''); setFilterState('');
                            setFilterDistrict(''); setFilterClass(''); setFilterSection('');
                            setFilterArea(''); setFilterRollNo('');
                        }}
                        style={{ background: '#f59e0b', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Clear
                    </button>
                </div>

                {/* Header row for desktop */}
                <div className="record-grid-header">
                    <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>School Name</span>
                    <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Phone Number</span>
                    <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Correspondence / Principal</span>
                    <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>School Address</span>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading school profiles...</div>
                ) : (
                    <div>
                        {(() => {
                            const filtered = campuses.filter(s => {
                                const name = (s.schoolName || s.schoolEnvelope || "").toLowerCase();
                                if (filterSchool && name !== filterSchool.toLowerCase()) return false;
                                if (filterState && s.state !== filterState) return false;
                                if (filterDistrict && s.district !== filterDistrict) return false;
                                return true;
                            });

                            if (filtered.length === 0) {
                                return (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginTop: '1rem' }}>
                                        No schools matching your filters were found.
                                    </div>
                                );
                            }

                            return filtered.map((school, index) => {
                                const isHovered = hoveredIndex === index;

                                // Map database fields
                                const name = school.schoolName || school.schoolEnvelope || "Unnamed School";
                                const phone = school.phoneNumber || school.schoolPhone || "N/A";
                                const principal = school.principal?.name || school.principalName || "Not assigned";
                                const address = school.address
                                    ? (() => {
                                        const { addressLine, area, city } = school.address;
                                        const parts = [];
                                        if (addressLine) parts.push(addressLine.trim());
                                        if (area && !addressLine?.toLowerCase().includes(area.toLowerCase())) parts.push(area.trim());
                                        if (city && !addressLine?.toLowerCase().includes(city.toLowerCase()) && !area?.toLowerCase().includes(city.toLowerCase())) parts.push(city.trim());
                                        return parts.filter(Boolean).join(', ');
                                    })() || "No address provided"
                                    : (school.schoolAddress || "No address provided");

                                return (
                                    <div key={school._id || index} className="record-row-grid">
                                        <div
                                            className="envelope-svg-container"
                                            onClick={() => handleCampusHover(index, school)}
                                            style={{
                                                position: 'relative',
                                                width: '100%',
                                                minHeight: '140px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',

                                                boxSizing: 'border-box',
                                                cursor: 'pointer'
                                            }}>
                                            {/* Envelope SVG serving as the background card */}
                                            <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(260px, 90%)', height: '180px', zIndex: 0 }} viewBox="0 0 24 24" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" fill="#facc15" stroke="#1e3a8a" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M3 8L10.8906 13.2604C11.5624 13.7083 12.4376 13.7083 13.1094 13.2604L21 8" stroke="#1e3a8a" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>

                                            <span className="school-name-badge" style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                opacity: (healthAssistantData?.assignedCampus && name.toLowerCase() !== healthAssistantData.assignedCampus.toLowerCase()) ? 0.6 : 1
                                            }}>
                                                {(healthAssistantData?.assignedCampus && name.toLowerCase() !== healthAssistantData.assignedCampus.toLowerCase()) && (
                                                    <Shield size={14} color="#64748b" /> // Visual indicator for locked school
                                                )}
                                                {name}
                                            </span>
                                        </div>

                                        <div className="mobile-cell">
                                            <span className="mobile-label">Phone</span>
                                            <span className="cell-value">{phone}</span>
                                        </div>
                                        <div className="mobile-cell">
                                            <span className="mobile-label">Principal</span>
                                            <span className="cell-value">{principal}</span>
                                        </div>
                                        <div className="mobile-cell">
                                            <span className="mobile-label">Address</span>
                                            <span className="cell-value">{address}</span>
                                        </div>

                                        {/* Modal Overlay for classes detail */}
                                        {isHovered && (
                                            <div className="envelope-detail-overlay" onClick={(e) => { e.stopPropagation(); setHoveredIndex(null); }}>
                                                <div className="envelope-detail-modal" onClick={(e) => e.stopPropagation()}>
                                                    <button className="envelope-close-btn" onClick={() => setHoveredIndex(null)} aria-label="Close modal">✕</button>

                                                    <div className="envelope-modal-header">
                                                        <Mail size={16} /> SELECT CLASS FOR {typeof name === 'string' ? name.toUpperCase() : 'SCHOOL'}
                                                    </div>

                                                    <div className="envelope-classes-grid">
                                                        {isFetchingEnvelopes ? <p>Loading classes...</p> : dynamicEnvelopes.map((cls) => (
                                                            <button
                                                                key={cls}
                                                                className="class-select-card"
                                                                onClick={() => {
                                                                    setSelectedClass(cls);
                                                                    setSelectedSchool(school);
                                                                    setHoveredIndex(null);
                                                                    fetchStudentsList(school, cls);
                                                                }}
                                                            >
                                                                <div style={{ backgroundColor: '#facc15', padding: '4px', borderRadius: '6px', border: '1px solid #1e3a8a', display: 'flex' }}>
                                                                    <Mail size={20} color="#1e3a8a" />
                                                                </div>
                                                                {cls}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p style={{ marginTop: '2.5rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>Click a class envelope to open report sheet</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    © vajra blue zone hospital private limited . All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default StudentHealthRecord;
