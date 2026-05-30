const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.resolve(__dirname, '../.env.local');

function readEnv() {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx !== -1) {
      const key = line.substring(0, idx).trim();
      const val = line.substring(idx + 1).trim();
      env[key] = val;
    }
  });
  return env;
}

function writeEnv(env) {
  const content = Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  fs.writeFileSync(envPath, content + '\n');
}

let child = null;

function showMenu() {
  console.clear();
  const env = readEnv();
  const apiKey = env['GEMINI_API_KEY'] || '';
  const maskedKey = apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : 'Not set';
  
  console.log("========================================");
  console.log("      CLEAN EXERCISE UTILITY CLI        ");
  console.log("========================================");
  console.log(`1. View/Edit Gemini API Key`);
  console.log(`   (Current: ${maskedKey})`);
  console.log(`2. Start Cleaning Process`);
  console.log(`3. Exit`);
  console.log("========================================");
  
  rl.question("Select an option: ", (answer) => {
    switch(answer.trim()) {
      case '1':
        rl.question("Enter new Gemini API Key (or press enter to cancel): ", (newKey) => {
          if (newKey.trim()) {
            const currentEnv = readEnv();
            currentEnv['GEMINI_API_KEY'] = newKey.trim();
            writeEnv(currentEnv);
            console.log("API Key updated!");
          }
          setTimeout(showMenu, 1000);
        });
        break;
      case '2':
        console.clear();
        console.log("========================================");
        console.log("          CLEANER RUNNING...            ");
        console.log(">>> Press Ctrl+C to stop and return. <<<");
        console.log("========================================\n");
        
        child = spawn('node', [path.resolve(__dirname, 'clean-exercises.js')], {
          stdio: 'inherit'
        });
        
        child.on('close', (code) => {
          console.log(`\nProcess finished or stopped.`);
          child = null;
          setTimeout(showMenu, 2000);
        });
        break;
      case '3':
        if (child) child.kill();
        rl.close();
        process.exit(0);
        break;
      default:
        showMenu();
    }
  });
}

// Handle Ctrl+C (SIGINT)
rl.on('SIGINT', () => {
  if (child) {
    console.log("\nStopping process...");
    child.kill('SIGINT');
    child = null;
    // The child close event will trigger showMenu
  } else {
    console.log("\nExiting CLI...");
    process.exit(0);
  }
});

showMenu();
