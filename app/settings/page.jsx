"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, deleteDoc, updateDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { User, Calendar, Scale, Goal, Edit3, Check, X, Database, Flame, Trophy } from 'lucide-react';
import styles from './page.module.css';
import { SEED_DATABASE } from '../../lib/exerciseDatabase';

export default function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Gamification States
  const [stats, setStats] = useState({ level: 1, title: 'Novice', streak: 0, totalVolume: 0 });

  const [adminTapCount, setAdminTapCount] = useState(0);
  const [adminTapTimer, setAdminTapTimer] = useState(null);

  const handleNameTap = () => {
    setAdminTapCount(prev => prev + 1);
    if (adminTapTimer) clearTimeout(adminTapTimer);
    const timer = setTimeout(() => setAdminTapCount(0), 1500);
    setAdminTapTimer(timer);
  };

  useEffect(() => {
    if (adminTapCount >= 5) {
      setAdminTapCount(0);
      handleToggleAdmin();
    }
  }, [adminTapCount]);

  // Fetch History & Calculate Stats
  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "history"));
        const records = [];
        let volume = 0;
        snap.forEach(d => {
          const data = d.data();
          records.push(data);
          volume += (data.totalVolume || 0);
        });

        // Calculate Level (10,000 lbs per level)
        const lvl = Math.floor(volume / 10000) + 1;
        let title = 'Novice Lifter';
        if (lvl >= 5) title = 'Dedicated Regular';
        if (lvl >= 10) title = 'Iron Athlete';
        if (lvl >= 20) title = 'Elite Warrior';
        if (lvl >= 50) title = 'Atlas';

        // Calculate Streak
        let currentStreak = 0;
        if (records.length > 0) {
          // Get unique ISO date strings
          const dates = records
            .map(r => new Date(r.createdAt).toISOString().split('T')[0])
            .sort((a, b) => b.localeCompare(a)); // Descending
          const uniqueDates = [...new Set(dates)];

          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
            currentStreak = 1;
            let checkDate = new Date(uniqueDates[0]);
            for (let i = 1; i < uniqueDates.length; i++) {
              checkDate.setDate(checkDate.getDate() - 1);
              const expectedStr = checkDate.toISOString().split('T')[0];
              if (uniqueDates[i] === expectedStr) {
                currentStreak++;
              } else {
                break;
              }
            }
          }
        }

        setStats({ level: lvl, title, streak: currentStreak, totalVolume: volume });
      } catch (err) {
        console.error("Failed to load history for stats", err);
      }
    };
    fetchStats();
  }, [user]);

  const handleToggleAdmin = async () => {
    const code = window.prompt("Enter admin passcode:");
    if (code === "Mackenzie") {
      try {
        const newStatus = !userData?.isAdmin;
        await updateDoc(doc(db, 'users', user.uid), { isAdmin: newStatus });
        alert(newStatus ? "Admin Mode Unlocked! You now have global publishing rights." : "Admin Mode Disabled.");
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Failed to update admin status.");
      }
    } else if (code !== null) {
      alert("Incorrect passcode.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to log out.");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to completely delete your account and all data? This cannot be undone."
    );
    
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "users", user.uid));
        await deleteUser(user);
        router.push('/');
      } catch (error) {
        console.error("Error deleting account:", error);
        if (error.code === 'auth/requires-recent-login') {
          alert("For security reasons, please log out and log back in before deleting your account.");
        } else {
          alert("Failed to delete account. You may need to log out and log back in first.");
        }
      }
    }
  };

  const calculateAge = (birthday) => {
    if (!birthday) return 0;
    const birthDate = new Date(birthday);
    const today = new Date();
    let computedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      computedAge--;
    }
    return computedAge;
  };

  const startEditing = () => {
    const heightStr = userData.height || "5'10\"";
    const feetMatch = heightStr.match(/(\d+)'/);
    const inchesMatch = heightStr.match(/(\d+)"/);
    setEditForm({
      name: userData.name || '',
      goal: userData.goal || 'muscle',
      gender: userData.gender || 'male',
      feet: feetMatch ? feetMatch[1] : '5',
      inches: inchesMatch ? inchesMatch[1] : '10',
      weight: userData.weight || '',
      birthday: userData.birthday || '',
      useVisualMap: userData.useVisualMap !== false,
    });
    setIsEditingProfile(true);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: editForm.name.trim(),
        goal: editForm.goal,
        gender: editForm.gender,
        height: `${editForm.feet}'${editForm.inches}"`,
        weight: parseFloat(editForm.weight) || userData.weight,
        birthday: editForm.birthday || userData.birthday || null,
        useVisualMap: editForm.useVisualMap,
      });
      window.location.reload();
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Profile data layout list
  const profileDetails = useMemo(() => {
    if (!userData) return [];
    
    const formatGoal = (g) => {
      if (g === 'muscle') return 'Build Muscle';
      if (g === 'strength') return 'Gain Strength';
      if (g === 'fat_loss') return 'Lose Fat';
      if (g === 'endurance') return 'Endurance';
      return g || 'Not specified';
    };

    return [
      { label: 'Name', value: userData.name || 'Not set', icon: User },
      { label: 'Goal', value: formatGoal(userData.goal), icon: Goal },
      { label: 'Gender', value: userData.gender?.replace(/^\w/, c => c.toUpperCase()) || 'Male', icon: User },
      { label: 'Height', value: userData.height || 'Not set', icon: Scale },
      { label: 'Baseline Weight', value: `${userData.weight || 0} lbs`, icon: Scale },
      { label: 'Age', value: `${userData.birthday ? calculateAge(userData.birthday) : (userData.age || 0)} years`, icon: Calendar },
      { label: 'Visual Map', value: userData.useVisualMap !== false ? 'Enabled' : 'Disabled', icon: Database },
      { label: 'Level', value: `Lvl ${stats.level} (${stats.title})`, icon: Trophy },
      { label: 'Current Streak', value: `${stats.streak} Days 🔥`, icon: Flame },
      { label: 'Lifetime Volume', value: `${stats.totalVolume.toLocaleString()} lbs`, icon: Scale },
    ];
  }, [userData, stats]);

  if (loading || !user || !userData) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account Profile</h1>
        <p className={styles.subtitle}>Manage preferences &amp; onboarding metrics</p>
      </header>

      <div className={styles.card}>
        {/* User info header row with edit controls */}
        <div className={styles.profileCardHeader}>
          <div className={styles.userInfoHeader}>
            <div className={styles.avatarIconBg}>
              <User size={28} className={styles.avatarIcon} />
            </div>
            <div onClick={handleNameTap} style={{ cursor: 'pointer', userSelect: 'none' }}>
              <h2 className={styles.userName}>
                {userData?.name || "Pulse Athlete"} 
                {userData?.isAdmin && <span style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>★</span>}
              </h2>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          </div>

          <div className={styles.editToggleBtnGroup}>
            {!isEditingProfile ? (
              <button
                className={styles.pencilBtn}
                onClick={startEditing}
                title="Edit profile"
                aria-label="Edit profile"
              >
                <Edit3 size={17} />
              </button>
            ) : (
              <>
                <button
                  className={styles.saveBtn}
                  onClick={saveProfile}
                  disabled={isSaving}
                  title="Save changes"
                  aria-label="Save changes"
                >
                  {isSaving ? '...' : <Check size={15} />}
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setIsEditingProfile(false)}
                  title="Cancel editing"
                  aria-label="Cancel editing"
                >
                  <X size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Editable form or static grid */}
        {isEditingProfile ? (
          <div className={styles.editFormGrid}>

            {/* Name */}
            <div className={styles.editDetailCard}>
              <div className={styles.detailIconCol}>
                <User size={16} className={styles.detailIcon} />
              </div>
              <div className={styles.detailTextCol}>
                <span className={styles.detailLabel}>Name</span>
                <input
                  className={styles.editInput}
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Goal */}
            <div className={styles.editDetailCard}>
              <div className={styles.detailIconCol}>
                <Goal size={16} className={styles.detailIcon} />
              </div>
              <div className={styles.detailTextCol}>
                <span className={styles.detailLabel}>Goal</span>
                <select
                  className={styles.editSelect}
                  value={editForm.goal}
                  onChange={e => setEditForm(prev => ({ ...prev, goal: e.target.value }))}
                >
                  <option value="muscle">Build Muscle</option>
                  <option value="strength">Gain Strength</option>
                  <option value="fat_loss">Lose Fat</option>
                  <option value="endurance">Endurance</option>
                </select>
              </div>
            </div>

            {/* Gender */}
            <div className={styles.editDetailCard}>
              <div className={styles.detailIconCol}>
                <User size={16} className={styles.detailIcon} />
              </div>
              <div className={styles.detailTextCol}>
                <span className={styles.detailLabel}>Gender</span>
                <div className={styles.genderToggleRow}>
                  <button
                    type="button"
                    className={`${styles.genderToggleBtn} ${editForm.gender === 'male' ? styles.genderToggleBtnActive : ''}`}
                    onClick={() => setEditForm(prev => ({ ...prev, gender: 'male' }))}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    className={`${styles.genderToggleBtn} ${editForm.gender === 'female' ? styles.genderToggleBtnActive : ''}`}
                    onClick={() => setEditForm(prev => ({ ...prev, gender: 'female' }))}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>

            {/* Height */}
            <div className={styles.editDetailCard}>
              <div className={styles.detailIconCol}>
                <Scale size={16} className={styles.detailIcon} />
              </div>
              <div className={styles.detailTextCol}>
                <span className={styles.detailLabel}>Height</span>
                <div className={styles.heightInputRow}>
                  <input
                    className={styles.editInput}
                    type="number"
                    min="3"
                    max="8"
                    value={editForm.feet}
                    onChange={e => setEditForm(prev => ({ ...prev, feet: e.target.value }))}
                    style={{ width: '3rem' }}
                  />
                  <span className={styles.heightSuffix}>ft</span>
                  <input
                    className={styles.editInput}
                    type="number"
                    min="0"
                    max="11"
                    value={editForm.inches}
                    onChange={e => setEditForm(prev => ({ ...prev, inches: e.target.value }))}
                    style={{ width: '3rem' }}
                  />
                  <span className={styles.heightSuffix}>in</span>
                </div>
              </div>
            </div>

            {/* Baseline Weight */}
            <div className={styles.editDetailCard}>
              <div className={styles.detailIconCol}>
                <Scale size={16} className={styles.detailIcon} />
              </div>
              <div className={styles.detailTextCol}>
                <span className={styles.detailLabel}>Baseline Weight</span>
                <div className={styles.heightInputRow}>
                  <input
                    className={styles.editInput}
                    type="number"
                    min="50"
                    max="600"
                    value={editForm.weight}
                    onChange={e => setEditForm(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="0"
                    style={{ width: '4.5rem' }}
                  />
                  <span className={styles.heightSuffix}>lbs</span>
                </div>
              </div>
            </div>

            {/* Birthday */}
            <div className={styles.editDetailCard}>
              <div className={styles.detailIconCol}>
                <Calendar size={16} className={styles.detailIcon} />
              </div>
              <div className={styles.detailTextCol}>
                <span className={styles.detailLabel}>Birthday</span>
                <div className={styles.heightInputRow}>
                  <input
                    className={styles.editInput}
                    type="date"
                    value={editForm.birthday}
                    onChange={e => setEditForm(prev => ({ ...prev, birthday: e.target.value }))}
                    style={{ width: '8.5rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Visual Map Preference */}
            <div className={styles.editDetailCard}>
              <div className={styles.detailIconCol}>
                <Database size={16} className={styles.detailIcon} />
              </div>
              <div className={styles.detailTextCol}>
                <span className={styles.detailLabel}>Visual Anatomy Map</span>
                <div className={styles.genderToggleRow}>
                  <button
                    type="button"
                    className={`${styles.genderToggleBtn} ${editForm.useVisualMap ? styles.genderToggleBtnActive : ''}`}
                    onClick={() => setEditForm(prev => ({ ...prev, useVisualMap: true }))}
                  >
                    Enabled
                  </button>
                  <button
                    type="button"
                    className={`${styles.genderToggleBtn} ${!editForm.useVisualMap ? styles.genderToggleBtnActive : ''}`}
                    onClick={() => setEditForm(prev => ({ ...prev, useVisualMap: false }))}
                  >
                    Disabled
                  </button>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Static profile details grid */
          <div className={styles.profileDetailsGrid}>
            {profileDetails.map((detail, idx) => {
              const Icon = detail.icon;
              return (
                <div key={idx} className={styles.profileDetailCard}>
                  <div className={styles.detailIconCol}>
                    <Icon size={16} className={styles.detailIcon} />
                  </div>
                  <div className={styles.detailTextCol}>
                    <span className={styles.detailLabel}>{detail.label}</span>
                    <span className={styles.detailValue}>{detail.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Account Utility Controls */}
        <div className={styles.accountActionDivider}></div>
        
        <button className={styles.btnSecondary} onClick={handleLogout}>
          Log Out
        </button>
        
        <button className={styles.btnDanger} onClick={handleDeleteAccount}>
          Delete Account &amp; Clear Data
        </button>

      </div>
    </div>
  );
}
