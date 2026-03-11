import './globals.css';
import { Inter } from 'next/font/google';
import { NotificationProvider } from '../context/NotificationContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Preventive Healthcare',
    description: 'Expert Health Intelligence for Children',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Preventive Healthcare',
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport = {
    themeColor: '#1e3a8a',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
                />
            </head>
            <body className={inter.className}>
                <NotificationProvider>
                    {children}
                </NotificationProvider>
            </body>
        </html>
    );
}
