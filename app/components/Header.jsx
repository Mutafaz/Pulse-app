"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User, Flame, Trophy } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import styles from './Header.module.css';

export default function Header() {
  const pathname = usePathname();
  const { user, userData } = useAuth();

  const [stats, setStats] = useState({ level: 1, streak: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "history"));
        const records = [];
        let volume = 0;
        snap.forEach(d => {
          const data = d.data();
          records.push(data);
          volume += (data.totalVolume || 0);
        });

        const lvl = Math.floor(volume / 10000) + 1;
        
        let currentStreak = 0;
        if (records.length > 0) {
          const dates = records
            .map(r => new Date(r.createdAt).toISOString().split('T')[0])
            .sort((a, b) => b.localeCompare(a));
          const uniqueDates = [...new Set(dates)];
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
            currentStreak = 1;
            let checkDate = new Date(uniqueDates[0]);
            for (let i = 1; i < uniqueDates.length; i++) {
              checkDate.setDate(checkDate.getDate() - 1);
              if (uniqueDates[i] === checkDate.toISOString().split('T')[0]) {
                currentStreak++;
              } else {
                break;
              }
            }
          }
        }
        setStats({ level: lvl, streak: currentStreak });
      } catch (err) {}
    };
    fetchStats();
  }, [user]);

  if (!user || !userData) return null;
  if (pathname === '/auth' || pathname === '/onboarding') return null;
  if (pathname === '/workout' || pathname.startsWith('/workout/')) return null;

  return (
    <header className={styles.header}>
      <div className={styles.statsContainer}>
        <div className={styles.statBadge}>
          <Trophy size={13} className={styles.levelIcon} />
          <span>Lvl {stats.level}</span>
        </div>
        {stats.streak > 0 && (
          <>
            <div className={styles.divider} />
            <div className={styles.statBadge}>
              <Flame size={13} className={styles.streakIcon} />
              <span>{stats.streak}</span>
            </div>
          </>
        )}
        <div className={styles.divider} />
        <Link href="/settings" className={styles.profileBtn} title="View Profile">
          <User size={16} className={styles.profileIcon} />
        </Link>
      </div>
    </header>
  );
}
