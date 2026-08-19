import * as XLSX from "xlsx";

export const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

const TEMPLATE_HEADERS = [
  "Type",
  "Question",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Correct Option (A/B/C/D)",
  "Marks",
  "Batch",
  "Difficulty (Easy/Medium/Hard)",
  "Subject",
  "Image URL (optional)",
];

const TEMPLATE_EXAMPLE_ROWS = [
  [
    "Objective",
    "What is the chemical symbol for water?",
    "H2O",
    "CO2",
    "O2",
    "NaCl",
    "A",
    "1",
    "Batch 2026 - Mock 1",
    "Easy",
    "Chemistry",
    "",
  ],
  [
    "Essay",
    "Discuss the causes and effects of the Nigerian Civil War.",
    "",
    "",
    "",
    "",
    "",
    "10",
    "Batch 2026 - Mock 1",
    "Medium",
    "History",
    "",
  ],
];

// Generates and downloads a ready-to-fill .xlsx template so admins know
// exactly what columns/format to use for bulk question upload.
export function downloadQuestionTemplate() {
  const wb = XLSX.utils.book_new();

  const sheetData = [TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE_ROWS];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!cols"] = [
    { wch: 10 },
    { wch: 45 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 8 },
    { wch: 22 },
    { wch: 24 },
    { wch: 16 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Questions");

  const instructions = [
    ["How to use this template"],
    [""],
    ["1. Type must be either 'Objective' or 'Essay'."],
    ["2. For Objective questions, fill Option A and B at minimum (up to F if you add more columns) and set the Correct Option letter."],
    ["3. For Essay questions, leave the Option and Correct Option columns blank."],
    ["4. Marks is a number, e.g. 1, 2, 10."],
    ["5. Batch is any label you use to group questions, e.g. 'Batch 2026 - Mock 1'. Keep the wording consistent so filtering works well."],
    ["6. Difficulty must be Easy, Medium, or Hard."],
    ["7. Subject/Image URL are optional. Image URL must be a direct link to an already-hosted image."],
    ["8. Do not rename or reorder the header row — the importer matches columns by header name."],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(instructions);
  wsInfo["!cols"] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, "Instructions");

  XLSX.writeFile(wb, "cbt-question-upload-template.xlsx");
}

function normalizeHeader(h) {
  return String(h || "").trim().toLowerCase();
}

function findValue(row, headerMap, candidates) {
  for (const candidate of candidates) {
    const key = headerMap[normalizeHeader(candidate)];
    if (key !== undefined && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  return "";
}

// Reads an uploaded workbook (File object) and returns
// { questions: [...validRows], errors: [{ row, message }] }
export async function parseQuestionsWorkbook(file) {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase() !== "instructions") || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });

  if (!rows.length) return { questions: [], errors: [{ row: 0, message: "The sheet is empty." }] };

  const headerRow = rows[0];
  const headerMap = {};
  headerRow.forEach((h, i) => {
    headerMap[normalizeHeader(h)] = i;
  });

  const questions = [];
  const errors = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => String(c ?? "").trim() === "")) continue; // skip blank rows
    const rowNum = r + 1; // 1-indexed, matches spreadsheet row number

    const typeRaw = findValue(row, headerMap, ["Type"]).toLowerCase();
    const text = findValue(row, headerMap, ["Question"]);
    const marksRaw = findValue(row, headerMap, ["Marks"]);
    const batch = findValue(row, headerMap, ["Batch"]);
    const difficultyRaw = findValue(row, headerMap, ["Difficulty (Easy/Medium/Hard)", "Difficulty"]);
    const subject = findValue(row, headerMap, ["Subject"]);
    const imageUrl = findValue(row, headerMap, ["Image URL (optional)", "Image URL"]);

    if (!text) {
      errors.push({ row: rowNum, message: "Missing question text." });
      continue;
    }
    if (typeRaw !== "objective" && typeRaw !== "essay") {
      errors.push({ row: rowNum, message: `Type must be "Objective" or "Essay" (got "${findValue(row, headerMap, ["Type"])}").` });
      continue;
    }
    const difficulty = DIFFICULTIES.find((d) => d.toLowerCase() === difficultyRaw.toLowerCase()) || "";
    if (!difficulty) {
      errors.push({ row: rowNum, message: `Difficulty must be Easy, Medium, or Hard (got "${difficultyRaw || "blank"}").` });
      continue;
    }
    if (!batch) {
      errors.push({ row: rowNum, message: "Missing batch label." });
      continue;
    }

    const marks = marksRaw ? Number(marksRaw) : null;
    if (marksRaw && Number.isNaN(marks)) {
      errors.push({ row: rowNum, message: `Marks must be a number (got "${marksRaw}").` });
      continue;
    }

    const base = {
      type: typeRaw,
      text,
      marks: marks ?? null,
      batch,
      difficulty,
      subject: subject || null,
      imageUrl: imageUrl || null,
    };

    if (typeRaw === "objective") {
      const options = [];
      OPTION_LETTERS.forEach((letter) => {
        const val = findValue(row, headerMap, [`Option ${letter}`]);
        if (val) options.push({ id: letter, text: val });
      });
      if (options.length < 2) {
        errors.push({ row: rowNum, message: "Objective questions need at least Option A and Option B filled in." });
        continue;
      }
      const correctRaw = findValue(row, headerMap, ["Correct Option (A/B/C/D)", "Correct Option"]).toUpperCase();
      const correctOptionId = OPTION_LETTERS.includes(correctRaw) ? correctRaw : "";
      if (!correctOptionId || !options.some((o) => o.id === correctOptionId)) {
        errors.push({ row: rowNum, message: `Correct Option must match one of the filled options (got "${correctRaw || "blank"}").` });
        continue;
      }
      questions.push({ ...base, options, correctOptionId });
    } else {
      questions.push({ ...base, options: [], correctOptionId: null });
    }
  }

  return { questions, errors };
}
