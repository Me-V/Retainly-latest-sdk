// app/(main)/practice/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getSubjects } from "@/services/api.edu";
import { ChooseSubDownIndicator } from "@/assets/logo2";
import { BackIcon } from "@/assets/logo";

type Subject = {
  id?: string;
  uuid?: string;
  name?: string;
  title?: string;
};

const getId = (s: Subject) => s.id || s.uuid || "";
const getName = (s: Subject) => s.name || s.title || "Subject";

type SubjectBtnProps = { label: string; onPress?: () => void };
const SubjectBtn = ({ label, onPress }: SubjectBtnProps) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    className="w-full h-12 rounded-2xl bg-[#F07D53] items-center justify-center mb-4"
  >
    <Text className="text-white text-[16px] font-semibold">{label}</Text>
  </TouchableOpacity>
);

// Optional: for local testing when API returns few items
const dummyList: Subject[] = [
  { id: "1", name: "Mathematics" },
  { id: "2", name: "Science" },
  { id: "3", name: "English" },
  { id: "4", name: "History" },
  { id: "5", name: "Geography" },
  { id: "6", name: "Biology" },
  { id: "7", name: "Chemistry" },
];

export default function PracticeSubjects() {
  const router = useRouter();

  const token = useSelector((s: RootState) => s.auth.token);
  const userInfo = useSelector((s: RootState) => s.auth.userInfo as any);
  const boardId: string | undefined = userInfo?.board;
  const classId: string | undefined = userInfo?.class;
  const streamId: string | undefined = userInfo?.stream;

  const [data, setData] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  // Measurements for scroll state
  const [containerH, setContainerH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!token || !boardId || !classId) return;
      setLoading(true);
      try {
        const res = await getSubjects(token, {
          boardId,
          classId,
          ...(streamId ? { streamId } : {}),
        });
        setData(Array.isArray(res) ? res : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, boardId, classId, streamId]);

  // Use API data if available, else dummy for testing
  const renderList = data.length > 0 ? data : dummyList;

  // Inner scroll only if more than 5 items
  const moreThanFive = useMemo(
    () => renderList.length > 5,
    [renderList.length]
  );

  // Determine if there is actual overflow to scroll
  const canScroll = useMemo(
    () => moreThanFive && contentH > containerH + 1,
    [moreThanFive, contentH, containerH]
  );

  // Track bottom to place the indicator
  const maxScroll = Math.max(0, contentH - containerH);
  const atBottom = canScroll && scrollY >= maxScroll - 2;

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerH(e.nativeEvent.layout.height);
  };

  const onContentSizeChange = (_w: number, h: number) => {
    setContentH(h);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(e.nativeEvent.contentOffset.y);
  };

  const handleSelect = (s: Subject) => {
    const subjectId = getId(s);
    const name = getName(s);
    if (!subjectId) return;

    router.push({
      pathname: "/practice/[subjectId]/chooseChapter",
      params: { subjectId, name },
    } as const);
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#F3E8DD", "#E4C7A6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
      style={{ flex: 1 }}
    >
      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        {/* Top bar with back */}
        <View className="px-5 pt-6">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <BackIcon />
          </TouchableOpacity>
        </View>

        {/* Heading */}
        <View className="px-5 mt-8 items-center">
          <Text className="text-[24px] font-extrabold text-[#E3642A]">
            Select Subject
          </Text>
          <Text className="text-[14px] text-neutral-600 mt-6">
            What you want to practice today
          </Text>
        </View>

        {/* Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center mt-12">
            <ActivityIndicator />
            <Text className="mt-2 text-neutral-600">Loading subjects…</Text>
          </View>
        ) : (
          <View className="px-8 mt-14">
            <View className="w-full rounded-3xl bg-[#F6DCC8] px-6 py-6 items-center">
              {/* Scrollable area (scrollbar hidden) */}
              <View
                onLayout={onContainerLayout}
                style={{
                  width: "100%",
                  position: "relative",
                  ...(moreThanFive ? { maxHeight: 300 } : null),
                }}
              >
                <ScrollView
                  contentContainerStyle={{ paddingBottom: 0 }}
                  showsVerticalScrollIndicator={false} // fully hide scrollbar
                  scrollEnabled={moreThanFive}
                  nestedScrollEnabled
                  onContentSizeChange={onContentSizeChange}
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                >
                  {renderList.length === 0 ? (
                    <Text className="text-neutral-600 text-[14px]">
                      No subjects available.
                    </Text>
                  ) : (
                    renderList.map((item) => (
                      <SubjectBtn
                        key={getId(item) || getName(item)}
                        label={getName(item)}
                        onPress={() => handleSelect(item)}
                      />
                    ))
                  )}
                </ScrollView>

                {/* Directional indicator:
                    - Show at bottom when scrollable and not at bottom.
                    - Swap to top (rotated) when reached bottom. */}
                {canScroll && !atBottom ? (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: -70, // inside the panel to avoid clipping
                      alignItems: "center",
                    }}
                  >
                    <ChooseSubDownIndicator />
                  </View>
                ) : null}
              </View>
            </View>
            {canScroll && atBottom ? (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: -50, // inside the panel at the top
                  alignItems: "center",
                  transform: [{ rotate: "180deg" }], // reuse as "up"
                }}
              >
                <ChooseSubDownIndicator />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
