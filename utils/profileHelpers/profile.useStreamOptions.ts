// src/hooks/profile/useStreamOptions.ts
import { useEffect, useMemo, useState } from "react";
import { getStreams } from "@/services/api.edu";
import type { Option } from "@/utils/profileHelpers/profile.types";
import { makeNameById } from "@/utils/profileHelpers/profile.nameById";

const isSenior = (className: string | undefined) => {
  const n = Number(className);
  return Number.isFinite(n) && n > 10;
};

export const useStreamOptions = (token?: string, classId?: string, className?: string) => {
  const [streams, setStreams] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classId || !isSenior(className)) {
      setStreams([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getStreams(token as string, classId);
        const mapped = res
          .map((s: any) => ({ id: String(s.id), name: String(s.name) }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        if (mounted) setStreams(mapped);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, classId, className]);

  const nameById = useMemo(() => makeNameById(streams), [streams]);
  return { streams, streamsLoading: loading, streamNameById: nameById, isSenior: isSenior(className) };
};
