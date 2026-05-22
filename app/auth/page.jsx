"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import styles from './page.module.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // No email verification check required

        
        // Check if onboarding is complete
        try {
          const docRef = doc(db, "users", userCredential.user.uid);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            router.push('/onboarding');
          } else {
            router.push('/');
          }
        } catch (e) {
          console.error("Error fetching user doc during login:", e);
          // Fallback to home page if client is offline or network fails
          router.push('/');
        }
        
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Automatically signed in by Firebase, redirect straight to onboarding
        router.push('/onboarding');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user document already exists
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          router.push('/onboarding');
        } else {
          router.push('/');
        }
      } catch (e) {
        console.error("Error fetching user doc during Google sign in:", e);
        router.push('/');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      {/* Logo splash above card */}
      <div className={styles.logoSplash}>
        <Image
          src="/logo.png"
          alt="Pulse"
          width={320}
          height={128}
          className={styles.splashLogo}
          priority
        />
        <p className={styles.splashTagline}>Your personal training companion</p>
      </div>

      <div className={styles.card}>
        <h1 className={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        
        {error && <p className={styles.error}>{error}</p>}
        {message && <p style={{color: 'var(--success-color)', textAlign: 'center', marginBottom: '1rem'}}>{message}</p>}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          
          <input 
            type="email" 
            placeholder="Email" 
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className={styles.btnPrimary}>
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <button 
          className={styles.btnSecondary} 
          onClick={handleGoogleSignIn}
          type="button"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" style={{ width: '20px', height: '20px' }} />
          Continue with Google
        </button>

        <p className={styles.toggleText}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span 
            className={styles.toggleLink} 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </span>
        </p>
      </div>
    </div>
  );
}
