// src/utils/nameById.ts
import type { Option } from "@/utils/profileHelpers/profile.types";

export const makeNameById = (options: Option[]) => {
  const map = new Map<string, string>();
  for (const o of options) map.set(String(o.id), String(o.name));
  return (id?: string | number | null) =>
    id != null ? map.get(String(id)) ?? String(id) : "—";
};
