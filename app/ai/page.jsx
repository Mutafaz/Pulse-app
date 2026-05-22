"use client";

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, collection, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import styles from './page.module.css';

export default function AIPlanPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  if (authLoading) return null;

  // Require full onboarding
  if ((!user || !userData) && typeof window !== "undefined") {
    router.push(user ? '/onboarding' : '/auth');
    return null;
  }

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutText: inputText, userId: user.uid })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      const programName = data.plan.programName || "My Program";
      const splits = data.plan.splits || data.plan; // fallback if old format
      
      // Save each split template to Firestore with the folder name
      for (const split of splits) {
        const newTemplateRef = doc(collection(db, "users", user.uid, "templates"));
        await setDoc(newTemplateRef, {
          ...split,
          folderName: programName,
          createdAt: new Date().toISOString()
        });
      }
      
      setResult(`Saved ${splits.length} splits to "${programName}"!`);
      setInputText('');
    } catch (error) {
      console.error(error);
      setResult("Error generating plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Smart Generator</h1>
        <p className={styles.subtitle}>Paste your unstructured workout plan from notes or a message, and it will turn into trackable days.</p>
      </header>

      <div className={styles.card}>
        <label className={styles.label} htmlFor="workout-text">Paste Workout Text</label>
        <textarea
          id="workout-text"
          className={styles.textarea}
          placeholder="e.g. Day 1: Bench 3x10, Incline DB 3x12, Tricep pushdowns 4x15..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button 
          className={styles.btnPrimary}
          onClick={handleGenerate}
          disabled={isGenerating || !inputText.trim()}
        >
          {isGenerating ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Sparkles />
          )}
          {isGenerating ? 'Generating...' : 'Generate Plan'}
        </button>
      </div>

      {result && (
        <div className={styles.card}>
          <h2 className={styles.label}>Result</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}
