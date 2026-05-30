"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Dumbbell, Activity, Sparkles, Sun } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const pathname = usePathname();
  const { user, userData } = useAuth();

  // Hide nav if not logged in OR if still onboarding
  if (!user || !userData) return null;

  // Do not show on auth or onboarding pages just in case
  if (pathname === '/auth' || pathname === '/onboarding') return null;

  const navItems = [
    { name: 'Workout', href: '/workout', icon: Dumbbell },
    { name: 'Tracker', href: '/tracker', icon: CalendarDays },
    { name: 'Today', href: '/', icon: Sun, isCenter: true },
    { name: 'Overview', href: '/overview', icon: Activity },
    { name: 'Generator', href: '/ai', icon: Sparkles },
  ];


  return (
    <nav className={styles.nav}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        if (item.isCenter) {
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.navItem} ${styles.navCenter} ${isActive ? styles.centerActive : ''}`}
            >
              <div className={`${styles.centerBubble} ${isActive ? styles.centerBubbleActive : ''}`}>
                <Icon />
              </div>
              <span>{item.name}</span>
            </Link>
          );
        }

        return (
          <Link 
            key={item.name} 
            href={item.href}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Icon />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
