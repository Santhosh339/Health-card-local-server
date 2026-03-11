import React, { useState, useEffect } from 'react';
import { useNotification } from './context/NotificationContext';
import './StudentIdentityCard.css';
import {
    Plus, Search, List, Grid, School, User, MapPin, Hash, GraduationCap,
    Clock, Calendar, FileText, ChevronLeft, ChevronRight, FilePlus,
    Download, Edit2, Shield, Mail, ArrowLeft, Save, ClipboardPlus
} from 'lucide-react';
import trustCareLogo from './assets/trust_care_logo.png';
import vajraLogoJpg from './assets/vajra_logo.jpg';
import vajraSealSigned from './assets/vajra_seal_signed.png';
import { statesData } from './utils/statesData';

const StudentHealthCard = ({ onBack, vajraLogo, secondLogo, schoolInfo, classInfo, prefillData, healthAssistantData }) => {
    const { showAlert } = useNotification();
    // Determine the initialized school name correctly
    const defaultSchoolName = schoolInfo?.schoolName || schoolInfo?.schoolEnvelope || '';

    const [healthCardForm, setHealthCardForm] = useState({
        photoBase64: '',
        lFileNo: '',
        dateOfIssue: new Date().toISOString().split('T')[0],
        validity: '1 Year',
        name: prefillData?.name || '',
        dobOrAge: prefillData?.dob ? `${prefillData.dob.includes('-') ? prefillData.dob.split('-').reverse().join('/') : prefillData.dob}${prefillData.age ? ` (${prefillData.age})` : ''}` : (prefillData?.age || ''),
        bloodGroup: prefillData?.bloodGroup || '',
        studentClass: prefillData?.studentClass || classInfo || '',
        rollNo: prefillData?.rollNo || '',
        school: prefillData?.schoolEnvelope || defaultSchoolName,
        address1: prefillData?.schoolAddress || '',
        address2: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // View Cards Mode logic
    const [viewMode, setViewMode] = useState('form'); // 'form', 'schools', 'list', 'view'
    const [savedCards, setSavedCards] = useState([]);
    const [isLoadingCards, setIsLoadingCards] = useState(false);

    // Envelopes & Classes logic
    const [campuses, setCampuses] = useState([]);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [dynamicClasses, setDynamicClasses] = useState([]);
    const staticClassList = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

    // Deduplicate class list case-insensitively to prevent "Nursery" vs "nursery" duplicates
    const classList = [];
    const seenClasses = new Set();
    [...staticClassList, ...dynamicClasses].forEach(cls => {
        if (!cls) return;
        const normalized = cls.trim().toLowerCase();
        if (!seenClasses.has(normalized)) {
            seenClasses.add(normalized);
            classList.push(cls.trim());
        }
    });

    // List Filters logic
    const [filterSearch, setFilterSearch] = useState('');
    const [filterSchool, setFilterSchool] = useState('');
    const [filterState, setFilterState] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterRollNo, setFilterRollNo] = useState('');

    // FETCH CAMPUSES AND CARDS ON MOUNT
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch Campuses
                const campusRes = await fetch('/api/campuses');
                let loadedCampuses = [];
                if (campusRes.ok) {
                    loadedCampuses = await campusRes.json();
                    setCampuses(loadedCampuses);
                }

                // Fetch Cards (for assigned campus or all if unspecified)
                setIsLoadingCards(true);
                let apiUrl = '/api/health-cards';
                if (healthAssistantData?.assignedCampus) {
                    apiUrl += `?school=${encodeURIComponent(healthAssistantData.assignedCampus)}`;
                }

                const cardsRes = await fetch(apiUrl);
                if (cardsRes.ok) {
                    const cards = await cardsRes.json();
                    setSavedCards(cards);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setIsLoadingCards(false);
            }
        };
        fetchInitialData();
    }, [healthAssistantData?.assignedCampus]);

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
            const isUpdate = !!healthCardForm._id;
            const response = await fetch('/api/health-cards', {
                method: isUpdate ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(healthCardForm),
            });

            if (response.ok) {
                showAlert('Health card record saved to database.', 'success', 'Success!');
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

    const handleViewCardsClick = async () => {
        setIsLoadingCards(true);
        setViewMode('schools');
        try {
            const campusRes = await fetch('/api/campuses');
            if (campusRes.ok) {
                const data = await campusRes.json();
                // SHOW ALL CAMPUSES (User requested all be displayed)
                setCampuses(data);
            }

            // Radically shrink database payload by ONLY requesting explicit school assigned
            let apiUrl = '/api/health-cards';
            if (healthAssistantData?.assignedCampus) {
                apiUrl += `?school=${encodeURIComponent(healthAssistantData.assignedCampus)}`;
            } else if (defaultSchoolName) {
                apiUrl += `?school=${encodeURIComponent(defaultSchoolName)}`;
            }

            const cardsRes = await fetch(apiUrl);
            if (cardsRes.ok) {
                const data = await cardsRes.json();
                setSavedCards(data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoadingCards(false);
        }
    };

    useEffect(() => {
        const fetchDynamicClasses = async () => {
            const schName = selectedSchool?.schoolName || selectedSchool?.schoolEnvelope || defaultSchoolName;
            if (!schName) return;
            try {
                const res = await fetch(`/api/envelopes?school=${encodeURIComponent(schName)}`);
                if (res.ok) {
                    const data = await res.json();
                    setDynamicClasses(data.map(e => e.className));
                }
            } catch (error) {
                console.error("Error fetching envelopes:", error);
            }
        };
        fetchDynamicClasses();
    }, [selectedSchool, defaultSchoolName]);

    const handleClassSelect = async (school, cls) => {
        setIsLoadingCards(true);
        const schName = school.schoolName || school.schoolEnvelope || '';
        setSelectedSchool(school);
        setSelectedClass(cls);
        setFilterSchool(schName);
        setFilterClass(cls);
        setHoveredIndex(null);

        try {
            const [res, cardsRes] = await Promise.all([
                fetch(`/api/students?school=${encodeURIComponent(schName)}&class=${encodeURIComponent(cls)}`),
                fetch(`/api/health-cards?school=${encodeURIComponent(schName)}&class=${encodeURIComponent(cls)}`)
            ]);

            if (res.ok && cardsRes.ok) {
                let data = await res.json();
                const cards = await cardsRes.json();

                const cardMap = new Map();
                cards.forEach(c => {
                    if (c.rollNo) cardMap.set(String(c.rollNo).trim(), c);
                });

                data = data.map(s => {
                    const existing = s.rollNo ? cardMap.get(String(s.rollNo).trim()) : null;
                    if (existing) {
                        return { ...s, existingCard: existing };
                    }
                    return s;
                });

                setSavedCards(data); // Reusing savedCards as the active students list for this session
                setViewMode('list');
            }
        } catch (error) {
            console.error("Error fetching class students:", error);
        } finally {
            setIsLoadingCards(false);
        }
    };

    const handleViewSingleCard = (card) => {
        setHealthCardForm({
            _id: card._id, // Keep ID if we are editing an existing card
            photoBase64: card.photoBase64 || '',
            lFileNo: card.lFileNo || '',
            dateOfIssue: card.dateOfIssue || new Date().toISOString().split('T')[0],
            validity: card.validity || '1 Year',
            name: card.name || card.studentName || '',
            dobOrAge: card.dobOrAge || (card.dob ? `${card.dob.includes('-') ? card.dob.split('-').reverse().join('/') : card.dob}${card.age ? ` (${card.age})` : ''}` : (card.age || '')),
            bloodGroup: card.bloodGroup || '',
            studentClass: card.studentClass || card.className || '',
            rollNo: card.rollNo || '',
            school: card.school || '',
            address1: card.address1 || card.address || '',
            address2: card.address2 || ''
        });
        setViewMode('view');
    };

    const resetFormToNew = () => {
        setHealthCardForm({
            photoBase64: '', lFileNo: '', dateOfIssue: new Date().toISOString().split('T')[0],
            validity: '1 Year', name: '', dobOrAge: '', bloodGroup: '',
            studentClass: classInfo || '', rollNo: '', school: defaultSchoolName, address1: '', address2: ''
        });
        setViewMode('form');
    };

    const filteredCards = savedCards.filter(c => {
        const studentName = (c.name || c.studentName || '').trim().toLowerCase();
        const studentClass = (c.studentClass || c.className || '').trim().toLowerCase();
        const studentSchoolRaw = (c.school || '').trim().toLowerCase();
        const studentSchoolNoDots = studentSchoolRaw.replace(/\./g, '').replace(/\s+/g, ' ');
        const studentSection = (c.section || '').trim().toLowerCase();

        const fSearch = (filterSearch || '').trim().toLowerCase();
        const fSchool = (filterSchool || '').trim().toLowerCase();
        const fClass = (filterClass || '').trim().toLowerCase();
        const fSection = (filterSection || '').trim().toLowerCase();
        const fState = (filterState || '').trim().toLowerCase();
        const fDistrict = (filterDistrict || '').trim().toLowerCase();
        const fArea = (filterArea || '').trim().toLowerCase();
        const fRollNo = (filterRollNo || '').trim().toLowerCase();

        if (fSearch && !studentName.includes(fSearch)) return false;
        if (fSchool && studentSchoolRaw !== fSchool) return false;
        if (fClass && studentClass !== fClass) return false;
        if (fSection && studentSection !== fSection) return false;

        // State and District Filters
        let matchingCampus = campuses.find(cp => {
            const cpName = (cp.schoolName || '').trim().toLowerCase();
            const cpEnv = (cp.schoolEnvelope || '').trim().toLowerCase();
            const cpNameNoDots = cpName.replace(/\./g, '').replace(/\s+/g, ' ');
            const cpEnvNoDots = cpEnv.replace(/\./g, '').replace(/\s+/g, ' ');

            return cpName === studentSchoolRaw ||
                cpEnv === studentSchoolRaw ||
                cpNameNoDots === studentSchoolNoDots ||
                cpEnvNoDots === studentSchoolNoDots;
        });

        // Fallback: If no campus record found but it matches assistant's assigned school
        if (!matchingCampus && (healthAssistantData?.assignedCampus || '').toLowerCase().trim() === studentSchoolRaw) {
            matchingCampus = healthAssistantData;
        }

        if (fState) {
            const compState = (matchingCampus?.state || '').trim().toLowerCase();
            // Also check address if campus metadata lookup fails
            const inAddress = (c.address1 || '').toLowerCase().includes(fState) || (c.address2 || '').toLowerCase().includes(fState) || (c.address || '').toLowerCase().includes(fState);
            if (compState !== fState && !inAddress) return false;
        }

        if (fDistrict) {
            const compDistrict = (matchingCampus?.district || '').trim().toLowerCase();
            const inAddress = (c.address1 || '').toLowerCase().includes(fDistrict) || (c.address2 || '').toLowerCase().includes(fDistrict) || (c.address || '').toLowerCase().includes(fDistrict);
            if (compDistrict !== fDistrict && !inAddress) return false;
        }

        if (fRollNo && !c.rollNo?.toString().toLowerCase().includes(fRollNo)) return false;
        if (fArea && !c.address1?.toLowerCase().includes(fArea) && !c.address2?.toLowerCase().includes(fArea) && !c.address?.toLowerCase().includes(fArea)) return false;

        return true;
    });

    const availableSections = [...new Set(savedCards.map(s => s.section || s.Section).filter(Boolean))].sort();

    return (
        <div className="card-editor-container fade-in">
            <h1 className="sr-only">Student Health Card Dashboard</h1>
            <div className="id-card-top-controls responsive-top-controls" style={{
                display: 'flex', justifyContent: 'flex-end', gap: '10px',
                width: '100%', margin: '0 auto 1rem', zIndex: 100,
                position: 'relative'
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
                            &larr; Back to List
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
                    <>
                        <button
                            onClick={resetFormToNew}
                            style={{
                                backgroundColor: '#10b981', color: '#fff', border: 'none',
                                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            &larr; Fill New Identity Card
                        </button>
                        {onBack && (
                            <button
                                onClick={() => setViewMode('form')}
                                style={{
                                    backgroundColor: '#1e293b', color: '#fff', border: 'none',
                                    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                    fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}
                            >
                                <ArrowLeft size={18} /> Back
                            </button>
                        )}
                    </>
                )}



                {viewMode === 'view' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => {
                                // Enable editing
                                setViewMode('form');
                            }}
                            style={{
                                backgroundColor: '#f59e0b', color: '#fff', border: 'none',
                                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Edit2 size={18} /> Edit
                        </button>
                        <button
                            onClick={() => window.print()}
                            style={{
                                backgroundColor: '#10b981', color: '#fff', border: 'none',
                                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Download size={18} /> Download
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                backgroundColor: '#3b82f6', color: '#fff', border: 'none',
                                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            &larr; Back to List
                        </button>
                    </div>
                )}
            </div>

            {/* MAIN CARD EXPLORER (Schools / Classes / List / Search) */}
            {(viewMode === 'schools' || viewMode === 'classes' || viewMode === 'list') && (() => {
                // Determine if we should show the "Search Results" (List) view globally
                // We only jump to the global results list if the user is searching for a SPECIFIC student (name/roll/etc)
                // or if they are already in the list view.
                // High-level filters like State/District/School or even Class should filter the CURRENT view.
                const hasSearchFilters = filterSearch || filterClass || filterSection || filterArea || filterRollNo;
                const effectiveView = (hasSearchFilters || viewMode === 'list') ? 'list' : viewMode;

                const hasAnyFilter = hasSearchFilters || filterSchool || filterState || filterDistrict;

                let titleText = 'Select School Campus';
                if (effectiveView === 'classes') titleText = `SELECT CLASS FOR ${(selectedSchool?.schoolName || selectedSchool?.schoolEnvelope || '').toUpperCase()}`;
                if (effectiveView === 'list') {
                    if (hasSearchFilters && viewMode === 'schools') titleText = 'Search Results Across Schools';
                    else if (hasSearchFilters) titleText = 'Search Results';
                    else titleText = `Saved Cards for Class ${selectedClass}`;
                }

                return (
                    <div className="responsive-page-container" style={{ margin: '0 auto' }}>

                        {/* Header Area */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {effectiveView === 'classes' && <Mail size={24} />}
                                {titleText}
                            </h2>
                            {effectiveView !== 'schools' && (
                                <button onClick={() => {
                                    if (effectiveView === 'list' && selectedClass && !hasAnyFilter) {
                                        setViewMode('classes');
                                    } else {
                                        setFilterSearch(''); setFilterSchool(''); setFilterState(''); setFilterDistrict(''); setFilterClass(''); setFilterSection(''); setFilterArea('');
                                        setViewMode('schools');
                                    }
                                }} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    &larr; Back
                                </button>
                            )}
                        </div>

                        {/* Filter Bar (Always visible) */}
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'flex-end', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div className="filter-item-group" style={{ flex: '1 1 auto', minWidth: '150px' }}>
                                <label htmlFor="filterSearch" className="filter-label">Search Name</label>
                                <div className="filter-input-wrapper">
                                    <Search className="filter-icon" size={16} />
                                    <input id="filterSearch" name="filterSearch" type="text" placeholder="Start typing name..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
                                </div>
                            </div>

                            <div className="filter-item-group">
                                <label htmlFor="filterState" className="filter-label">State</label>
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
                                <label htmlFor="filterDistrict" className="filter-label">District</label>
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
                                        {filterState && statesData[filterState].sort().map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="filter-item-group" style={{ minWidth: '160px' }}>
                                <label htmlFor="filterSchool" className="filter-label">School</label>
                                <div className="filter-input-wrapper">
                                    <School className="filter-icon" size={16} />
                                    <select
                                        id="filterSchool"
                                        name="filterSchool"
                                        style={{ color: filterSchool ? 'black' : '#94a3b8' }}
                                        value={filterSchool}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFilterSchool(val);
                                            const found = (campuses.length > 0 ? campuses : []).find(s => (s.schoolName || s.schoolEnvelope) === val);
                                            if (found) {
                                                setSelectedSchool(found);
                                                // Switch to classes view for this school if not already there
                                                if (viewMode !== 'classes') setViewMode('classes');
                                            } else if (!val) {
                                                setViewMode('schools');
                                            }
                                        }}
                                    >
                                        <option value="">All Schools</option>
                                        {(campuses.length > 0 ? campuses : []).map((school, index) => {
                                            const name = school.schoolName || school.schoolEnvelope;
                                            return <option key={school._id || index} value={name}>{name}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>

                            <div className="filter-item-group">
                                <label htmlFor="filterClass" className="filter-label">Class</label>
                                <div className="filter-input-wrapper">
                                    <GraduationCap className="filter-icon" size={16} />
                                    <select
                                        id="filterClass"
                                        name="filterClass"
                                        style={{ color: filterClass ? 'black' : '#94a3b8' }}
                                        value={filterClass}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFilterClass(val);
                                            if (selectedSchool && val) {
                                                handleClassSelect(selectedSchool, val);
                                            }
                                        }}
                                    >
                                        <option value="">All Classes</option>
                                        {classList.map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="filter-item-group">
                                <label htmlFor="filterSection" className="filter-label">Section</label>
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
                                        {availableSections.map(sec => (
                                            <option key={sec} value={sec}>{sec}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="filter-item-group">
                                <label htmlFor="filterRollNo" className="filter-label">Roll No</label>
                                <div className="filter-input-wrapper">
                                    <Hash className="filter-icon" size={16} />
                                    <input id="filterRollNo" name="filterRollNo" type="text" placeholder="Roll No" value={filterRollNo || ''} onChange={(e) => setFilterRollNo(e.target.value)} />
                                </div>
                            </div>

                            <div className="filter-item-group" style={{ minWidth: '120px' }}>
                                <label htmlFor="filterArea" className="filter-label">Area</label>
                                <div className="filter-input-wrapper">
                                    <MapPin className="filter-icon" size={16} />
                                    <input id="filterArea" name="filterArea" type="text" placeholder="Area/Addr..." value={filterArea} onChange={(e) => setFilterArea(e.target.value)} />
                                </div>
                            </div>

                            <button type="button" className="btn-filter-clear" onClick={() => { setFilterSearch(''); setFilterSchool(''); setFilterState(''); setFilterDistrict(''); setFilterClass(''); setFilterSection(''); setFilterArea(''); setFilterRollNo(''); }}>Clear</button>
                        </div>

                        {/* Content Area */}
                        {
                            isLoadingCards ? <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading Data...</div> : (
                                <>
                                    {effectiveView === 'schools' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', paddingTop: '1rem' }}>
                                            {((campuses.length > 0 ? campuses : []).filter(s => {
                                                const sState = (s.state || '').trim().toLowerCase();
                                                const sDist = (s.district || '').trim().toLowerCase();
                                                const fState = (filterState || '').trim().toLowerCase();
                                                const fDist = (filterDistrict || '').trim().toLowerCase();
                                                const fSchool = (filterSchool || '').trim().toLowerCase();

                                                if (fState && sState !== fState) return false;
                                                if (fDist && sDist !== fDist) return false;
                                                if (fSchool && (s.schoolName || s.schoolEnvelope || '').toLowerCase() !== fSchool) return false;
                                                return true;
                                            })).map((school, index) => {
                                                const name = school.schoolName || school.schoolEnvelope;
                                                return (
                                                    <div
                                                        key={school._id || index}
                                                        onClick={() => {
                                                            // Force re-read the session init data to ensure absolute accuracy
                                                            const storedAuthData = localStorage.getItem('healthAssistantData');
                                                            const parsedAuth = storedAuthData ? JSON.parse(storedAuthData) : null;
                                                            const initKey = parsedAuth ? `healthAssistantInit_${parsedAuth.email}` : '';
                                                            const initDataRaw = initKey ? localStorage.getItem(initKey) : null;
                                                            const initData = initDataRaw ? JSON.parse(initDataRaw) : null;
                                                            const currentToday = new Date().toISOString().split('T')[0];

                                                            const schName = (school.schoolName || school.schoolEnvelope || '').trim();
                                                            const initializedCampus = (initData?.date === currentToday ? initData.assignedCampus : (healthAssistantData?.assignedCampus || '')).trim();

                                                            if (!initializedCampus) {
                                                                showAlert('You must initialize your daily shift first.', 'warning', 'Access Denied');
                                                                return;
                                                            }

                                                            if (schName.toLowerCase() !== initializedCampus.toLowerCase()) {
                                                                showAlert(`Your active shift is initialized for: "${initializedCampus}"\nYou are trying to open: "${schName}"`, 'warning', 'Access Denied');
                                                                return;
                                                            }
                                                            setSelectedSchool(school);
                                                            setViewMode('classes');
                                                        }}
                                                        style={{
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '12px',
                                                            padding: '2rem 1rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            backgroundColor: '#f8fafc',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                            transition: 'all 0.2s',
                                                            fontWeight: 'bold',
                                                            color: '#1e3a8a',
                                                            textAlign: 'center',
                                                            minHeight: '100px',
                                                            fontSize: '1.1rem',
                                                            opacity: (healthAssistantData?.assignedCampus && (school.schoolName || school.schoolEnvelope).toLowerCase() !== healthAssistantData.assignedCampus.toLowerCase()) ? 0.6 : 1
                                                        }}
                                                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                                                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none' }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {(healthAssistantData?.assignedCampus && (school.schoolName || school.schoolEnvelope).toLowerCase() !== healthAssistantData.assignedCampus.toLowerCase()) && (
                                                                <Shield size={18} color="#64748b" />
                                                            )}
                                                            {name}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {effectiveView === 'classes' && (
                                        <>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', paddingTop: '1rem' }}>
                                                {classList.map((cls) => (
                                                    <button
                                                        key={cls}
                                                        onClick={() => handleClassSelect(selectedSchool, cls)}
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            background: '#ffffff',
                                                            border: '2px solid #1e3a8a',
                                                            borderRadius: '16px',
                                                            width: '100px',
                                                            height: '75px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            boxShadow: '4px 4px 0px 0px #1e3a8a',
                                                            color: '#1e3a8a',
                                                            fontWeight: '800',
                                                            fontSize: '0.9rem'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#facc15';
                                                            e.currentTarget.style.transform = 'translate(2px, 2px)';
                                                            e.currentTarget.style.boxShadow = '2px 2px 0px 0px #1e3a8a';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                                            e.currentTarget.style.transform = 'none';
                                                            e.currentTarget.style.boxShadow = '4px 4px 0px 0px #1e3a8a';
                                                        }}
                                                    >
                                                        <div style={{ backgroundColor: '#facc15', padding: '4px', borderRadius: '6px', border: '1px solid #1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Mail size={20} color="#1e3a8a" />
                                                        </div>
                                                        {cls}
                                                    </button>
                                                ))}
                                            </div>
                                            <p style={{ marginTop: '2.5rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>Click a class envelope to open identity cards list</p>
                                        </>
                                    )}

                                    {effectiveView === 'list' && (
                                        <div className="responsive-list-container" style={{ background: '#f8fafc', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
                                                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                                                    Enrolled Students: <span style={{ color: '#3b82f6' }}>Class {healthCardForm.studentClass || selectedSchool?.schoolName || 'Roster'}</span>
                                                </h2>
                                                <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.9rem', fontWeight: '700' }}>
                                                    {filteredCards.length} {filteredCards.length === 1 ? 'Student' : 'Students'} Total
                                                </span>
                                            </div>

                                            {filteredCards.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                                                    No student records found matching these filters.
                                                </div>
                                            ) : (
                                                <div className="records-table-container">
                                                    <table className="records-table">
                                                        <thead>
                                                            <tr>
                                                                <th className="sticky-col sticky-col-1">Student Details</th>
                                                                <th className="sticky-col sticky-col-2">Section</th>
                                                                <th>Roll No</th>
                                                                <th>Class</th>
                                                                <th>Blood Group</th>
                                                                <th style={{ textAlign: 'center' }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredCards.map((c, idx) => {
                                                                const name = c.name || c.studentName || 'Unnamed Student';
                                                                const cls = c.studentClass || c.className || 'N/A';
                                                                const section = c.section || c.Section || 'N/A';
                                                                const roll = c.rollNo || 'N/A';
                                                                const blood = c.existingCard?.bloodGroup || c.bloodGroup || 'N/A';

                                                                return (
                                                                    <tr
                                                                        key={c._id || idx}
                                                                        className="record-item-row"
                                                                    >
                                                                        <td className="sticky-col sticky-col-1">
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                                {c.photoBase64 ? (
                                                                                    <img src={c.photoBase64} alt={name} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                                                                                ) : (
                                                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                        <User size={20} color="#3b82f6" />
                                                                                    </div>
                                                                                )}
                                                                                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.05rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{name}</div>
                                                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{c.school || 'Assigned School'}</div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="sticky-col sticky-col-2">
                                                                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700' }}>
                                                                                {section}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <span style={{ fontWeight: '600', color: '#334155' }}>#{roll}</span>
                                                                        </td>
                                                                        <td>
                                                                            <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700' }}>{cls}</span>
                                                                        </td>
                                                                        <td>
                                                                            <span style={{ color: blood !== 'N/A' ? '#e11d48' : '#64748b', fontWeight: '700' }}>{blood}</span>
                                                                        </td>
                                                                        <td style={{ textAlign: 'center' }}>
                                                                            <button
                                                                                onClick={() => handleViewSingleCard(c.existingCard || c)}
                                                                                className="btn-filling-form"
                                                                                style={{
                                                                                    backgroundColor: c.existingCard ? '#10b981' : '#2563eb'
                                                                                }}
                                                                            >
                                                                                <ClipboardPlus size={16} /> {c.existingCard ? 'View' : 'Fill'}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )
                        }
                    </div >
                );
            })()}

            {
                (viewMode === 'form' || viewMode === 'view') && (
                    <form onSubmit={handleSubmit} className="identity-card-form-wrapper" style={{ pointerEvents: viewMode === 'view' ? 'none' : 'auto', userSelect: viewMode === 'view' ? 'none' : 'auto' }}>
                        {/* The Editable Physical Card */}
                        <div className="id-card-physical">
                            <div className="id-card-inner">

                                {/* Top Header Row */}
                                <div className="id-header-row">
                                    <div style={{ width: '10px', flexShrink: 0 }}></div>
                                    <div className="header-school-center">
                                        <input
                                            id="headerSchool"
                                            name="headerSchool"
                                            className="header-school-input"
                                            value={healthCardForm.school}
                                            onChange={(e) => setHealthCardForm({ ...healthCardForm, school: e.target.value.replace(/\n/g, ' ') })}
                                            placeholder="ENTER SCHOOL NAME"
                                        />
                                    </div>
                                    <div className="id-logo-right">
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
                                        <input id="card-photo-upload" name="card-photo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                                    </div>

                                    <div className="id-top-fields">
                                        <div className="dotted-row red-row">
                                            <span className="row-label">FILE No:</span>
                                            <input id="lFileNo" name="lFileNo" className="dotted-input" type="text" value={healthCardForm.lFileNo} onChange={(e) => setHealthCardForm({ ...healthCardForm, lFileNo: e.target.value })} required />
                                        </div>
                                        <div className="dotted-row red-row">
                                            <span className="row-label">Date of Issue:</span>
                                            <input id="dateOfIssue" name="dateOfIssue" className="dotted-input" type="text" value={healthCardForm.dateOfIssue} onChange={(e) => setHealthCardForm({ ...healthCardForm, dateOfIssue: e.target.value })} required />
                                        </div>
                                        <div className="dotted-row red-row">
                                            <span className="row-label">Validity:</span>
                                            <input id="validity" name="validity" className="dotted-input" type="text" value={healthCardForm.validity} onChange={(e) => setHealthCardForm({ ...healthCardForm, validity: e.target.value })} required />
                                        </div>
                                    </div>
                                </div>

                                {/* Main Student Info Fields */}
                                <div className="id-student-info">
                                    <div className="dotted-row blue-row" style={{ position: 'relative' }}>
                                        <span className="row-label">NAME:</span>
                                        <input id="name" name="name" className={`dotted-input ${healthCardForm.name && healthCardForm.name.length < 4 ? 'has-error' : ''}`} type="text" value={healthCardForm.name} onChange={(e) => setHealthCardForm({ ...healthCardForm, name: e.target.value })} required />
                                        {healthCardForm.name && healthCardForm.name.length < 4 && (
                                            <span style={{ position: 'absolute', right: '0', top: '-15px', color: '#ef4444', fontSize: '0.65rem', fontWeight: '800', background: 'white', padding: '0 4px' }}>
                                                invalid (Min 4 chars)
                                            </span>
                                        )}
                                    </div>
                                    <div className="dotted-row blue-row">
                                        <span className="row-label">DOB/ AGE:</span>
                                        <input id="dobOrAge" name="dobOrAge" className="dotted-input" type="text" value={healthCardForm.dobOrAge} onChange={(e) => setHealthCardForm({ ...healthCardForm, dobOrAge: e.target.value })} required />
                                    </div>
                                    <div className="dotted-row blue-row">
                                        <span className="row-label">BLOOD GROUP:</span>
                                        <input id="bloodGroup" name="bloodGroup" className="dotted-input" type="text" value={healthCardForm.bloodGroup} onChange={(e) => setHealthCardForm({ ...healthCardForm, bloodGroup: e.target.value })} required />
                                    </div>
                                    <div className="dotted-row blue-row split-row">
                                        <span className="row-label">CLASS :</span>
                                        <input id="studentClass" name="studentClass" className="dotted-input" type="text" value={healthCardForm.studentClass} onChange={(e) => setHealthCardForm({ ...healthCardForm, studentClass: e.target.value })} required />
                                        <span className="row-label ml-2">ROLL No:</span>
                                        <input id="rollNo" name="rollNo" className="dotted-input" type="text" value={healthCardForm.rollNo} onChange={(e) => setHealthCardForm({ ...healthCardForm, rollNo: e.target.value })} required />
                                    </div>
                                    <div className="dotted-row blue-row">
                                        <span className="row-label">SCHOOL:</span>
                                        <input id="school" name="school" className="dotted-input" type="text" value={healthCardForm.school} onChange={(e) => setHealthCardForm({ ...healthCardForm, school: e.target.value })} required />
                                    </div>
                                    <div className="dotted-row blue-row" style={{ alignItems: 'flex-start' }}>
                                        <span className="row-label" style={{ marginTop: '0.1rem' }}>ADDRESS:</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.9rem' }}>
                                            <input
                                                id="address1"
                                                name="address1"
                                                className="dotted-input"
                                                type="text"
                                                value={healthCardForm.address1 !== undefined ? healthCardForm.address1 : healthCardForm.address || ''}
                                                onChange={(e) => {
                                                    setHealthCardForm({ ...healthCardForm, address1: e.target.value });
                                                    if (e.target.value.length >= 35) {
                                                        const addr2 = document.getElementById('address2');
                                                        if (addr2) addr2.focus();
                                                    }
                                                }}
                                                maxLength={38}
                                                required
                                                style={{ width: '100%', paddingLeft: '5px' }}
                                            />
                                            <input
                                                id="address2"
                                                name="address2"
                                                className="dotted-input"
                                                type="text"
                                                value={healthCardForm.address2 || ''}
                                                onChange={(e) => setHealthCardForm({ ...healthCardForm, address2: e.target.value })}
                                                style={{ width: '100%', marginLeft: '0' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Divider removed as per request */}

                                {/* Footer Logos & Sigs */}
                                <div className="id-footer-logos">
                                    <div className="left-maintenance">
                                        <span className="tiny-label">Maintained by</span>
                                        <img src={vajraLogoJpg.src || vajraLogoJpg} alt="Vajra" style={{ height: '70px', objectFit: 'contain', marginTop: 'auto' }} />
                                    </div>
                                    <div className="center-supported">
                                        <span className="tiny-label">Supported by</span>
                                        <img src={trustCareLogo.src || trustCareLogo} alt="Trust Care" style={{ height: '40px', objectFit: 'contain', marginTop: 'auto', marginBottom: '8px' }} />
                                    </div>
                                    <div className="right-signature">
                                        <img src={vajraSealSigned.src || vajraSealSigned} alt="Seal" style={{ height: '75px', width: '75px', objectFit: 'contain', mixBlendMode: 'multiply', marginTop: 'auto' }} />
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
                        {viewMode !== 'view' && (
                            <div className="card-editor-actions">
                                <button type="submit" className="btn-save-card" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : <><Save size={20} /> Save Health Card</>}
                                </button>
                            </div>
                        )}

                        <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center', lineHeight: '1.4' }}>
                            <div>Vajra preventive healthcare for children is a part of vajra blue zone hospitals private limited.</div>
                            <div>© vajra blue zone hospital private limited . All rights reserved.</div>
                        </div>
                    </form>
                )
            }
        </div >
    );
};

export default StudentHealthCard;
