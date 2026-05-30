"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Dumbbell, ChevronDown, ChevronUp, Target, BarChart2 } from 'lucide-react';
import styles from './page.module.css';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_NAMES = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };

export default function TodayPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);


  useEffect(() => {
    if (loading) return;
    if (!user || !userData) { router.push('/auth'); return; }
    loadData();
  }, [user, userData, loading]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [templateSnap, historySnap] = await Promise.all([
        getDocs(collection(db, 'users', user.uid, 'templates')),
        getDocs(collection(db, 'users', user.uid, 'history')),
      ]);
      const loadedTemplates = [];
      templateSnap.forEach(d => loadedTemplates.push({ id: d.id, ...d.data() }));
      setTemplates(loadedTemplates);

      const loadedHistory = [];
      historySnap.forEach(d => loadedHistory.push({ id: d.id, ...d.data() }));
      loadedHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(loadedHistory);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  const todayKey = DAY_KEYS[new Date().getDay()];
  const todayTemplateId = userData?.weekSchedule?.[todayKey];
  const isRestDay = todayTemplateId === 'rest';
  const todayTemplate = templates.find(t => t.id === todayTemplateId);



  if (loading || dataLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div className={styles.loadingPulse}>
        <Dumbbell size={32} style={{ opacity: 0.4 }} />
      </div>
    </div>
  );

  const firstName = (userData?.name || 'Athlete').split(' ')[0];
  const dayName = DAY_NAMES[todayKey];

  return (
    <div className={styles.container}>

      {/* Greeting Header */}
      <header className={styles.todayHeader}>
        <div className={styles.todayGreetingRow}>
          <div>
            <p className={styles.todayDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className={styles.todayGreeting}>
              Hey {firstName} 👋
            </h1>
          </div>
          <div className={styles.todayBadge}>
            {isRestDay ? '😴' : todayTemplate ? '🔥' : '📅'}
          </div>
        </div>
      </header>

      {/* Today's Plan Card */}
      {isRestDay ? (
        <div className={styles.restCard}>
          <div className={styles.restCardIcon}>😴</div>
          <h2 className={styles.restCardTitle}>Rest & Recovery Day</h2>
          <p className={styles.restCardSub}>Your muscles are growing right now. Rest is part of the program.</p>
        </div>
      ) : todayTemplate ? (
        <div className={styles.todayPlanCard}>
          <div className={styles.todayPlanHeader}>
            <div>
              <p className={styles.todayPlanLabel}>
                <Target size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
                Today you&apos;re hitting
              </p>
              <h2 className={styles.todayPlanName}>{todayTemplate.splitName || 'Workout'}</h2>
              <p className={styles.todayPlanMeta}>{todayTemplate.exercises?.length || 0} exercises</p>
            </div>
            <button
              className={styles.startWorkoutBtn}
              onClick={() => router.push('/workout')}
            >
              <Dumbbell size={16} />
              Start
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.noScheduleCard}>
          <Target size={28} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
          <p className={styles.noScheduleText}>No workout scheduled for {dayName}.</p>
          <button className={styles.setScheduleBtn} onClick={() => router.push('/settings')}>
            Set Up Schedule →
          </button>
        </div>
      )}

    </div>
  );
}
