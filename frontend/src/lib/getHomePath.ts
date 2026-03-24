export type UserRole = "patient" | "nurse" | "doctor" | "clinic" | null | undefined;

export function getHomePath(role: UserRole): string {
  switch (role) {
    case "patient":
      return "/dashboard/patient";
    case "nurse":
      return "/dashboard/nurse";
    case "doctor":
      return "/dashboard/doctor";
    case "clinic":
      return "/dashboard/clinic";
    default:
      return "/";
  }
}