import { useState, useMemo } from 'react';
import { Dumbbell, TrendingUp } from 'lucide-react';
import styles from './StrengthTracker.module.css';

const LIFTS = ['Barbell Bench Press', 'Barbell Squat', 'Deadlift', 'Overhead Press'];

export default function StrengthTracker({ history }) {
  const [selectedLift, setSelectedLift] = useState(LIFTS[0]);

  // Extract max weight lifted for the selected exercise over time
  const strengthLogs = useMemo(() => {
    if (!history) return [];
    
    // Group by date
    const dailyMaxes = {};
    
    history.forEach(session => {
      if (session.isRestDay || !session.exercises) return;
      
      const date = new Date(session.createdAt).toISOString().split('T')[0];
      
      session.exercises.forEach(ex => {
        if (ex.name === selectedLift) {
          let maxWeight = 0;
          ex.sets.forEach(s => {
            if (s.completed && s.lbs) {
              const weight = parseFloat(s.lbs);
              if (weight > maxWeight) maxWeight = weight;
            }
          });
          
          if (maxWeight > 0) {
            if (!dailyMaxes[date] || maxWeight > dailyMaxes[date]) {
              dailyMaxes[date] = maxWeight;
            }
          }
        }
      });
    });

    const list = Object.keys(dailyMaxes).map(date => ({
      date,
      weight: dailyMaxes[date]
    }));
    
    // Sort chronologically
    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [history, selectedLift]);

  const stats = useMemo(() => {
    if (strengthLogs.length === 0) return { start: 0, current: 0, delta: 0, best: 0 };
    const start = strengthLogs[0].weight;
    const current = strengthLogs[strengthLogs.length - 1].weight;
    const delta = current - start;
    const best = Math.max(...strengthLogs.map(l => l.weight));
    return { start, current, delta, best };
  }, [strengthLogs]);

  const chartData = useMemo(() => {
    if (strengthLogs.length < 2) return null;

    const width = 500;
    const height = 150;
    const padding = { left: 45, right: 20, top: 25, bottom: 25 };
    
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const weights = strengthLogs.map(l => l.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightDelta = maxWeight - minWeight;
    
    const yPadding = weightDelta === 0 ? 10 : weightDelta * 0.15;
    const minY = minWeight - yPadding;
    const maxY = maxWeight + yPadding;
    const yRange = maxY - minY;

    const points = strengthLogs.map((log, index) => {
      const x = padding.left + (index * graphWidth) / (strengthLogs.length - 1);
      const y = padding.top + graphHeight - ((log.weight - minY) * graphHeight) / yRange;
      return { x, y, weight: log.weight, date: log.date, index };
    });

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

    const fillPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    const gridlines = [
      { y: padding.top, label: `${Math.round(maxY)}` },
      { y: padding.top + graphHeight / 2, label: `${Math.round((maxY + minY) / 2)}` },
      { y: padding.top + graphHeight, label: `${Math.round(minY)}` }
    ];

    return { linePath, fillPath, points, gridlines, width, height, graphWidth };
  }, [strengthLogs]);

  return (
    <div className={styles.container}>
      {/* Lift Selector */}
      <div className={styles.selectorScroll}>
        {LIFTS.map(lift => (
          <button
            key={lift}
            className={`${styles.liftPill} ${selectedLift === lift ? styles.activePill : ''}`}
            onClick={() => setSelectedLift(lift)}
          >
            {lift}
          </button>
        ))}
      </div>

      <div className={styles.metricsBar}>
        <div className={styles.metricCard}>
          <Dumbbell size={16} className={styles.metricCardIcon} />
          <div className={styles.metricText}>
            <span className={styles.metricValue}>
              {stats.best ? `${stats.best}` : '--'}
            </span>
            <span className={styles.metricLabel}>All-Time 1RM</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <TrendingUp size={16} className={styles.metricCardIcon} />
          <div className={styles.metricText}>
            <span className={styles.metricValue} style={{ color: stats.delta > 0 ? 'var(--success-color)' : (stats.delta < 0 ? 'var(--danger-color)' : 'var(--text-main)') }}>
              {stats.delta > 0 ? '+' : ''}{stats.delta ? `${stats.delta.toFixed(1)}` : '0'}
            </span>
            <span className={styles.metricLabel}>Progression</span>
          </div>
        </div>
      </div>

      <div className={styles.chartContainer}>
        {chartData ? (
          <svg width="100%" height="100%" viewBox={`0 0 ${chartData.width} ${chartData.height}`} preserveAspectRatio="xMidYMid meet" className={styles.chartSvg}>
            <defs>
              <linearGradient id="strengthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--neon-pink)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--neon-pink)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {chartData.gridlines.map((gl, i) => (
              <g key={`grid-${i}`}>
                <line x1="40" y1={gl.y} x2={chartData.width - 20} y2={gl.y} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4,4" />
                <text x="35" y={gl.y + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="inherit">{gl.label}</text>
              </g>
            ))}
            <path d={chartData.fillPath} fill="url(#strengthGradient)" />
            <path d={chartData.linePath} fill="none" stroke="var(--neon-pink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {chartData.points.map(pt => (
              <circle key={pt.index} cx={pt.x} cy={pt.y} r="4" fill="var(--surface-color)" stroke="var(--neon-pink)" strokeWidth="2" />
            ))}
          </svg>
        ) : (
          <div className={styles.emptyChart}>
            <Dumbbell size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>Log {selectedLift} at least twice to see your 1RM progression chart.</p>
          </div>
        )}
      </div>
      
      {/* List view below chart */}
      <div className={styles.logsList}>
        {strengthLogs.length === 0 ? (
          <div className={styles.noLogs}>No data available for {selectedLift}.</div>
        ) : (
          [...strengthLogs].reverse().map((log, idx) => (
            <div key={idx} className={styles.logItem}>
              <span className={styles.logDate}>{new Date(log.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <span className={styles.logWeight}>{log.weight} lbs</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
