const axios = require('axios');

const RAPID_API_KEY = "b0a2c75315msh83f7489a1938bf1p15ad37jsnfb45ef7fdf4c";

async function testFetch() {
  console.log("Testing ExerciseDB API response...");
  try {
    const response = await axios.get('https://exercisedb.p.rapidapi.com/exercises', {
      params: { limit: 1 },
      headers: {
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    });
    console.log("API Response Data:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("API Fetch Error:", error.message);
  }
}

testFetch();
