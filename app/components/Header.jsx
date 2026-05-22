"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import styles from './Header.module.css';

export default function Header() {
  const pathname = usePathname();
  const { user, userData } = useAuth();

  if (!user || !userData) return null;
  if (pathname === '/auth' || pathname === '/onboarding') return null;

  return (
    <header className={styles.header}>
      <Link href="/settings" className={styles.profileBtn} title="View Profile">
        <User size={20} className={styles.profileIcon} />
      </Link>
    </header>
  );
}
