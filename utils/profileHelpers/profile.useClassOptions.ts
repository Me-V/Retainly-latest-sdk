// src/hooks/profile/useClassOptions.ts
import { useEffect, useMemo, useState } from "react";
import { getClasses } from "@/services/api.edu";
import type { Option } from "@/utils/profileHelpers/profile.types";
import { makeNameById } from "@/utils/profileHelpers/profile.nameById";

export const useClassOptions = (token?: string) => {
  const [classes, setClasses] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const list = await getClasses(token as string);
        const mapped = list
          .map((c: any) => ({ id: String(c.id), name: String(c.name) }))
          .sort((a, b) => a.name.localeCompare(b.name));
        if (mounted) setClasses(mapped);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const nameById = useMemo(() => makeNameById(classes), [classes]);
  return { classes, classesLoading: loading, classNameById: nameById };
};
