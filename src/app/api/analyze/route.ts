import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Check that the Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is missing." },
        { status: 500 },
      );
    }

    // Receive simulation results from the dashboard
    const data = await request.json();

    const { policy, allocation, fairnessWeight, before, after, bestPlan } =
      data;

    // Validate the incoming simulation data
    if (
      !["directorate", "equity"].includes(policy) ||
      !allocation ||
      !before ||
      !after ||
      !bestPlan ||
      ![before, after].every(
        (value) =>
          Number.isFinite(value.totalUnsafePersonHours) &&
          Number.isFinite(value.deepUnsafeHoursPerCapita),
      )
    ) {
      return NextResponse.json(
        { error: "Invalid simulation data." },
        { status: 400 },
      );
    }

    // Connect to Gemini
    const ai = new GoogleGenAI({ apiKey });

    // Ask Gemini to analyze the disaster response plan
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `
You are DOMINO's AI emergency response advisor.

DOMINO simulates a fictional underground city with five levels.
A geothermal failure affects electricity, temperature, and water.

The user has 100 credits to allocate between:
- Ventilation restoration
- Recycler repairs
- Power redistribution

Here are the actual simulation results:

${JSON.stringify(
  {
    policy,
    allocation,
    fairnessWeight,
    before,
    after,
    bestPlan,
  },
  null,
  2,
)}

Your tasks:

1. BEFORE VS AFTER
Compare unsafe person-hours before and after intervention.
Explain whether the selected plan improved conditions.

2. WHY THIS PLAN
Explain why the allocation may be effective.
Discuss benefits and trade-offs.

3. SUGGESTED NEXT ACTION
Recommend what the user should do next.
Use the bestPlan data when suggesting a better allocation.

IMPORTANT RULES:
- Only use the simulation data provided.
- Never invent numbers or improvements.
- If the plan performs worse, clearly explain that.
- Do not claim real lives were saved.
- This is a fictional simulation, not a real disaster forecast.
- Keep your entire response under 180 words.
- Use simple language suitable for a hackathon demo.
      `,
    });

    // Send Gemini's explanation back to the dashboard
    return NextResponse.json({
      explanation: response.text ?? "No explanation returned.",
    });
  } catch (error) {
    console.error("Gemini analysis error:", error);

    return NextResponse.json(
      { error: "AI analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
