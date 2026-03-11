'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Activity, CheckCircle, AlertTriangle, Calendar, RefreshCw, User } from 'lucide-react';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKS = ['Week 1 (1–7)', 'Week 2 (8–14)', 'Week 3 (15–21)', 'Week 4 (22–31)'];

function getWeekNumber(day) {
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
}

function deriveHealthStatus(record) {
    if (!record) return null;

    const issues = [];

    if (record.seasonal && record.seasonal.trim()) issues.push(`🤧 Seasonal: ${record.seasonal}`);
    if (record.chronic && record.chronic.trim()) issues.push(`🏥 Chronic: ${record.chronic}`);
    if (record.hereditary && record.hereditary.trim()) issues.push(`🧬 Hereditary: ${record.hereditary}`);
    if (record.underMedication && record.underMedication.trim() && record.underMedication.toLowerCase() !== 'no' && record.underMedication.toLowerCase() !== 'none') {
        issues.push(`💊 Medication: ${record.underMedication}`);
    }
    if (record.drugAllergies && record.drugAllergies.trim()) issues.push(`⚠️ Drug Allergy: ${record.drugAllergies}`);
    if (record.foodAllergies && record.foodAllergies.trim()) issues.push(`🍽️ Food Allergy: ${record.foodAllergies}`);
    if (record.nutritionDeficiency && record.nutritionDeficiency.trim()) issues.push(`🥗 Nutrition Deficiency: ${record.nutritionDeficiency}`);
    if (record.otherDefects && record.otherDefects.trim()) issues.push(`📋 Other: ${record.otherDefects}`);

    const condition = (record.healthCondition || 'Good').toLowerCase();

    return {
        issues,
        condition,
        isHealthy: issues.length === 0 && condition === 'good',
        label: issues.length === 0
            ? (condition === 'good' ? '✅ Fit & Fine' : condition === 'fair' ? '🟡 Moderate' : '🔴 Needs Attention')
            : '⚠️ Issues Detected',
        color: issues.length === 0
            ? (condition === 'good' ? '#10b981' : condition === 'fair' ? '#f59e0b' : '#ef4444')
            : '#f59e0b',
        bg: issues.length === 0
            ? (condition === 'good' ? '#ecfdf5' : condition === 'fair' ? '#fffbeb' : '#fef2f2')
            : '#fffbeb',
    };
}

const WeeklyHealthUpdate = ({ schoolName, className, student, onBack }) => {
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
    const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(now.getDate()));
    const [weeklyRecords, setWeeklyRecords] = useState([]); // records for this student across all weeks in view
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const currentYear = now.getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const fetchWeeklyData = useCallback(async () => {
        if (!schoolName || !className || !student) return;
        setIsLoading(true);
        try {
            const rollNo = String(student.rollNo || '').trim();
            const res = await fetch(`/api/health-records?school=${encodeURIComponent(schoolName)}&class=${encodeURIComponent(className)}`);
            if (!res.ok) return;
            const allRecords = await res.json();

            // Filter records belonging to this specific student by rollNo
            const studentRecords = allRecords.filter(r => String(r.rollNo || '').trim() === rollNo);

            // Group by week within selected year + month
            const grouped = {}; // weekNumber -> record (most recent)
            studentRecords.forEach(r => {
                const d = new Date(r.createdAt);
                if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
                    const wk = getWeekNumber(d.getDate());
                    if (!grouped[wk] || new Date(r.createdAt) > new Date(grouped[wk].createdAt)) {
                        grouped[wk] = r;
                    }
                }
            });

            // Build rows for all 4 weeks; only week selected is relevant for main view
            const rows = [1, 2, 3, 4].map(wk => ({
                week: wk,
                label: WEEKS[wk - 1],
                record: grouped[wk] || null,
                status: deriveHealthStatus(grouped[wk] || null),
                date: grouped[wk] ? new Date(grouped[wk].createdAt).toLocaleDateString('en-IN') : null,
            }));

            setWeeklyRecords(rows);
            setSelectedRecord(grouped[selectedWeek] || null);
        } catch (err) {
            console.error('Error fetching weekly data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [schoolName, className, student, selectedYear, selectedMonth, selectedWeek]);

    useEffect(() => {
        fetchWeeklyData();
    }, [fetchWeeklyData]);

    const studentName = student?.studentName || student?.name || 'Student';
    const currentWeekRow = weeklyRecords.find(r => r.week === selectedWeek);

    return (
        <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        📅 Weekly Health Update
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0' }}>
                        <strong style={{ color: '#1e293b' }}>{studentName}</strong> · Roll #{student?.rollNo} · Class {className} · {schoolName}
                    </p>
                </div>
                <button
                    onClick={onBack}
                    style={{
                        background: '#1e293b', color: '#fff', border: 'none',
                        padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.15)'
                    }}
                >
                    <ArrowLeft size={16} /> Back to Students
                </button>
            </div>

            {/* Filter Bar */}
            <div style={{
                background: '#fff', borderRadius: '12px', padding: '1.2rem 1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
                display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center',
                marginBottom: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="#64748b" />
                    <span style={{ fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>Filter:</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Year</label>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', fontWeight: '700', color: '#1e293b', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Month</label>
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                        style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', fontWeight: '700', color: '#1e293b', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Week</label>
                    <select
                        value={selectedWeek}
                        onChange={e => setSelectedWeek(Number(e.target.value))}
                        style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', fontWeight: '700', color: '#1d4ed8', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                        {WEEKS.map((w, i) => <option key={i} value={i + 1}>{w}</option>)}
                    </select>
                </div>

                <button
                    onClick={fetchWeeklyData}
                    style={{
                        background: '#3b82f6', color: '#fff', border: 'none',
                        padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>

                <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                    Viewing: <span style={{ color: '#1e293b' }}>
                        {WEEKS[selectedWeek - 1]}, {MONTHS[selectedMonth]} {selectedYear}
                    </span>
                </div>
            </div>

            {/* Selected Week Detail Card */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)' }}>
                    <Activity size={20} color="#3b82f6" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
                        {WEEKS[selectedWeek - 1]} — {MONTHS[selectedMonth]} {selectedYear}
                    </h3>
                    {currentWeekRow?.status && (
                        <span style={{
                            marginLeft: 'auto',
                            background: currentWeekRow.status.bg, color: currentWeekRow.status.color,
                            padding: '5px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700',
                            border: `1.5px solid ${currentWeekRow.status.color}33`
                        }}>
                            {currentWeekRow.status.label}
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                        <div style={{ width: '36px', height: '36px', border: '4px solid #f1f5f9', borderTop: '4px solid #3b82f6', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }}></div>
                        Loading health data...
                    </div>
                ) : !currentWeekRow?.record ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
                        <span style={{ fontSize: '3rem' }}>⏳</span>
                        <p style={{ marginTop: '1rem', fontWeight: '600', fontSize: '1rem' }}>
                            No health record submitted for <strong>{studentName}</strong> during {WEEKS[selectedWeek - 1]}, {MONTHS[selectedMonth]} {selectedYear}.
                        </p>
                    </div>
                ) : (
                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            <div style={{ flex: '1', minWidth: '150px', background: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Submitted On</div>
                                <div style={{ fontWeight: '800', color: '#1e293b' }}>{currentWeekRow.date}</div>
                            </div>
                            <div style={{ flex: '1', minWidth: '150px', background: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Health Condition</div>
                                <div style={{ fontWeight: '800', color: '#1e293b' }}>{currentWeekRow.record?.healthCondition || 'Good'}</div>
                            </div>
                            <div style={{ flex: '1', minWidth: '150px', background: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Under Medication</div>
                                <div style={{ fontWeight: '800', color: '#1e293b' }}>{currentWeekRow.record?.underMedication || 'No'}</div>
                            </div>
                        </div>

                        {currentWeekRow.status?.issues?.length > 0 ? (
                            <div style={{ background: '#fffbeb', border: '1.5px solid #f59e0b33', borderRadius: '10px', padding: '1.2rem' }}>
                                <div style={{ fontWeight: '800', color: '#92400e', marginBottom: '8px', fontSize: '0.9rem' }}>⚠️ Health Issues / Conditions Detected:</div>
                                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                    {currentWeekRow.status.issues.map((issue, j) => (
                                        <li key={j} style={{ color: '#78350f', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '500' }}>{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div style={{ background: '#ecfdf5', border: '1.5px solid #10b98133', borderRadius: '10px', padding: '1.2rem', textAlign: 'center' }}>
                                <span style={{ color: '#065f46', fontWeight: '800', fontSize: '1.05rem' }}>
                                    🎉 No issues detected — {studentName} is Fit & Fine this week!
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* All Weeks Overview Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #f1f5f9' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>
                        📊 All Weeks Overview — {MONTHS[selectedMonth]} {selectedYear}
                    </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Week', 'Date Range', 'Submitted On', 'Health Status', 'Issues / Conditions'].map((h, i) => (
                                    <th key={i} style={{
                                        padding: '12px 16px', textAlign: 'left', color: '#475569',
                                        fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase',
                                        letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0'
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {weeklyRecords.map((row, idx) => (
                                <tr
                                    key={idx}
                                    onClick={() => setSelectedWeek(row.week)}
                                    style={{
                                        borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                                        background: row.week === selectedWeek ? '#eff6ff' : (idx % 2 === 0 ? '#fff' : '#fafafa'),
                                        transition: 'background 0.15s'
                                    }}
                                >
                                    <td style={{ padding: '14px 16px', fontWeight: '800', color: row.week === selectedWeek ? '#1d4ed8' : '#1e293b' }}>
                                        Week {row.week} {row.week === selectedWeek ? '◀' : ''}
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem' }}>{row.label.replace(/Week \d+ /, '')}</td>
                                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem', fontWeight: '500' }}>
                                        {row.date || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Not recorded</span>}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        {row.status ? (
                                            <span style={{
                                                background: row.status.bg, color: row.status.color,
                                                padding: '4px 10px', borderRadius: '20px',
                                                fontSize: '0.78rem', fontWeight: '700',
                                                border: `1px solid ${row.status.color}33`
                                            }}>
                                                {row.status.label}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontStyle: 'italic' }}>⏳ Not Submitted</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                                        {row.status?.issues?.length > 0 ? (
                                            <span style={{ color: '#78350f', fontSize: '0.82rem', fontWeight: '500' }}>
                                                {row.status.issues.join(' · ')}
                                            </span>
                                        ) : row.record ? (
                                            <span style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: '600' }}>No issues — Healthy 🎉</span>
                                        ) : (
                                            <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default WeeklyHealthUpdate;

