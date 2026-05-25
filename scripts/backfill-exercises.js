const { getFirestore, collection, collectionGroup, getDocs, updateDoc, doc } = require('firebase/firestore');
const dotenv = require('dotenv');
const path = require('path');
const { initializeApp } = require('firebase/app');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("=== FIRESTORE DEBUG SCRIPT ===");
  
  const exercisesSnap = await getDocs(collection(db, "exercises"));
  console.log(`Total documents in 'exercises' collection: ${exercisesSnap.size}`);
  if (!exercisesSnap.empty) {
    console.log("Sample 'exercises' document:", JSON.stringify(exercisesSnap.docs[0].data(), null, 2));
  }

  const customSnap = await getDocs(collectionGroup(db, "custom_exercises"));
  console.log(`\nTotal documents in 'custom_exercises' collectionGroup: ${customSnap.size}`);
  if (!customSnap.empty) {
    console.log("Sample 'custom_exercises' document:", JSON.stringify(customSnap.docs[0].data(), null, 2));
  }
  
  process.exit(0);
}

run();
