import { LoginUser } from "@/api";

export const PAGE_KEY_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  checkkitting: "Checkkitting",
  posting: "Posting",
  makepayment: "Makepayment",
  freight: "Freight",
  users: "Users",
};

export function getUserAllowedTabs(user: LoginUser): string[] {
  const isAdmin = user.Role?.toLowerCase() === "admin";
  if (isAdmin) return Object.keys(PAGE_KEY_MAP);
  const userPages = (user.Page || "")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  return Object.entries(PAGE_KEY_MAP)
    .filter(([_, pageKey]) => userPages.includes(pageKey.toLowerCase()))
    .map(([tabKey]) => tabKey);
}

export function hasAccess(user: LoginUser, tabKey: string): boolean {
  if (user.Role?.toLowerCase() === "admin") return true;
  const userPages = (user.Page || "")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const pageKey = PAGE_KEY_MAP[tabKey];
  return pageKey ? userPages.includes(pageKey.toLowerCase()) : false;
}
