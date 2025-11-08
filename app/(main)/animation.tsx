// app/(main)/animation.tsx — gate by login method, then completeness
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";
import { Href, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getme } from "@/services/api.auth";
import { setUser } from "@/store/slices/authSlice";
import { useDispatch } from "react-redux";

export default function AnimationsScreen() {
  const router = useRouter();
  const token = useSelector((s: RootState) => s.auth.token);
  const userInfo = useSelector((state: RootState) => state.auth.userInfo);
  const classInfo = useSelector((state: RootState) => state.academics.selectedClass);
  const boardInfo = useSelector((state: RootState) => state.academics.selectedBoard);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showMicroFade, setShowMicroFade] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    console.log("######Token in redux", token);

    const isNonEmpty = (v: any) =>
      v !== undefined && v !== null && String(v).trim().length > 0;

    // Only require stream when we can clearly parse a numeric class (e.g., "11", "Class 12")
    const requiresStream = (classLabel: any) => {
      const raw = String(classLabel ?? "").trim();
      // Match "11", "12", "Class 11", "class12" etc.
      const direct = raw.match(/^(\d{1,2})$/);
      const withWord = raw.match(/class\s*(\d{1,2})/i);
      const n = direct
        ? Number(direct[1])
        : withWord
        ? Number(withWord[1])
        : NaN;
      return Number.isFinite(n) && n >= 11;
    };

    const run = async () => {
      let target: Href = "/(auth)/login" as Href;

      try {
        if (!token) {
          target = "/(auth)/login" as Href;
        } else {
          const me = await getme(token);

          dispatch(
            setUser({
              token: token!,
              userInfo: {
                alias: me?.alias,
                class: me?.student_class,
                board: me?.board,
                stream: me?.stream,
                school: me?.school,
              } as any,
            })
          );

          console.log("######Data in redux", userInfo, ", Class Number", classInfo?.name, ", Board Name", boardInfo?.name);
          // Normalize method
          const method = String(me?.signup_method || "").toLowerCase();
          const isPhoneLogin = method.startsWith("phone"); // phone-otp, phone-pwd, etc.
          const isEmailLogin = method.startsWith("email"); // email, email-pwd, email-otp, etc.

          // Prefer human-readable class name if API provides one; otherwise use ID only for presence
          const clsId =
            me?.student_class ??
            me?.class_id ??
            me?.school_class_id ??
            me?.class ??
            me?.school_class;

          const clsName =
            me?.student_class_name ??
            me?.class_name ??
            me?.school_class_name ??
            "";

          const email = me?.email ?? "";
          const phone = me?.phone_number ?? "";
          const board = me?.board ?? me?.board_id ?? "";
          const stream = me?.stream ?? me?.stream_id ?? "";
          const school = me?.school ?? "";

          const hasEmail = isNonEmpty(email);
          const hasPhone = isNonEmpty(phone);
          const hasClass = isNonEmpty(clsId) || isNonEmpty(clsName);
          const hasBoard = isNonEmpty(board);
          const needsStream = requiresStream(clsName); // only check numeric label, not UUIDs
          const hasStream = isNonEmpty(stream);
          const hasSchool = isNonEmpty(school);

          const allComplete =
            hasEmail &&
            // hasPhone &&
            hasSchool;

          if (isPhoneLogin) {
            target = allComplete
              ? ("/(main)/dashboard" as Href)
              : ("/(auth)/chat-email" as Href);
          } else if (isEmailLogin) {
            target = allComplete
              ? ("/(main)/dashboard" as Href)
              : ("/(auth)/chat-phone" as Href);
          } else {
            // Fallback by missing identity, else completeness
            if (!hasEmail && hasPhone) target = "/(auth)/chat-email" as Href;
            else if (hasEmail && !hasPhone)
              target = "/(auth)/chat-phone" as Href;
            else
              target = allComplete
                ? ("/(main)/dashboard" as Href)
                : ("/(auth)/chat-email" as Href);
          }
        }
      } catch {
        target = "/(auth)/signup-options" as Href;
      }

      if (target === "/(main)/dashboard") {
        setShowMicroFade(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => router.replace(target));
      } else {
        router.replace(target);
      }
    };

    run();
  }, [fadeAnim, router, token]);

  if (!showMicroFade) return null;

  return (
    <View className="flex-1 bg-[#E4C7A6] items-center justify-center">
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text className="text-2xl font-bold text-black">Welcome Back 👋</Text>
      </Animated.View>
    </View>
  );
}
