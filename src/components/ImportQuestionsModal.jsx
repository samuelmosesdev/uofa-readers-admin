import { useRef, useState } from "react";
import { X, FileDown, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { downloadQuestionTemplate, parseQuestionsWorkbook } from "../lib/questionsExcel";

export default function ImportQuestionsModal({ open, onClose, onImport, busy }) {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null); // { questions, errors }
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const inputRef = useRef(null);

  if (!open) return null;

  function reset() {
    setFileName("");
    setParsed(null);
    setParseError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParsed(null);
    setParseError("");
    setParsing(true);
    try {
      const result = await parseQuestionsWorkbook(file);
      setParsed(result);
    } catch (err) {
      setParseError(err.message || "Couldn't read that file. Make sure it's a .xlsx file exported from the template.");
    } finally {
      setParsing(false);
    }
  }

  function handleConfirm() {
    if (!parsed?.questions?.length) return;
    onImport(parsed.questions, reset);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-border-subtle bg-bg-panel p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary">Upload questions from Excel</h3>
          <button onClick={handleClose} className="text-text-muted hover:text-text-primary" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={downloadQuestionTemplate}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary hover:border-accent hover:text-accent"
          >
            <FileDown size={15} />
            Download the template (.xlsx)
          </button>
          <p className="text-xs text-text-muted">
            Fill in the template, keeping the header row as-is, then upload it below. Objective and Essay
            questions can both be in the same file.
          </p>

          <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-4 py-6 text-center hover:border-accent">
            <FileSpreadsheet size={22} className="text-text-muted" />
            <span className="text-sm text-text-secondary">
              {fileName || "Click to choose a filled-in .xlsx file"}
            </span>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
          </label>

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 size={15} className="animate-spin" /> Reading file…
            </div>
          )}

          {parseError && <p className="text-sm text-status-danger">{parseError}</p>}

          {parsed && (
            <div className="space-y-2 rounded-lg border border-border-subtle bg-bg-panel-alt p-3">
              <div className="flex items-center gap-2 text-sm text-accent">
                <CheckCircle2 size={15} />
                {parsed.questions.length} question{parsed.questions.length === 1 ? "" : "s"} ready to import
              </div>
              {parsed.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-status-warning">
                    <AlertTriangle size={15} />
                    {parsed.errors.length} row{parsed.errors.length === 1 ? "" : "s"} skipped
                  </div>
                  <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-text-muted">
                    {parsed.errors.map((e, i) => (
                      <li key={i}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!parsed?.questions?.length || busy}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-app hover:bg-accent-strong disabled:opacity-60"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              Import {parsed?.questions?.length || ""} question{parsed?.questions?.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
