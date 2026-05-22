# Global Exercise Scraper 🏋️‍♂️

This directory contains utility scripts to help manage your global Exercise Database.

## `scrapeExercises.js`

This script is designed to fetch thousands of exercises from external third-party APIs (like ExerciseDB), map their data into our specific application schema, and push them directly to your live global Firestore `/exercises` collection.

### Prerequisites

1. **Node.js**: Ensure you have Node.js installed on your machine.
2. **Dependencies**: You need to install the required packages. Open your terminal in the root of the project and run:
   ```bash
   npm install firebase-admin axios dotenv
   ```
3. **Firebase Service Account**:
   - Go to your [Firebase Console](https://console.firebase.google.com/).
   - Click the gear icon next to **Project Overview** -> **Project Settings**.
   - Navigate to the **Service accounts** tab.
   - Click **Generate new private key**.
   - Save the downloaded JSON file as `serviceAccountKey.json` directly inside the `scripts` folder. *(DO NOT commit this file to GitHub!)*

### How to Run

1. Open your terminal.
2. Navigate to the root directory of your project:
   ```bash
   cd path/to/WORKOUT
   ```
3. Execute the script using Node:
   ```bash
   node scripts/scrapeExercises.js
   ```

### Notes
- By default, the script has a placeholder for the RapidAPI key. If you run it without changing the key, it will safely execute a "mock" payload just to demonstrate the Firestore connection without hitting a real API.
- To scrape real data, you will need to sign up for [ExerciseDB on RapidAPI](https://rapidapi.com/justin-roche/api/exercisedb) and paste your key into the `RAPID_API_KEY` variable inside the script.
