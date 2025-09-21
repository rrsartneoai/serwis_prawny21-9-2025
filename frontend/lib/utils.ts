import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the appropriate panel URL based on user role
 */
export function getPanelUrlByRole(role: "client" | "operator" | "admin" | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "operator":
      return "/panel-operatora";
    case "client":
    default:
      return "/panel-klienta";
  }
}
