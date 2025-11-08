// app/(main)/practice/[subjectId]/chooseChapter.tsx
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getTopics } from "@/services/api.edu";
import { BackIcon } from "@/assets/logo";
import { ChooseSubDownIndicator } from "@/assets/logo2";

type Topic = {
  id: string;
  title: string;
};

type TopicBtnProps = { label: string; onPress?: () => void };
const TopicBtn = ({ label, onPress }: TopicBtnProps) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    className="w-full rounded-2xl bg-[#F07D53] px-4 py-3 mb-3"
  >
    <Text
      numberOfLines={3}
      ellipsizeMode="tail"
      className="text-white text-[16px] font-semibold leading-snug text-center"
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function SubjectTopics() {
  const router = useRouter();
  const { subjectId } = useLocalSearchParams<{
    subjectId: string;
  }>();
  const token = useSelector((s: RootState) => s.auth.token);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);

  // Measurements for scroll state (to drive the indicator)
  const [containerH, setContainerH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!token || !subjectId) return;
      setLoading(true);
      try {
        const res = await getTopics(token, { subjectId: String(subjectId) });
        setTopics(
          (res || []).map((t: any) => ({
            id: String(t.id),
            title: String(t.name ?? t.title ?? ""),
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, subjectId]);

  const handleOpenTopic = (topic: Topic) => {
    if (!topic?.id) return;
    router.push({
      pathname: "/practice/[topicId]/chooseSubTopics",
      params: {
        topicId: topic.id, // send topic ID
      },
    } as const);
  };

  // Heuristic: consider an item “long” if > 28 chars or contains a newline
  const hasLongItems = useMemo(
    () =>
      topics.some(
        (t) => (t.title?.length ?? 0) > 28 || /\n/.test(t.title ?? "")
      ),
    [topics]
  );
  const manyItems = useMemo(() => topics.length > 5, [topics.length]);

  // Cap and allow scroll if many items or long items (same as subjects behavior)
  const shouldCapAndScroll = manyItems || hasLongItems;

  // Determine if scrolling is actually possible (content larger than container)
  const canScroll = useMemo(
    () => shouldCapAndScroll && contentH > containerH + 1,
    [shouldCapAndScroll, contentH, containerH]
  );

  // Bottom detection to flip indicator to top when at end
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
          <Text className="text-[20px] font-extrabold text-[#E3642A]">
            Select Chapters
          </Text>
          {/* <Text className="text-[14px] text-neutral-600 mt-1">
            Choose what to practice today
          </Text> */}
        </View>

        {/* Content with inner scroll and directional indicator */}
        {loading ? (
          <View className="flex-1 items-center justify-center mt-12">
            <ActivityIndicator />
            <Text className="mt-2 text-neutral-600">Loading topics…</Text>
          </View>
        ) : (
          <View className="px-8 mt-20">
            <View className="w-full rounded-3xl bg-[#F6DCC8] px-6 py-6 items-center">
              <View
                onLayout={onContainerLayout}
                style={{
                  width: "100%",
                  position: "relative",
                  ...(shouldCapAndScroll ? { maxHeight: 300 } : null),
                }}
              >
                <ScrollView
                  contentContainerStyle={{ paddingBottom: 0 }}
                  showsVerticalScrollIndicator={false} // hide scrollbar
                  scrollEnabled={shouldCapAndScroll}
                  nestedScrollEnabled
                  onContentSizeChange={onContentSizeChange}
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                >
                  {topics.length === 0 ? (
                    <Text className="text-neutral-600 text-[14px]">
                      No topics found.
                    </Text>
                  ) : (
                    topics.map((item) => (
                      <TopicBtn
                        key={item.id}
                        label={item.title || "Topic"}
                        onPress={() => handleOpenTopic(item)}
                      />
                    ))
                  )}
                </ScrollView>

                {/* Directional indicator (same behavior as subjects screen) */}
                {canScroll && !atBottom ? (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: -70, // inside the panel bottom edge
                      alignItems: "center",
                    }}
                  >
                    <ChooseSubDownIndicator />
                  </View>
                ) : null}

                {canScroll && atBottom ? (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: -70, // inside the panel top edge
                      alignItems: "center",
                      transform: [{ rotate: "180deg" }], // reuse down icon as "up"
                    }}
                  >
                    <ChooseSubDownIndicator />
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
