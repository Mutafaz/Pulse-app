"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Activity, Clock, Flame, Route, Trash2, Plus, Calendar as CalendarIcon, Bike, Waves, Footprints, Mountain, ArrowUp, Timer, Gauge, RefreshCcw } from 'lucide-react';
import styles from './CardioTracker.module.css';

const CARDIO_TYPES = [
  'Running', 
  'Cycling', 
  'Swimming', 
  'Walking', 
  'Rowing', 
  'Stairmaster', 
  'Elliptical', 
  'HIIT', 
  'Other'
];

export default function CardioTracker() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Running');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [calories, setCalories] = useState('');
  
  // Dynamic State
  const [speed, setSpeed] = useState('');
  const [pace, setPace] = useState('');
  const [elevation, setElevation] = useState('');
  const [floors, setFloors] = useState('');
  const [spm, setSpm] = useState('');
  const [split, setSplit] = useState('');
  const [laps, setLaps] = useState('');

  // Clear dynamic fields when type changes
  useEffect(() => {
    setSpeed(''); setPace(''); setElevation(''); setFloors(''); setSpm(''); setSplit(''); setLaps('');
  }, [type]);

  const fetchLogs = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, "users", user.uid, "cardio_history"));
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      // Sort newest first
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch cardio history", err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !duration) return;

    setIsSaving(true);
    try {
      const extraMetrics = {};
      if (speed) extraMetrics.speed = speed;
      if (pace) extraMetrics.pace = pace;
      if (elevation) extraMetrics.elevation = parseInt(elevation);
      if (floors) extraMetrics.floors = parseInt(floors);
      if (spm) extraMetrics.spm = parseInt(spm);
      if (split) extraMetrics.split = split;
      if (laps) extraMetrics.laps = parseInt(laps);

      const newLog = {
        date,
        type,
        durationMinutes: parseInt(duration) || 0,
        distanceMiles: parseFloat(distance) || 0,
        calories: parseInt(calories) || 0,
        extraMetrics,
        createdAt: new Date().toISOString()
      };
      
      const docId = `${date}_${Date.now()}`;
      await setDoc(doc(db, "users", user.uid, "cardio_history", docId), newLog);
      
      // Reset form
      setDuration(''); setDistance(''); setCalories('');
      setSpeed(''); setPace(''); setElevation(''); setFloors(''); setSpm(''); setSplit(''); setLaps('');
      
      await fetchLogs();
    } catch (err) {
      console.error("Failed to save cardio log", err);
      alert("Failed to save cardio session.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm("Delete this cardio session?")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "cardio_history", logId));
      await fetchLogs();
    } catch (err) {
      console.error("Failed to delete log", err);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    let totalMiles = 0;
    let totalMinutes = 0;
    let totalCals = 0;

    logs.forEach(log => {
      totalMiles += (log.distanceMiles || 0);
      totalMinutes += (log.durationMinutes || 0);
      totalCals += (log.calories || 0);
    });

    return {
      miles: totalMiles.toFixed(1),
      hours: (totalMinutes / 60).toFixed(1),
      cals: totalCals.toLocaleString()
    };
  }, [logs]);

  const getIconForType = (activityType) => {
    const t = activityType.toLowerCase();
    if (t.includes('cycl') || t.includes('bike')) return <Bike size={16} />;
    if (t.includes('swim')) return <Waves size={16} />;
    if (t.includes('walk') || t.includes('run')) return <Footprints size={16} />;
    return <Activity size={16} />;
  };

  const renderGraph = () => {
    if (logs.length < 2) return null;
    
    // Grab the 10 oldest first for chronological order
    const graphData = [...logs].reverse().slice(-10);
    
    const W = 300, H = 100, pad = { top: 15, bottom: 25, left: 25, right: 25 };
    const values = graphData.map(l => l.durationMinutes || 0);
    const maxV = Math.max(...values) || 1;
    const minV = Math.min(...values);
    const range = maxV - minV || 1;
    const xStep = (W - pad.left - pad.right) / (graphData.length - 1);
    const yScale = (v) => pad.top + ((H - pad.top - pad.bottom) * (1 - (v - minV) / range));
    const xScale = (i) => pad.left + i * xStep;
    
    const points = graphData.map((p, i) => `${xScale(i)},${yScale(p.durationMinutes || 0)}`).join(' ');

    return (
      <div style={{ overflowX: 'auto', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '0.5rem' }}>Duration Trend (Last 10 Sessions)</h4>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '500px', display: 'block', margin: '0 auto' }}>
          {[0.25, 0.5, 0.75, 1].map(t => (
            <line key={t} x1={pad.left} x2={W - pad.right}
              y1={pad.top + (H - pad.top - pad.bottom) * (1 - t)}
              y2={pad.top + (H - pad.top - pad.bottom) * (1 - t)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          ))}
          <defs>
            <linearGradient id="cardioGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,42,117,0.35)" />
              <stop offset="100%" stopColor="rgba(255,42,117,0)" />
            </linearGradient>
          </defs>
          <polyline
            points={[`${xScale(0)},${H - pad.bottom}`, ...graphData.map((p, i) => `${xScale(i)},${yScale(p.durationMinutes || 0)}`), `${xScale(graphData.length - 1)},${H - pad.bottom}`].join(' ')}
            fill="url(#cardioGrad)" stroke="none"
          />
          <polyline
            points={points}
            fill="none"
            stroke="var(--primary-color)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {graphData.map((p, i) => (
            <g key={i}>
              <circle cx={xScale(i)} cy={yScale(p.durationMinutes || 0)} r="3" fill="var(--primary-color)" stroke="var(--surface-light)" strokeWidth="2" />
              {i === graphData.length - 1 || i === 0 ? (
                <text 
                  x={xScale(i)} 
                  y={yScale(p.durationMinutes || 0) - 8} 
                  textAnchor={i === 0 ? "start" : "end"} 
                  fontSize="7" 
                  fill="var(--primary-color)" 
                  fontWeight="700"
                >{p.durationMinutes}m</text>
              ) : null}
              <text 
                x={xScale(i)} 
                y={H - 5} 
                textAnchor={i === 0 ? "start" : i === graphData.length - 1 ? "end" : "middle"} 
                fontSize="6" 
                fill="var(--text-muted)"
              >{new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      
      {/* Summary Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Route size={20} className={styles.statIcon} />
          <span className={styles.statValue}>{stats.miles}</span>
          <span className={styles.statLabel}>Total Miles</span>
        </div>
        <div className={styles.statCard}>
          <Clock size={20} className={styles.statIcon} />
          <span className={styles.statValue}>{stats.hours}</span>
          <span className={styles.statLabel}>Total Hours</span>
        </div>
        <div className={styles.statCard}>
          <Flame size={20} className={styles.statIcon} />
          <span className={styles.statValue}>{stats.cals}</span>
          <span className={styles.statLabel}>Calories</span>
        </div>
      </div>

      {/* Graph */}
      {renderGraph()}

      {/* Add Log Form */}
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <Plus size={20} color="var(--primary-color)" />
          <span>Log Cardio Session</span>
        </div>
        
        <form onSubmit={handleSave} className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Date</label>
            <input 
              type="date" 
              className={styles.input} 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required 
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Activity</label>
            <select className={styles.select} value={type} onChange={e => setType(e.target.value)}>
              {CARDIO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Duration (mins)</label>
            <input 
              type="number" 
              className={styles.input} 
              placeholder="e.g. 30" 
              value={duration} 
              onChange={e => setDuration(e.target.value)} 
              min="1"
              required 
            />
          </div>

          {type !== 'Stairmaster' && type !== 'HIIT' && type !== 'Other' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Distance ({type === 'Rowing' || type === 'Swimming' ? 'meters' : 'miles'})
              </label>
              <input 
                type="number" 
                step="0.01" 
                className={styles.input} 
                placeholder={type === 'Rowing' || type === 'Swimming' ? "e.g. 2000" : "e.g. 3.1"} 
                value={distance} 
                onChange={e => setDistance(e.target.value)} 
                min="0"
              />
            </div>
          )}

          {(type === 'Running' || type === 'Walking' || type === 'Elliptical') && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Speed (mph)</label>
                <input type="number" step="0.1" className={styles.input} placeholder="e.g. 6.5" value={speed} onChange={e => setSpeed(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Pace (min/mi)</label>
                <input type="text" className={styles.input} placeholder="e.g. 9:15" value={pace} onChange={e => setPace(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Elevation Gain (ft)</label>
                <input type="number" className={styles.input} placeholder="e.g. 300" value={elevation} onChange={e => setElevation(e.target.value)} />
              </div>
            </>
          )}

          {type === 'Cycling' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Average Speed (mph)</label>
                <input type="number" step="0.1" className={styles.input} placeholder="e.g. 14.5" value={speed} onChange={e => setSpeed(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Elevation Gain (ft)</label>
                <input type="number" className={styles.input} placeholder="e.g. 800" value={elevation} onChange={e => setElevation(e.target.value)} />
              </div>
            </>
          )}

          {type === 'Rowing' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Split Time (/500m)</label>
                <input type="text" className={styles.input} placeholder="e.g. 2:05" value={split} onChange={e => setSplit(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Strokes per min (SPM)</label>
                <input type="number" className={styles.input} placeholder="e.g. 24" value={spm} onChange={e => setSpm(e.target.value)} />
              </div>
            </>
          )}

          {type === 'Stairmaster' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Floors Climbed</label>
                <input type="number" className={styles.input} placeholder="e.g. 50" value={floors} onChange={e => setFloors(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Steps per min</label>
                <input type="number" className={styles.input} placeholder="e.g. 60" value={spm} onChange={e => setSpm(e.target.value)} />
              </div>
            </>
          )}

          {type === 'Swimming' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Laps</label>
              <input type="number" className={styles.input} placeholder="e.g. 40" value={laps} onChange={e => setLaps(e.target.value)} />
            </div>
          )}

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>Calories Burned - Optional</label>
            <input 
              type="number" 
              className={styles.input} 
              placeholder="e.g. 350" 
              value={calories} 
              onChange={e => setCalories(e.target.value)} 
              min="0"
            />
          </div>

          <div className={styles.fullWidth}>
            <button type="submit" className={styles.submitBtn} disabled={isSaving || !duration}>
              {isSaving ? 'Saving...' : 'Save Session'}
            </button>
          </div>
        </form>
      </div>

      {/* History List */}
      <div className={styles.historySection}>
        <h3 className={styles.historyHeader}>Recent Activity</h3>
        
        {logs.length === 0 ? (
          <div className={styles.emptyState}>
            <Activity size={32} className={styles.emptyIcon} />
            <p>No cardio sessions logged yet.</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className={styles.logCard}>
              <div className={styles.logInfo}>
                <div className={styles.logTitleRow}>
                  <span style={{ color: 'var(--primary-color)' }}>{getIconForType(log.type)}</span>
                  <span className={styles.logType}>{log.type}</span>
                  <span className={styles.logDate}>{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className={styles.logMetrics}>
                  <div className={styles.logMetric}>
                    <Clock size={14} />
                    {log.durationMinutes} min
                  </div>
                  {log.distanceMiles > 0 && (
                    <div className={styles.logMetric}>
                      <Route size={14} />
                      {log.distanceMiles} {log.type === 'Rowing' || log.type === 'Swimming' ? 'm' : 'mi'}
                    </div>
                  )}
                  {log.extraMetrics?.speed && (
                    <div className={styles.logMetric}>
                      <Gauge size={14} />
                      {log.extraMetrics.speed} mph
                    </div>
                  )}
                  {log.extraMetrics?.pace && (
                    <div className={styles.logMetric}>
                      <Timer size={14} />
                      {log.extraMetrics.pace} min/mi
                    </div>
                  )}
                  {log.extraMetrics?.elevation > 0 && (
                    <div className={styles.logMetric}>
                      <Mountain size={14} />
                      {log.extraMetrics.elevation} ft
                    </div>
                  )}
                  {log.extraMetrics?.floors > 0 && (
                    <div className={styles.logMetric}>
                      <ArrowUp size={14} />
                      {log.extraMetrics.floors} floors
                    </div>
                  )}
                  {log.extraMetrics?.laps > 0 && (
                    <div className={styles.logMetric}>
                      <RefreshCcw size={14} />
                      {log.extraMetrics.laps} laps
                    </div>
                  )}
                  {log.extraMetrics?.split && (
                    <div className={styles.logMetric}>
                      <Timer size={14} />
                      {log.extraMetrics.split} /500m
                    </div>
                  )}
                  {log.extraMetrics?.spm > 0 && (
                    <div className={styles.logMetric}>
                      <Gauge size={14} />
                      {log.extraMetrics.spm} {log.type === 'Stairmaster' ? 'steps/min' : 'spm'}
                    </div>
                  )}
                  {log.calories > 0 && (
                    <div className={styles.logMetric}>
                      <Flame size={14} />
                      {log.calories} kcal
                    </div>
                  )}
                </div>
              </div>
              <button 
                className={styles.deleteBtn} 
                onClick={() => handleDelete(log.id)}
                title="Delete Session"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
