import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { workoutText, userId } = await request.json();

    if (!workoutText || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
    }

    const prompt = `
You are an expert personal trainer AI. The user has provided an unstructured block of text describing a workout plan.
Your task is to parse this text into a strict, structured JSON format.

The JSON MUST exactly match this structure and return NOTHING ELSE (no markdown formatting, no backticks, just the raw JSON object):

{
  "programName": "A short name for the overall program, e.g. PPL, Upper Lower, Bro Split, Full Body",
  "splits": [
    {
      "splitName": "e.g. Push, Pull, Legs, Upper, Lower, Chest & Triceps",
      "exercises": [
        {
          "name": "e.g. Barbell Curl",
          "sets": 2,
          "reps": "5-12",
          "restTime": "180s"
        }
      ]
    }
  ]
}

If sets, reps, or rest time are not explicitly mentioned in the user's text for an exercise, ALWAYS default to:
- sets: 2
- reps: "5-12"
- restTime: "180s"

Parse the following workout text:
"""
${workoutText}
"""
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch from Gemini');
    }

    const rawText = data.candidates[0].content.parts[0].text;
    
    // Clean up any potential markdown formatting from the response
    const cleanJsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonString);

    return NextResponse.json({ plan: parsedData }, { status: 200 });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
