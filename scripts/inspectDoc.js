const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (err) {
  fs.writeFileSync(path.join(__dirname, 'inspected.txt'), "Error loading service account: " + err.message);
  process.exit(1);
}

const db = admin.firestore();

async function inspect() {
  const snapshot = await db.collection('exercises').limit(10).get();
  let output = "";
  if (snapshot.empty) {
    output = "Collection 'exercises' is empty!";
  } else {
    snapshot.forEach(doc => {
      output += `Document ID: ${doc.id}\n`;
      output += JSON.stringify(doc.data(), null, 2) + "\n";
      output += "-----------------------------------------\n";
    });
  }
  fs.writeFileSync(path.join(__dirname, 'inspected.txt'), output);
}

inspect().then(() => process.exit(0)).catch(err => {
  fs.writeFileSync(path.join(__dirname, 'inspected.txt'), "Error running inspect: " + err.message);
  process.exit(1);
});
