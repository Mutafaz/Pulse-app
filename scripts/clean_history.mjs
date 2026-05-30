import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';

// Load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("=========================================");
  console.log("  AI Exercise History Cleaner (Terminal) ");
  console.log("=========================================");

  let apiKey = await question(`Gemini API Key (Press Enter to use env ${process.env.GEMINI_API_KEY ? 'found' : 'missing'}): `);
  if (!apiKey) apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("Error: Gemini API key is required. Get one at https://aistudio.google.com/app/apikey");
    process.exit(1);
  }

  const email = await question("Pulse Account Email: ");
  const password = await question("Pulse Account Password: ");

  console.log("\nConnecting to Firebase...");
  const app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

  const auth = getAuth(app);
  const db = getFirestore(app);

  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`Successfully logged in as ${userCredential.user.email}`);
  } catch (err) {
    console.error("Login failed:", err.message);
    process.exit(1);
  }

  // Set up Gemini
  const ai = new GoogleGenAI({ apiKey });

  console.log("\nFetching history...");
  const historyRef = collection(db, "users", userCredential.user.uid, "history");
  const snap = await getDocs(historyRef);
  
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
  
  console.log(`Found ${docs.length} workout sessions. Analyzing exercises...`);

  const promptTemplate = `
You are a fitness data cleaner. The user logged an exercise with a messy name.
Normalize it to standard industry names (e.g. "bench", "barbell bench" -> "Barbell Bench Press").
Return ONLY the clean name, nothing else.

Messy name: "{name}"
Clean name:`;

  for (const session of docs) {
    let changed = false;
    const cleanExercises = [];
    for (const ex of (session.exercises || [])) {
      if (!ex.name) continue;
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptTemplate.replace("{name}", ex.name),
        });
        const cleanName = response.text.trim();
        
        if (cleanName && cleanName.toLowerCase() !== ex.name.toLowerCase()) {
          console.log(`Mapping: "${ex.name}"  -->  "${cleanName}"`);
          cleanExercises.push({ ...ex, name: cleanName });
          changed = true;
        } else {
          cleanExercises.push(ex);
        }
      } catch (err) {
        console.error(`Failed to map ${ex.name}:`, err.message);
        cleanExercises.push(ex);
      }
    }

    if (changed) {
      const docRef = doc(db, "users", userCredential.user.uid, "history", session.id);
      await updateDoc(docRef, { exercises: cleanExercises });
      console.log(`Updated session: ${session.name} (${session.id})`);
    }
  }

  console.log("=========================================");
  console.log("Done! Your exercise history is now clean and standardized.");
  process.exit(0);
}

main();
