import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { collection, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import Modal from "./Modal";

const TEMPLATE_CSV = `courseCode,courseTitle,topic,faculty,department,level,questionText,optionA,optionB,optionC,optionD,correct,difficulty,explanation
CSC 201,Introduction to Computing,Algorithms,Faculty of Science,Computer Science,100 Level,What is the time complexity of binary search?,O(n),O(log n),O(n log n),O(1),B,medium,Binary search halves the search space each step.
MTH 101,Elementary Mathematics,Algebra,Faculty of Science,Mathematics,100 Level,Solve for x: 2x + 4 = 10,x=2,x=3,x=4,x=5,B,easy,2x = 6 so x = 3.
`;

function parseCsv(text) {
  const lines = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      if (current.trim() || lines.length > 0) lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length < 2) return [];

  const splitRow = (row) => {
    const cells = [];
    let cell = "";
    let q = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (q && row[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = !q;
      } else if (ch === "," && !q) {
        cells.push(cell.trim());
        cell = "";
      } else cell += ch;
    }
    cells.push(cell.trim());
    return cells;
  };

  const headers = splitRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ""));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    if (cells.every((c) => !c)) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] ?? "";
    });
    rows.push(obj);
  }
  return rows;
}

function normaliseCorrect(val) {
  if (val === undefined || val === null || val === "") return 0;
  const s = String(val).trim().toUpperCase();
  if (s === "A" || s === "0") return 0;
  if (s === "B" || s === "1") return 1;
  if (s === "C" || s === "2") return 2;
  if (s === "D" || s === "3") return 3;
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 && n <= 3 ? n : 0;
}

function rowToQuestion(row) {
  const courseCode = (row.coursecode || row.course_code || "").trim().toUpperCase();
  const questionText = (row.questiontext || row.question || row.question_text || "").trim();
  if (!courseCode || !questionText) return null;

  const options = [
    row.optiona || row.option_a || row.a || "",
    row.optionb || row.option_b || row.b || "",
    row.optionc || row.option_c || row.c || "",
    row.optiond || row.option_d || row.d || "",
  ].map((o) => String(o).trim());

  if (options.some((o) => !o)) return null;

  const difficultyRaw = (row.difficulty || "medium").toLowerCase();
  const difficulty = ["easy", "medium", "hard"].includes(difficultyRaw) ? difficultyRaw : "medium";

  return {
    courseCode,
    courseTitle: (row.coursetitle || row.course_title || courseCode).trim(),
    topic: (row.topic || "").trim() || null,
    faculty: (row.faculty || "").trim() || null,
    department: (row.department || "").trim() || null,
    level: (row.level || "").trim() || null,
    questionText,
    options,
    correctIndex: normaliseCorrect(row.correct || row.answer || row.correctanswer),
    explanation: (row.explanation || row.explain || "").trim() || null,
    difficulty,
    createdAt: serverTimestamp(),
  };
}

export default function ImportQuestionsModal({ open, onClose }) {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  function reset() {
    setFileName("");
    setParsed([]);
    setErrors([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose?.();
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const rows = parseCsv(text);
        const questions = [];
        const errs = [];

        rows.forEach((row, i) => {
          const q = rowToQuestion(row);
          if (q) questions.push(q);
          else errs.push(`Row ${i + 2}: missing courseCode, questionText, or one of the options`);
        });

        setParsed(questions);
        setErrors(errs);
      } catch (err) {
        setParsed([]);
        setErrors([err.message || "Could not parse file"]);
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleImport() {
    if (parsed.length === 0) return;
    setImporting(true);
    setResult(null);

    let success = 0;
    let failed = 0;

    try {
      const chunkSize = 400;
      for (let i = 0; i < parsed.length; i += chunkSize) {
        const chunk = parsed.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((q) => {
          const ref = doc(collection(db, "cbtQuestions"));
          batch.set(ref, q);
        });
        await batch.commit();
        success += chunk.length;
      }
      setResult({ success, failed });
      setParsed([]);
      setFileName("");
    } catch (err) {
      failed = parsed.length - success;
      setResult({ success, failed, message: err.message });
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cbt-questions-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import questions from Excel / CSV">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Upload a <strong className="text-text-primary">.csv</strong> file (save your Excel workbook as CSV UTF-8).
          Required columns: <code className="text-xs text-accent">courseCode</code>,{" "}
          <code className="text-xs text-accent">questionText</code>,{" "}
          <code className="text-xs text-accent">optionA–D</code>,{" "}
          <code className="text-xs text-accent">correct</code> (A/B/C/D).
        </p>

        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-2 text-sm font-medium text-accent hover:underline"
        >
          <FileSpreadsheet size={15} />
          Download sample template (.csv)
        </button>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-bg-panel-alt px-4 py-8 transition hover:border-accent">
          <Upload size={22} className="text-text-muted" />
          <span className="text-sm text-text-secondary">
            {fileName || "Click to choose a .csv file"}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />
        </label>

        {parsed.length > 0 && (
          <div className="rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 text-sm text-text-primary">
            <CheckCircle2 size={14} className="mr-1.5 inline text-accent" />
            Ready to import <strong>{parsed.length}</strong> question{parsed.length !== 1 ? "s" : ""}
          </div>
        )}

        {errors.length > 0 && (
          <div className="max-h-28 overflow-y-auto rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs text-status-danger">
            <AlertCircle size={14} className="mr-1 inline" />
            {errors.slice(0, 8).map((e, i) => (
              <div key={i}>{e}</div>
            ))}
            {errors.length > 8 && <div>…and {errors.length - 8} more</div>}
          </div>
        )}

        {result && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              result.failed
                ? "border border-status-warning/40 bg-status-warning/10 text-status-warning"
                : "border border-accent/30 bg-accent-soft text-accent"
            }`}
          >
            Imported {result.success} question{result.success !== 1 ? "s" : ""}.
            {result.failed ? ` ${result.failed} failed.` : ""}
            {result.message && ` (${result.message})`}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-bg-panel-alt"
          >
            Close
          </button>
          <button
            type="button"
            disabled={parsed.length === 0 || importing}
            onClick={handleImport}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-app hover:bg-accent-strong disabled:opacity-50"
          >
            {importing ? "Importing…" : `Import ${parsed.length || ""} questions`}
          </button>
        </div>
      </div>
    </Modal>
  );
}