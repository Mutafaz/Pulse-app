/**
 * WORKOUT APP - GLOBAL EXERCISE SCRAPER
 * 
 * This is a standalone Node.js script designed to fetch exercises from 
 * external APIs (e.g. ExerciseDB) in small paginated batches and push them into Firestore.
 * 
 * It persists the current progress (offset) in `scraperState.json` so you can
 * run it repeatedly to fetch the next batch without duplication or hitting limits.
 * 
 * PREREQUISITES:
 * 1. You must have a Firebase Admin SDK service account key (JSON file).
 *    Save it in this directory as `serviceAccountKey.json`.
 * 2. npm install firebase-admin axios
 * 
 * USAGE:
 * node scripts/scrapeExercises.js
 */

const admin = require('firebase-admin');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// State file to track progress (offset)
const STATE_FILE_PATH = path.join(__dirname, 'scraperState.json');

// 1. Initialize Firebase Admin
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (err) {
  console.error("❌ ERROR: Could not find serviceAccountKey.json.");
  console.error("Please download it from Firebase Console and place it in the scripts folder.");
  process.exit(1);
}

const db = admin.firestore();

// Load current scraper progress
let scraperState = { offset: 0 };
if (fs.existsSync(STATE_FILE_PATH)) {
  try {
    scraperState = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
  } catch (err) {
    console.warn("⚠️ Warning: Could not parse scraperState.json, starting from offset 0.");
  }
}

// Helper to pause execution between API calls
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 2. Define the scraping function
async function scrapeAndUpload() {
  console.log("🚀 Starting Scraper in Auto-Loop Mode...");
  console.log("Press Ctrl + C at any time to pause/stop the scraper.");

  const RAPID_API_KEY = "b0a2c75315msh83f7489a1938bf1p15ad37jsnfb45ef7fdf4c"; 
  const BATCH_SIZE = 10;
  const DELAY_MS = 2000; // 2-second delay between requests to safely stay within free rate limits
  
  if (RAPID_API_KEY === "YOUR_RAPID_API_KEY_HERE") {
    console.warn("⚠️ Warning: RAPID_API_KEY is not set. The scraper will use a small mock data payload for demonstration.");
  }

  while (true) {
    console.log(`\n────────────────────────────────────────────`);
    console.log(`📦 Starting Batch (Current Offset: ${scraperState.offset})`);

    try {
      let rawExercises = [];

      if (RAPID_API_KEY !== "YOUR_RAPID_API_KEY_HERE") {
        // Fetch paginated batch from ExerciseDB
        console.log(`Fetching ${BATCH_SIZE} exercises starting from offset ${scraperState.offset}...`);
        const response = await axios.get('https://exercisedb.p.rapidapi.com/exercises', {
          params: {
            limit: BATCH_SIZE,
            offset: scraperState.offset
          },
          headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
          }
        });
        rawExercises = response.data;
      } else {
        // Mock data for testing when key is placeholder
        rawExercises = [
          {
            id: `mock-${scraperState.offset + 1}`,
            name: `Mock Exercise ${scraperState.offset + 1}`,
            target: "biceps",
            bodyPart: "upper arms",
            equipment: "ez barbell",
            gifUrl: null,
            instructions: ["Sit on bench.", "Grab bar.", "Curl up."]
          }
        ];
      }

      if (!rawExercises || rawExercises.length === 0) {
        console.log("🎉 All exercises have been successfully scraped and uploaded!");
        scraperState.offset = 0; // Reset offset back to 0 for future runs
        fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(scraperState, null, 2));
        break;
      }

      console.log(`Fetched ${rawExercises.length} exercises from API.`);
      let successCount = 0;

      for (const raw of rawExercises) {
        // 3. Map to our specific Database Schema
        let primaryMuscle = 'chest';
        const targetLower = (raw.target || raw.bodyPart || '').toLowerCase();
        if (targetLower.includes('bicep') || targetLower.includes('arm')) primaryMuscle = 'biceps';
        else if (targetLower.includes('tricep')) primaryMuscle = 'triceps';
        else if (targetLower.includes('chest') || targetLower.includes('pec')) primaryMuscle = 'chest';
        else if (targetLower.includes('back') || targetLower.includes('lat')) primaryMuscle = 'lats';
        else if (targetLower.includes('shoulder') || targetLower.includes('delt')) primaryMuscle = 'shoulders';
        else if (targetLower.includes('quad') || targetLower.includes('leg')) primaryMuscle = 'quads';
        else if (targetLower.includes('hamstring')) primaryMuscle = 'hamstrings';
        else if (targetLower.includes('calf') || targetLower.includes('calves')) primaryMuscle = 'calves';
        else if (targetLower.includes('abs') || targetLower.includes('core')) primaryMuscle = 'abs';
        else if (targetLower.includes('glute')) primaryMuscle = 'glutes';

        const tags = [primaryMuscle, raw.equipment || 'bodyweight'];
        if (raw.name.toLowerCase().includes('press') || raw.name.toLowerCase().includes('push')) tags.push('push');
        if (raw.name.toLowerCase().includes('pull') || raw.name.toLowerCase().includes('curl')) tags.push('pull');

        const slugifiedId = raw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const formattedExercise = {
          id: slugifiedId,
          name: raw.name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          primaryMuscle: primaryMuscle,
          tags: [...new Set(tags)],
          equipment: raw.equipment || 'other',
          mediaUrl: raw.gifUrl || null,
          instructions: raw.instructions || [],
          hints: ["Keep your core tight.", "Focus on mind-muscle connection."],
          isCustom: false,
          createdAt: new Date().toISOString()
        };

        // 4. Upload to Firestore
        await db.collection('exercises').doc(slugifiedId).set(formattedExercise);
        successCount++;
      }

      // 5. Update and persist state
      scraperState.offset += rawExercises.length;
      fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(scraperState, null, 2));

      console.log(`✅ Success! Uploaded ${successCount} formatted exercises to Firestore.`);
      console.log(`📈 Next batch will start at Offset: ${scraperState.offset}`);

      // If we fetched fewer than BATCH_SIZE, it means we hit the end of the API list
      if (rawExercises.length < BATCH_SIZE) {
        console.log("🎉 Reached the end of the exercise database!");
        break;
      }

      console.log(`⏳ Waiting ${DELAY_MS / 1000} seconds before next batch to protect rate limit...`);
      await sleep(DELAY_MS);

    } catch (error) {
      console.error("❌ Scraper Error:", error.message);
      console.log("Skipping batch due to error. Scraper will pause for 5 seconds before trying again...");
      await sleep(5000);
    }
  }
}

scrapeAndUpload();
