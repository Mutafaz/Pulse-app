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
  const [selectedExercise, setSelectedExercise] = useState('');

  // 1. Get today's exercises
  const todayExerciseNames = useMemo(() => {
    if (!todayTemplate || !todayTemplate.exercises) return [];
    return todayTemplate.exercises.map(ex => ex.name).sort();
  }, [todayTemplate]);

  // 2. Get all other exercises from history
  const allHistoryExercises = useMemo(() => {
    const names = new Set();
    history.forEach(s => (s.exercises || []).forEach(e => { if (e.name) names.add(e.name); }));
    return [...names].filter(name => !todayExerciseNames.includes(name)).sort();
  }, [history, todayExerciseNames]);

  // 3. Compute progress data for selected exercise
  const progressData = useMemo(() => {
    if (!selectedExercise || history.length === 0) return [];
    const key = selectedExercise.trim().toLowerCase();
    const points = [];
    for (const session of [...history].reverse()) {
      const ex = (session.exercises || []).find(e => (e.name || '').trim().toLowerCase() === key);
      if (!ex) continue;
      const completedSets = (ex.sets || []).filter(s => s.completed);
      if (completedSets.length === 0) continue;
      const volume = completedSets.reduce((sum, s) => sum + ((parseFloat(s.lbs) || 0) * (parseInt(s.reps) || 0)), 0);
      const bestSet = Math.max(...completedSets.map(s => parseFloat(s.lbs) || 0));
      const date = new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      points.push({ date, volume: Math.round(volume), bestSet });
    }
    return points.slice(-10); // last 10
  }, [selectedExercise, history]);

  const renderProgressGraph = () => {
    if (progressData.length < 2) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {progressData.length === 0 ? 'No sessions found for this exercise.' : 'Log at least 2 sessions to see your trend.'}
        </div>
      );
    }
    const W = 300, H = 120, pad = { top: 10, bottom: 30, left: 10, right: 10 };
    const volumes = progressData.map(p => p.volume);
    const maxV = Math.max(...volumes) || 1;
    const minV = Math.min(...volumes);
    const range = maxV - minV || 1;
    const xStep = (W - pad.left - pad.right) / (progressData.length - 1);
    const yScale = (v) => pad.top + ((H - pad.top - pad.bottom) * (1 - (v - minV) / range));
    const xScale = (i) => pad.left + i * xStep;
    const points = progressData.map((p, i) => `${xScale(i)},${yScale(p.volume)}`).join(' ');

    return (
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '500px', display: 'block', margin: '0 auto' }}>
          {[0.25, 0.5, 0.75, 1].map(t => (
            <line key={t} x1={pad.left} x2={W - pad.right}
              y1={pad.top + (H - pad.top - pad.bottom) * (1 - t)}
              y2={pad.top + (H - pad.top - pad.bottom) * (1 - t)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          ))}
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,42,117,0.35)" />
              <stop offset="100%" stopColor="rgba(255,42,117,0)" />
            </linearGradient>
          </defs>
          <polyline
            points={[`${xScale(0)},${H - pad.bottom}`, ...progressData.map((p, i) => `${xScale(i)},${yScale(p.volume)}`), `${xScale(progressData.length - 1)},${H - pad.bottom}`].join(' ')}
            fill="url(#lineGrad)" stroke="none"
          />
          <polyline
            points={points}
            fill="none"
            stroke="var(--primary-color)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {progressData.map((p, i) => (
            <g key={i}>
              <circle cx={xScale(i)} cy={yScale(p.volume)} r="4" fill="var(--primary-color)" stroke="var(--surface-light)" strokeWidth="2" />
              {i === progressData.length - 1 || i === 0 ? (
                <text x={xScale(i)} y={yScale(p.volume) - 8} textAnchor="middle" fontSize="8" fill="var(--primary-color)" fontWeight="700">{p.volume}</text>
              ) : null}
              <text x={xScale(i)} y={H - 5} textAnchor="middle" fontSize="7" fill="var(--text-muted)">{p.date}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

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

      {/* Minimal Exercise Progress Section */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={18} style={{ color: 'var(--primary-color)' }} />
          Exercise Progress
        </h2>
        
        <select
          value={selectedExercise}
          onChange={e => setSelectedExercise(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--card-bg, #1a1a24)',
            color: 'var(--text-main)',
            fontSize: '0.95rem',
            marginBottom: '1.5rem',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none'
          }}
        >
          <option value="">Select workout to track progress...</option>
          {todayExerciseNames.length > 0 && (
            <optgroup label="Today's Workouts" style={{ color: 'var(--primary-color)' }}>
              {todayExerciseNames.map(name => <option key={name} value={name}>{name}</option>)}
            </optgroup>
          )}
          {allHistoryExercises.length > 0 && (
            <optgroup label="All Workouts">
              {allHistoryExercises.map(name => <option key={name} value={name}>{name}</option>)}
            </optgroup>
          )}
        </select>

        {selectedExercise && (
          <div style={{
            background: 'var(--card-bg, #1a1a24)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
            borderRadius: '16px',
            padding: '1.25rem',
          }}>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing last {progressData.length} sessions • Volume = lbs × reps completed
            </p>
            {renderProgressGraph()}
            {progressData.length >= 2 && (
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                    {Math.max(...progressData.map(p => p.volume)).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Peak Volume</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
                    {Math.max(...progressData.map(p => p.bestSet))} lbs
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Best Set</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: progressData[progressData.length - 1]?.volume >= progressData[0]?.volume ? '#34d399' : '#f87171' }}>
                    {progressData[progressData.length - 1]?.volume >= progressData[0]?.volume ? '↑' : '↓'}
                    {Math.abs(progressData[progressData.length - 1]?.volume - progressData[0]?.volume).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trend</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
