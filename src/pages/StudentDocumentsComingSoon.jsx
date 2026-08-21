import { FileText, Construction } from "lucide-react";

export default function StudentDocumentsComingSoon() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-soft">
        <Construction size={36} className="text-teal" />
      </div>
      <h1 className="text-2xl font-bold text-ink">Documents</h1>
      <p className="mt-3 max-w-md text-sm text-ink-muted leading-relaxed">
        The Documents library is getting a full redesign. In the meantime, course materials
        uploaded by your Course Rep live in <strong className="text-ink">Materials</strong>,
        and you can still use Reading Hub for existing platform documents.
      </p>
      <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border-light bg-card-light px-4 py-2 text-xs font-medium text-ink-muted">
        <FileText size={14} />
        Coming soon
      </div>
    </div>
  );
}
