'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Baby, Search, ChevronLeft, ChevronRight, Phone, Menu, X, Virus, Stethoscope, Activity, ShieldAlert, BookOpen, Clock, User } from 'lucide-react';
import { diseaseData } from '../data';
import { specialtiesData } from '../specialtiesData';
import { hierarchicalDiseaseData } from '../diseasesHierarchical';
import { hierarchicalSpecialtiesData } from '../specialtiesHierarchical';
import dynamic from 'next/dynamic';

const StudentHealthRecord = dynamic(() => import('../StudentHealthRecord'), { ssr: false });
const StudentHealthCard = dynamic(() => import('../StudentHealthCard'), { ssr: false });
const LoginModal = dynamic(() => import('../components/LoginModal'), { ssr: false });
const HealthAssistantProfile = dynamic(() => import('../components/HealthAssistantProfile'), { ssr: false });
import { useNotification } from '../context/NotificationContext';

import Image from 'next/image';

// Images (Using relative paths as paths in public or assets)
import heroImg from '../assets/home_indian.png';
import pic2 from '../assets/pic2.png';
import pic3 from '../assets/pic3.png';
import slider1 from '../assets/slider_1.jpg';
import slider2 from '../assets/slider_2.jpg';
import slider3 from '../assets/slider_3.jpg';
import vajraLogo from '../assets/children_logo.png';
import Vajra from '../assets/vajra_logo.jpg';
import trustCareLogo from '../assets/trust_care_logo.png';

export default function Home() {
    return (
        <HomeContent />
    );
}

function HomeContent() {
    const { showAlert } = useNotification();
    const [scrollY, setScrollY] = useState(0);
    const [currentView, setCurrentView] = useState('home');
    const [searchTerm, setSearchTerm] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isHealthAssistantAuthenticated, setIsHealthAssistantAuthenticated] = useState(false);
    const [healthAssistantData, setHealthAssistantData] = useState(null);
    const [hasCompletedInit, setHasCompletedInit] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);


    // State for prefilling Health Identity Card from Student Health Record submission
    const [prefillCardData, setPrefillCardData] = useState(null);
    const [prefillSchool, setPrefillSchool] = useState(null);
    const [prefillClass, setPrefillClass] = useState(null);

    // States for Portals
    const [selectedDisease, setSelectedDisease] = useState(diseaseData[0]);
    const [selectedSpec, setSelectedSpec] = useState(specialtiesData[0].items[0]);
    const [expandedCategory, setExpandedCategory] = useState(specialtiesData[0].category);

    // States for Hierarchical Diseases
    const [expandedDiseaseCategory, setExpandedDiseaseCategory] = useState(hierarchicalDiseaseData[0].category);
    const [expandedSubcategory, setExpandedSubcategory] = useState(null);
    const [selectedHierarchicalDisease, setSelectedHierarchicalDisease] = useState(
        hierarchicalDiseaseData[0].subcategories[0].diseases[0]
    );

    // States for Hierarchical Specialties
    const [expandedSpecialtyCategory, setExpandedSpecialtyCategory] = useState(hierarchicalSpecialtiesData[0].category);
    const [expandedSpecialtySubcategory, setExpandedSpecialtySubcategory] = useState(null);
    const [selectedHierarchicalSpecialty, setSelectedHierarchicalSpecialty] = useState(
        hierarchicalSpecialtiesData[0].subcategories[0].specialties[0]
    );

    // Slider State
    const slides = useMemo(() => [heroImg, slider1, slider2, slider3, pic3, pic2], [heroImg, slider1, slider2, slider3, pic3, pic2]);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);

        const checkAuthAndInit = () => {
            if (localStorage.getItem('isHealthAssistantAuthenticated') === 'true') {
                setIsHealthAssistantAuthenticated(true);
                const storedData = localStorage.getItem('healthAssistantData');
                if (storedData) {
                    const parsedData = JSON.parse(storedData);

                    // Check if Init is complete for today and merge that session data
                    const initStatus = localStorage.getItem(`healthAssistantInit_${parsedData.email}`);
                    if (initStatus) {
                        const initData = JSON.parse(initStatus);
                        if (initData.date === new Date().toISOString().split('T')[0]) {
                            setHasCompletedInit(true);
                            // MERGE: Update the health assistant data with the specific campus assigned for THIS shift
                            setHealthAssistantData({
                                ...parsedData,
                                assignedCampus: initData.assignedCampus,
                                idNumber: initData.idNumber,
                                currentShiftLocation: initData.location
                            });
                        } else {
                            setHasCompletedInit(false);
                            setHealthAssistantData(parsedData);
                        }
                    } else {
                        setHasCompletedInit(false);
                        setHealthAssistantData(parsedData);
                    }
                }
            }


        };

        checkAuthAndInit();

        // Listen for the custom event dispatched by HealthAssistantProfile
        window.addEventListener('healthAssistantInitUpdated', checkAuthAndInit);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('healthAssistantInitUpdated', checkAuthAndInit);
        };
    }, []);

    // Locking body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    const handleProtectedNavigation = (view) => {
        if (!isHealthAssistantAuthenticated) {
            setIsLoginModalOpen(true);
            return;
        }

        if (!hasCompletedInit) {
            showAlert('Please complete your daily Shift Initialization on your profile page to access student records.', 'warning', 'Action Required');
            setCurrentView('profile');
            setSearchTerm('');
            setIsMenuOpen(false);
            return;
        }

        if (view === 'health-card' || view === 'student-records') {
            setPrefillCardData(null);
            setPrefillSchool(null);
            setPrefillClass(null);
        }

        setCurrentView(view);
        setSearchTerm('');
        setIsMenuOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('isHealthAssistantAuthenticated');
        localStorage.removeItem('healthAssistantData');
        setIsHealthAssistantAuthenticated(false);
        setHealthAssistantData(null);
        setHasCompletedInit(false);
        if (currentView === 'student-records' || currentView === 'health-card' || currentView === 'profile') {
            setCurrentView('home');
        }
    };

    const handleAuthAction = () => {
        if (isHealthAssistantAuthenticated) {
            setCurrentView('profile');
            setSearchTerm('');
            setIsMenuOpen(false);
        } else {
            setIsLoginModalOpen(true);
        }
    };

    // Filtered data for specialties search
    const filteredSpecialties = useMemo(() => {
        if (!searchTerm) return hierarchicalSpecialtiesData;

        return hierarchicalSpecialtiesData.map(category => {
            const filteredSubcategories = category.subcategories.map(subcat => {
                const matchedSpecialties = subcat.specialties.filter(spec =>
                    spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    spec.info.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    spec.checks.toLowerCase().includes(searchTerm.toLowerCase())
                );
                return { ...subcat, specialties: matchedSpecialties };
            }).filter(subcat => subcat.specialties.length > 0);

            return { ...category, subcategories: filteredSubcategories };
        }).filter(category =>
            category.subcategories.length > 0 ||
            category.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    // Filtered data for diseases search
    const filteredDiseases = useMemo(() => {
        if (!searchTerm) return hierarchicalDiseaseData;

        return hierarchicalDiseaseData.map(category => {
            const filteredSubcategories = category.subcategories.map(subcat => {
                const matchedDiseases = subcat.diseases.filter(disease =>
                    disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    disease.symptoms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    disease.prevention.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                return { ...subcat, diseases: matchedDiseases };
            }).filter(subcat => subcat.diseases.length > 0);

            return { ...category, subcategories: filteredSubcategories };
        }).filter(category =>
            category.subcategories.length > 0 ||
            category.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const handleSlideClick = () => {
        if (!isHealthAssistantAuthenticated) {
            setIsLoginModalOpen(true);
            return;
        }

        // Mapping slides to views
        if (currentSlide === 0) {
            // Hero -> Awareness Videos
            setCurrentView('videos');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (currentSlide === 1 || currentSlide === 2) {
            // ENT/Vision, Skin/Psychology -> Specialties
            setCurrentView('doctors');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (currentSlide === 3) {
            // Dental/Awareness -> Videos
            setCurrentView('videos');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (currentSlide === 4) {
            // Swapped: pic3 -> Health Card
            handleProtectedNavigation('health-card');
        } else if (currentSlide === 5) {
            // Swapped: pic2 -> Student Health Records
            handleProtectedNavigation('student-records');
        }
    };

    const renderHome = () => (
        <>
            <section className="hero" id="home">
                <div className="hero-content">
                    <div className="hero-text fade-in">
                        <h1>Expert Health <span>Intelligence</span> for Children</h1>
                        <p><strong>Vision :</strong> Provide most trusted and accessible preventive Healthcare system for children.</p>
                        <p><strong>Objective :</strong> Student health is monitored through weekly visits by health assistants and monthly reviews by paediatric specialists. It helps detect health issues early, promotes hygiene and nutrition awareness, and ensures follow-up care.</p>
                        <div className="hero-btns">
                            <button onClick={() => { setCurrentView('diseases'); setSearchTerm(''); }} className="btn-primary-alt">Disease Guide</button>
                            <button onClick={() => { setCurrentView('doctors'); setSearchTerm(''); }} className="btn-primary-alt">Specialties</button>
                        </div>
                    </div>
                    <div className="hero-image-slider-container" onClick={handleSlideClick} style={{ cursor: 'pointer' }}>
                        <div className="slider-content">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSlide}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8 }}
                                    className="slide-wrapper"
                                >
                                    <Image
                                        src={slides[currentSlide]}
                                        alt={`Hero banner slide ${currentSlide + 1} showing health intelligence indicators`}
                                        fill
                                        priority={true}
                                        style={{ objectFit: currentSlide === 0 ? 'cover' : 'contain', borderRadius: '21px' }}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <div className="slider-dots">
                            {slides.map((_, idx) => (
                                <span
                                    key={idx}
                                    className={`dot ${idx === currentSlide ? 'active' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
                                    role="button"
                                    aria-label={`Go to slide ${idx + 1}`}
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setCurrentSlide(idx); } }}
                                ></span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="feature-cards">
                <div className="section-title">
                    <h2>Comprehensive <span>Healthcare</span> Resources for Children</h2>
                    <p>A wide range of medical definitions and safety guides are available for children</p>
                </div>
                <div className="feature-container">
                    <div className="feature-card doctors-feature" onClick={() => { setCurrentView('doctors'); setSearchTerm(''); }}>
                        <div className="feature-icon">
                            <i className="fas fa-user-doctor"></i>
                        </div>
                        <h3>100+ Medical Fields</h3>
                        <p>Explore comprehensive specialties from Primary Care to Surgical and Emerging Fields.</p>
                        <span className="feature-link">Open Specialties <i className="fas fa-arrow-right"></i></span>
                    </div>

                    <div className="feature-card diseases-feature" onClick={() => { setCurrentView('diseases'); setSearchTerm(''); }}>
                        <div className="feature-icon">
                            <i className="fas fa-virus"></i>
                        </div>
                        <h3>250+ Condition Guides</h3>
                        <p>Instant access to symptoms and prevention methods for common and rare conditions.</p>
                        <span className="feature-link">Open Directory <i className="fas fa-arrow-right"></i></span>
                    </div>
                </div>
            </section>

            <section className="prevention-section" id="prevention">
                <div className="prevention-container">
                    <div className="prevention-header">
                        <span className="subtitle">Prevention First</span>
                        <h2>Nurturing <span>Healthy</span> Habits for Life</h2>
                        <p>Protecting children's health goes beyond medical checks. It's about building a foundation of wellness through simple, daily habits.</p>
                    </div>

                    <div className="prevention-grid">
                        <div className="prevention-item">
                            <div className="item-icon-box blue">
                                <i className="fas fa-soap"></i>
                            </div>
                            <div className="item-text">
                                <h4>Hygiene Standards</h4>
                                <p>Encourage frequent handwashing and proper hygiene to prevent the spread of 80% of infections.</p>
                            </div>
                        </div>
                        <div className="prevention-item">
                            <div className="item-icon-box green">
                                <i className="fas fa-apple-whole"></i>
                            </div>
                            <div className="item-text">
                                <h4>Nutritional Balance</h4>
                                <p>A diet rich in vitamins and minerals is the body's first line of defense against seasonal illnesses.</p>
                            </div>
                        </div>
                        <div className="prevention-item">
                            <div className="item-icon-box purple">
                                <i className="fas fa-bed"></i>
                            </div>
                            <div className="item-text">
                                <h4>Restorative Sleep</h4>
                                <p>Consistency in sleep schedules supports cognitive development and strengthens the immune system.</p>
                            </div>
                        </div>
                        <div className="prevention-item">
                            <div className="item-icon-box orange">
                                <i className="fas fa-person-running"></i>
                            </div>
                            <div className="item-text">
                                <h4>Active Lifestyle</h4>
                                <p>Daily physical activity improves cardiovascular health and boosts mental well-being in children.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );

    const renderHierarchicalSpecialties = () => (
        <div className="portal-container hierarchical-portal fade-in">
            <div className="portal-sidebar">
                <div className="sidebar-header">
                    <button className="back-link" onClick={() => setCurrentView('home')}><i className="fas fa-chevron-left"></i> Home</button>
                    <h2>Medical Specialties</h2>
                    <div className="search-bar-sidebar">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search specialties..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="scroll-list">
                    {filteredSpecialties.map((category, catIdx) => (
                        <div key={catIdx} className="category-group hierarchical-category">
                            <div
                                className={`category-title main-category ${expandedSpecialtyCategory === category.category ? 'expanded' : ''}`}
                                onClick={() => {
                                    setExpandedSpecialtyCategory(expandedSpecialtyCategory === category.category ? null : category.category);
                                    setExpandedSpecialtySubcategory(null);
                                }}
                            >
                                <div className="category-title-content">
                                    <i className={category.icon}></i>
                                    <span>{category.category}</span>
                                </div>
                                <i className={`fas fa-chevron-${expandedSpecialtyCategory === category.category ? 'up' : 'down'}`}></i>
                            </div>
                            {expandedSpecialtyCategory === category.category && (
                                <div className="subcategory-wrapper fade-in">
                                    {category.subcategories.map((subcat, subIdx) => (
                                        <div key={subIdx} className="subcategory-group">
                                            <div
                                                className={`subcategory-title ${expandedSpecialtySubcategory === `${catIdx}-${subIdx}` ? 'expanded' : ''}`}
                                                onClick={() => setExpandedSpecialtySubcategory(
                                                    expandedSpecialtySubcategory === `${catIdx}-${subIdx}` ? null : `${catIdx}-${subIdx}`
                                                )}
                                            >
                                                <span>{subcat.name}</span>
                                                <span className="disease-count">{subcat.specialties.length}</span>
                                            </div>
                                            {expandedSpecialtySubcategory === `${catIdx}-${subIdx}` && (
                                                <div className="disease-items fade-in">
                                                    {subcat.specialties.map((specialty, specIdx) => (
                                                        <div
                                                            key={specIdx}
                                                            className={`list-item disease-item ${selectedHierarchicalSpecialty?.name === specialty.name ? 'active' : ''}`}
                                                            onClick={() => setSelectedHierarchicalSpecialty({ ...specialty, category: category.category, subcategory: subcat.name })}
                                                        >
                                                            <div className="item-dot"></div>
                                                            <div className="item-text">
                                                                <h4>{specialty.name}</h4>
                                                            </div>
                                                            <i className="fas fa-chevron-right arrow-sm"></i>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="portal-content hierarchical-content">
                {selectedHierarchicalSpecialty && (
                    <div className="detail-view hierarchical-detail fade-in" key={selectedHierarchicalSpecialty.name}>
                        <div className="detail-breadcrumb">
                            <span>{selectedHierarchicalSpecialty.category}</span>
                            <i className="fas fa-chevron-right"></i>
                            <span>{selectedHierarchicalSpecialty.subcategory}</span>
                        </div>

                        <div className="detail-main-header specialty-header">
                            <div className="field-type-icon specialty-icon">
                                <i className="fas fa-user-doctor"></i>
                            </div>
                            <div className="header-titles">
                                <h2>{selectedHierarchicalSpecialty.name}</h2>
                            </div>
                        </div>

                        <div className="detail-info-cards hierarchical-cards">
                            <div className="overview-expertise-grid">
                                <div className="info-card-large specialty-overview-card glass-card">
                                    <div className="card-header overview-header">
                                        <i className="fas fa-circle-info"></i>
                                        <h3>Specialties Overview</h3>
                                    </div>
                                    <div className="card-body">
                                        <p className="specialty-description">{selectedHierarchicalSpecialty.info}</p>
                                    </div>
                                </div>

                                <div className="info-card-large specialty-checks-card glass-card">
                                    <div className="card-header expertise-header">
                                        <i className="fas fa-clipboard-check"></i>
                                        <h3>Areas of Expertise</h3>
                                    </div>
                                    <div className="card-body">
                                        <p className="specialty-description">
                                            {selectedHierarchicalSpecialty.checks}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="action-cards-grid">
                                <div className="action-card glass-card">
                                    <i className="fas fa-calendar-check"></i>
                                    <h4>Book Appointment</h4>
                                    <p>Schedule a consultation</p>
                                </div>
                                <div className="action-card glass-card">
                                    <i className="fas fa-phone-medical"></i>
                                    <h4>Contact Specialties</h4>
                                    <p>Get immediate assistance</p>
                                </div>
                                <div className="action-card glass-card">
                                    <i className="fas fa-file-medical"></i>
                                    <h4>Medical Records</h4>
                                    <p>Access patient information</p>
                                </div>
                            </div>

                            <div className="medical-disclaimer specialty-note">
                                <i className="fas fa-circle-info"></i>
                                <p><strong>Professional Note:</strong> This specialty provides expert medical care in its field of expertise. Please consult with your primary care physician for referrals and initial assessments.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderHierarchicalDiseases = () => (
        <div className="portal-container hierarchical-portal fade-in">
            <div className="portal-sidebar">
                <div className="sidebar-header">
                    <button className="back-link" onClick={() => setCurrentView('home')}><i className="fas fa-chevron-left"></i> Home</button>
                    <h2>Children's Health Guide</h2>
                    <div className="search-bar-sidebar">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search diseases..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="scroll-list">
                    {filteredDiseases.map((category, catIdx) => (
                        <div key={catIdx} className="category-group hierarchical-category">
                            <div
                                className={`category-title main-category ${expandedDiseaseCategory === category.category ? 'expanded' : ''}`}
                                onClick={() => {
                                    setExpandedDiseaseCategory(expandedDiseaseCategory === category.category ? null : category.category);
                                    setExpandedSubcategory(null);
                                }}
                            >
                                <div className="category-title-content">
                                    <i className={category.icon}></i>
                                    <span>{category.category}</span>
                                </div>
                                <i className={`fas fa-chevron-${expandedDiseaseCategory === category.category ? 'up' : 'down'}`}></i>
                            </div>
                            {expandedDiseaseCategory === category.category && (
                                <div className="subcategory-wrapper fade-in">
                                    {category.subcategories.map((subcat, subIdx) => (
                                        <div key={subIdx} className="subcategory-group">
                                            <div
                                                className={`subcategory-title ${expandedSubcategory === `${catIdx}-${subIdx}` ? 'expanded' : ''}`}
                                                onClick={() => setExpandedSubcategory(
                                                    expandedSubcategory === `${catIdx}-${subIdx}` ? null : `${catIdx}-${subIdx}`
                                                )}
                                            >
                                                <span>{subcat.name}</span>
                                                <span className="disease-count">{subcat.diseases.length}</span>
                                            </div>
                                            {expandedSubcategory === `${catIdx}-${subIdx}` && (
                                                <div className="disease-items fade-in">
                                                    {subcat.diseases.map((disease, diseaseIdx) => (
                                                        <div
                                                            key={diseaseIdx}
                                                            className={`list-item disease-item ${selectedHierarchicalDisease?.name === disease.name ? 'active' : ''}`}
                                                            onClick={() => setSelectedHierarchicalDisease({ ...disease, category: category.category, subcategory: subcat.name })}
                                                        >
                                                            <div className="item-dot"></div>
                                                            <div className="item-text">
                                                                <h4>{disease.name}</h4>
                                                            </div>
                                                            <i className="fas fa-chevron-right arrow-sm"></i>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="portal-content hierarchical-content">
                {selectedHierarchicalDisease && (
                    <div className="detail-view hierarchical-detail fade-in" key={selectedHierarchicalDisease.name}>
                        <div className="detail-breadcrumb">
                            <span>{selectedHierarchicalDisease.category}</span>
                            <i className="fas fa-chevron-right"></i>
                            <span>{selectedHierarchicalDisease.subcategory}</span>
                        </div>

                        <div className="detail-main-header disease-header">
                            <div className="field-type-icon">
                                <i className="fas fa-heartbeat"></i>
                            </div>
                            <div className="header-titles">
                                <h2>{selectedHierarchicalDisease.name}</h2>
                            </div>
                        </div>

                        <div className="detail-info-cards hierarchical-cards">
                            <div className="overview-expertise-grid">
                                <div className="info-card-large symptom-dashboard-card glass-card">
                                    <div className="card-header symptoms-header">
                                        <i className="fas fa-stethoscope"></i>
                                        <h3>Clinical Symptoms</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="dashboard-symptom-list">
                                            {selectedHierarchicalDisease.symptoms.map((symptom, idx) => (
                                                <div key={idx} className="symptom-tag">
                                                    <i className="fas fa-check-double"></i>
                                                    <span>{symptom}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="info-card-large prevention-dashboard-card glass-card">
                                    <div className="card-header prevention-header">
                                        <i className="fas fa-shield-heart"></i>
                                        <h3>Prevention & Recovery</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="dashboard-prevention-steps">
                                            {selectedHierarchicalDisease.prevention.map((method, idx) => (
                                                <div key={idx} className="prevention-step-item">
                                                    <div className="step-number">{idx + 1}</div>
                                                    <p>{method}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="action-cards-grid">
                                <div className="action-card glass-card">
                                    <i className="fas fa-user-doctor"></i>
                                    <h4>Consult Specialist</h4>
                                    <p>Get professional medical advice</p>
                                </div>
                                <div className="action-card glass-card">
                                    <i className="fas fa-book-medical"></i>
                                    <h4>Learn More</h4>
                                    <p>Detailed treatment guidelines</p>
                                </div>
                                <div className="action-card glass-card">
                                    <i className="fas fa-notes-medical"></i>
                                    <h4>Track Symptoms</h4>
                                    <p>Monitor health progress</p>
                                </div>
                            </div>

                            <div className="medical-disclaimer">
                                <i className="fas fa-circle-info"></i>
                                <p><strong>Medical Disclaimer:</strong> This information is provided for educational purposes only and should not replace professional medical advice. Always consult with a qualified healthcare provider for accurate diagnosis and treatment.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const videoData = [
        { id: 'AdC6_Wk6I5g', title: 'Why is Nutrition Important for Children?', description: 'Understanding the basics of child nutrition and healthy eating habits.' },
        { id: '1u31zO1a38o', title: 'Hygiene Habits for Children', description: 'Teaching children the importance of personal hygiene and cleanliness.' },
        { id: 'z1mkiSjJm2A', title: 'Importance of Sleep for Children', description: 'How sleep affects growth, learning, and emotional well-being.' },
        { id: '5J42Xb7y1j8', title: 'Physical Activity for Children', description: 'Fun ways to keep children active and healthy at home.' },
        { id: 'Y82jDhrrswc', title: 'Understanding Child Mental Health', description: 'Signs of mental health issues in children and how to support them.' },
        { id: '_Xf2W5Vd0qQ', title: 'Vaccination Awareness', description: 'Why vaccinations are crucial for protecting children from diseases.' },
    ];

    const renderVideos = () => (
        <section className="videos-section fade-in">
            <div className="videos-header">
                <h2>Expert Health <span>Videos</span></h2>
                <p>Watch and learn from top pediatricians and health experts.</p>
            </div>
            <div className="video-grid">
                {videoData.map((video, index) => (
                    <div className="video-card" key={index}>
                        <div className="video-wrapper">
                            <iframe
                                src={`https://www.youtube.com/embed/${video.id}`}
                                title={video.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <div className="video-info">
                            <h3>{video.title}</h3>
                            <p>{video.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );

    return (
        <div className={`app view-${currentView}`}>
            <header className={scrollY > 50 ? 'scrolled' : ''}>
                <div className="top-header">
                    <div className="logo-section" onClick={() => setCurrentView('home')}>
                        <div className="logo-image-container">
                            <Image src={vajraLogo} alt="VAJRA Logo" className="logo-image" width={200} height={100} priority={true} style={{ height: 'auto', objectFit: 'contain' }} />
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="contact-info">
                            <div className="contact-icon">
                                <i className="fas fa-phone-volume"></i>
                            </div>
                            <div className="contact-text">
                                <span className="contact-label">Emergency Contact</span>
                                <span className="contact-number">7799799261</span>
                            </div>
                        </div>

                        <div className="logo-section" onClick={() => setCurrentView('home')}>
                            <span className="initiative-label" style={{ textTransform: 'uppercase', display: 'inline-block' }}>SUPPORTED BY</span>
                            <div className="logo-image-container">
                                <Image src={trustCareLogo} alt="Trust Care Foundation" className="logo-image trust-care" width={100} height={50} style={{ height: 'auto', objectFit: 'contain' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="main-nav-bar">
                    <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
                        <Menu className={`fas fa-${isMenuOpen ? 'times' : 'bars'}`} aria-hidden="true" />
                    </button>
                    <nav className={isMenuOpen ? 'mobile-nav-open' : ''}>
                        <ul>
                            <li className={currentView === 'home' ? 'active' : ''}><button onClick={() => { setCurrentView('home'); setSearchTerm(''); setIsMenuOpen(false); }}>Home</button></li>
                            <li className={currentView === 'doctors' ? 'active' : ''}><button onClick={() => { setCurrentView('doctors'); setSearchTerm(''); setIsMenuOpen(false); }}>Specialties</button></li>
                            <li className={currentView === 'diseases' ? 'active' : ''}><button onClick={() => { setCurrentView('diseases'); setSearchTerm(''); setIsMenuOpen(false); }}>Diseases</button></li>
                            <li className={currentView === 'videos' ? 'active' : ''}><button onClick={() => { setCurrentView('videos'); setSearchTerm(''); setIsMenuOpen(false); }}>Awareness Videos</button></li>

                            <li className={`${currentView === 'student-records' ? 'active' : ''} ${!isHealthAssistantAuthenticated ? 'locked-nav-item' : ''}`}>
                                <button onClick={() => handleProtectedNavigation('student-records')}>
                                    Student Health Records {!isHealthAssistantAuthenticated && <i className="fas fa-lock" style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}></i>}
                                </button>
                            </li>
                            <li className={`${currentView === 'health-card' ? 'active' : ''} ${!isHealthAssistantAuthenticated ? 'locked-nav-item' : ''}`}>
                                <button onClick={() => handleProtectedNavigation('health-card')}>
                                    Health Card {!isHealthAssistantAuthenticated && <i className="fas fa-lock" style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}></i>}
                                </button>
                            </li>
                            <li>
                                <button onClick={handleAuthAction} className={currentView === 'profile' ? 'active-profile-btn' : ''} aria-label={isHealthAssistantAuthenticated ? "View Profile" : "Login Member"}>
                                    {isHealthAssistantAuthenticated ? (
                                        <>Profile <User className="fas fa-user" size={14} style={{ marginLeft: '0.25rem' }} aria-hidden="true" /></>
                                    ) : (
                                        <>Login Member <User className="fas fa-sign-in-alt" size={14} style={{ marginLeft: '0.25rem' }} aria-hidden="true" /></>
                                    )}
                                </button>
                            </li>
                        </ul>
                    </nav>
                    {isMenuOpen && (
                        <div
                            className="mobile-nav-click-outside"
                            onClick={() => setIsMenuOpen(false)}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100vw',
                                height: '100vh',
                                zIndex: 2999,
                                background: 'transparent'
                            }}
                        />
                    )}
                </div>
            </header>

            <main>
                {currentView === 'home' && renderHome()}
                {currentView === 'doctors' && renderHierarchicalSpecialties()}
                {currentView === 'diseases' && renderHierarchicalDiseases()}
                {currentView === 'videos' && renderVideos()}
                {currentView === 'student-records' && (
                    <StudentHealthRecord
                        vajraLogo={vajraLogo.src || vajraLogo}
                        secondLogo={vajraLogo.src || vajraLogo}
                        emergencyContact="7799799261"
                        onBack={() => setCurrentView('student-records')}
                        onRedirectToHealthCard={(data, school, stdClass) => {
                            setPrefillCardData(data);
                            setPrefillSchool(school);
                            setPrefillClass(stdClass);
                            setCurrentView('health-card');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        healthAssistantData={healthAssistantData}
                    />
                )}
                {currentView === 'health-card' && (
                    <StudentHealthCard
                        onBack={() => {
                            setPrefillCardData(null);
                            setCurrentView(prefillCardData ? 'student-records' : 'home');
                        }}
                        vajraLogo={vajraLogo.src || vajraLogo}
                        secondLogo={vajraLogo.src || vajraLogo}
                        prefillData={prefillCardData}
                        schoolInfo={prefillSchool}
                        classInfo={prefillClass}
                        healthAssistantData={healthAssistantData}
                    />
                )}
                {currentView === 'profile' && (
                    <HealthAssistantProfile
                        healthAssistantData={healthAssistantData}
                        onLogout={handleLogout}
                    />
                )}

            </main>

            {currentView === 'home' && (
                <footer>
                    <div className="footer-content">
                        <div className="footer-info">
                            <h3>Children Health</h3>
                            <p>Professional pediatric resource for a safer and healthier tomorrow.</p>
                        </div>
                        <div className="footer-links">
                            <h4>Quick Access</h4>
                            <ul>
                                <li><button onClick={() => { setCurrentView('doctors'); setSearchTerm(''); }}>Specialist Directory</button></li>
                                <li><button onClick={() => { setCurrentView('diseases'); setSearchTerm(''); }}>Disease Guide</button></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; vajra blue zone hospital private limited . All rights reserved.</p>
                    </div>
                </footer>
            )}

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onLoginSuccess={() => {
                    setIsHealthAssistantAuthenticated(true);
                    window.dispatchEvent(new Event('healthAssistantInitUpdated'));
                    setCurrentView('profile');
                }}
                onPrincipalLoginSuccess={() => {
                    window.location.href = '/principal';
                }}
            />
        </div>
    );
}
