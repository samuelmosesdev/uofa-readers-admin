export default function StudentKpiCard({ icon: Icon, value, label, circular = false }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-teal p-5 text-white">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
        <Icon size={16} />
      </span>
      <div className="mt-4">
        {circular ? (
          <span className="text-sm font-medium leading-snug">{value}</span>
        ) : (
          <>
            <span className="block text-2xl font-bold leading-tight">{value}</span>
            <span className="text-xs text-white/80">{label}</span>
          </>
        )}
      </div>
    </div>
  );
}
