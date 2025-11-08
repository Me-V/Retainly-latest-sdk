// app/(main)/practice/[topicId]/chooseSubTopics.tsx
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getSubTopics } from "@/services/api.edu";
import { ChooseSubDownIndicator } from "@/assets/logo2";
import { BackIcon } from "@/assets/logo";

type SubTopic = { id?: string; uuid?: string; name?: string; title?: string };
const getId = (s: SubTopic) => s.id || s.uuid || "";
const getName = (s: SubTopic) => s.name || s.title || "Unnamed";

const SubTopicBtn = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => (
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

export default function ChooseSubTopics() {
  const router = useRouter();
  const token = useSelector((s: RootState) => s.auth.token);
  const { topicId } = useLocalSearchParams<{
    topicId: string;
  }>();

  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [loading, setLoading] = useState(false);

  // Measurements for inner scroll + arrow indicators (same pattern as chapters screen)
  const [containerH, setContainerH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Heuristics: enable cap/scroll when many or long items
  const hasLongItems = useMemo(
    () =>
      subTopics.some((t) => getName(t).length > 28 || /\n/.test(getName(t))),
    [subTopics]
  );
  const manyItems = useMemo(() => subTopics.length > 5, [subTopics.length]);
  const shouldCapAndScroll = manyItems || hasLongItems;

  // Scrollability + bottom detection
  const canScroll = useMemo(
    () => shouldCapAndScroll && contentH > containerH + 1,
    [shouldCapAndScroll, contentH, containerH]
  );
  const maxScroll = Math.max(0, contentH - containerH);
  const atBottom = canScroll && scrollY >= maxScroll - 2;

  const dummyData = [
    { id: "1", name: "subtopic1" },
    { id: "2", name: "subtopic2" },
    { id: "3", name: "subtopic3" },
    { id: "4", name: "subtopic4" },
    { id: "5", name: "subtopic5" },
    { id: "6", name: "subtopic6" },
    { id: "7", name: "subtopic7" },
    { id: "8", name: "subtopic8" },
    { id: "9", name: "subtopic9" },
    { id: "10", name: "subtopic10" },
  ];

  useEffect(() => {
    const load = async () => {
      if (!token || !topicId) return;
      setLoading(true);
      try {
        const res = await getSubTopics(token, { topicId });
        setSubTopics(Array.isArray(res) ? res : dummyData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, topicId]);

  const handleSelect = (sub: SubTopic) => {
    const subId = getId(sub);
    if (!subId) return;
    router.push({
      pathname: "/practice/[subTopicId]/chooseQuestion",
      params: { subTopicId: subId, name: getName(sub) },
    } as const);
  };

  // Handlers for dynamic height/scroll state
  const onContainerLayout = (e: LayoutChangeEvent) =>
    setContainerH(e.nativeEvent.layout.height);
  const onContentSizeChange = (_w: number, h: number) => setContentH(h);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setScrollY(e.nativeEvent.contentOffset.y);

  return (
    <LinearGradient
      colors={["#FFFFFF", "#F3E8DD", "#E4C7A6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        {/* Top bar with back (mirrors chapters screen) */}
        <View className="px-5 pt-6">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <BackIcon />
          </TouchableOpacity>
        </View>

        {/* Heading (same size/color/placement as chapters) */}
        <View className="px-5 mt-8 items-center">
          <Text className="text-[20px] font-extrabold text-[#E3642A]">
            Select Subtopics
          </Text>
        </View>

        {/* Card container with capped inner scroll and directional indicator */}
        {loading ? (
          <View className="flex-1 items-center justify-center mt-12">
            <ActivityIndicator />
            <Text className="mt-2 text-neutral-600">Loading subtopics…</Text>
          </View>
        ) : (
          <View className="px-8 mt-20">
            <View className="w-full rounded-3xl bg-[#F6DCC8] px-6 py-6 items-center">
              <View
                onLayout={onContainerLayout}
                className={`w-full relative ${
                  shouldCapAndScroll ? "max-h-[300px]" : ""
                }`}
              >
                <ScrollView
                  contentContainerStyle={{ paddingBottom: 0 }}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={shouldCapAndScroll}
                  nestedScrollEnabled
                  onContentSizeChange={onContentSizeChange}
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                >
                  {subTopics.length === 0 ? (
                    <Text className="text-neutral-600 text-[14px]">
                      No subtopics found.
                    </Text>
                  ) : (
                    subTopics.map((sub) => (
                      <SubTopicBtn
                        key={getId(sub)}
                        label={getName(sub)}
                        onPress={() => handleSelect(sub)}
                      />
                    ))
                  )}
                </ScrollView>

                {/* Directional indicator — bottom when not at end */}
                {canScroll && !atBottom && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: -70,
                      alignItems: "center",
                    }}
                  >
                    <ChooseSubDownIndicator />
                  </View>
                )}

                {/* Flip to top when at end */}
                {canScroll && atBottom && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: -70,
                      alignItems: "center",
                      transform: [{ rotate: "180deg" }],
                    }}
                  >
                    <ChooseSubDownIndicator />
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
