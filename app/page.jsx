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
  const [expandedExercise, setExpandedExercise] = useState(null);

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

  // For each exercise in today's template, get last performance
  const exerciseHistory = useMemo(() => {
    if (!todayTemplate || history.length === 0) return {};
    const map = {};
    const names = (todayTemplate.exercises || []).map(e => (e.name || '').trim().toLowerCase());

    for (const session of history) {
      for (const ex of (session.exercises || [])) {
        const key = (ex.name || '').trim().toLowerCase();
        if (names.includes(key) && !map[key]) {
          const completedSets = (ex.sets || []).filter(s => s.completed && (s.lbs || s.reps));
          if (completedSets.length > 0) {
            map[key] = {
              sets: completedSets,
              date: new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              volume: completedSets.reduce((sum, s) => sum + ((parseFloat(s.lbs) || 0) * (parseInt(s.reps) || 0)), 0),
            };
          }
        }
      }
      if (Object.keys(map).length >= names.length) break;
    }
    return map;
  }, [todayTemplate, history]);

  // Progress graph data per exercise (last 8 sessions with that exercise)
  const getExerciseProgress = (exerciseName) => {
    const key = exerciseName.trim().toLowerCase();
    const points = [];
    for (const session of [...history].reverse()) {
      const ex = (session.exercises || []).find(e => (e.name || '').trim().toLowerCase() === key);
      if (!ex) continue;
      const completed = (ex.sets || []).filter(s => s.completed);
      if (!completed.length) continue;
      const volume = completed.reduce((s, set) => s + ((parseFloat(set.lbs) || 0) * (parseInt(set.reps) || 0)), 0);
      const best = Math.max(...completed.map(s => parseFloat(s.lbs) || 0));
      points.push({ date: new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), volume: Math.round(volume), best });
    }
    return points.slice(-8);
  };

  const renderMiniGraph = (exerciseName) => {
    const data = getExerciseProgress(exerciseName);
    if (data.length < 2) return (
      <p className={styles.noGraphData}>Log at least 2 sessions to see your trend.</p>
    );
    const W = 260, H = 72, padX = 8, padY = 8, padBottom = 20;
    const volumes = data.map(d => d.volume);
    const maxV = Math.max(...volumes) || 1;
    const minV = Math.min(...volumes);
    const range = maxV - minV || 1;
    const xStep = (W - padX * 2) / (data.length - 1);
    const xS = i => padX + i * xStep;
    const yS = v => padY + (H - padY - padBottom) * (1 - (v - minV) / range);
    const polyPoints = data.map((d, i) => `${xS(i)},${yS(d.volume)}`).join(' ');
    const fillPoints = [`${xS(0)},${H - padBottom}`, ...data.map((d, i) => `${xS(i)},${yS(d.volume)}`), `${xS(data.length - 1)},${H - padBottom}`].join(' ');
    const improving = data[data.length - 1].volume >= data[0].volume;

    return (
      <div className={styles.miniGraphWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.miniGraphSvg}>
          <defs>
            <linearGradient id={`grad-${exerciseName.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={improving ? 'rgba(52,211,153,0.3)' : 'rgba(255,42,117,0.3)'} />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
          </defs>
          {[0.33, 0.66, 1].map(t => (
            <line key={t} x1={padX} x2={W - padX}
              y1={padY + (H - padY - padBottom) * (1 - t)}
              y2={padY + (H - padY - padBottom) * (1 - t)}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          <polyline points={fillPoints} fill={`url(#grad-${exerciseName.replace(/\s/g, '')})`} stroke="none" />
          <polyline points={polyPoints} fill="none"
            stroke={improving ? '#34d399' : 'var(--primary-color)'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={xS(i)} cy={yS(d.volume)} r="3"
                fill={improving ? '#34d399' : 'var(--primary-color)'}
                stroke="var(--surface-light)" strokeWidth="1.5" />
              {(i === 0 || i === data.length - 1) && (
                <text x={xS(i)} y={H - 5} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.35)">{d.date}</text>
              )}
            </g>
          ))}
        </svg>
        <div className={styles.miniGraphStats}>
          <span style={{ color: improving ? '#34d399' : '#f87171', fontWeight: 700, fontSize: '0.75rem' }}>
            {improving ? '↑' : '↓'} {Math.abs(data[data.length - 1].volume - data[0].volume).toLocaleString()} lbs
          </span>
          <span className={styles.miniGraphBest}>Best: {Math.max(...data.map(d => d.best))} lbs</span>
        </div>
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

      {/* Exercise Progress Section */}
      {todayTemplate && !isRestDay && (
        <section className={styles.exerciseSection}>
          <div className={styles.sectionHeaderRow}>
            <BarChart2 size={16} style={{ color: 'var(--primary-color)' }} />
            <h2 className={styles.sectionTitle}>Exercise Progress</h2>
          </div>

          <div className={styles.exerciseList}>
            {(todayTemplate.exercises || []).map((ex, i) => {
              const key = (ex.name || '').trim().toLowerCase();
              const prev = exerciseHistory[key];
              const isExpanded = expandedExercise === ex.name;

              return (
                <div key={i} className={`${styles.exerciseCard} ${isExpanded ? styles.exerciseCardExpanded : ''}`}>
                  <button
                    className={styles.exerciseCardBtn}
                    onClick={() => setExpandedExercise(isExpanded ? null : ex.name)}
                  >
                    <div className={styles.exerciseCardLeft}>
                      <span className={styles.exerciseIndex}>{i + 1}</span>
                      <div className={styles.exerciseCardInfo}>
                        <span className={styles.exerciseName}>{ex.name}</span>
                        <span className={styles.exerciseMeta}>
                          {ex.sets} sets × {ex.reps} reps
                          {prev && <span className={styles.prevBadge}> · Last: {prev.date}</span>}
                        </span>
                      </div>
                    </div>
                    <div className={styles.exerciseCardRight}>
                      {prev && (
                        <span className={styles.prevVolume}>{prev.volume.toLocaleString()} lbs</span>
                      )}
                      {isExpanded ? <ChevronUp size={16} style={{ opacity: 0.5 }} /> : <ChevronDown size={16} style={{ opacity: 0.5 }} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className={styles.exerciseExpanded}>
                      {prev ? (
                        <>
                          <div className={styles.prevSetsRow}>
                            <p className={styles.prevSetsLabel}>Last session sets:</p>
                            <div className={styles.prevSetsPills}>
                              {prev.sets.map((s, si) => (
                                <span key={si} className={styles.setPill}>
                                  {s.lbs || '?'}lbs × {s.reps || '?'}
                                </span>
                              ))}
                            </div>
                          </div>
                          {renderMiniGraph(ex.name)}
                        </>
                      ) : (
                        <p className={styles.noHistoryText}>No previous data yet. Crush this workout! 💪</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
