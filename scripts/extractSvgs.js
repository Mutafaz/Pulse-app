const fs = require('fs');
const path = require('path');

const inputFile = 'C:/Users/59322/.gemini/antigravity/brain/fe5d0ca5-79e2-48d0-8d06-1d29852a61e8/.system_generated/steps/9/output.txt';
const outFront = path.join(__dirname, '../public/musclemap_female_front.svg');
const outBack = path.join(__dirname, '../public/musclemap_female_back.svg');

try {
  const content = fs.readFileSync(inputFile, 'utf-8');
  
  // Extract just the JSON portion
  const jsonStart = content.indexOf('{');
  const jsonEnd = content.lastIndexOf('}') + 1;
  const jsonStr = content.slice(jsonStart, jsonEnd);
  
  const data = JSON.parse(jsonStr);
  
  fs.writeFileSync(outFront, data.front);
  console.log('✅ Successfully created: public/musclemap_female_front.svg');
  
  fs.writeFileSync(outBack, data.back);
  console.log('✅ Successfully created: public/musclemap_female_back.svg');
} catch (e) {
  console.error('Error extracting SVGs:', e);
}
