"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Activity, Dumbbell, Calendar, Info, RefreshCw, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './page.module.css';
import MuscleSelector from '../components/MuscleSelector';
import { SEED_DATABASE } from '../../lib/exerciseDatabase';

// Removed static SVG paths in favor of the dynamic MuscleSelector component

export default function OverviewPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [activeDay, setActiveDay] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewGender, setViewGender] = useState('male'); // 'male' or 'female'
  const [history, setHistory] = useState([]);
  const [globalExercises, setGlobalExercises] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  const [muscleLoad, setMuscleLoad] = useState({});
  const [historyLoading, setHistoryLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);



  // Today's Plan state
  const [templates, setTemplates] = useState([]);

  // Sync gender preference from profile
  useEffect(() => {
    if (userData?.gender) {
      setViewGender(userData.gender);
    }
  }, [userData]);

  // Protect page
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth');
    } else {
      fetchHistory();
      fetchDatabases();
    }
  }, [user, loading, router]);

  // Fetch workout templates for Today's Plan
  useEffect(() => {
    if (!user) return;
    const fetchTemplates = async () => {
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'templates'));
        const loaded = [];
        snap.forEach(d => loaded.push({ id: d.id, ...d.data() }));
        setTemplates(loaded);
      } catch (err) { console.error('Error loading templates:', err); }
    };
    fetchTemplates();
  }, [user]);

  const fetchDatabases = async () => {
    if (!user) return;
    try {
      const customSnap = await getDocs(collection(db, "users", user.uid, "custom_exercises"));
      const custom = [];
      customSnap.forEach(d => custom.push({ id: d.id, ...d.data() }));
      setCustomExercises(custom);

      const globalSnap = await getDocs(collection(db, "exercises"));
      if (globalSnap.empty) {
        setGlobalExercises(SEED_DATABASE);
      } else {
        const globals = [];
        globalSnap.forEach(d => globals.push({ id: d.id, ...d.data() }));
        setGlobalExercises(globals);
      }
    } catch (err) {
      console.error("Error loading exercises:", err);
      setGlobalExercises(SEED_DATABASE);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "users", user.uid, "history"));
      const records = [];
      snapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() });
      });
      // Sort by date descending
      records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(records);
    } catch (err) {
      console.error("Error loading workout history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Generate dynamic calendar strip for 7 days ending with Today shifted by weekOffset weeks
  const timelineDays = useMemo(() => {
    const list = [];
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayISO = new Date().toISOString().split('T')[0];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      // Shift backwards by weekOffset * 7 days, then subtract i days to get the sequence ending at that offset
      d.setDate(d.getDate() - (weekOffset * 7 + i));
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayKey = d.toISOString().split('T')[0];
      list.push({
        name: DAYS[d.getDay()],
        dateStr,
        dayKey,
        isToday: dayKey === todayISO
      });
    }
    return list;
  }, [weekOffset]);






  // Calculate active muscles and load metrics for the selected day or overall last 7 days
  useEffect(() => {
    if (history.length === 0) {
      setMuscleLoad({});
      return;
    }

    // Dynamic History Parser: Loop completed sessions and aggregate muscle workloads
    const selectedDateStr = activeDay;

    // Filter relevant workout records
    const relevantSessions = history.filter(session => {
      const sessionDate = new Date(session.createdAt);
      const sessionDayISO = sessionDate.toISOString().split('T')[0];

      if (selectedDateStr === 'all') {
        if (!timelineDays || timelineDays.length < 7) return false;
        const oldestDay = timelineDays[0].dayKey;
        const newestDay = timelineDays[6].dayKey;
        return sessionDayISO >= oldestDay && sessionDayISO <= newestDay;
      } else {
        // Specific day selection
        return sessionDayISO === selectedDateStr;
      }
    });

    const loadScore = {
      chest: 0, shoulders: 0, biceps: 0, triceps: 0, forearms: 0,
      abs: 0, lats: 0, traps: 0, lower_back: 0, glutes: 0,
      quads: 0, hamstrings: 0, calves: 0
    };

    relevantSessions.forEach(session => {
      const exercises = session.exercises || [];
      exercises.forEach(ex => {
        const nameLower = (ex.name || "").toLowerCase();

        // Count total completed sets and sum up actual completed reps
        let completedSets = 0;
        let totalReps = 0;
        (ex.sets || []).forEach(set => {
          if (set.completed) {
            completedSets++;
            const repsNum = parseInt(set.reps) || 0;
            totalReps += repsNum;
          }
        });

        if (completedSets === 0) return;

        // Find exercise in DB to use exact tags
        const cleanName = (ex.name || "").trim().toLowerCase();
        const combined = [...globalExercises, ...customExercises];
        const dbEx = combined.find(e => e.name.trim().toLowerCase() === cleanName);
        
        let matchedMuscles = [];

        if (dbEx) {
          if (dbEx.primaryMuscle) matchedMuscles.push(dbEx.primaryMuscle);
          if (dbEx.tags) {
            dbEx.tags.forEach(t => {
              if (Object.keys(loadScore).includes(t)) matchedMuscles.push(t);
            });
          }
        }

        matchedMuscles = [...new Set(matchedMuscles)]; // deduplicate
        
        matchedMuscles.forEach(muscleKey => {
          if (loadScore[muscleKey] !== undefined) {
            // Settle score: base impact + additional sets weight + reps volume factor
            loadScore[muscleKey] += 10 + (completedSets * 5) + (totalReps * 1.2);
          }
        });
      });
    });

    // Cap values at 100 to fit scale progress indicators
    const normalized = {};
    Object.keys(loadScore).forEach(k => {
      const score = loadScore[k];
      normalized[k] = score > 100 ? 100 : score;
    });

    setMuscleLoad(normalized);
  }, [activeDay, history, timelineDays, MUSCLE_MAPPINGS, globalExercises, customExercises]);

  // UI status labels
  const getHeaderDateLabel = () => {
    if (activeDay === 'all') {
      if (weekOffset === 0) return "Last 7 Days (All)";
      if (!timelineDays || timelineDays.length < 7) return "Selected Week (All)";
      return `${timelineDays[0].dateStr} - ${timelineDays[6].dateStr} (All)`;
    }
    const dayObj = timelineDays.find(d => d.dayKey === activeDay);
    return dayObj ? `${dayObj.name}, ${dayObj.dateStr}` : "Day Overview";
  };

  const getActiveMusclesCount = () => {
    return Object.values(muscleLoad).filter(score => score > 0).length;
  };

  // Helper to resolve CSS dynamic class matching muscle highlights
  const getMuscleClassName = (muscleKey) => {
    const score = muscleLoad[muscleKey] || 0;
    if (score >= 75) return `${styles.musclePath} ${styles.loadHigh}`;
    if (score >= 40) return `${styles.musclePath} ${styles.loadMedium}`;
    if (score > 0) return `${styles.musclePath} ${styles.loadLow}`;
    return styles.musclePath;
  };



  return (
    <div className={styles.container}>
      
      {/* Top Header Controls */}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Overview</h1>
            <p className={styles.subtitle}>Anatomical load and week analysis</p>
          </div>
        </div>
      </header>


      {/* Dynamic 7-Day Calendar Strip with Week Pagination */}
      <div className={styles.calendarWrapper}>
        <button 
          className={`${styles.allDaysButton} ${activeDay === 'all' ? styles.allDaysActive : ''}`}
          onClick={() => setActiveDay('all')}
        >
          <span className={styles.allDaysLabel}>
            <Calendar size={14} className={styles.allDaysIcon} />
            {weekOffset === 0 ? "All Last 7 Days" : `All Days (${timelineDays[0]?.dateStr} - ${timelineDays[6]?.dateStr})`}
          </span>
        </button>

        <div className={styles.calendarContainer}>
          <button 
            className={styles.scrollBtn}
            onClick={() => {
              setWeekOffset(prev => prev + 1);
              setActiveDay('all');
            }}
            title="Previous Week"
          >
            <ChevronLeft size={20} />
          </button>

          <div className={styles.calendarStrip}>
            {timelineDays.map((day) => {
              const isSelected = activeDay === day.dayKey;
              return (
                <button 
                  key={day.dayKey}
                  className={`${styles.calendarDayCard} ${isSelected ? styles.activeDay : ''} ${day.isToday ? styles.todayBorder : ''}`}
                  onClick={() => setActiveDay(day.dayKey)}
                >
                  <span className={styles.dayLabel}>{day.name}</span>
                  <span className={styles.dateLabel}>{day.dateStr.split(' ')[1]}</span>
                </button>
              );
            })}
          </div>

          <button 
            className={styles.scrollBtn}
            onClick={() => {
              setWeekOffset(prev => Math.max(0, prev - 1));
              setActiveDay('all');
            }}
            disabled={weekOffset === 0}
            title="Next Week"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Main Grid: Body SVG Maps Side-by-Side */}
      <div className={styles.workoutStatsRow}>
        <h2 className={styles.statsRowTitle}>
          <Activity size={18} className={styles.statsIcon} />
          <span>Anatomy Loading Map: {getHeaderDateLabel()}</span>
        </h2>
      </div>

      <div className={styles.anatomyGrid}>
        
        {/* Front Anatomical SVG Card */}
        <div className={styles.anatomyCard}>
          <h3 className={styles.anatomyCardTitle}>Front View</h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <MuscleSelector 
              key={viewGender + 'front'}
              mode="heatmap"
              gender={viewGender}
              side="front"
              muscleLoads={muscleLoad}
            />
          </div>
        </div>

        {/* Back Anatomical SVG Card */}
        <div className={styles.anatomyCard}>
          <h3 className={styles.anatomyCardTitle}>Back View</h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <MuscleSelector 
              key={viewGender + 'back'}
              mode="heatmap"
              gender={viewGender}
              side="back"
              muscleLoads={muscleLoad}
            />
          </div>
        </div>

      </div>

      {/* Heatmap Color Key Legend */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '0.75rem 1rem',
        background: 'var(--card-bg, #1a1a24)',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))'
      }}>
        {[
          { label: 'Low (1–24%)', color: 'rgba(56,182,255,0.75)', glow: 'rgba(56,182,255,0.4)' },
          { label: 'Moderate (25–49%)', color: 'rgba(52,211,153,0.85)', glow: 'rgba(52,211,153,0.4)' },
          { label: 'High (50–74%)', color: 'rgba(251,146,60,0.9)', glow: 'rgba(251,146,60,0.4)' },
          { label: 'Intense (75–100%)', color: 'rgba(239,68,68,1)', glow: 'rgba(239,68,68,0.5)' },
        ].map(({ label, color, glow }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 8px ${glow}`,
              flexShrink: 0
            }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Active Muscle Focus Breakdown Metrics */}
      <div className={styles.insightsCard}>
        <div className={styles.insightsHeader}>
          <div className={styles.insightsTitleCol}>
            <Zap size={20} className={styles.accentIcon} />
            <h3 className={styles.insightsTitle}>Target Load Metrics</h3>
          </div>
          <span className={styles.muscleBadge}>
            {getActiveMusclesCount()} Muscles Highlighted
          </span>
        </div>

        {getActiveMusclesCount() === 0 ? (
          <div className={styles.emptyInsights}>
            <Info size={28} className={styles.infoIcon} />
            <p className={styles.emptyText}>No training activity logged for this period.</p>
            <p className={styles.emptySubText}>Recovery is active! Settle in, stretch, and let your body regenerate.</p>
          </div>
        ) : (
          <div className={styles.muscleScoresGrid}>
            {Object.keys(muscleLoad).map((muscleKey) => {
              const score = Math.round(muscleLoad[muscleKey] || 0);
              if (score === 0) return null;

              const formattedName = muscleKey.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

              // 4-color scale matching the heatmap
              let barColor, barGlow;
              if (score >= 75) {
                barColor = 'rgba(239,68,68,1)';
                barGlow = 'rgba(239,68,68,0.5)';
              } else if (score >= 50) {
                barColor = 'rgba(251,146,60,0.9)';
                barGlow = 'rgba(251,146,60,0.4)';
              } else if (score >= 25) {
                barColor = 'rgba(52,211,153,0.85)';
                barGlow = 'rgba(52,211,153,0.35)';
              } else {
                barColor = 'rgba(56,182,255,0.75)';
                barGlow = 'rgba(56,182,255,0.3)';
              }

              return (
                <div key={muscleKey} className={styles.muscleProgressRow}>
                  <div className={styles.muscleProgressLabels}>
                    <span className={styles.muscleProgressName}>{formattedName}</span>
                    <span className={styles.muscleProgressPct} style={{ color: barColor }}>{score}% Load</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${score}%`,
                        background: barColor,
                        boxShadow: `0 0 8px ${barGlow}`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic AI Tip overlay box */}
        {getActiveMusclesCount() > 0 && (
          <div className={styles.aiTipBox}>
            <div className={styles.aiTipTitleRow}>
              <Zap size={14} className={styles.aiTipIcon} />
              <span className={styles.aiTipTitle}>Recovery Recommendation</span>
            </div>
            <p className={styles.aiTipContent}>
              {muscleLoad.chest > 75 || muscleLoad.shoulders > 75 
                ? "High loading detected on your chest/shoulders. Ensure at least 48 hours of recovery before hitting heavy pushes again, and stretch out your pectorals to avoid shoulder rounding." 
                : muscleLoad.lats > 75 || muscleLoad.lower_back > 75 
                ? "Your upper back and lats took a heavy beating. Perform active lat hangs and focus on core stability bracing to decompress your spine."
                : muscleLoad.quads > 75 || muscleLoad.glutes > 75
                ? "Heavy leg load scores observed! Keep hydrated, take a light walk to flush out lactic acid, and trigger rolling stretches on hamstrings and calves."
                : "Balanced workout load. Maintain high protein synthesis and execute standard active mobility stretches to secure muscle building gains."
              }
            </p>
          </div>
        )}
      </div>



    </div>
  );
}
