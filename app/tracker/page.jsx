"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Flame, 
  Dumbbell,
  Scale,
  TrendingDown,
  Plus,
  Trash2,
  Calendar,
  Info,
  X,
  Moon,
  Share2,
  Pencil,
  Copy
} from 'lucide-react';
import styles from './page.module.css';
import StrengthTracker from '../components/StrengthTracker';
import SocialShareCard from '../components/SocialShareCard';
import * as htmlToImage from 'html-to-image';

export default function TrackerPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  // Tab State: 'calendar' (Workout Calendar) or 'tracker' (Weight Tracker)
  const [activeTab, setActiveTab] = useState('calendar');

  // Workout Calendar States
  const [history, setHistory] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // Weight Tracker States
  const [weightLogs, setWeightLogs] = useState([]);
  const [weightInput, setWeightInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null); // { index, x, y, weight, date }

  // Social Sharing State
  const shareRef = useRef(null);
  const [sharingWorkout, setSharingWorkout] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Calendar Edit/Delete state
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false);

  // Sync Workout Calendar history when user loads
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!userData) {
      router.push('/onboarding');
      return;
    }

    const fetchHistory = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users", user.uid, "history"));
        const loaded = [];
        snapshot.forEach(doc => {
          loaded.push({ id: doc.id, ...doc.data() });
        });
        setHistory(loaded);
      } catch (err) {
        console.error("Error fetching workout history:", err);
      }
    };
    
    fetchHistory();
  }, [user, userData, loading, router]);

  // Sync weight history when user is loaded or tab changes
  useEffect(() => {
    if (user && activeTab === 'tracker') {
      fetchWeightHistory();
    }
  }, [user, activeTab]);

  const fetchWeightHistory = async () => {
    if (!user) return;
    try {
      const snapshot = await getDocs(collection(db, "users", user.uid, "weight_history"));
      const records = [];
      snapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() });
      });
      // Sort chronologically (oldest to newest)
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      setWeightLogs(records);
    } catch (err) {
      console.error("Error fetching weight history:", err);
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('Delete this workout? This cannot be undone.')) return;
    setIsDeletingWorkout(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'history', workoutId));
      setHistory(prev => prev.filter(w => w.id !== workoutId));
      setSelectedDay(null);
    } catch (err) {
      console.error('Error deleting workout:', err);
      alert('Failed to delete workout.');
    } finally {
      setIsDeletingWorkout(false);
    }
  };

  const handleSaveWorkoutEdit = async () => {
    if (!editingWorkout) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'history', editingWorkout.id), {
        name: editingWorkout.name,
        notes: editingWorkout.notes,
      });
      setHistory(prev => prev.map(w =>
        w.id === editingWorkout.id ? { ...w, name: editingWorkout.name, notes: editingWorkout.notes } : w
      ));
      setEditingWorkout(null);
    } catch (err) {
      console.error('Error updating workout:', err);
      alert('Failed to save changes.');
    }
  };

  const handleSaveWeight = async (e) => {
    e.preventDefault();
    if (!user || !weightInput) return;
    
    const weightNum = parseFloat(weightInput);
    if (isNaN(weightNum) || weightNum < 50 || weightNum > 1000) {
      alert("Please enter a valid weight between 50 and 1000 lbs.");
      return;
    }

    setIsSaving(true);
    const todayISO = new Date().toISOString().split('T')[0];

    try {
      await setDoc(doc(db, "users", user.uid, "weight_history", todayISO), {
        weight: weightNum,
        date: todayISO,
        createdAt: new Date().toISOString()
      });
      setWeightInput('');
      await fetchWeightHistory();
    } catch (err) {
      console.error("Error saving weight:", err);
      alert("Failed to save weight.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (logId === 'baseline') return;
    const confirmDelete = window.confirm("Are you sure you want to delete this weight log?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "weight_history", logId));
      await fetchWeightHistory();
    } catch (err) {
      console.error("Error deleting weight log:", err);
      alert("Failed to delete weight entry.");
    }
  };

  // Compile active weight logs including baseline onboarding weight as the starting point
  const allLogs = useMemo(() => {
    const list = [...weightLogs];
    
    if (userData?.weight) {
      // 1. Resolve a stable, constant registration date
      let regDateStr = null;
      if (userData.createdAt) {
        if (typeof userData.createdAt === 'string') {
          regDateStr = userData.createdAt.split('T')[0];
        } else if (userData.createdAt.seconds) {
          // Firebase Timestamp object handling
          regDateStr = new Date(userData.createdAt.seconds * 1000).toISOString().split('T')[0];
        } else if (userData.createdAt.toDate && typeof userData.createdAt.toDate === 'function') {
          regDateStr = userData.createdAt.toDate().toISOString().split('T')[0];
        }
      }

      // If missing or invalid, fall back to the oldest logged weight's date to keep it constant
      if (!regDateStr && list.length > 0) {
        const sortedTemp = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
        regDateStr = sortedTemp[0].date;
      }

      // Final fallback to today's date if completely empty
      if (!regDateStr) {
        regDateStr = new Date().toISOString().split('T')[0];
      }
        
      // 2. Ensure baseline date is ALWAYS exactly 1 day before the stable registration date.
      // This prevents dynamic day-to-day shifting, stabilizes historical sorting, and prevents date collisions.
      const d = new Date(regDateStr + 'T12:00:00'); // Parse with mid-day to avoid timezone shifting
      d.setDate(d.getDate() - 1);
      const baselineDate = d.toISOString().split('T')[0];
      
      // Check if this resolved baselineDate is already in the list
      const hasBaselineDate = list.some(log => log.date === baselineDate);
      if (!hasBaselineDate) {
        list.unshift({
          id: 'baseline',
          weight: userData.weight,
          date: baselineDate,
          isBaseline: true
        });
      }
    }
    
    // Sort chronologically
    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [weightLogs, userData]);

  // Weight statistics delta
  const weightStats = useMemo(() => {
    if (allLogs.length === 0) return { start: 0, current: 0, delta: 0 };
    const start = allLogs[0].weight;
    const current = allLogs[allLogs.length - 1].weight;
    const delta = current - start;
    return { start, current, delta };
  }, [allLogs]);

  // Formatted list for historical weight entries
  const sortedLogsDesc = useMemo(() => {
    const list = [...allLogs];
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allLogs]);

  // Math coordinates generator for progression SVG curve
  const chartData = useMemo(() => {
    if (allLogs.length < 2) return null;

    const width = 500;
    const height = 150;
    const padding = { left: 45, right: 20, top: 25, bottom: 25 };
    
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const weights = allLogs.map(l => l.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightDelta = maxWeight - minWeight;
    
    // Add Y padding so curve doesn't hit absolute borders
    const yPadding = weightDelta === 0 ? 5 : weightDelta * 0.15;
    const minY = minWeight - yPadding;
    const maxY = maxWeight + yPadding;
    const yRange = maxY - minY;

    // Generate x, y coordinates
    const points = allLogs.map((log, index) => {
      const x = padding.left + (index * graphWidth) / (allLogs.length - 1);
      const y = padding.top + graphHeight - ((log.weight - minY) * graphHeight) / yRange;
      return { x, y, weight: log.weight, date: log.date, index };
    });

    // Create cubic smooth S-curve interpolation line
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i+1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
      const cp2y = p1.y;
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    // Create smooth area gradient fill bounding path
    const fillPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    // Horizontal Y Gridlines labels
    const gridlines = [
      { y: padding.top, label: `${Math.round(maxY)}` },
      { y: padding.top + graphHeight / 2, label: `${Math.round((maxY + minY) / 2)}` },
      { y: padding.top + graphHeight, label: `${Math.round(minY)}` }
    ];

    return { points, linePath, fillPath, gridlines, width, height, padding };
  }, [allLogs]);

  // Calendar monthly calculations
  if (loading || !user || !userData) return null;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Map workout dates
  const workoutsByDate = useMemo(() => {
    const map = {};
    history.forEach(h => {
      const d = new Date(h.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(h);
    });
    return map;
  }, [history]);

  const getWorkoutsForDay = (day) => {
    const key = `${year}-${month}-${day}`;
    return workoutsByDate[key] || [];
  };



  const today = new Date();
  const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const m = Math.floor(seconds / 60);
    if (m >= 60) {
      const h = Math.floor(m / 60);
      return `${h}h ${m % 60}m`;
    }
    return `${m}m`;
  };

  // Stats for current month
  const monthWorkouts = history.filter(h => {
    const d = new Date(h.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const totalSessions = monthWorkouts.length;
  const totalVolume = monthWorkouts.reduce((acc, w) => acc + (w.totalVolume || 0), 0);
  const totalTime = monthWorkouts.reduce((acc, w) => acc + (w.durationSeconds || 0), 0);

  const selectedWorkouts = selectedDay ? getWorkoutsForDay(selectedDay) : [];

  return (
    <div className={styles.container}>
      
      {/* Dynamic Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          {activeTab === 'calendar' 
            ? `Welcome, ${userData?.name?.split(' ')[0] || 'Athlete'}` 
            : "Weight Tracker"
          }
        </h1>
        <p className={styles.subtitle}>
          {activeTab === 'calendar' 
            ? "Monitor your workout calendar and monthly summaries" 
            : "Configure metrics & track bodyweight progression"
          }
        </p>
      </header>

      {/* Glassmorphic Sliding Navigation Tabs */}
      <div className={styles.tabsSlider}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'calendar' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'tracker' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('tracker')}
        >
          Bodyweight
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'strength' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('strength')}
        >
          Strength (1RM)
        </button>
      </div>

      {/* Tab A: Workout Calendar Subview */}
      {activeTab === 'calendar' && (
        <div className={styles.tabContentPanel}>



          {/* Monthly Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <Dumbbell size={18} className={styles.statIcon} />
              <span className={styles.statValue}>{totalSessions}</span>
              <span className={styles.statLabel}>Sessions</span>
            </div>
            <div className={styles.statCard}>
              <Flame size={18} className={styles.statIcon} />
              <span className={styles.statValue}>{totalVolume.toLocaleString()}</span>
              <span className={styles.statLabel}>lbs moved</span>
            </div>
            <div className={styles.statCard}>
              <Clock size={18} className={styles.statIcon} />
              <span className={styles.statValue}>{formatDuration(totalTime)}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
          </div>

          {/* Calendar Card */}
          <div className={styles.calendarCard}>
            <div className={styles.calendarNav}>
              <button onClick={prevMonth} className={styles.navBtn}><ChevronLeft size={24} /></button>
              <h2 className={styles.monthTitle}>{monthNames[month]} {year}</h2>
              <button onClick={nextMonth} className={styles.navBtn}><ChevronRight size={24} /></button>
            </div>

            <div className={styles.calendarGrid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className={styles.dayHeader}>{d}</div>
              ))}

              {/* Empty cells for first week offset */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className={styles.dayCell} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayWorkouts = getWorkoutsForDay(day);
                const hasAny = dayWorkouts.length > 0;
                const allRest = hasAny && dayWorkouts.every(w => w.isRestDay);
                const hasRealWorkout = hasAny && dayWorkouts.some(w => !w.isRestDay);
                const isSel = selectedDay === day;

                return (
                  <div
                    key={day}
                    className={[
                      styles.dayCell,
                      hasRealWorkout ? styles.hasWorkout : '',
                      allRest && !hasRealWorkout ? styles.hasRestDay : '',
                      isToday(day) ? styles.today : '',
                      isSel ? styles.selected : ''
                    ].join(' ')}
                    onClick={() => setSelectedDay(isSel ? null : day)}
                  >
                    <span className={styles.dayNumber}>{day}</span>
                    {hasRealWorkout && <div className={styles.dot} />}
                    {allRest && !hasRealWorkout && <div className={styles.dotRest} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day popup modal overlay */}
          {selectedDay && (
            <div className={styles.dayModalOverlay} onClick={() => setSelectedDay(null)}>
              <div className={styles.dayModal} onClick={e => e.stopPropagation()}>
                <div className={styles.dayModalHeader}>
                  <h3 className={styles.dayModalTitle}>{monthNames[month]} {selectedDay}</h3>
                  <button className={styles.dayModalClose} onClick={() => setSelectedDay(null)}><X size={20} /></button>
                </div>

                {selectedWorkouts.length === 0 ? (
                  <div className={styles.dayModalEmpty}>
                    <Moon size={32} className={styles.dayModalEmptyIcon} />
                    <p>No workout recorded for this day.</p>
                    <p className={styles.dayModalEmptySub}>Rest days are just as important as training days.</p>
                  </div>
                ) : (
                  selectedWorkouts.map(w => (
                    <div key={w.id} className={styles.dayModalCard}>
                      {w.isRestDay ? (
                        <>
                          <div className={styles.dayModalRestHeader}>
                            <Moon size={18} className={styles.restDayIcon} />
                            <span className={styles.restDayLabel}>Active Recovery Day</span>
                          </div>
                          {w.notes && <p className={styles.dayModalNotes}>{w.notes}</p>}
                          <div className={styles.workoutActions}>
                            <button className={styles.deleteBtnSmall} onClick={() => handleDeleteWorkout(w.id)} disabled={isDeletingWorkout}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </>
                      ) : editingWorkout?.id === w.id ? (
                        /* ── Inline Edit Form ── */
                        <div className={styles.editForm}>
                          <input
                            className={styles.editInput}
                            value={editingWorkout.name}
                            onChange={e => setEditingWorkout(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Workout name"
                          />
                          <textarea
                            className={styles.editTextarea}
                            value={editingWorkout.notes || ''}
                            onChange={e => setEditingWorkout(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Notes (optional)"
                            rows={3}
                          />
                          <div className={styles.editFormActions}>
                            <button className={styles.saveEditBtn} onClick={handleSaveWorkoutEdit}>Save</button>
                            <button className={styles.cancelEditBtn} onClick={() => setEditingWorkout(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={styles.dayModalWorkoutHeader}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <h4 className={styles.dayModalWorkoutName}>{w.name}</h4>
                              <div className={styles.workoutActions}>
                                <button
                                  className={styles.shareBtn}
                                  onClick={() => {
                                    const exText = (w.exercises || []).map((ex, i) => {
                                      const completed = ex.sets?.filter(s => s.completed) || [];
                                      if (completed.length === 0) return `${i + 1}. ${ex.name} - 0 sets`;
                                      const setDetails = completed.map(s => {
                                        const lbs = parseFloat(s.lbs) || 0;
                                        return lbs > 0 ? `${s.reps}x${lbs}lbs` : `${s.reps} reps`;
                                      }).join(', ');
                                      return `${i + 1}. ${ex.name} - ${completed.length} sets (${setDetails})`;
                                    }).join('\n');
                                    const text = `Pulse Workout: ${w.name}\nDuration: ${formatDuration(w.durationSeconds)}\nVolume: ${(w.totalVolume || 0).toLocaleString()} lbs\n\nExercises:\n${exText}`;
                                    navigator.clipboard.writeText(text);
                                    alert('Workout copied to clipboard!');
                                  }}
                                  title="Copy for Strava"
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  className={styles.shareBtn}
                                  onClick={async () => {
                                    setSharingWorkout(w);
                                    setIsExporting(true);
                                    try {
                                      setTimeout(async () => {
                                        if (shareRef.current) {
                                          const dataUrl = await htmlToImage.toPng(shareRef.current, { quality: 0.95 });
                                          const link = document.createElement('a');
                                          link.download = `Pulse-Workout-${w.name.replace(/\s+/g, '-')}.png`;
                                          link.href = dataUrl;
                                          link.click();
                                        }
                                        setIsExporting(false);
                                      }, 100);
                                    } catch (error) {
                                      console.error('oops, something went wrong!', error);
                                      setIsExporting(false);
                                    }
                                  }}
                                  disabled={isExporting}
                                  title="Share as Image"
                                >
                                  <Share2 size={14} />
                                </button>
                                <button className={styles.editBtnSmall} onClick={() => setEditingWorkout({ id: w.id, name: w.name, notes: w.notes || '' })} title="Edit workout">
                                  <Pencil size={13} />
                                </button>
                                <button className={styles.deleteBtnSmall} onClick={() => handleDeleteWorkout(w.id)} disabled={isDeletingWorkout} title="Delete workout">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            {w.notes && <p className={styles.dayModalWorkoutNotes}>{w.notes}</p>}
                          </div>
                          <div className={styles.dayModalStats}>
                            <div className={styles.dayModalStat}>
                              <Clock size={14} />
                              <span>{formatDuration(w.durationSeconds)}</span>
                            </div>
                            <div className={styles.dayModalStat}>
                              <Flame size={14} />
                              <span>{(w.totalVolume || 0).toLocaleString()} lbs</span>
                            </div>
                            <div className={styles.dayModalStat}>
                              <Dumbbell size={14} />
                              <span>{w.exercises?.length || 0} exercises</span>
                            </div>
                          </div>
                          {w.exercises && w.exercises.length > 0 && (
                            <div className={styles.dayModalExerciseList}>
                              {w.exercises.map((ex, i) => (
                                <div key={i} className={styles.dayModalExerciseItem}>
                                  <span className={styles.dayModalExNum}>{i + 1}</span>
                                  <div className={styles.dayModalExInfo}>
                                    <span className={styles.dayModalExName}>{ex.name}</span>
                                    <span className={styles.dayModalExMeta}>
                                      {ex.sets?.filter(s => s.completed).length || 0} sets completed
                                      {ex.note && ` · ${ex.note}`}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab B: Body Stats Progression & Log Chart View */}
      {activeTab === 'tracker' && (
        <div className={styles.tabContentPanel}>
          {/* Quick Metrics Bar Cards */}
          <div className={styles.metricsBar}>
            <div className={styles.metricCard}>
              <Scale size={16} className={styles.metricCardIcon} />
              <div className={styles.metricText}>
                <span className={styles.metricValue}>
                  {weightStats.start ? `${weightStats.start.toFixed(1)}` : '--'}
                </span>
                <span className={styles.metricLabel}>Starting Weight</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <Scale size={16} className={styles.metricCardIcon} />
              <div className={styles.metricText}>
                <span className={styles.metricValue}>
                  {weightStats.current ? `${weightStats.current.toFixed(1)}` : '--'}
                </span>
                <span className={styles.metricLabel}>Current Weight</span>
              </div>
            </div>

            <div className={`${styles.metricCard} ${
              weightStats.delta < 0 ? styles.gainLossCardLoss : weightStats.delta > 0 ? styles.gainLossCardGain : ''
            }`}>
              <TrendingDown size={16} className={styles.metricCardIcon} />
              <div className={styles.metricText}>
                <span className={styles.metricValue}>
                  {weightStats.delta === 0 ? 'Stable' : `${weightStats.delta > 0 ? '+' : ''}${weightStats.delta.toFixed(1)} lbs`}
                </span>
                <span className={styles.metricLabel}>Net Progress Change</span>
              </div>
            </div>
          </div>

          {/* Interactive Progression SVG Chart Card */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Weight Trend Progression</h3>
              <span className={styles.unitBadge}>lbs</span>
            </div>

            {chartData ? (
              <div className={styles.svgWrapper}>
                <svg 
                  viewBox={`0 0 ${chartData.width} ${chartData.height}`} 
                  className={styles.progressionSvg}
                >
                  <defs>
                    {/* Glowing Linear Area Gradient */}
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff2a75" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ff2a75" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines & Y-Axis Labels */}
                  {chartData.gridlines.map((line, idx) => (
                    <g key={idx}>
                      <line 
                        x1={chartData.padding.left} 
                        y1={line.y} 
                        x2={chartData.width - chartData.padding.right} 
                        y2={line.y} 
                        className={styles.gridline}
                      />
                      <text 
                        x={chartData.padding.left - 10} 
                        y={line.y + 4} 
                        className={styles.gridLabel}
                        textAnchor="end"
                      >
                        {line.label}
                      </text>
                    </g>
                  ))}

                  {/* Shaded Area Under Curve */}
                  <path d={chartData.fillPath} fill="url(#areaGradient)" />

                  {/* Glowing Bezier Curve Line */}
                  <path d={chartData.linePath} className={styles.chartCurveLine} />

                  {/* Interactive Nodes Circle Markers */}
                  {chartData.points.map((point) => (
                    <circle 
                      key={point.index}
                      cx={point.x}
                      cy={point.y}
                      r={hoveredNode?.index === point.index ? 6 : 4}
                      className={styles.chartNodeCircle}
                      onMouseEnter={() => setHoveredNode(point)}
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                  ))}
                </svg>

                {/* Floating CSS Tooltip Node Overlays */}
                {hoveredNode && (
                  <div 
                    className={styles.chartTooltip}
                    style={{
                      left: `${(hoveredNode.x / chartData.width) * 100}%`,
                      top: `${(hoveredNode.y / chartData.height) * 100}%`,
                    }}
                  >
                    <div className={styles.tooltipBox}>
                      <span className={styles.tooltipWeight}>{hoveredNode.weight.toFixed(1)} lbs</span>
                      <span className={styles.tooltipDate}>
                        {new Date(hoveredNode.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyChartInfo}>
                <Info size={24} className={styles.emptyChartIcon} />
                <p className={styles.emptyChartText}>Progression curve is mapping baseline.</p>
                <p className={styles.emptyChartSubText}>Log an additional weight entry to draw your smooth Bezier progression curve!</p>
              </div>
            )}
          </div>

          {/* Quick weight input submission logger */}
          <div className={styles.loggerCard}>
            <h3 className={styles.cardTitle}>Log Today's Bodyweight</h3>
            <form onSubmit={handleSaveWeight} className={styles.logWeightForm}>
              <div className={styles.weightInputGroup}>
                <input 
                  type="number" 
                  step="0.1" 
                  min="50" 
                  max="1000"
                  className={styles.weightInput} 
                  placeholder="e.g. 182.4" 
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  required
                />
                <span className={styles.weightSuffix}>lbs</span>
              </div>
              <button 
                type="submit" 
                className={styles.logWeightBtn}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : <><Plus size={16} /><span>Log Entry</span></>}
              </button>
            </form>
          </div>

          {/* Table history scroll block */}
          <div className={styles.historyLogsCard}>
            <h3 className={styles.cardTitle}>Historical Logs</h3>
            
            <div className={styles.logsListContainer}>
              {sortedLogsDesc.map((log) => {
                const dateObj = new Date(log.date);
                const displayDate = dateObj.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <div key={log.id} className={styles.historyLogItem}>
                    <div className={styles.logLeftCol}>
                      <Calendar size={15} className={styles.calendarIcon} />
                      <span className={styles.logDateStr}>{displayDate}</span>
                      {log.isBaseline && <span className={styles.baselineBadge}>Baseline</span>}
                    </div>
                    <div className={styles.logRightCol}>
                      <span className={styles.logWeightStr}>{log.weight.toFixed(1)} lbs</span>
                      <button 
                        className={styles.deleteLogBtn}
                        onClick={() => handleDeleteLog(log.id)}
                        disabled={log.isBaseline}
                        title={log.isBaseline ? "Baseline cannot be deleted" : "Delete Log"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab C: Strength Progression */}
      {activeTab === 'strength' && (
        <div className={styles.tabContentPanel}>
          <StrengthTracker />
        </div>
      )}

      {/* Hidden element for Strava-style Image Export */}
      <SocialShareCard ref={shareRef} workout={sharingWorkout} userData={userData} />
    </div>
  );
}
