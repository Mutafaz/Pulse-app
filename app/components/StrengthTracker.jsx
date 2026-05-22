'use client';
import { useState, useEffect, useMemo } from 'react';
import { Dumbbell, TrendingUp, Plus, Trash2, Info } from 'lucide-react';
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import pageStyles from '../page.module.css';
import styles from './StrengthTracker.module.css';

// Combine both style objects — pageStyles for shared components, styles for 1RM-specific ones
const s = { ...pageStyles, ...styles };

const LIFTS = ['Barbell Bench Press', 'Barbell Squat', 'Deadlift', 'Overhead Press'];

export default function StrengthTracker() {
  const { user } = useAuth();
  const [selectedLift, setSelectedLift] = useState(LIFTS[0]);

  // Data
  const [logs, setLogs] = useState([]);

  // Form
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  // Tooltip
  const [hoveredNode, setHoveredNode] = useState(null);

  // ── Fetch from strength_history collection ──────────────────────────────
  const fetchLogs = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'strength_history'));
      const records = [];
      snap.forEach(d => records.push({ id: d.id, ...d.data() }));
      setLogs(records);
    } catch (err) {
      console.error('Error fetching strength history:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  // ── Filter by selected lift & sort chronologically ──────────────────────
  const filteredLogs = useMemo(() => {
    return logs
      .filter(l => l.exercise === selectedLift)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [logs, selectedLift]);

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (filteredLogs.length === 0) return { best: 0, delta: 0, current: 0 };
    const best = Math.max(...filteredLogs.map(l => l.weight));
    const first = filteredLogs[0].weight;
    const current = filteredLogs[filteredLogs.length - 1].weight;
    return { best, delta: current - first, current };
  }, [filteredLogs]);

  // ── Chart ───────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (filteredLogs.length < 2) return null;

    const width = 500;
    const height = 150;
    const padding = { left: 45, right: 20, top: 25, bottom: 25 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const weights = filteredLogs.map(l => l.weight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = maxW - minW;
    const yPad = range === 0 ? 10 : range * 0.15;
    const minY = minW - yPad;
    const maxY = maxW + yPad;
    const yRange = maxY - minY;

    const points = filteredLogs.map((log, i) => {
      const x = padding.left + (i * graphWidth) / (filteredLogs.length - 1);
      const y = padding.top + graphHeight - ((log.weight - minY) * graphHeight) / yRange;
      return { x, y, weight: log.weight, date: log.date, index: i };
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i], p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
      linePath += ` C ${cp1x} ${p0.y}, ${cp2x} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    const fillPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    const gridlines = [
      { y: padding.top, label: `${Math.round(maxY)}` },
      { y: padding.top + graphHeight / 2, label: `${Math.round((maxY + minY) / 2)}` },
      { y: padding.top + graphHeight, label: `${Math.round(minY)}` },
    ];

    return { linePath, fillPath, points, gridlines, width, height, padding };
  }, [filteredLogs]);

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const w = parseFloat(weightInput);
    if (!w || w <= 0 || w > 2000) return;
    setIsSaving(true);
    // Use exercise+date as the document ID (one entry per lift per day)
    const docId = `${selectedLift.replace(/\s+/g, '_')}_${dateInput}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'strength_history', docId), {
        exercise: selectedLift,
        weight: w,
        date: dateInput,
        createdAt: new Date().toISOString(),
      });
      setWeightInput('');
      await fetchLogs();
    } catch (err) {
      console.error('Error saving 1RM:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (logId) => {
    if (!window.confirm('Delete this 1RM entry?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'strength_history', logId));
      setLogs(prev => prev.filter(l => l.id !== logId));
    } catch (err) {
      console.error('Error deleting 1RM:', err);
    }
  };

  return (
    <div className={styles.container}>

      {/* Lift Selector */}
      <div className={s.selectorScroll}>
        {LIFTS.map(lift => (
          <button
            key={lift}
            className={`${s.liftPill} ${selectedLift === lift ? s.activePill : ''}`}
            onClick={() => { setSelectedLift(lift); setHoveredNode(null); }}
          >
            {lift}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className={s.metricsBar}>
        <div className={s.metricCard}>
          <Dumbbell size={16} className={s.metricCardIcon} />
          <div className={s.metricText}>
            <span className={s.metricValue}>{stats.best || '--'}</span>
            <span className={s.metricLabel}>All-Time 1RM (lbs)</span>
          </div>
        </div>
        <div className={s.metricCard}>
          <TrendingUp size={16} className={s.metricCardIcon} />
          <div className={s.metricText}>
            <span className={s.metricValue} style={{
              color: stats.delta > 0 ? 'var(--success-color)' : stats.delta < 0 ? 'var(--danger-color)' : 'var(--text-main)'
            }}>
              {stats.delta > 0 ? '+' : ''}{stats.delta ? stats.delta.toFixed(1) : '0'}
            </span>
            <span className={s.metricLabel}>Progression (lbs)</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className={s.chartCard}>
        <div className={s.cardHeader}>
          <h3 className={s.cardTitle}>{selectedLift} — 1RM Trend</h3>
          <span className={s.unitBadge}>lbs</span>
        </div>

        {chartData ? (
          <div className={s.svgWrapper}>
            <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className={s.progressionSvg}>
              <defs>
                <linearGradient id="strengthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff2a75" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#ff2a75" stopOpacity="0" />
                </linearGradient>
              </defs>
              {chartData.gridlines.map((gl, i) => (
                <g key={i}>
                  <line x1={chartData.padding.left} y1={gl.y} x2={chartData.width - chartData.padding.right} y2={gl.y} className={s.gridline} />
                  <text x={chartData.padding.left - 10} y={gl.y + 4} className={s.gridLabel} textAnchor="end">{gl.label}</text>
                </g>
              ))}
              <path d={chartData.fillPath} fill="url(#strengthGrad)" />
              <path d={chartData.linePath} className={s.chartCurveLine} />
              {chartData.points.map(pt => (
                <circle
                  key={pt.index}
                  cx={pt.x} cy={pt.y}
                  r={hoveredNode?.index === pt.index ? 6 : 4}
                  className={s.chartNodeCircle}
                  onMouseEnter={() => setHoveredNode(pt)}
                  onMouseLeave={() => setHoveredNode(null)}
                />
              ))}
            </svg>

            {hoveredNode && (
              <div
                className={s.chartTooltip}
                style={{
                  left: `${(hoveredNode.x / chartData.width) * 100}%`,
                  top: `${(hoveredNode.y / chartData.height) * 100}%`,
                }}
              >
                <div className={s.tooltipBox}>
                  <span className={s.tooltipWeight}>{hoveredNode.weight} lbs</span>
                  <span className={s.tooltipDate}>
                    {new Date(hoveredNode.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={s.emptyChartInfo}>
            <Info size={24} className={s.emptyChartIcon} />
            <p className={s.emptyChartText}>Log at least 2 entries to see your progression curve.</p>
          </div>
        )}
      </div>

      {/* Log Entry Form */}
      <div className={s.loggerCard}>
        <h3 className={s.cardTitle}>Log a 1RM for {selectedLift}</h3>
        <form onSubmit={handleSave} className={s.logWeightForm}>
          <div className={s.weightInputGroup}>
            <input
              type="number"
              step="0.5"
              min="1"
              max="2000"
              className={s.weightInput}
              placeholder="e.g. 225"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              required
            />
            <span className={s.weightSuffix}>lbs</span>
          </div>
          <input
            type="date"
            className={s.dateInput}
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            required
          />
          <button type="submit" className={s.logWeightBtn} disabled={isSaving}>
            {isSaving ? 'Saving...' : <><Plus size={16} /><span>Log Entry</span></>}
          </button>
        </form>
      </div>

      {/* History List */}
      <div className={s.historyLogsCard}>
        <h3 className={s.cardTitle}>Historical Logs</h3>
        <div className={s.logsListContainer}>
          {filteredLogs.length === 0 ? (
            <p className={s.emptyLogs}>No entries yet. Log your first {selectedLift} 1RM above.</p>
          ) : (
            [...filteredLogs].reverse().map(log => (
              <div key={log.id} className={s.historyLogItem}>
                <div className={s.logLeftCol}>
                  <span className={s.logDateStr}>
                    {new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className={s.logRightCol}>
                  <span className={s.logWeightStr}>{log.weight} lbs</span>
                  <button
                    className={s.deleteLogBtn}
                    onClick={() => handleDelete(log.id)}
                    title="Delete entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

