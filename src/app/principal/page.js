'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PrincipalDashboard from '../../components/PrincipalDashboard';
import { NotificationProvider } from '../../context/NotificationContext';

export default function PrincipalPage() {
    const router = useRouter();
    const [principalData, setPrincipalData] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const auth = localStorage.getItem('isPrincipalAuthenticated');
        if (auth !== 'true') {
            router.push('/');
        } else {
            const data = localStorage.getItem('principalData');
            if (data) {
                setPrincipalData(JSON.parse(data));
            }
            setIsLoaded(true);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('isPrincipalAuthenticated');
        localStorage.removeItem('principalData');
        router.push('/');
    };

    if (!isLoaded) return null;

    return (
        <PrincipalDashboard
            principalData={principalData}
            onLogout={handleLogout}
        />
    );
}
