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
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getQuestions } from "@/services/api.edu";
import { ChooseSubDownIndicator } from "@/assets/logo2";
import { BackIcon } from "@/assets/logo";

type Question = { id?: string; name?: string; title?: string; text?: string };
const getId = (q: Question) => String(q.id || "");
const getName = (q: Question) => q.title || q.text || "Unnamed";

const QuestionBtn = ({
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

export default function SubTopicQuestions() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const containerMaxHeight = isTablet ? 520 : 300;
  const token = useSelector((s: RootState) => s.auth.token);
  const { subTopicId } = useLocalSearchParams<{
    subTopicId: string;
  }>();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  // Inner scroll + indicator state (same pattern)
  const [containerH, setContainerH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const hasLongItems = useMemo(
    () =>
      questions.some((q) => getName(q).length > 28 || /\n/.test(getName(q))),
    [questions]
  );
  const manyItems = useMemo(() => questions.length > 5, [questions.length]);
  const shouldCapAndScroll = manyItems || hasLongItems;

  const canScroll = useMemo(
    () => shouldCapAndScroll && contentH > containerH + 1,
    [shouldCapAndScroll, contentH, containerH]
  );
  const maxScroll = Math.max(0, contentH - containerH);
  const atBottom = canScroll && scrollY >= maxScroll - 2;

  useEffect(() => {
    const load = async () => {
      if (!token || !subTopicId) return;
      setLoading(true);
      try {
        const res = await getQuestions(token, {
          subTopicId: String(subTopicId),
        });
        setQuestions(Array.isArray(res) ? res : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, subTopicId]);

  const handleOpenQuestion = (q: Question) => {
    const questionId = getId(q);
    if (!questionId) return;
    // Navigate to a question detail/attempt screen
    // router.push({ pathname: "/practice/[questionId]/attempt", params: { questionId } } as const);
    console.log("Open question:", questionId, getName(q));
  };

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
        {/* Top bar with back */}
        <View className="px-5 pt-6">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <BackIcon />
          </TouchableOpacity>
        </View>

        {/* Heading */}
        <View className="px-5 mt-20 mb-5 items-center">
          <Text className="text-[24px] font-extrabold text-[#E3642A]">
            Select Question
          </Text>
        </View>

        {/* Card with capped inner scroll */}
        {loading ? (
          <View className="flex-1 items-center justify-center mt-6">
            <ActivityIndicator />
            <Text className="mt-2 text-neutral-600">Loading questions…</Text>
          </View>
        ) : (
          <View className="px-8 mt-16">
            <View className="w-full rounded-3xl bg-[#F6DCC8] px-6 py-6 items-center">
              <View
                onLayout={onContainerLayout}
                style={{
                  width: "100%",
                  position: "relative",
                  maxHeight: containerMaxHeight, // 📌 tablet-aware height
                }}
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
                  {questions.length === 0 ? (
                    <Text className="text-neutral-600 text-[14px]">
                      No questions found.
                    </Text>
                  ) : (
                    questions.map((q) => (
                      <QuestionBtn
                        key={getId(q)}
                        label={getName(q)}
                        onPress={() => handleOpenQuestion(q)}
                      />
                    ))
                  )}
                </ScrollView>

                {/* ↓ Down indicator */}
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

                {/* ↑ Up indicator */}
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
