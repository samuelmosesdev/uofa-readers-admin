/**
 * Gemini AI helper for generating CBT questions from PDF material.
 *
 * Setup:
 *   1. Get a free API key: https://aistudio.google.com/apikey
 *   2. Add to .env.local:
 *        VITE_GEMINI_API_KEY=your_key_here
 *   3. Restart the dev server
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Free-tier friendly (gemini-2.0-flash shut down June 2026)
const MODEL = "gemini-3.5-flash-lite";

const SYSTEM_PROMPT = `You are an expert university exam setter for Nigerian universities (especially University of Abuja style).

Your task: Read the provided study material (PDF) carefully and generate high-quality multiple-choice questions.

RULES:
1. Generate ONLY valid JSON. No markdown, no code fences, no extra text.
2. Output format must be exactly:
{
  "questions": [
    {
      "questionText": "Clear, unambiguous question stem",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctIndex": 0,
      "explanation": "2–4 sentence explanation of why the correct answer is right and why others are wrong",
      "difficulty": "easy" | "medium" | "hard",
      "topic": "Short topic/chapter name from the material"
    }
  ]
}
3. correctIndex is 0-based (0 = first option, 1 = second, etc.)
4. Exactly 4 options per question. Make distractors plausible.
5. Questions must be answerable from the provided material only.
6. Mix difficulties if the user did not specify one.
7. Prefer application and understanding over pure recall when possible.
8. Use clear academic English suitable for university students.`;

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function generateQuestionsFromPdf({
  pdfFile,
  count = 10,
  difficulty = "",
  topic = "",
  courseCode = "",
  courseTitle = "",
}) {
  if (!API_KEY) {
    throw new Error(
      "Gemini API key missing. Add VITE_GEMINI_API_KEY to your .env.local and restart the server."
    );
  }

  if (!pdfFile) throw new Error("Please select a PDF file.");
  if (pdfFile.type !== "application/pdf") {
    throw new Error("Only PDF files are supported.");
  }
  if (pdfFile.size > 10 * 1024 * 1024) {
    throw new Error("PDF is too large. Please use a file under 10MB.");
  }

  const n = Math.min(Math.max(Number(count) || 5, 1), 30);
  const base64 = await fileToBase64(pdfFile);

  let userInstruction = `Generate exactly ${n} multiple-choice questions from this study material.`;
  if (courseCode || courseTitle) {
    userInstruction += `\nCourse: ${[courseCode, courseTitle].filter(Boolean).join(" — ")}.`;
  }
  if (topic) {
    userInstruction += `\nFocus on the topic/section: "${topic}".`;
  }
  if (difficulty) {
    userInstruction += `\nAll questions should be ${difficulty} difficulty.`;
  } else {
    userInstruction += `\nMix easy, medium and hard questions.`;
  }
  userInstruction += `\n\nReturn ONLY the JSON object described in the system instructions.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const body = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64,
            },
          },
          { text: userInstruction },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = `Gemini API error (${res.status})`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed?.error?.message || msg;
    } catch {
      /* ignore */
    }
    if (res.status === 429) {
      msg = "Rate limit reached. Wait a minute or try fewer questions.";
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
    "";

  if (!text) {
    throw new Error("Gemini returned an empty response. Try a shorter PDF or fewer questions.");
  }

  let parsed;
  try {
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Could not parse AI response as JSON. Try again or reduce the number of questions."
    );
  }

  const list = Array.isArray(parsed) ? parsed : parsed.questions;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("AI returned no questions. Try a different PDF or fewer questions.");
  }

  return list
    .map((q, i) => {
      const options = Array.isArray(q.options)
        ? q.options.slice(0, 4).map((o) => String(o || "").trim())
        : ["", "", "", ""];
      while (options.length < 4) options.push("");

      let correctIndex = Number(q.correctIndex);
      if (Number.isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        correctIndex = 0;
      }

      const diff = String(q.difficulty || "medium").toLowerCase();
      const difficultyNorm = ["easy", "medium", "hard"].includes(diff)
        ? diff
        : "medium";

      return {
        questionText: String(q.questionText || q.question || "").trim(),
        options,
        correctIndex,
        explanation: String(q.explanation || "").trim(),
        difficulty: difficultyNorm,
        topic: String(q.topic || topic || "").trim() || "General",
        _aiIndex: i,
      };
    })
    .filter((q) => q.questionText && q.options.some((o) => o));
}

export async function fetchPdfAsFile(pdfUrl, fileName = "material.pdf") {
  const res = await fetch(pdfUrl);
  if (!res.ok) {
    throw new Error(
      "Could not download the PDF. Make sure the file URL is public, or re-upload and try again."
    );
  }
  const blob = await res.blob();
  if (blob.size > 10 * 1024 * 1024) {
    throw new Error("PDF is too large (max 10MB).");
  }
  return new File([blob], fileName, { type: "application/pdf" });
}

export async function generateQuestionsFromDocument({
  pdfUrl,
  fileName = "material.pdf",
  count = 10,
  byDifficulty = null,
  documentTitle = "",
}) {
  const file = await fetchPdfAsFile(pdfUrl, fileName);

  if (
    byDifficulty &&
    (byDifficulty.easy > 0 || byDifficulty.medium > 0 || byDifficulty.hard > 0)
  ) {
    const batches = [];
    for (const [diff, n] of [
      ["easy", Number(byDifficulty.easy) || 0],
      ["medium", Number(byDifficulty.medium) || 0],
      ["hard", Number(byDifficulty.hard) || 0],
    ]) {
      if (n <= 0) continue;
      const part = await generateQuestionsFromPdf({
        pdfFile: file,
        count: Math.min(n, 30),
        difficulty: diff,
        topic: documentTitle,
        courseTitle: documentTitle,
      });
      batches.push(...part.map((q) => ({ ...q, difficulty: diff })));
    }
    if (batches.length === 0) {
      throw new Error("Enter at least one question for easy, medium, or hard.");
    }
    return batches;
  }

  return generateQuestionsFromPdf({
    pdfFile: file,
    count,
    difficulty: "",
    topic: documentTitle,
    courseTitle: documentTitle,
  });
}