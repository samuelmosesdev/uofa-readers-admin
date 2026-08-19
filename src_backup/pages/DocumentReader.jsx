import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { ArrowLeft, Menu, Download, ExternalLink, FileText } from "lucide-react";
import { db } from "../firebase/config";
import { withDownloadFlag } from "../lib/cloudinaryUpload";

function getExtension(name = "", url = "") {
  const source = name || url;
  const match = source.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "";
}

function useDocumentRecord(docId) {
  const [record, setRecord] = useState(undefined); // undefined = loading, null = not found
  useEffect(() => {
    if (!docId) return;
    setRecord(undefined);
    const unsub = onSnapshot(
      doc(db, "documents", docId),
      (snap) => setRecord(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => setRecord(null)
    );
    return unsub;
  }, [docId]);
  return record;
}

export default function DocumentReader() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const item = useDocumentRecord(docId);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (item === undefined) {
    return <div className="flex h-[60vh] items-center justify-center text-sm text-ink-muted">Loading document…</div>;
  }

  if (item === null) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <FileText size={28} className="text-ink-muted" />
        <p className="text-sm text-ink-muted">This document isn't available anymore.</p>
        <button
          onClick={() => navigate("/dashboard/reading-hub")}
          className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-dark"
        >
          Back to Reading Hub
        </button>
      </div>
    );
  }

  const ext = getExtension(item.fileName, item.fileUrl);
  const isPdf = ext === "pdf";
  const downloadUrl = withDownloadFlag(item.fileUrl, item.fileName || item.title);

  // Non-PDF files (doc, docx, ppt, pptx, etc.) are rendered through Google's
  // viewer so they still open inside our site instead of forcing a download.
  const viewerSrc = isPdf ? item.fileUrl : `https://docs.google.com/viewer?url=${encodeURIComponent(item.fileUrl)}&embedded=true`;

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-xl border border-border-light bg-card-light sm:h-[calc(100vh-3rem)]">
      <div className="flex items-center justify-between gap-3 border-b border-border-light px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/reading-hub")}
            aria-label="Back"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-light hover:text-ink"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-ink sm:text-base">{item.title}</h1>
            <p className="truncate text-xs text-ink-muted">
              {[item.faculty, item.level].filter(Boolean).join(" • ") || "General"}
            </p>
          </div>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Document options"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-light hover:text-ink"
          >
            <Menu size={19} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-lg border border-border-light bg-card-light shadow-lg">
              <a
                href={downloadUrl}
                download={item.fileName || item.title}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-surface-light"
              >
                <Download size={15} className="text-ink-muted" />
                Download
              </a>
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-surface-light"
              >
                <ExternalLink size={15} className="text-ink-muted" />
                Open in new tab
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 bg-surface-light">
        <iframe src={viewerSrc} title={item.title} className="h-full w-full border-0" />
      </div>
    </div>
  );
}
