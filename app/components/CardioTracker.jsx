"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Activity, Clock, Flame, Route, Trash2, Plus, Calendar as CalendarIcon, Bike, Waves, Footprints } from 'lucide-react';
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
      const newLog = {
        date,
        type,
        durationMinutes: parseInt(duration) || 0,
        distanceMiles: parseFloat(distance) || 0,
        calories: parseInt(calories) || 0,
        createdAt: new Date().toISOString()
      };
      
      const docId = `${date}_${Date.now()}`;
      await setDoc(doc(db, "users", user.uid, "cardio_history", docId), newLog);
      
      // Reset form
      setDuration('');
      setDistance('');
      setCalories('');
      
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

          <div className={styles.formGroup}>
            <label className={styles.label}>Distance (miles) - Optional</label>
            <input 
              type="number" 
              step="0.01" 
              className={styles.input} 
              placeholder="e.g. 3.1" 
              value={distance} 
              onChange={e => setDistance(e.target.value)} 
              min="0"
            />
          </div>

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
                      {log.distanceMiles} mi
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
