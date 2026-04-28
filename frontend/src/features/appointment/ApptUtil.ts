




export const statusColor = (status: string): string => {
  const STATUS_COLORS: Record<string, string> = {
    completed: "#16a34a", // green
    active: "#2563eb",    // blue
    unseen: "#eab308",    // yellow
    pending: "#f97316",   // orange
    canceled: "#dc2626",  // red
    deserted: "#7f1d1d",  // dark red
    default: "#64748b",   // slate gray
  };
  console.log(STATUS_COLORS[status])
  return STATUS_COLORS[status] ?? STATUS_COLORS.default;
};







