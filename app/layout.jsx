import './globals.css';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import { AuthProvider } from '../lib/AuthContext';

export const metadata = {
  title: 'Pulse',
  description: 'AI-powered workout tracker',
  manifest: '/manifest.json',
  icons: {
    icon: '/tab_logo.png',
    apple: '/tab_logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pulse'
  },
  themeColor: '#0a0a0a'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" href="/tab_logo.png" />
      </head>
      <body>
        <AuthProvider>
          <Header />
          <main className="app-container animate-fade-in">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}

