// src/hooks/profile/useBoardOptions.ts
import { useEffect, useMemo, useState } from "react";
import { getBoards } from "@/services/api.edu";
import type { Option } from "@/utils/profileHelpers/profile.types";
import { makeNameById } from "@/utils/profileHelpers/profile.nameById";

export const useBoardOptions = (token?: string, classId?: string) => {
  const [boards, setBoards] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const list = await getBoards(token as string, classId);
        const mapped = list
          .map((b: any) => {
            const name = b?.name ?? b?.board_name ?? b?.title ?? "";
            return { id: String(b.id), name: String(name) } as Option;
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        if (mounted) setBoards(mapped);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, classId]);

  const nameById = useMemo(() => makeNameById(boards), [boards]);
  return { boards, boardsLoading: loading, boardNameById: nameById };
};
