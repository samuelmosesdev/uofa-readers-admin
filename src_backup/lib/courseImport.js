/**
 * Excel-friendly course import (CSV — open/save in Microsoft Excel).
 * Columns: code, title, faculty, department, level, semester
 */

export const COURSE_CSV_HEADERS = [
  "code",
  "title",
  "faculty",
  "department",
  "level",
  "semester",
];

export const SAMPLE_COURSE_ROWS = [
  {
    code: "CSC 101",
    title: "Introduction to Computer Science",
    faculty: "Faculty of Science",
    department: "Computer Science",
    level: "100 Level",
    semester: "First",
  },
  {
    code: "CSC 201",
    title: "Computer Programming I",
    faculty: "Faculty of Science",
    department: "Computer Science",
    level: "200 Level",
    semester: "First",
  },
  {
    code: "MTH 101",
    title: "Elementary Mathematics I",
    faculty: "Faculty of Science",
    department: "Mathematics",
    level: "100 Level",
    semester: "First",
  },
];

function escapeCsvCell(val) {
  const s = String(val ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildSampleCsv() {
  const lines = [
    COURSE_CSV_HEADERS.join(","),
    ...SAMPLE_COURSE_ROWS.map((r) =>
      COURSE_CSV_HEADERS.map((h) => escapeCsvCell(r[h])).join(",")
    ),
  ];
  return lines.join("\r\n");
}

export function downloadSampleCsv(filename = "uofa-courses-sample.csv") {
  const blob = new Blob([buildSampleCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Minimal CSV parser (handles quoted fields) */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const src = String(text).replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c)) rows.push(row);
      row = [];
    } else if (ch === "\r") {
      /* skip */
    } else {
      cell += ch;
    }
  }
  row.push(cell.trim());
  if (row.some((c) => c)) rows.push(row);

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) =>
    String(h)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
  );

  const alias = {
    code: ["code", "coursecode", "course_code"],
    title: ["title", "coursetitle", "course_title", "name"],
    faculty: ["faculty"],
    department: ["department", "dept"],
    level: ["level"],
    semester: ["semester", "sem"],
  };

  function idx(field) {
    const names = alias[field] || [field];
    for (const n of names) {
      const i = headers.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  }

  const map = {
    code: idx("code"),
    title: idx("title"),
    faculty: idx("faculty"),
    department: idx("department"),
    level: idx("level"),
    semester: idx("semester"),
  };

  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const line = rows[r];
    const get = (k) => (map[k] >= 0 ? line[map[k]] || "" : "");
    const code = get("code").trim();
    const title = get("title").trim();
    if (!code && !title) continue;
    out.push({
      code,
      title,
      faculty: get("faculty").trim(),
      department: get("department").trim(),
      level: get("level").trim(),
      semester: get("semester").trim(),
      rowNum: r + 1,
    });
  }
  return out;
}

export function validateCourseRow(row) {
  const errors = [];
  if (!row.code) errors.push("missing code");
  if (!row.title) errors.push("missing title");
  if (!row.faculty) errors.push("missing faculty");
  if (!row.department) errors.push("missing department");
  if (!row.level) errors.push("missing level");
  return errors;
}

export function normalizeCoursePayload(row) {
  return {
    code: String(row.code).trim().toUpperCase(),
    title: String(row.title).trim(),
    faculty: String(row.faculty).trim() || null,
    department: String(row.department).trim() || null,
    level: String(row.level).trim() || null,
    semester: String(row.semester).trim() || null,
  };
}
