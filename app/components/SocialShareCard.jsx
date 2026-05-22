import React, { forwardRef } from 'react';
import { Flame, Clock, Dumbbell } from 'lucide-react';
import styles from './SocialShareCard.module.css';

const formatDuration = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const SocialShareCard = forwardRef(({ workout, userData }, ref) => {
  if (!workout) return null;

  const dateStr = new Date(workout.createdAt).toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className={styles.exportWrapper}>
      {/* The actual element that gets captured */}
      <div ref={ref} className={styles.cardContainer}>
        {/* Glowing orb background effect */}
        <div className={styles.glowOrb}></div>
        
        <div className={styles.header}>
          <div className={styles.logo}>PULSE</div>
          <div className={styles.athleteName}>{userData?.name || 'Athlete'}</div>
        </div>

        <div className={styles.body}>
          <div className={styles.date}>{dateStr}</div>
          <h2 className={styles.workoutName}>{workout.name}</h2>
          
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <Flame size={20} className={styles.statIcon} />
              <div className={styles.statValue}>{(workout.totalVolume || 0).toLocaleString()}</div>
              <div className={styles.statLabel}>LBS LIFTED</div>
            </div>
            <div className={styles.statBox}>
              <Clock size={20} className={styles.statIcon} style={{ color: '#60a5fa' }} />
              <div className={styles.statValue}>{formatDuration(workout.durationSeconds || 0)}</div>
              <div className={styles.statLabel}>TIME</div>
            </div>
            <div className={styles.statBox}>
              <Dumbbell size={20} className={styles.statIcon} style={{ color: '#a78bfa' }} />
              <div className={styles.statValue}>{workout.exercises?.length || 0}</div>
              <div className={styles.statLabel}>EXERCISES</div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          Built with Pulse — Track workouts & visualize progress
        </div>
      </div>
    </div>
  );
});

SocialShareCard.displayName = 'SocialShareCard';

export default SocialShareCard;
