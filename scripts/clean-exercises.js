const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
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

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BATCH_SIZE = 15;
const DELAY_BETWEEN_BATCHES = 4000; // 4 seconds to respect rate limits
const PROGRESS_FILE = path.resolve(__dirname, 'clean-progress.json');

const ALLOWED_TAGS = [
  'chest', 'lats', 'traps', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'lower_back', 'glutes', 'quads', 'hamstrings', 'calves',
  'compound', 'isolation', 'push', 'pull', 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log("Fetching all exercises from Firestore...");
  const snapshot = await getDocs(collection(db, "exercises"));
  
  let allExercises = [];
  snapshot.forEach(d => {
    allExercises.push({ path: d.ref.path, id: d.id, ...d.data() });
  });

  // Load progress to allow resuming if it crashes
  let processedIds = [];
  if (fs.existsSync(PROGRESS_FILE)) {
    processedIds = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    console.log(`Loaded ${processedIds.length} already processed exercises from save file.`);
  }

  // Filter out exercises we've already cleaned
  const exercisesToUpdate = allExercises.filter(ex => !processedIds.includes(ex.id));

  console.log(`Found ${exercisesToUpdate.length} exercises remaining to clean.`);

  for (let i = 0; i < exercisesToUpdate.length; i += BATCH_SIZE) {
    const batch = exercisesToUpdate.slice(i, i + BATCH_SIZE).map(ex => ({
      path: ex.path,
      id: ex.id,
      name: ex.name,
      instructions: ex.instructions,
      hints: ex.hints,
      tags: ex.tags
    }));

    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(exercisesToUpdate.length / BATCH_SIZE)}...`);

    const promptText = `
You are a master fitness expert. Review the following JSON array of exercises. 
For every single exercise, you must:
1. Verify the "instructions" array. If it is inaccurate for the named workout, completely rewrite it to be perfectly accurate (3-5 steps). If it is already accurate, leave it as is or improve its clarity.
2. Verify the "hints" array (1-3 pro-tips).
3. Replace the "tags" array. You are ONLY ALLOWED to use tags strictly from this exact list:
${JSON.stringify(ALLOWED_TAGS)}
Do NOT invent any tags. For example, if it says "body weight", change it to "bodyweight". If it says "abs", keep "abs". Ensure the primary muscle is included in the tags.

Input exercises:
${JSON.stringify(batch, null, 2)}

Return ONLY valid JSON. The output must be an array of objects containing the exact "path", "id", "instructions", "hints", and "tags". Do NOT wrap it in markdown code blocks (\`\`\`json). Return the raw array.
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
        if (!item.path || !item.instructions) continue;
        console.log(`  Updating ${item.name || item.id}...`);
        const docRef = doc(db, item.path);
        
        // Filter out any rogue tags just in case the AI hallucinated
        const sanitizedTags = (item.tags || []).filter(t => ALLOWED_TAGS.includes(t));

        await updateDoc(docRef, {
          instructions: item.instructions,
          hints: item.hints || [],
          tags: sanitizedTags
        });

        processedIds.push(item.id);
      }

      // Save progress
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(processedIds));

      console.log("Batch complete.");
      if (i + BATCH_SIZE < exercisesToUpdate.length) {
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms to respect rate limits...`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }

    } catch (err) {
      console.error("Error processing batch (it may have hit a rate limit):", err.message);
      console.log("Waiting 10 seconds before continuing...");
      await sleep(10000);
      i -= BATCH_SIZE; // Retry the same batch
    }
  }

  console.log("\nAll done! Exercise database has been completely cleaned and standardized.");
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE); // cleanup
  process.exit(0);
}

run();
