'use client';
import React, { createContext, useState, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [alert, setAlert] = useState(null);

    const showAlert = useCallback((message, type = 'info', title = '') => {
        setAlert({ message, type, title });
    }, []);

    const closeAlert = useCallback(() => {
        setAlert(null);
    }, []);

    return (
        <NotificationContext.Provider value={{ showAlert, closeAlert }}>
            {children}
            <AnimatePresence>
                {alert && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 99999,
                            padding: '1rem'
                        }}
                        onClick={closeAlert}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{
                                backgroundColor: '#1e293b',
                                color: 'white',
                                padding: '2rem',
                                borderRadius: '1.5rem',
                                maxWidth: '450px',
                                width: '100%',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                position: 'relative'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={closeAlert}
                                style={{
                                    position: 'absolute',
                                    top: '1.25rem',
                                    right: '1.25rem',
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.closest('button').style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.target.closest('button').style.backgroundColor = 'transparent'}
                            >
                                <X size={20} />
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ 
                                    marginBottom: '1.5rem',
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: alert.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                                                     alert.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
                                                     alert.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                                                     'rgba(59, 130, 246, 0.1)',
                                    color: alert.type === 'error' ? '#ef4444' : 
                                           alert.type === 'success' ? '#22c55e' : 
                                           alert.type === 'warning' ? '#f59e0b' : 
                                           '#3b82f6'
                                }}>
                                    {alert.type === 'error' && <AlertCircle size={32} />}
                                    {alert.type === 'success' && <CheckCircle2 size={32} />}
                                    {alert.type === 'warning' && <AlertTriangle size={32} />}
                                    {alert.type === 'info' && <Info size={32} />}
                                </div>

                                {alert.title && (
                                    <h3 style={{ 
                                        fontSize: '1.5rem', 
                                        fontWeight: '700', 
                                        marginBottom: '0.5rem',
                                        color: '#f8fafc'
                                    }}>
                                        {alert.title}
                                    </h3>
                                )}

                                <p style={{ 
                                    lineHeight: '1.6', 
                                    color: '#cbd5e1', 
                                    fontSize: '1.1rem',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {alert.message}
                                </p>

                                <button
                                    onClick={closeAlert}
                                    style={{
                                        marginTop: '2rem',
                                        padding: '0.75rem 2.5rem',
                                        borderRadius: '9999px',
                                        border: 'none',
                                        backgroundColor: alert.type === 'error' ? '#ef4444' : 
                                                         alert.type === 'success' ? '#22c55e' : 
                                                         alert.type === 'warning' ? '#f59e0b' : 
                                                         '#3b82f6',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        transition: 'transform 0.2s, opacity 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                    OK
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </NotificationContext.Provider>
    );
};
