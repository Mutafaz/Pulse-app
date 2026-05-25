const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: '../.env.local' });

// Initialize Firebase (Using your existing client config)
// REPLACE these with your actual Firebase config if not loaded via env
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

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log("Fetching exercises from Firestore...");
  const snapshot = await getDocs(collection(db, "exercises"));
  
  const exercisesToUpdate = [];
  snapshot.forEach(d => {
    const data = d.data();
    // Check if it's missing instructions or tags
    if (!data.instructions || data.instructions.length === 0 || !data.tags || data.tags.length === 0) {
      exercisesToUpdate.push({ id: d.id, name: data.name, primaryMuscle: data.primaryMuscle, equipment: data.equipment });
    }
  });

  console.log(`Found ${exercisesToUpdate.length} exercises needing updates.`);

  for (let i = 0; i < exercisesToUpdate.length; i += BATCH_SIZE) {
    const batch = exercisesToUpdate.slice(i, i + BATCH_SIZE);
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(exercisesToUpdate.length / BATCH_SIZE)}...`);

    const promptText = `
You are a fitness expert. I will give you a JSON array of exercises. 
For each exercise, return a JSON array containing the exact same "id", but add:
1. "instructions": an array of 3-5 strings explaining how to perform the exercise.
2. "hints": an array of 1-3 string tips or common mistakes to avoid.
3. "tags": an array of strings including the primary muscle, equipment, movement type (push/pull), and whether it is compound/isolation. (e.g. ["chest", "push", "compound", "dumbbell"])

Input exercises:
${JSON.stringify(batch, null, 2)}

Return ONLY valid JSON. The output must be an array of objects. Do NOT wrap it in markdown code blocks (\`\`\`json). Just return the raw array.
`;

    try {
      console.log("Calling Gemini API...");
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
      });

      let responseText = response.text;
      // Clean up markdown if the model accidentally included it
      responseText = responseText.replace(/```json\n/g, '').replace(/```\n?/g, '').trim();

      const updatedData = JSON.parse(responseText);

      // Save back to Firestore
      for (const item of updatedData) {
        if (!item.id || !item.instructions) continue;
        console.log(`Updating ${item.id}...`);
        const docRef = doc(db, "exercises", item.id);
        await updateDoc(docRef, {
          instructions: item.instructions,
          hints: item.hints || [],
          tags: item.tags || []
        });
      }

      console.log("Batch complete.");
      if (i + BATCH_SIZE < exercisesToUpdate.length) {
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch to respect rate limits...`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }

    } catch (err) {
      console.error("Error processing batch:", err);
      console.log("Failed prompt was:\n", promptText);
      console.log("Skipping to next batch...");
    }
  }

  console.log("\nAll done! Exercise database has been backfilled.");
  process.exit(0);
}

run();
