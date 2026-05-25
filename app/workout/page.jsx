"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import {
  Play, Plus, Check, Timer, X, FolderOpen, ChevronDown, ChevronRight, ChevronLeft,
  Edit3, Trash2, Search, HelpCircle, Dumbbell, MessageSquare, RefreshCw
} from 'lucide-react';
import styles from './page.module.css';

import { polyfill } from "mobile-drag-drop";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
import "mobile-drag-drop/default.css";

if (typeof window !== "undefined") {
  polyfill({
    dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride
  });
}
import {
  SEED_DATABASE,
  MUSCLE_GROUPS,
  searchExercises,
  autoTagExercise,
  slugify
} from '../../lib/exerciseDatabase';
import MuscleSelector from '../components/MuscleSelector';

const STANDARD_SETS = [1, 2, 3, 4, 5, 6, 8, 10];
const STANDARD_REPS = ["1", "2", "3", "4", "5", "6", "8", "10", "12", "15", "5-12", "8-12", "10-12"];
const STANDARD_REST = ["30s", "60s", "90s", "120s", "150s", "180s", "240s", "300s"];

export default function WorkoutPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [templates, setTemplates] = useState([]);
  const [customFolders, setCustomFolders] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [previewSplit, setPreviewSplit] = useState(null);
  const [editedSplit, setEditedSplit] = useState(null);
  const [isEditingSplitName, setIsEditingSplitName] = useState(false);
  const [isEditingSplit, setIsEditingSplit] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [draggingOverFolder, setDraggingOverFolder] = useState(null);

  // Timers
  const [globalSeconds, setGlobalSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restEndTime, setRestEndTime] = useState(null);
  const [isResting, setIsResting] = useState(false);
  const [restingExerciseId, setRestingExerciseId] = useState(null);
  const [totalRestSeconds, setTotalRestSeconds] = useState(180);
  const restRef = useRef(false);

  // ── NEW STATE ─────────────────────────────────────────────────────────────
  // Exercise search bottom sheet
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('All');
  const [exerciseSearchMode, setExerciseSearchMode] = useState('visual'); // 'list' | 'visual'
  const [globalExercises, setGlobalExercises] = useState([]);

  // Sync default search mode with user preferences
  useEffect(() => {
    if (userData && userData.useVisualMap === false) {
      setExerciseSearchMode('list');
    } else {
      setExerciseSearchMode('visual');
    }
  }, [userData, showExerciseSearch]);
  const [customExercises, setCustomExercises] = useState([]);

  // Custom exercise creation form
  const [showAddCustomForm, setShowAddCustomForm] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiReviewData, setAiReviewData] = useState(null);
  const [customFormData, setCustomFormData] = useState({
    name: '',
    primaryMuscle: 'chest',
    instructions: '',
    hints: ''
  });

  // Info guide modal (shared across all contexts)
  const [exerciseInfoModal, setExerciseInfoModal] = useState(null);

  // Rest Day Logger
  const [showRestDaySheet, setShowRestDaySheet] = useState(false);
  const [restDayNotes, setRestDayNotes] = useState('');
  const [restDaySaved, setRestDaySaved] = useState(false);

  // Session-level notes
  const [sessionNotes, setSessionNotes] = useState('');
  const [showSessionNotes, setShowSessionNotes] = useState(false);
  const [exerciseSearchContext, setExerciseSearchContext] = useState('session'); // 'session', 'edit', or 'swap'
  const [draggedExerciseIndex, setDraggedExerciseIndex] = useState(null);
  const [exerciseSwapIndex, setExerciseSwapIndex] = useState(null);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (loading) return;
    if (!user || !userData) {
      router.push('/auth');
      return;
    }
    fetchTemplates();
    fetchCustomExercises();
    fetchGlobalExercises();
  }, [user, userData, loading, router]);

  const fetchTemplates = async () => {
    if (!user) return;
    const snapshot = await getDocs(collection(db, "users", user.uid, "templates"));
    const loaded = [];
    snapshot.forEach(d => {
      loaded.push({ id: d.id, ...d.data() });
    });
    setTemplates(loaded);

    try {
      const foldersDoc = await getDoc(doc(db, "users", user.uid, "metadata", "folders"));
      let folderNames = [];
      if (foldersDoc.exists()) {
        folderNames = foldersDoc.data().list || [];
      }
      const templateFolders = Array.from(new Set(loaded.map(t => t.folderName).filter(Boolean)));
      const mergedFolders = Array.from(new Set([...folderNames, ...templateFolders]));
      setCustomFolders(mergedFolders);
    } catch (err) {
      console.error("Error fetching folders list:", err);
      const templateFolders = Array.from(new Set(loaded.map(t => t.folderName).filter(Boolean)));
      setCustomFolders(templateFolders);
    }
  };

  const fetchCustomExercises = async () => {
    if (!user) return;
    try {
      const snapshot = await getDocs(collection(db, "users", user.uid, "custom_exercises"));
      const loaded = [];
      snapshot.forEach(d => loaded.push({ id: d.id, ...d.data() }));
      setCustomExercises(loaded);
    } catch (err) {
      console.error("Error fetching custom exercises:", err);
    }
  };

  const fetchGlobalExercises = async () => {
    try {
      const snapshot = await getDocs(collection(db, "exercises"));
      if (snapshot.empty) {
        // Fallback: seed the database
        const seedPromises = SEED_DATABASE.map(ex => setDoc(doc(db, "exercises", ex.id), ex));
        await Promise.all(seedPromises);
        setGlobalExercises(SEED_DATABASE);
      } else {
        const loaded = [];
        snapshot.forEach(d => loaded.push({ id: d.id, ...d.data() }));
        setGlobalExercises(loaded);
      }
    } catch (err) {
      console.error("Error fetching global exercises:", err);
      setGlobalExercises(SEED_DATABASE);
    }
  };

  // Global timer
  useEffect(() => {
    if (!activeSession || !sessionStartTime) return;
    const interval = setInterval(() => {
      setGlobalSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession, sessionStartTime]);

  // Rest timer (countdown)
  useEffect(() => {
    if (!activeSession || !isResting || !restEndTime) {
      setRestingExerciseId(null);
      return;
    }
    
    const checkRestTimer = () => {
      const remaining = Math.max(0, Math.floor((restEndTime - Date.now()) / 1000));
      setRestSeconds(remaining);
      if (remaining <= 0) {
        setIsResting(false);
        setRestingExerciseId(null);
      }
    };
    
    checkRestTimer();
    const interval = setInterval(checkRestTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession, isResting, restEndTime]);

  // Auto-Load Active Session
  useEffect(() => {
    if (!user) return;
    const draftJson = localStorage.getItem(`workoutDraft_${user.uid}`);
    if (draftJson) {
      try {
        const draft = JSON.parse(draftJson);
        if (draft.activeSession) {
          setActiveSession(draft.activeSession);
          setSessionStartTime(draft.sessionStartTime);
          setIsResting(draft.isResting || false);
          setRestEndTime(draft.restEndTime || null);
          setRestingExerciseId(draft.restingExerciseId || null);
          setSessionNotes(draft.sessionNotes || '');
        }
      } catch (e) {
        console.error("Failed to parse workout draft", e);
      }
    }
  }, [user]);

  // Auto-Save Active Session
  useEffect(() => {
    if (!user) return;
    if (activeSession) {
      const draft = {
        activeSession,
        sessionStartTime,
        isResting,
        restEndTime,
        restingExerciseId,
        sessionNotes,
      };
      localStorage.setItem(`workoutDraft_${user.uid}`, JSON.stringify(draft));
    } else {
      localStorage.removeItem(`workoutDraft_${user.uid}`);
    }
  }, [activeSession, sessionStartTime, isResting, restEndTime, restingExerciseId, sessionNotes, user]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h.toString().padStart(2, '0')}:${m}:${s}` : `${m}:${s}`;
  };

  const renderAIReviewModal = () => {
    if (!aiReviewData) return null;
    return (
      <div className={styles.infoModal} onClick={() => setAiReviewData(null)}>
        <div className={styles.infoPanel} onClick={e => e.stopPropagation()}>
          <div className={styles.infoPanelHeader}>
            <h3 className={styles.searchTitle}>Review AI Generation</h3>
            <button className={styles.infoBtn} onClick={() => setAiReviewData(null)}>
              <X size={22} />
            </button>
          </div>
          <div className={styles.infoSection}>
            <h4 className={styles.infoSectionTitle}>Name & Muscle</h4>
            <input type="text" className={styles.customFormInput} value={aiReviewData.name} onChange={e => setAiReviewData(prev => ({...prev, name: e.target.value}))} style={{ marginBottom: '0.5rem' }} />
            <input type="text" className={styles.customFormInput} value={aiReviewData.primaryMuscle} onChange={e => setAiReviewData(prev => ({...prev, primaryMuscle: e.target.value}))} />
          </div>
          <div className={styles.infoSection}>
            <h4 className={styles.infoSectionTitle}>Tags</h4>
            <input type="text" className={styles.customFormInput} value={aiReviewData.tags.join(', ')} onChange={e => setAiReviewData(prev => ({...prev, tags: e.target.value.split(',').map(t=>t.trim())}))} />
          </div>
          <div className={styles.infoSection}>
            <h4 className={styles.infoSectionTitle}>Instructions</h4>
            <textarea className={styles.customFormTextarea} rows={4} value={aiReviewData.instructions.join('\n')} onChange={e => setAiReviewData(prev => ({...prev, instructions: e.target.value.split('\n')}))} />
          </div>
          <div className={styles.infoSection}>
            <h4 className={styles.infoSectionTitle}>Hints</h4>
            <textarea className={styles.customFormTextarea} rows={3} value={aiReviewData.hints.join('\n')} onChange={e => setAiReviewData(prev => ({...prev, hints: e.target.value.split('\n')}))} />
          </div>
          <div className={styles.modalBtnGroup} style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <button className={styles.btnSecondary} style={{ width: '50%', color: 'var(--text-muted)' }} onClick={() => setAiReviewData(null)}>Discard</button>
            <button className={styles.btnPrimary} style={{ width: '50%' }} onClick={approveAIGeneration}>Approve & Publish</button>
          </div>
        </div>
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

  /** Find an exercise object by name from combined DB */
  const findExerciseByName = (name) => {
    if (!name) return null;
    const cleanName = name.trim().toLowerCase();
    const combined = [...globalExercises, ...customExercises];
    return combined.find(ex => ex.name.trim().toLowerCase() === cleanName) || null;
  };

  // ── FOLDER LOGIC ──────────────────────────────────────────────────────────
  const groupedByFolder = () => {
    const grouped = {};
    customFolders.forEach(folder => {
      grouped[folder] = [];
    });
    const ungrouped = [];
    templates.forEach(t => {
      const folder = t.folderName || null;
      if (folder) {
        if (!grouped[folder]) grouped[folder] = [];
        grouped[folder].push(t);
      } else {
        ungrouped.push(t);
      }
    });
    return { grouped, ungrouped };
  };

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const startRenameFolder = (folderName) => {
    setEditingFolder(folderName);
    setFolderNameInput(folderName);
  };

  const saveRenameFolder = async (oldName) => {
    const newName = folderNameInput.trim();
    if (!newName || newName === oldName) { setEditingFolder(null); return; }
    const toUpdate = templates.filter(t => t.folderName === oldName);
    for (const t of toUpdate) {
      await updateDoc(doc(db, "users", user.uid, "templates", t.id), { folderName: newName });
    }
    const updatedFolders = customFolders.map(f => f === oldName ? newName : f);
    setCustomFolders(updatedFolders);
    await setDoc(doc(db, "users", user.uid, "metadata", "folders"), { list: updatedFolders });
    setEditingFolder(null);
    fetchTemplates();
  };

  const createFolder = async () => {
    const name = window.prompt("Enter new folder/program name:");
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (customFolders.includes(trimmed)) { alert("Folder already exists."); return; }
    const updated = [...customFolders, trimmed];
    setCustomFolders(updated);
    await setDoc(doc(db, "users", user.uid, "metadata", "folders"), { list: updated });
  };

  const deleteFolder = async (folderName) => {
    if (!window.confirm(`Are you sure you want to delete "${folderName}"? Splits inside will be moved to Ungrouped.`)) return;
    const toUpdate = templates.filter(t => t.folderName === folderName);
    for (const t of toUpdate) {
      await updateDoc(doc(db, "users", user.uid, "templates", t.id), { folderName: null });
    }
    const updated = customFolders.filter(f => f !== folderName);
    setCustomFolders(updated);
    await setDoc(doc(db, "users", user.uid, "metadata", "folders"), { list: updated });
    fetchTemplates();
  };

  const moveToFolder = async (templateId) => {
    const folderName = window.prompt("Enter folder/program name (or leave empty to remove from folder):");
    if (folderName === null) return;
    const trimmed = folderName.trim() || null;
    await updateDoc(doc(db, "users", user.uid, "templates", templateId), { folderName: trimmed });
    if (trimmed && !customFolders.includes(trimmed)) {
      const updated = [...customFolders, trimmed];
      setCustomFolders(updated);
      await setDoc(doc(db, "users", user.uid, "metadata", "folders"), { list: updated });
    }
    fetchTemplates();
  };

  // Drag & Drop
  const handleDragStart = (e, templateId) => { e.dataTransfer.setData("text/plain", templateId); };
  const handleDragOver = (e, folderName) => { e.preventDefault(); setDraggingOverFolder(folderName); };
  const handleDragLeave = () => { setDraggingOverFolder(null); };
  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    setDraggingOverFolder(null);
    const templateId = e.dataTransfer.getData("text/plain");
    if (!templateId) return;
    await updateDoc(doc(db, "users", user.uid, "templates", templateId), { folderName: targetFolder });
    if (targetFolder && !customFolders.includes(targetFolder)) {
      const updated = [...customFolders, targetFolder];
      setCustomFolders(updated);
      await setDoc(doc(db, "users", user.uid, "metadata", "folders"), { list: updated });
    }
    fetchTemplates();
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm("Delete this split template?")) return;
    await deleteDoc(doc(db, "users", user.uid, "templates", templateId));
    fetchTemplates();
  };

  const parseRestTimeToSeconds = (str) => {
    if (!str) return 180;
    const val = String(str).toLowerCase().trim();
    if (val.endsWith('s')) return parseInt(val) || 180;
    if (val.endsWith('m') || val.endsWith('min')) return Math.round(parseFloat(val) * 60) || 180;
    return parseInt(val) || 180;
  };

  // ── WORKOUT SESSION LOGIC ─────────────────────────────────────────────────
  const confirmStartWorkout = (template) => {
    setPreviewSplit(template);
    setIsEditingSplit(false);
    setIsEditingSplitName(false);
    const exercisesCopy = (template.exercises || []).map(ex => {
      const setsVal = ex.sets !== undefined ? parseInt(ex.sets) || 2 : 2;
      const repsVal = ex.reps !== undefined ? String(ex.reps) : "5-12";
      const restVal = ex.restTime !== undefined ? String(ex.restTime) : "180s";
      return {
        name: ex.name,
        sets: setsVal,
        reps: repsVal,
        restTime: restVal,
        isSetsManual: !STANDARD_SETS.includes(setsVal),
        isRepsManual: !STANDARD_REPS.includes(repsVal),
        isRestManual: !STANDARD_REST.includes(restVal)
      };
    });
    setEditedSplit({ ...template, exercises: exercisesCopy });
  };

  const handleCancelEdit = () => {
    if (!previewSplit) return;
    const exercisesCopy = (previewSplit.exercises || []).map(ex => {
      const setsVal = ex.sets !== undefined ? parseInt(ex.sets) || 2 : 2;
      const repsVal = ex.reps !== undefined ? String(ex.reps) : "5-12";
      const restVal = ex.restTime !== undefined ? String(ex.restTime) : "180s";
      return {
        name: ex.name,
        sets: setsVal,
        reps: repsVal,
        restTime: restVal,
        isSetsManual: !STANDARD_SETS.includes(setsVal),
        isRepsManual: !STANDARD_REPS.includes(repsVal),
        isRestManual: !STANDARD_REST.includes(restVal)
      };
    });
    setEditedSplit({ ...previewSplit, exercises: exercisesCopy });
    setIsEditingSplit(false);
    setIsEditingSplitName(false);
  };

  const handleEditExerciseField = (index, field, value) => {
    setEditedSplit(prev => {
      const updatedEx = prev.exercises.map((ex, i) => i === index ? { ...ex, [field]: value } : ex);
      return { ...prev, exercises: updatedEx };
    });
  };

  const handleSetsDropdownChange = (index, val) => {
    setEditedSplit(prev => {
      const updatedEx = prev.exercises.map((ex, i) => {
        if (i !== index) return ex;
        if (val === 'manual') return { ...ex, isSetsManual: true };
        return { ...ex, isSetsManual: false, sets: parseInt(val) || 2 };
      });
      return { ...prev, exercises: updatedEx };
    });
  };

  const handleRepsDropdownChange = (index, val) => {
    setEditedSplit(prev => {
      const updatedEx = prev.exercises.map((ex, i) => {
        if (i !== index) return ex;
        if (val === 'manual') {
          const numericVal = parseInt(ex.reps) || 8;
          return { ...ex, isRepsManual: true, reps: String(numericVal) };
        }
        return { ...ex, isRepsManual: false, reps: val };
      });
      return { ...prev, exercises: updatedEx };
    });
  };

  const handleRestDropdownChange = (index, val) => {
    setEditedSplit(prev => {
      const updatedEx = prev.exercises.map((ex, i) => {
        if (i !== index) return ex;
        if (val === 'manual') return { ...ex, isRestManual: true };
        return { ...ex, isRestManual: false, restTime: val };
      });
      return { ...prev, exercises: updatedEx };
    });
  };

  const saveAndExit = async (template) => {
    if (template.id) {
      try {
        const cleanedExercises = (template.exercises || []).map(ex => ({
          name: ex.name,
          sets: parseInt(ex.sets) || 2,
          reps: String(ex.reps),
          restTime: String(ex.restTime)
        }));
        await updateDoc(doc(db, "users", user.uid, "templates", template.id), {
          splitName: template.splitName || "Workout Split",
          exercises: cleanedExercises
        });
        fetchTemplates();
      } catch (err) {
        console.error("Failed to save template edits to Firestore:", err);
      }
    }
    setPreviewSplit(null);
    setEditedSplit(null);
    setIsEditingSplitName(false);
  };

  const deleteTemplateFromModal = async (templateId) => {
    if (!window.confirm("Delete this split template?")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "templates", templateId));
      fetchTemplates();
    } catch (err) {
      console.error("Failed to delete template from Firestore:", err);
    }
    setPreviewSplit(null);
    setEditedSplit(null);
    setIsEditingSplitName(false);
  };

  const startWorkout = async (template) => {
    if (template.id) {
      try {
        const cleanedExercises = (template.exercises || []).map(ex => ({
          name: ex.name,
          sets: parseInt(ex.sets) || 2,
          reps: String(ex.reps),
          restTime: String(ex.restTime)
        }));
        await updateDoc(doc(db, "users", user.uid, "templates", template.id), {
          splitName: template.splitName || "Workout Split",
          exercises: cleanedExercises
        });
        fetchTemplates();
      } catch (err) {
        console.error("Failed to save template edits to Firestore:", err);
      }
    }

    const exercises = (template.exercises || []).map(ex => {
      const setsCount = parseInt(ex.sets) || 2;
      const initialSets = [];
      for (let i = 0; i < setsCount; i++) {
        initialSets.push({ type: 'normal', lbs: '', reps: '', completed: false });
      }
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: ex.name,
        sets: initialSets,
        restTime: ex.restTime || "180s",
        note: ''
      };
    });

    setActiveSession({ name: template.splitName || "Workout", exercises });
    setPreviewSplit(null);
    setEditedSplit(null);
    setIsEditingSplitName(false);
    setSessionStartTime(Date.now());
    setGlobalSeconds(0);
    setRestEndTime(null);
    setRestSeconds(0);
    setIsResting(false);
    setSessionNotes('');
    setShowSessionNotes(false);
    restRef.current = false;
  };

  const startEmptyWorkout = () => {
    setActiveSession({ name: "Custom Workout", exercises: [] });
    setSessionStartTime(Date.now());
    setGlobalSeconds(0);
    setRestEndTime(null);
    setRestSeconds(0);
    setIsResting(false);
    setSessionNotes('');
    setShowSessionNotes(false);
    restRef.current = false;
  };

  // ── EXERCISE SEARCH SHEET ─────────────────────────────────────────────────
  const openExerciseSearch = (context = 'session') => {
    setExerciseSearchContext(context);
    setExerciseSearchQuery('');
    setSelectedMuscleFilter('All');
    setShowAddCustomForm(false);
    setShowExerciseSearch(true);
  };

  /** Called when user taps an exercise in the search sheet during an ACTIVE session */
  const addExerciseFromSearch = (exercise) => {
    if (exerciseSearchContext === 'swap') {
      const newExercises = [...(editedSplit.exercises || [])];
      if (exerciseSwapIndex !== null && exerciseSwapIndex < newExercises.length) {
        newExercises[exerciseSwapIndex] = {
          ...newExercises[exerciseSwapIndex],
          name: exercise.name
        };
        setEditedSplit({ ...editedSplit, exercises: newExercises });
      }
      setExerciseSwapIndex(null);
    } else if (exerciseSearchContext === 'edit') {
      setEditedSplit(prev => ({
        ...prev,
        exercises: [
          ...(prev.exercises || []),
          {
            name: exercise.name,
            sets: 3,
            reps: "10",
            restTime: "120s"
          }
        ]
      }));
    } else {
      setActiveSession(prev => ({
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            id: Math.random().toString(36).substr(2, 9),
            name: exercise.name,
            sets: [
              { type: 'normal', lbs: '', reps: '', completed: false },
              { type: 'normal', lbs: '', reps: '', completed: false }
            ],
            restTime: '180s',
            note: ''
          }
        ]
      }));
    }
    setShowExerciseSearch(false);
    setExerciseSearchQuery('');
    setSelectedMuscleFilter('All');
  };

  // ── CUSTOM EXERCISE CREATION ──────────────────────────────────────────────

  const saveCustomExercise = async () => {
    const { name, primaryMuscle, instructions, hints } = customFormData;
    if (!name.trim()) { alert("Exercise name is required."); return; }

    const muscle = primaryMuscle.toLowerCase().replace(' ', '_');
    const tags = autoTagExercise(name, muscle);
    const id = slugify(name);

    const exerciseData = {
      id,
      name: name.trim(),
      primaryMuscle: muscle,
      tags,
      equipment: 'other',
      mediaUrl: null,
      instructions: instructions.split('\n').map(s => s.trim()).filter(Boolean),
      hints: hints.split('\n').map(s => s.trim()).filter(Boolean),
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'custom_exercises', id), exerciseData);
      await fetchCustomExercises();
      setCustomFormData({ name: '', primaryMuscle: 'chest', instructions: '', hints: '' });
      setShowAddCustomForm(false);
    } catch (err) {
      console.error("Failed to save custom exercise:", err);
      alert("Failed to save. Please try again.");
    }
  };

  const generateGlobalExerciseAI = async () => {
    const { name } = customFormData;
    if (!name.trim()) { alert("Exercise name is required."); return; }
    
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      
      setAiReviewData({
        name: name.trim(),
        primaryMuscle: data.primaryMuscle || 'chest',
        tags: data.tags || [],
        instructions: data.instructions || [],
        hints: data.hints || []
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const approveAIGeneration = async () => {
    if (!aiReviewData) return;
    const id = slugify(aiReviewData.name);
    const exerciseData = {
      id,
      ...aiReviewData,
      equipment: 'other',
      mediaUrl: null,
      isCustom: false,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'exercises', id), exerciseData);
      await fetchGlobalExercises();
      setAiReviewData(null);
      setCustomFormData({ name: '', primaryMuscle: 'chest', instructions: '', hints: '' });
      setShowAddCustomForm(false);
      alert("Successfully published to global database!");
    } catch (err) {
      console.error(err);
      alert("Failed to publish.");
    }
  };

  // ── SET / EXERCISE ACTIONS ────────────────────────────────────────────────

  const addSet = (exerciseId, type) => {
    setActiveSession(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : { lbs: '', reps: '' };
        const newSet = { type, lbs: type === 'drop' ? '' : lastSet.lbs, reps: lastSet.reps, completed: false };
        if (type === 'drop') {
          let insertIdx = -1;
          for (let i = ex.sets.length - 1; i >= 0; i--) {
            if (ex.sets[i].completed) { insertIdx = i; break; }
          }
          if (insertIdx === -1) insertIdx = ex.sets.length > 0 ? 0 : -1;
          if (insertIdx === -1) return { ...ex, sets: [newSet] };
          const newSets = [...ex.sets];
          newSets.splice(insertIdx + 1, 0, newSet);
          return { ...ex, sets: newSets };
        }
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    }));
  };

  const removeSet = (exerciseId, setIndex) => {
    setActiveSession(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) };
      })
    }));
  };

  const updateSet = (exerciseId, setIndex, field, value) => {
    setActiveSession(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const newSets = ex.sets.map((s, i) => i === setIndex ? { ...s, [field]: value } : s);
        return { ...ex, sets: newSets };
      })
    }));
  };

  const toggleSetComplete = (exerciseId, setIndex) => {
    setActiveSession(prev => {
      const newExercises = prev.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const newSets = ex.sets.map((s, i) => {
          if (i !== setIndex) return s;
          const nowCompleted = !s.completed;
          if (nowCompleted) {
            const seconds = parseRestTimeToSeconds(ex.restTime);
            setRestEndTime(Date.now() + seconds * 1000);
            setRestSeconds(seconds);
            setTotalRestSeconds(seconds);
            setIsResting(true);
            setRestingExerciseId(exerciseId);
            restRef.current = true;
          }
          return { ...s, completed: nowCompleted };
        });
        return { ...ex, sets: newSets };
      });
      return { ...prev, exercises: newExercises };
    });
  };

  const removeExercise = (exerciseId) => {
    if (!window.confirm("Remove this exercise?")) return;
    setActiveSession(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
    }));
  };

  const updateExerciseNote = (exerciseId, note) => {
    setActiveSession(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, note } : ex
      )
    }));
  };

  const toggleExerciseNoteVisible = (exerciseId) => {
    setActiveSession(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, showNote: !ex.showNote } : ex
      )
    }));
  };

  const finishWorkout = async () => {
    if (!window.confirm("Finish and save workout?")) return;

    let totalVolume = 0;
    activeSession.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed && s.lbs && s.reps) {
          totalVolume += parseFloat(s.lbs) * parseInt(s.reps);
        }
      });
    });

    const sessionData = {
      name: activeSession.name,
      durationSeconds: globalSeconds,
      totalVolume,
      exercises: activeSession.exercises,
      notes: sessionNotes,
      createdAt: new Date().toISOString()
    };

    try {
      const newSessionRef = doc(collection(db, "users", user.uid, "history"));
      await setDoc(newSessionRef, sessionData);
      alert(`Workout saved! Total Volume: ${totalVolume.toLocaleString()} lbs. Time: ${formatTime(globalSeconds)}`);
      setActiveSession(null);
      setIsResting(false);
      setGlobalSeconds(0);
      setRestSeconds(0);
      setSessionNotes('');
      setShowSessionNotes(false);
      localStorage.removeItem(`workoutDraft_${user.uid}`);
    } catch (err) {
      console.error(err);
      alert("Failed to save workout.");
    }
  };

  // ── REST DAY LOGGER ───────────────────────────────────────────────────────

  const saveRestDay = async () => {
    try {
      const newRef = doc(collection(db, 'users', user.uid, 'history'));
      await setDoc(newRef, {
        name: 'Rest & Active Recovery',
        isRestDay: true,
        notes: restDayNotes,
        durationSeconds: 0,
        totalVolume: 0,
        exercises: [],
        createdAt: new Date().toISOString()
      });
      setRestDaySaved(true);
      setTimeout(() => {
        setShowRestDaySheet(false);
        setRestDaySaved(false);
        setRestDayNotes('');
      }, 1500);
    } catch (err) {
      console.error("Failed to save rest day:", err);
      alert("Failed to save. Please try again.");
    }
  };

  if (loading || !user) return null;

  // ── SHARED OVERLAYS (rendered at root level so they can appear in any screen) ──
  // Curated premium fitness images based on muscle group
  const getMusclePlaceholderImage = (muscle) => {
    const m = String(muscle || '').toLowerCase().replace('_', '');
    if (m.includes('bicep') || m.includes('tricep') || m.includes('arm')) {
      return 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80'; // Arm workout
    }
    if (m.includes('chest') || m.includes('push')) {
      return 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80'; // Chest workout / Pushups
    }
    if (m.includes('lat') || m.includes('back') || m.includes('pull') || m.includes('trap')) {
      return 'https://images.unsplash.com/photo-1603387124445-c49b88a8dcc5?auto=format&fit=crop&w=600&q=80'; // Lat pull down / Cable Row
    }
    if (m.includes('shoulder')) {
      return 'https://images.unsplash.com/photo-1532029837906-834eb7495547?auto=format&fit=crop&w=600&q=80'; // Shoulders / DB lift
    }
    if (m.includes('abs') || m.includes('core') || m.includes('waist')) {
      return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'; // Core planking
    }
    if (m.includes('quad') || m.includes('leg') || m.includes('hamstring') || m.includes('calf') || m.includes('glute')) {
      return 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=600&q=80'; // Legs Squat
    }
    return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80';
  };

  const renderExerciseInfoModal = () => {
    if (!exerciseInfoModal) return null;
    const ex = exerciseInfoModal;
    const placeholderImg = getMusclePlaceholderImage(ex.primaryMuscle);

    const content = (
      <div className={styles.infoModal} onClick={() => setExerciseInfoModal(null)}>
        <div className={styles.infoPanel} onClick={e => e.stopPropagation()}>
          <div className={styles.infoPanelHeader}>
            <div>
              <h2 className={styles.infoPanelTitle}>{ex.name}</h2>
              <span className={styles.muscleBadge}>{ex.primaryMuscle?.replace('_', ' ')}</span>
            </div>
            <button className={styles.infoBtn} onClick={() => setExerciseInfoModal(null)}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.infoMediaContainer} style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', height: '220px', marginBottom: '1.25rem' }}>
            <img 
              src={ex.mediaUrl || placeholderImg} 
              alt={ex.name} 
              className={styles.infoMediaImage}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            />
            {!ex.mediaUrl && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))',
                padding: '1rem',
                color: 'white',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Dumbbell size={16} style={{ color: 'var(--neon-pink)' }} />
                <span>Standard visual preview loaded</span>
              </div>
            )}
          </div>

          {ex.instructions && ex.instructions.length > 0 && (
            <div className={styles.infoSection}>
              <h4 className={styles.infoSectionTitle}>How to Perform</h4>
              {ex.instructions.map((step, i) => (
                <div key={i} className={styles.infoStep}>
                  <span className={styles.infoStepNum}>{i + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          {ex.hints && ex.hints.length > 0 && (
            <div className={styles.infoSection}>
              <h4 className={styles.infoSectionTitle}>Pro Tips</h4>
              {ex.hints.map((hint, i) => (
                <div key={i} className={styles.hintItem}>
                  {hint}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );

    if (typeof window !== 'undefined') {
      return createPortal(content, document.body);
    }
    return content;
  };

  const renderExerciseSearchSheet = (mode) => {
    // mode: 'session' (can add) or 'preview' (info only)
    if (!showExerciseSearch) return null;
    const results = searchExercises(exerciseSearchQuery, selectedMuscleFilter, globalExercises, customExercises);
    const muscleOptions = MUSCLE_GROUPS;

    const content = (
      <div className={styles.searchSheet} onClick={() => setShowExerciseSearch(false)}>
        <div className={styles.searchPanel} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.searchHeader}>
            <h3 className={styles.searchTitle}>
              {exerciseSearchMode === 'visual' ? 'Choose Muscle' : (
                selectedMuscleFilter !== 'All' ? `${selectedMuscleFilter} Exercises` : 'Choose Exercise'
              )}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Persistent view toggle — only show if user has visual map enabled */}
              {userData?.useVisualMap !== false && (
                <button
                  className={styles.btnSecondary}
                  style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  onClick={() => setExerciseSearchMode(prev => prev === 'visual' ? 'list' : 'visual')}
                >
                  {exerciseSearchMode === 'visual' ? 'List View' : 'Visual Map'}
                </button>
              )}
              <button className={styles.infoBtn} onClick={() => setShowExerciseSearch(false)}>
                <X size={22} />
              </button>
            </div>
          </div>

          {/* === VISUAL MAP VIEW === */}
          {exerciseSearchMode === 'visual' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                Tap a muscle group to browse exercises
              </p>
              <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ flex: 1, maxWidth: '48%' }}>
                  <MuscleSelector
                    mode="interactive"
                    gender={userData?.gender || 'male'}
                    side="front"
                    selectedMuscle={selectedMuscleFilter !== 'All' ? selectedMuscleFilter.toLowerCase() : null}
                    onSelectMuscle={(muscleId) => {
                      const match = MUSCLE_GROUPS.find(m => m.toLowerCase().replace(' ', '_') === muscleId);
                      if (match) {
                        setSelectedMuscleFilter(match);
                        setExerciseSearchMode('list');
                      }
                    }}
                  />
                </div>
                <div style={{ flex: 1, maxWidth: '48%' }}>
                  <MuscleSelector
                    mode="interactive"
                    gender={userData?.gender || 'male'}
                    side="back"
                    selectedMuscle={selectedMuscleFilter !== 'All' ? selectedMuscleFilter.toLowerCase() : null}
                    onSelectMuscle={(muscleId) => {
                      const match = MUSCLE_GROUPS.find(m => m.toLowerCase().replace(' ', '_') === muscleId);
                      if (match) {
                        setSelectedMuscleFilter(match);
                        setExerciseSearchMode('list');
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* === LIST VIEW === */
            <>
              {/* Search input */}
              <div className={styles.searchInputWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  type="text"
                  placeholder="Search exercises..."
                  value={exerciseSearchQuery}
                  onChange={e => setExerciseSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Muscle filter pills — always show in list view */}
              <div className={styles.musclePillRow}>
                {muscleOptions.map(muscle => (
                  <button
                    key={muscle}
                    className={`${styles.musclePill} ${selectedMuscleFilter === muscle ? styles.musclePillActive : ''}`}
                    onClick={() => setSelectedMuscleFilter(muscle)}
                  >
                    {muscle}
                  </button>
                ))}
              </div>

              {/* Exercise list */}
              <div className={styles.exerciseList}>
                {results.length === 0 && (
                  <p className={styles.noResults}>No exercises found.</p>
                )}
                {results.map(ex => (
                  <div
                    key={ex.id || ex.name}
                    className={styles.exerciseItem}
                    onClick={() => mode === 'session' && addExerciseFromSearch(ex)}
                    style={{ cursor: mode === 'session' ? 'pointer' : 'default' }}
                  >
                    <div className={styles.exerciseItemInfo}>
                      <span className={styles.exerciseItemName}>{ex.name}</span>
                      <div className={styles.exerciseItemMeta}>
                        <span className={styles.muscleBadge}>{ex.primaryMuscle?.replace('_', ' ')}</span>
                        {ex.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className={styles.tagPill}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      className={styles.infoBtn}
                      title="Exercise guide"
                      onClick={e => { e.stopPropagation(); setExerciseInfoModal(ex); }}
                    >
                      <HelpCircle size={18} />
                    </button>
                  </div>
                ))}

                {/* Create Custom Exercise card */}
                <div className={styles.addCustomCard}>
                  <button
                    className={styles.addCustomToggle}
                    onClick={() => setShowAddCustomForm(prev => !prev)}
                  >
                    <Plus size={18} />
                    Create Custom Exercise
                    <ChevronDown size={16} style={{ transform: showAddCustomForm ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {showAddCustomForm && (
                    <div className={styles.customForm}>
                      <input
                        className={styles.customFormInput}
                        type="text"
                        placeholder="Exercise name *"
                        value={customFormData.name}
                        onChange={e => setCustomFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <select
                        className={styles.customFormSelect}
                        value={customFormData.primaryMuscle}
                        onChange={e => setCustomFormData(prev => ({ ...prev, primaryMuscle: e.target.value }))}
                      >
                        {MUSCLE_GROUPS.filter(m => m !== 'All').map(m => (
                          <option key={m} value={m.toLowerCase().replace(' ', '_')}>{m}</option>
                        ))}
                      </select>
                      <textarea
                        className={styles.customFormTextarea}
                        placeholder={"Instructions (one per line)\nStep 1...\nStep 2..."}
                        rows={4}
                        value={customFormData.instructions}
                        onChange={e => setCustomFormData(prev => ({ ...prev, instructions: e.target.value }))}
                      />
                      <textarea
                        className={styles.customFormTextarea}
                        placeholder={"Pro tips / hints (one per line)\nTip 1...\nTip 2..."}
                        rows={3}
                        value={customFormData.hints}
                        onChange={e => setCustomFormData(prev => ({ ...prev, hints: e.target.value }))}
                      />
                      <button className={styles.btnPrimary} onClick={saveCustomExercise} style={{ width: '100%' }}>
                        <Check size={16} /> Save Personal Exercise
                      </button>
                      {userData?.isAdmin && (
                        <button
                          className={styles.btnSecondary}
                          onClick={generateGlobalExerciseAI}
                          disabled={isGeneratingAI}
                          style={{ marginTop: '0.5rem', width: '100%', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }}
                        >
                          {isGeneratingAI ? "Generating..." : "✨ Generate via AI & Publish Globally"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );

    if (typeof window !== 'undefined') {
      return createPortal(content, document.body);
    }
    return content;
  };

  const renderRestDaySheet = () => {
    if (!showRestDaySheet) return null;
    return (
      <div className={styles.restDaySheet} onClick={() => setShowRestDaySheet(false)}>
        <div className={styles.restDayPanel} onClick={e => e.stopPropagation()}>
          <div className={styles.searchHeader}>
            <h3 className={styles.searchTitle}>Log Active Recovery</h3>
            <button className={styles.infoBtn} onClick={() => setShowRestDaySheet(false)}>
              <X size={22} />
            </button>
          </div>
          <p className={styles.subtitle} style={{ marginBottom: '1rem' }}>
            Record how your body is feeling today.
          </p>
          <textarea
            className={styles.restDayTextarea}
            placeholder="How does your body feel? Any soreness, stretching done, walks taken?"
            rows={5}
            value={restDayNotes}
            onChange={e => setRestDayNotes(e.target.value)}
          />
          {restDaySaved ? (
            <div className={styles.savedBanner}>
              <Check size={18} /> Rest day logged!
            </div>
          ) : (
            <button className={styles.btnPrimary} onClick={saveRestDay} style={{ marginTop: '0.75rem' }}>
              <Check size={18} /> Save Rest Day
            </button>
          )}
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  // CONFIRMATION MODAL
  // ════════════════════════════════════════════════════════════════════════════
  if (previewSplit && editedSplit) {
    return (
      <div className={styles.container}>
        {renderExerciseSearchSheet('session')}
        {renderAIReviewModal()}

        <div className={styles.modal}>
          {/* Header */}
          <div className={styles.modalHeader}>
            {isEditingSplit ? (
              isEditingSplitName ? (
                <input
                  type="text"
                  className={styles.modalTitleInput}
                  value={editedSplit.splitName || ""}
                  onChange={e => setEditedSplit(prev => ({ ...prev, splitName: e.target.value }))}
                  onBlur={() => setIsEditingSplitName(false)}
                  onKeyDown={e => e.key === 'Enter' && setIsEditingSplitName(false)}
                  autoFocus
                />
              ) : (
                <div className={styles.modalTitleRow}>
                  <h2 className={styles.title}>{editedSplit.splitName || "Workout Split"}</h2>
                  <button className={styles.pencilBtn} onClick={() => setIsEditingSplitName(true)} title="Rename Split">
                    <Edit3 size={18} />
                  </button>
                </div>
              )
            ) : (
              <div className={styles.modalTitleRow}>
                <h2 className={styles.title}>{editedSplit.splitName || "Workout Split"}</h2>
                <button className={styles.pencilBtn} onClick={() => { setIsEditingSplit(true); setIsEditingSplitName(true); }} title="Modify Split Parameters">
                  <Edit3 size={18} />
                </button>
              </div>
            )}
            <div className={styles.modalHeaderButtons}>
              {isEditingSplit && (
                <button className={styles.modalHeaderDeleteBtn} onClick={() => deleteTemplateFromModal(editedSplit.id)} title="Delete Split">
                  <Trash2 size={20} />
                </button>
              )}
              <button className={styles.removeExercise} onClick={() => { setPreviewSplit(null); setEditedSplit(null); setIsEditingSplit(false); setIsEditingSplitName(false); }} title="Close">
                <X size={24} />
              </button>
            </div>
          </div>

          <p className={styles.subtitle} style={{ marginBottom: '1.5rem' }}>
            {isEditingSplit
              ? "Modify your split parameters below. Changes are saved back to your template."
              : "Overview of your workout split exercises and targets."}
          </p>

          {/* Exercise List */}
          <div className={styles.previewList}>
            {(editedSplit.exercises || []).map((ex, i) => (
              <div 
                key={i} 
                className={isEditingSplit ? styles.previewItemEdit : styles.previewItem}
                draggable={isEditingSplit}
                onDragStart={(e) => {
                  setDraggedExerciseIndex(i);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedExerciseIndex === null || draggedExerciseIndex === i) return;
                  const newExercises = [...editedSplit.exercises];
                  const [movedExercise] = newExercises.splice(draggedExerciseIndex, 1);
                  newExercises.splice(i, 0, movedExercise);
                  setEditedSplit({ ...editedSplit, exercises: newExercises });
                  setDraggedExerciseIndex(null);
                }}
                onDragEnd={() => setDraggedExerciseIndex(null)}
                style={{ 
                  cursor: isEditingSplit ? 'grab' : 'default', 
                  opacity: draggedExerciseIndex === i ? 0.5 : 1 
                }}
              >
                <div className={styles.previewItemHeader}>
                  <span className={styles.previewNum}>{i + 1}</span>
                  {isEditingSplit ? (
                    <div className={styles.previewNameRow} style={{ flex: 1, justifyContent: 'space-between' }}>
                      <span className={styles.previewName}>{ex.name}</span>
                      <button
                        className={styles.infoIconBtn}
                        title="Swap Exercise"
                        onClick={() => {
                          setExerciseSwapIndex(i);
                          setExerciseSearchContext('swap');
                          setExerciseSearchQuery('');
                          setSelectedMuscleFilter('All');
                          setShowAddCustomForm(false);
                          setShowExerciseSearch(true);
                        }}
                      >
                        <RefreshCw size={15} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                      <div className={styles.previewNameRow}>
                        <span className={styles.previewName}>{ex.name}</span>
                        <button
                          className={styles.infoIconBtn}
                          title="Exercise guide"
                          onClick={() => {
                            const found = findExerciseByName(ex.name);
                            if (found) setExerciseInfoModal(found);
                          }}
                        >
                          <HelpCircle size={15} />
                        </button>
                      </div>
                      <span className={styles.previewMeta}>
                        {ex.sets} sets • {ex.reps} reps • {parseFloat(ex.restTime) / 60 >= 1 ? `${parseFloat(ex.restTime) / 60} min` : ex.restTime} rest
                      </span>
                    </div>
                  )}
                </div>

                {isEditingSplit && (
                  <div className={styles.previewEditRow}>
                    {/* Sets */}
                    <div className={styles.editField}>
                      <label className={styles.fieldLabel}>Sets</label>
                      <select
                        className={styles.modalSelect}
                        value={ex.isSetsManual ? "manual" : ex.sets}
                        onChange={e => handleSetsDropdownChange(i, e.target.value)}
                      >
                        {STANDARD_SETS.map(val => <option key={val} value={val}>{val}</option>)}
                        <option value="manual">Manual</option>
                      </select>
                      {ex.isSetsManual && (
                        <input
                          type="number" min="1" max="30"
                          className={styles.modalInputManual}
                          value={ex.sets}
                          onChange={e => handleEditExerciseField(i, 'sets', parseInt(e.target.value) || 1)}
                          placeholder="Sets"
                        />
                      )}
                    </div>

                    {/* Reps */}
                    <div className={styles.editField}>
                      <label className={styles.fieldLabel}>Reps</label>
                      <select
                        className={styles.modalSelect}
                        value={ex.isRepsManual ? "manual" : ex.reps}
                        onChange={e => handleRepsDropdownChange(i, e.target.value)}
                      >
                        {STANDARD_REPS.map(val => <option key={val} value={val}>{val}</option>)}
                        <option value="manual">Manual</option>
                      </select>
                      {ex.isRepsManual && (
                        <input
                          type="number" min="1"
                          className={styles.modalInputManual}
                          value={parseInt(ex.reps) || ""}
                          onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); handleEditExerciseField(i, 'reps', val); }}
                          placeholder="Reps"
                        />
                      )}
                    </div>

                    {/* Rest */}
                    <div className={styles.editField}>
                      <label className={styles.fieldLabel}>Rest</label>
                      <select
                        className={styles.modalSelect}
                        value={ex.isRestManual ? "manual" : ex.restTime}
                        onChange={e => handleRestDropdownChange(i, e.target.value)}
                      >
                        {STANDARD_REST.map(val => {
                          const min = parseFloat(val) / 60;
                          return <option key={val} value={val}>{min >= 1 ? `${min} min` : val}</option>;
                        })}
                        <option value="manual">Manual</option>
                      </select>
                      {ex.isRestManual && (
                        <input
                          type="number" min="1"
                          className={styles.modalInputManual}
                          value={parseInt(ex.restTime) || 180}
                          onChange={e => { const val = parseInt(e.target.value) || 0; handleEditExerciseField(i, 'restTime', `${val}s`); }}
                          placeholder="Seconds"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isEditingSplit && (
              <button 
                className={styles.btnSecondary} 
                onClick={() => {
                  setExerciseSearchContext('edit');
                  setExerciseSearchQuery('');
                  setSelectedMuscleFilter('All');
                  setShowAddCustomForm(false);
                  setShowExerciseSearch(true);
                }}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                <Plus size={20} /> Add Exercise to Template
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className={styles.modalActionsRow} style={{ marginTop: '2.5rem' }}>
            {isEditingSplit ? (
              <>
                <div></div>
                <div className={styles.modalBtnGroup}>
                  <button className={styles.btnCancel} onClick={handleCancelEdit} title="Cancel changes">Cancel</button>
                  <button className={styles.btnSecondary} onClick={() => saveAndExit(editedSplit)} title="Save changes and exit" style={{ width: 'auto', padding: '0.75rem 1.25rem' }}>
                    Save &amp; Exit
                  </button>
                  <button className={styles.btnPrimary} onClick={() => startWorkout(editedSplit)} title="Save and start" style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                    <Play size={18} /> Save &amp; Start
                  </button>
                </div>
              </>
            ) : (
              <>
                <div></div>
                <div className={styles.modalBtnGroup}>
                  <button className={styles.btnCancel} onClick={() => { setPreviewSplit(null); setEditedSplit(null); }}>Exit</button>
                  <button className={styles.btnPrimary} onClick={() => startWorkout(previewSplit)} title="Start workout session" style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                    <Play size={18} /> Start Session
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SELECTION SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (!activeSession) {
    const { grouped, ungrouped } = groupedByFolder();

    return (
      <div className={styles.container}>
        {renderExerciseSearchSheet('session')}
        {renderRestDaySheet()}
        {renderAIReviewModal()}

        <header className={styles.header}>
          <h1 className={styles.title}>Start Workout</h1>
          <p className={styles.subtitle}>Select a split or start from scratch.</p>
        </header>

        <div className={styles.actionRow}>
          <button className={styles.btnPrimary} onClick={startEmptyWorkout} style={{ flex: 1 }}>
            <Plus size={18} /> Custom Workout
          </button>
          <button className={styles.btnSecondary} onClick={createFolder} style={{ flex: 1, padding: '0.75rem' }}>
            <Plus size={18} /> Create Folder
          </button>
        </div>

        {/* Rest Day Logger button */}
        <button
          className={styles.logRestDayBtn}
          onClick={() => { setRestDayNotes(''); setRestDaySaved(false); setShowRestDaySheet(true); }}
        >
          Log Rest Day
        </button>

        {/* Folder groups */}
        {Object.keys(grouped).map(folderName => (
          <div
            key={folderName}
            className={`${styles.folderBlock} ${draggingOverFolder === folderName ? styles.dragOver : ''}`}
            onDragOver={e => handleDragOver(e, folderName)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, folderName)}
          >
            <div className={styles.folderHeader} onClick={() => toggleFolder(folderName)}>
              <div className={styles.folderTitleRow}>
                {expandedFolders[folderName] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <FolderOpen size={18} className={styles.folderIcon} />
                {editingFolder === folderName ? (
                  <input
                    className={styles.folderInput}
                    value={folderNameInput}
                    onChange={e => setFolderNameInput(e.target.value)}
                    onBlur={() => saveRenameFolder(folderName)}
                    onKeyDown={e => e.key === 'Enter' && saveRenameFolder(folderName)}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className={styles.folderName}>
                    {folderName} ({grouped[folderName]?.length || 0})
                  </span>
                )}
              </div>
              <div className={styles.folderActions} onClick={e => e.stopPropagation()}>
                <button className={styles.folderEditBtn} onClick={() => startRenameFolder(folderName)} title="Rename Folder">
                  <Edit3 size={16} />
                </button>
                <button className={styles.folderDeleteBtn} onClick={() => deleteFolder(folderName)} title="Delete Folder">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {expandedFolders[folderName] && (
              <div className={styles.folderContent}>
                {grouped[folderName].length === 0 ? (
                  <div className={styles.emptyFolderPlaceholder}>Empty Folder. Drag splits here!</div>
                ) : (
                  grouped[folderName].map(t => (
                    <div
                      key={t.id}
                      className={styles.card}
                      draggable
                      onDragStart={e => handleDragStart(e, t.id)}
                      onClick={() => confirmStartWorkout(t)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.cardMain}>
                        <h3 className={styles.cardTitle}>{t.splitName || "Workout Split"}</h3>
                        <p className={styles.cardDetails}>{t.exercises?.length || 0} exercises</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        {/* Ungrouped splits */}
        <div
          className={`${styles.ungroupedSection} ${draggingOverFolder === 'ungrouped' ? styles.dragOver : ''}`}
          onDragOver={e => handleDragOver(e, 'ungrouped')}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, null)}
        >
          <h2 className={styles.sectionTitle}>Ungrouped Splits</h2>
          {ungrouped.length === 0 ? (
            <div className={styles.emptyDragZone}>Drag splits here to remove from folders</div>
          ) : (
            <div className={styles.grid}>
              {ungrouped.map(t => (
                <div
                  key={t.id}
                  className={styles.card}
                  draggable
                  onDragStart={e => handleDragStart(e, t.id)}
                  onClick={() => confirmStartWorkout(t)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.cardMain}>
                    <h3 className={styles.cardTitle}>{t.splitName || "Workout Split"}</h3>
                    <p className={styles.cardDetails}>{t.exercises?.length || 0} exercises</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ACTIVE WORKOUT SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className={styles.container}>
      {renderExerciseSearchSheet('session')}

      {/* Sticky header */}
      <div className={styles.activeHeader}>
        <div className={styles.timerGroup}>
          <div className={styles.globalTimer}>{formatTime(globalSeconds)}</div>
          <div className={`${styles.restTimer} ${isResting ? styles.active : ''}`}>
            <Timer size={16} />
            Rest: {isResting ? formatTime(restSeconds) : "00:00"}
          </div>
        </div>
        <button
          className={styles.btnSecondary}
          style={{ padding: '0.5rem 1rem', width: 'auto' }}
          onClick={() => { if (window.confirm("Cancel workout? Progress will be lost.")) { setActiveSession(null); setIsResting(false); } }}
        >
          Cancel
        </button>
      </div>

      <h1 className={styles.title} style={{ marginBottom: '0.5rem' }}>{activeSession.name}</h1>

      {/* Session Notes toggle */}
      <div className={styles.sessionNotesContainer}>
        <button
          className={styles.noteToggleBtn}
          onClick={() => setShowSessionNotes(prev => !prev)}
        >
          <MessageSquare size={15} />
          Session Notes
          <ChevronDown size={14} style={{ transform: showSessionNotes ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {showSessionNotes && (
          <textarea
            className={styles.sessionNotesTextarea}
            placeholder="Add notes about this session, how you felt, PRs, etc."
            rows={3}
            value={sessionNotes}
            onChange={e => setSessionNotes(e.target.value)}
          />
        )}
      </div>

      {/* Exercise blocks */}
      {activeSession.exercises.map(ex => (
        <div key={ex.id} className={styles.exerciseBlock}>
          <div className={styles.exerciseHeader}>
            <div className={styles.exerciseNameRow}>
              <h3 className={styles.exerciseName}>{ex.name}</h3>
              <button
                className={styles.infoIconBtn}
                title="Exercise guide"
                onClick={() => {
                  let found = findExerciseByName(ex.name);
                  if (!found) {
                    found = { name: ex.name, primaryMuscle: 'general', instructions: ["No standard instructions found for this exercise."], hints: [] };
                  }
                  setExerciseInfoModal(found);
                }}
              >
                <HelpCircle size={15} />
              </button>
            </div>
            <button className={styles.removeExercise} onClick={() => removeExercise(ex.id)}>
              <X size={20} />
            </button>
          </div>

          <table className={styles.setTable}>
            <thead>
              <tr>
                <th style={{ width: '75px' }}>Set</th>
                <th>lbs</th>
                <th>Reps</th>
                <th style={{ width: '50px', textAlign: 'center' }}><Check size={16} /></th>
                <th style={{ width: '40px', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let normalSetCount = 0;
                return ex.sets.map((set, setIdx) => {
                  if (set.type !== 'drop') normalSetCount++;
                  const label = set.type === 'drop' ? 'D' : normalSetCount;
                  return (
                    <tr key={setIdx} className={`${styles.setRow} ${set.type === 'drop' ? styles.dropRow : ''} ${set.completed ? styles.completed : ''}`}>
                      <td>
                        <div className={`${styles.setLabel} ${set.type === 'drop' ? styles.drop : ''}`}>{label}</div>
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.inputSmall}
                          value={set.lbs}
                          onChange={e => updateSet(ex.id, setIdx, 'lbs', e.target.value)}
                          placeholder="-"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.inputSmall}
                          value={set.reps}
                          onChange={e => updateSet(ex.id, setIdx, 'reps', e.target.value)}
                          placeholder="-"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className={`${styles.checkBtn} ${set.completed ? styles.completed : ''}`}
                          onClick={() => toggleSetComplete(ex.id, setIdx)}
                        >
                          <Check size={20} />
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className={styles.btnDeleteSet} onClick={() => removeSet(ex.id, setIdx)} title="Delete Set">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>

          <div className={styles.addSetRow}>
            <button className={styles.btnAddSet} onClick={() => addSet(ex.id, 'normal')}>+ Set</button>
            <button className={styles.btnAddSet} onClick={() => addSet(ex.id, 'drop')}>+ Drop</button>
          </div>

          {/* Per-exercise note */}
          <div className={styles.exerciseNoteRow}>
            <button
              className={styles.noteToggleBtn}
              onClick={() => toggleExerciseNoteVisible(ex.id)}
            >
              <MessageSquare size={14} />
              {ex.showNote ? 'Hide Note' : 'Add Note'}
            </button>
            {ex.showNote && (
              <textarea
                className={styles.exerciseNoteTextarea}
                placeholder="Notes for this exercise (form cues, weight targets, etc.)"
                rows={2}
                value={ex.note || ''}
                onChange={e => updateExerciseNote(ex.id, e.target.value)}
              />
            )}
          </div>

          {/* Rest timer widget */}
          {isResting && restingExerciseId === ex.id && (
            <div className={styles.exerciseRestContainer}>
              <div className={styles.clockCircleContainer}>
                <svg className={styles.clockSvg} viewBox="0 0 36 36">
                  <circle className={styles.clockBg} cx="18" cy="18" r="16" />
                  <circle
                    className={styles.clockFill}
                    cx="18" cy="18" r="16"
                    strokeDasharray="100"
                    strokeDashoffset={100 - (restSeconds / totalRestSeconds) * 100}
                  />
                </svg>
                <div className={styles.clockTimeCenter}>
                  <span className={styles.clockTimeText}>{formatTime(restSeconds)}</span>
                  <span className={styles.clockSubText}>rest</span>
                </div>
              </div>
              <div className={styles.clockInfoCol}>
                <h4 className={styles.clockInfoTitle}>Resting</h4>
                <p className={styles.clockInfoSub}>Prepare for the next set</p>
              </div>
              <button
                className={styles.skipRestBtn}
                onClick={() => { setIsResting(false); setRestingExerciseId(null); }}
                title="Skip Rest"
              >
                Skip Rest
              </button>
            </div>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className={styles.btnSecondary} onClick={openExerciseSearch} style={{ flex: 1 }}>
          <Plus size={20} /> Add Exercise
        </button>
        <button 
          className={styles.btnDanger} 
          onClick={() => {
            if (window.confirm("Are you sure you want to cancel this workout? All progress will be lost.")) {
              setActiveSession(null);
              setSessionStartTime(null);
              setIsResting(false);
              setRestEndTime(null);
              setRestingExerciseId(null);
              setSessionNotes('');
              localStorage.removeItem(`workoutDraft_${user.uid}`);
            }
          }} 
          style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', borderRadius: 'var(--radius-md)' }}
        >
          Cancel Workout
        </button>
      </div>

      <button className={`${styles.btnPrimary} ${styles.finishBtn}`} onClick={finishWorkout}>
        Finish Workout
      </button>

      {/* Render Info Modal exactly once at the root to avoid CSS transform positioning bugs */}
      {renderExerciseInfoModal()}
    </div>
  );
}
