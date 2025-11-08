// src/hooks/profile/useUserProfile.ts
import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/utils/profileHelpers/profile.storeHooks";
import { getme, patchMe } from "@/services/api.auth";
import { setUser } from "@/store/slices/authSlice";
import {
  setSelectedClass as setSelectedClassAction,
  setSelectedStream as setSelectedStreamAction,
  setSelectedBoard as setSelectedBoardAction,
} from "@/store/slices/academicsSlice";
import type { ProfileForm } from "@/utils/profileHelpers/profile.types";

export const useUserProfile = ({
  classNameById,
  streamNameById,
  boardNameById,
}: {
  classNameById: (id?: string | number | null) => string;
  streamNameById: (id?: string | number | null) => string;
  boardNameById: (id?: string | number | null) => string;
}) => {
  const token = useAppSelector((s) => s.auth.token);
  const dispatch = useAppDispatch();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState<ProfileForm>({
    alias: "",
    email: "",
    phone_number: "",
    student_class: "",
    board: "",
    stream: "",
    school: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const me = await getme(token as string);
        if (!mounted) return;
        setUserData(me);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!userData) return;
    setForm({
      alias: userData?.alias ?? "",
      email: userData?.email ?? "",
      phone_number: userData?.phone_number ?? "",
      student_class: String(userData?.student_class ?? ""),
      board: userData?.board ?? "",
      stream: userData?.stream ?? "",
      school: userData?.school ?? "",
    });
  }, [userData, editing]);

  const hasChanges = useMemo(() => {
    if (!userData) return false;
    return (
      (userData?.alias ?? "") !== form.alias ||
      (userData?.email ?? "") !== form.email ||
      (userData?.phone_number ?? "") !== form.phone_number ||
      String(userData?.student_class ?? "") !== form.student_class ||
      (userData?.board ?? "") !== form.board ||
      (userData?.stream ?? "") !== form.stream ||
      (userData?.school ?? "") !== form.school
    );
  }, [userData, form]);

  const emailValid = useMemo(() => !form.email || /\S+@\S+\.\S+/.test(form.email), [form.email]);

  const syncReduxSelections = (payload: Partial<ProfileForm>) => {
    const classId = String(payload.student_class ?? userData?.student_class ?? "");
    if (classId) {
      dispatch(setSelectedClassAction({ id: classId, name: classNameById(classId) }));
    }
    const streamId = String(payload.stream ?? userData?.stream ?? "");
    if (streamId) {
      dispatch(setSelectedStreamAction({ id: streamId, name: streamNameById(streamId) }));
    }
    const boardId = String(payload.board ?? userData?.board ?? "");
    if (boardId) {
      dispatch(setSelectedBoardAction({ id: boardId, name: boardNameById(boardId) }));
    }
  };

  const save = async () => {
    if (saving || !emailValid || !hasChanges) return;
    try {
      setSaving(true);
      const payload: Partial<ProfileForm> = {
        alias: form.alias || undefined,
        email: form.email || undefined,
        phone_number: form.phone_number || undefined,
        student_class: form.student_class || undefined,
        board: form.board || undefined,
        stream: form.stream || undefined,
        school: form.school || undefined,
      };
      await patchMe(token as string, payload);
      dispatch(
        setUser({
          token: token!,
          userInfo: {
            alias: payload.alias ?? userData?.alias,
            class: payload.student_class ?? userData?.student_class,
            board: payload.board ?? userData?.board,
            stream: payload.stream ?? userData?.stream,
            school: payload.school ?? userData?.school,
          } as any,
        })
      );
      syncReduxSelections(payload);
      setUserData((prev: any) => ({ ...(prev ?? {}), ...payload }));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setEditing(false);
    if (!userData) return;
    setForm({
      alias: userData?.alias ?? "",
      email: userData?.email ?? "",
      phone_number: userData?.phone_number ?? "",
      student_class: String(userData?.student_class ?? ""),
      board: userData?.board ?? "",
      stream: userData?.stream ?? "",
      school: userData?.school ?? "",
    });
  };

  return {
    token,
    userData,
    setUserData,
    loading,
    saving,
    editing,
    setEditing,
    form,
    setForm,
    hasChanges,
    emailValid,
    save,
    cancel,
  };
};
