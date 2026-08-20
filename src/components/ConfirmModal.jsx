import Modal from "./Modal";

export default function ConfirmModal({ open, title, message, onCancel, onConfirm, confirmLabel = "Yes", cancelLabel = "Cancel" }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-text-muted">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-secondary">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg-app">
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
