"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import styles from './page.module.css';

const steps = [
  {
    title: "What's your name?",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&fit=crop"
  },
  {
    title: "What is your gender?",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&fit=crop"
  },
  {
    title: "When is your birthday?",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&fit=crop"
  },
  {
    title: "Current weight (lbs)?",
    image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&fit=crop"
  },
  {
    title: "How tall are you?",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&fit=crop"
  },
  {
    title: "What is your main goal?",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&fit=crop"
  }
];

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [birthday, setBirthday] = useState('');
  const [weight, setWeight] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [goal, setGoal] = useState('');

  // Protect route
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final submission
      try {
        await setDoc(doc(db, "users", user.uid), {
          name,
          gender,
          birthday,
          weight: parseFloat(weight), // saved in lbs implicitly
          height: `${feet}'${inches}"`, // formatted ft and inches
          goal,
          email: user.email,
          createdAt: new Date().toISOString()
        });
        
        // Force reload to re-fetch AuthContext userData
        window.location.href = '/'; 
      } catch (err) {
        console.error("Error saving profile:", err);
        alert("Failed to save profile. Please try again.");
      }
    }
  };

  const current = steps[currentStep];

  const isNextDisabled = () => {
    switch (currentStep) {
      case 0: return name.trim().length < 2;
      case 1: return false; // gender is always set (defaults to male)
      case 2: return !birthday;
      case 3: return !weight || parseFloat(weight) < 50 || parseFloat(weight) > 1000;
      case 4: return !feet || !inches || parseInt(feet) < 3 || parseInt(feet) > 8 || parseInt(inches) < 0 || parseInt(inches) > 11;
      case 5: return !goal;
      default: return true;
    }
  };

  return (
    <div className={styles.container}>
      {/* Background Image */}
      <div className={styles.imageContainer}>
        <img 
          src={current.image} 
          alt="Gym background" 
          className={styles.image}
          key={current.image} // Force re-render of image for animation
        />
        <div className={styles.overlay}></div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <p className={styles.stepIndicator}>Step {currentStep + 1} of {steps.length}</p>
        <h1 className={styles.title}>{current.title}</h1>

        <div className={styles.inputGroup}>
          {currentStep === 0 && (
            <input type="text" className={styles.input} placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} autoFocus />
          )}
          {currentStep === 1 && (
            <div className={styles.genderContainer}>
              <button
                type="button"
                className={`${styles.genderCard} ${gender === 'male' ? styles.activeGender : ''}`}
                onClick={() => setGender('male')}
              >
                <span className={styles.genderEmoji}>♂️</span>
                <span className={styles.genderLabel}>Male</span>
              </button>
              <button
                type="button"
                className={`${styles.genderCard} ${gender === 'female' ? styles.activeGender : ''}`}
                onClick={() => setGender('female')}
              >
                <span className={styles.genderEmoji}>♀️</span>
                <span className={styles.genderLabel}>Female</span>
              </button>
            </div>
          )}
          {currentStep === 2 && (
            <input type="date" className={styles.input} value={birthday} onChange={e => setBirthday(e.target.value)} autoFocus />
          )}
          {currentStep === 3 && (
            <input type="number" className={styles.input} placeholder="lbs" value={weight} onChange={e => setWeight(e.target.value)} autoFocus />
          )}
          {currentStep === 4 && (
            <>
              <input type="number" className={styles.input} placeholder="ft" value={feet} onChange={e => setFeet(e.target.value)} min="3" max="8" autoFocus />
              <input type="number" className={styles.input} placeholder="in" value={inches} onChange={e => setInches(e.target.value)} min="0" max="11" />
            </>
          )}
          {currentStep === 5 && (
            <select className={styles.select} value={goal} onChange={e => setGoal(e.target.value)}>
              <option value="" disabled>Select a goal...</option>
              <option value="muscle">Build Muscle (Hypertrophy)</option>
              <option value="strength">Get Stronger (Strength)</option>
              <option value="fat_loss">Lose Fat</option>
              <option value="endurance">Improve Endurance</option>
            </select>
          )}
        </div>

        <button 
          className={styles.btnPrimary} 
          onClick={handleNext}
          disabled={isNextDisabled()}
        >
          {currentStep === steps.length - 1 ? "Complete Setup" : "Continue"}
        </button>
      </div>
    </div>
  );
}
