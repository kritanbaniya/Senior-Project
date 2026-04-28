export type UserRole = "patient" | "nurse" | "doctor" | "clinic" | "system_admin" | null | undefined;

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
    case "system_admin":
      return "/dashboard/system-admin";
    default:
      return "/";
  }
}