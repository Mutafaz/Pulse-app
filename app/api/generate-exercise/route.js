import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Exercise name is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }

    const prompt = `You are an expert fitness coach and database manager.
I need you to generate structured data for the exercise: "${name}".

Respond ONLY with a valid JSON object. Do not include markdown code blocks like \`\`\`json. Just raw JSON.
The JSON MUST match this exact schema:
{
  "primaryMuscle": "string (MUST be exactly one of: chest, lats, traps, shoulders, biceps, triceps, forearms, abs, lower_back, glutes, quads, hamstrings, calves)",
  "tags": ["string", "string"], // 3-5 tags like: compound/isolation, push/pull, equipment type (machine/cable/barbell/dumbbell/bodyweight), and muscle names
  "instructions": ["string", "string"], // 3-5 detailed, accurate steps on how to perform the exercise safely
  "hints": ["string", "string"] // 2-3 expert pro-tips or common mistakes to avoid
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      return NextResponse.json({ error: "Failed to generate exercise data from AI." }, { status: 500 });
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textOutput) {
      return NextResponse.json({ error: "Invalid response from AI." }, { status: 500 });
    }

    const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI did not return valid JSON." }, { status: 500 });
    }

    const generatedExercise = JSON.parse(jsonMatch[0]);

    return NextResponse.json(generatedExercise);

  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
