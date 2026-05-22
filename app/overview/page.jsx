"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Activity, Dumbbell, Calendar, Info, RefreshCw, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './page.module.css';
import MuscleSelector from '../components/MuscleSelector';

// Removed static SVG paths in favor of the dynamic MuscleSelector component

export default function OverviewPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [activeDay, setActiveDay] = useState('all'); // 'all' or specific ISO date string
  const [viewGender, setViewGender] = useState('male'); // 'male' or 'female'
  const [history, setHistory] = useState([]);
  const [muscleLoad, setMuscleLoad] = useState({});
  const [historyLoading, setHistoryLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

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
    }
  }, [user, loading, router]);

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

  // Exercise exercise-to-muscle group keyword dictionary mapping
  const MUSCLE_MAPPINGS = useMemo(() => ({
    chest: ["bench", "chest", "pushup", "fly", "dip", "pectoral", "incline press", "decline press"],
    lats: ["pullup", "row", "lat pulldown", "pulldown", "chinup"],
    traps: ["shrug", "deadlift", "upright row"],
    shoulders: ["shoulder", "overhead", "lateral raise", "military press", "raise", "deltoid"],
    biceps: ["bicep", "curl", "chinup", "hammer curl"],
    triceps: ["tricep", "extension", "skullcrusher", "pushdown", "dip"],
    forearms: ["wrist", "forearm", "hammer", "grip"],
    abs: ["crunch", "leg raise", "plank", "ab roller", "situp", "core"],
    lower_back: ["deadlift", "back extension", "hyper"],
    glutes: ["hip thrust", "squat", "deadlift", "leg press", "lunge"],
    quads: ["squat", "leg press", "quad", "leg extension", "lunge"],
    hamstrings: ["leg curl", "deadlift", "romanian deadlift", "rdl", "curl"],
    calves: ["calf", "calves", "calf raise"]
  }), []);

  // Calculate active muscles and load metrics for the selected day or overall last 7 days
  useEffect(() => {
    // Standard default fallback datasets in case user has no workout history
    const FALLBACK_LOADS = {
      all: {
        chest: 85, shoulders: 70, triceps: 75, lats: 80, traps: 55, abs: 50,
        biceps: 65, forearms: 40, lower_back: 60, glutes: 70, quads: 85, hamstrings: 75, calves: 45
      },
      // Maps standard training routines to specific weekdays for immersive mock visual
      monday: { chest: 95, shoulders: 70, triceps: 85, abs: 45 },
      tuesday: { lats: 90, traps: 70, biceps: 80, forearms: 50, lower_back: 65 },
      wednesday: { glutes: 85, quads: 95, hamstrings: 85, calves: 60 },
      thursday: { shoulders: 90, traps: 60, abs: 85 },
      friday: { chest: 75, lats: 70, shoulders: 60, biceps: 65, triceps: 65, quads: 70, hamstrings: 60 },
      saturday: {},
      sunday: {}
    };

    if (history.length === 0) {
      // Parse day keywords based on what is selected
      if (activeDay === 'all') {
        setMuscleLoad(FALLBACK_LOADS.all);
      } else {
        const selectedDayObj = timelineDays.find(d => d.dayKey === activeDay);
        if (selectedDayObj) {
          const dayNameLower = selectedDayObj.name.toLowerCase();
          // Map to standard mock workout split weekdays
          if (dayNameLower === 'mon') setMuscleLoad(FALLBACK_LOADS.monday);
          else if (dayNameLower === 'tue') setMuscleLoad(FALLBACK_LOADS.tuesday);
          else if (dayNameLower === 'wed') setMuscleLoad(FALLBACK_LOADS.wednesday);
          else if (dayNameLower === 'thu') setMuscleLoad(FALLBACK_LOADS.thursday);
          else if (dayNameLower === 'fri') setMuscleLoad(FALLBACK_LOADS.friday);
          else setMuscleLoad({});
        } else {
          setMuscleLoad({});
        }
      }
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

        // Match exercise to muscle groups
        Object.keys(MUSCLE_MAPPINGS).forEach(muscleKey => {
          const keywords = MUSCLE_MAPPINGS[muscleKey];
          const hasKeyword = keywords.some(kw => nameLower.includes(kw));
          if (hasKeyword) {
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
  }, [activeDay, history, timelineDays, MUSCLE_MAPPINGS]);

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
              const score = muscleLoad[muscleKey] || 0;
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
