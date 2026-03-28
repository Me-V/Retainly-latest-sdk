// app/(main)/practice/[subTopicId]/chooseQuestion.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getQuestions } from "@/services/api.edu";
import Ionicons from "@expo/vector-icons/Ionicons";
import { GlassyListBtn } from "@/components/GlassyListBtn";
import { startAttempt } from "@/services/api.chat";
import { Octicons } from "@expo/vector-icons";
import PopupModal from "@/components/Popup-modal";

// --- TYPES ---
type Question = {
  id?: string;
  name?: string;
  title?: string;
  text?: string;
  is_completed?: boolean;
  is_locked?: boolean;
};
const getId = (q: Question) => String(q.id || "");
const getName = (q: Question) => q.title || q.text || "Unnamed Question";

export default function SubTopicQuestions() {
  const router = useRouter();
  const { width, height: screenHeight } = useWindowDimensions();
  const isTablet = width >= 768;

  // Use same container logic as previous screens
  const containerMaxHeight = screenHeight * 0.6;
  const containerWidth = isTablet ? 600 : "100%";

  const token = useSelector((s: RootState) => s.auth.token);
  const { subTopicId, name } = useLocalSearchParams<{
    subTopicId: string;
    name?: string;
  }>();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  // State for the suspension popup
  const [isSuspendedPopupVisible, setIsSuspendedPopupVisible] = useState(false);

  const [startingAttempt, setStartingAttempt] = useState(false);

  const [isLockedPopupVisible, setIsLockedPopupVisible] = useState(false);

  // Inner scroll state
  const [containerH, setContainerH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // --- DESIGN CONSTANTS ---
  const GLOW_COLOR = "rgba(255, 255, 255, 0.04)";
  const GLOW_SIZE = 25;

  // --- API LOGIC ---
  // Using useFocusEffect so it refreshes data instantly when returning from the Chat Screen
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchQuestionsList = async () => {
        if (!token || !subTopicId) return;

        // Only show the loading spinner if the list is completely empty (first load)
        setQuestions((currentQuestions) => {
          if (currentQuestions.length === 0 && isActive) {
            setLoading(true);
          }
          return currentQuestions;
        });

        try {
          const res = await getQuestions(token, {
            subTopicId: String(subTopicId),
          });
          if (isActive) {
            setQuestions(Array.isArray(res) ? res : []);
          }
        } catch (error) {
          console.error("Error fetching questions:", error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchQuestionsList();

      // Cleanup function to prevent setting state if the user leaves immediately
      return () => {
        isActive = false;
      };
    }, [token, subTopicId]),
  );

  const handleOpenQuestion = async (q: Question) => {
    // console.log("Question:", q);

    const questionId = getId(q);
    if (!questionId || !token) return;

    setStartingAttempt(true);
    try {
      // 1. Call API to start attempt
      const response = await startAttempt(token, questionId);

      // 2. Navigate to Chat Screen with attempt_id
      if (response?.attempt_id) {
        router.push({
          pathname: "/tutor/chat/[attemptId]",
          params: {
            attemptId: response.attempt_id,
            initialQuestion: q.text || q.title || "Practice Question",
          },
        });
      }
    } catch (error: any) {
      console.error(error);

      // Catch the 400 error to show the suspension modal
      if (error?.response?.status === 400) {
        setIsSuspendedPopupVisible(true);
      } else {
        Alert.alert("Error", "Could not start practice session.");
      }
    } finally {
      setStartingAttempt(false);
    }
  };

  // --- SCROLL LOGIC ---
  const canScroll = useMemo(
    () => contentH > containerH + 10,
    [contentH, containerH],
  );
  const maxScroll = Math.max(0, contentH - containerH);
  const atBottom = canScroll && scrollY >= maxScroll - 20;

  const onContainerLayout = (e: LayoutChangeEvent) =>
    setContainerH(e.nativeEvent.layout.height);
  const onContentSizeChange = (_w: number, h: number) => setContentH(h);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setScrollY(e.nativeEvent.contentOffset.y);

  return (
    <LinearGradient
      // Deep Purple Gradient
      colors={["#3B0A52", "#180323"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerClassName="pb-6 flex-grow">
        {/* Header */}
        <View className="px-6 flex-row justify-between items-center z-10">
          <TouchableOpacity
            onPress={() => router.push("/(main)/dashboard")}
            activeOpacity={0.8}
          >
            <Octicons
              name="home-fill"
              size={28}
              color="#FFA629"
              className="ml-2.5"
            />
          </TouchableOpacity>
          <Image
            source={require("@/assets/AppLogo.png")}
            className="w-[90px] h-[90px] mt-6"
          />
        </View>

        {/* Title */}
        <View className="px-6 mt-0 items-center z-10">
          <Text className="text-[26px] font-bold text-white mb-2 text-center tracking-wide">
            Select Question
          </Text>
          <Text className="text-[15px] text-white/70 font-normal text-center">
            {name ? `Practice ${name}` : "Choose a question to solve"}
          </Text>
        </View>

        {/* Main Content Area */}
        <View className="flex-1 items-center px-6 mt-10 mb-10 w-full relative">
          {loading ? (
            <ActivityIndicator size="large" color="#F59E51" className="mt-10" />
          ) : (
            <>
              {/* --- Up Arrow --- */}
              {canScroll && scrollY > 20 && (
                <View
                  pointerEvents="none"
                  className="absolute top-[-30px] z-20 items-center justify-center w-full"
                >
                  <Ionicons
                    name="chevron-up"
                    size={24}
                    color="white"
                    style={{ opacity: 0.8 }}
                  />
                </View>
              )}

              {/* --- GLASS CONTAINER --- */}
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.15)",
                  "rgba(255, 255, 255, 0.02)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                className="rounded-[30px] border border-white/10 p-1 overflow-hidden"
                style={{
                  maxHeight: containerMaxHeight,
                  width: containerWidth,
                  borderRadius: 30,
                }}
              >
                {/* Inner Glows */}
                <LinearGradient
                  colors={[GLOW_COLOR, "transparent"]}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: GLOW_SIZE,
                    zIndex: -1,
                  }}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={["transparent", GLOW_COLOR]}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: GLOW_SIZE,
                    zIndex: -1,
                  }}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={[GLOW_COLOR, "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: GLOW_SIZE,
                    zIndex: -1,
                  }}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={["transparent", GLOW_COLOR]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: GLOW_SIZE,
                    zIndex: -1,
                  }}
                  pointerEvents="none"
                />

                <View
                  className="w-full px-5 py-6 relative"
                  onLayout={onContainerLayout}
                >
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    onContentSizeChange={onContentSizeChange}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    scrollEnabled={true}
                  >
                    {questions.length === 0 ? (
                      <Text className="text-white/60 text-[14px] text-center mt-4">
                        No questions found.
                      </Text>
                    ) : (
                      questions.map((q) => {
                        // 🟢 1. Pre-determine the icon based on status
                        let statusIcon = null;
                        if (q.is_locked) {
                          statusIcon = (
                            <Ionicons
                              name="lock-closed"
                              size={20}
                              color="rgba(255,255,255,0.4)"
                            />
                          );
                        } else if (q.is_completed) {
                          statusIcon = (
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color="#4ADE80" // Green tick
                            />
                          );
                        }

                        return (
                          // 🟢 2. Remove "relative" container, we don't need absolute positioning anymore
                          <View key={getId(q)}>
                            <GlassyListBtn
                              label={getName(q)}
                              onPress={() => {
                                if (q.is_locked) {
                                  setIsLockedPopupVisible(true);
                                } else {
                                  handleOpenQuestion(q);
                                }
                              }}
                              numberOfLines={3}
                              // 🟢 3. Pass the icon into the component prop (assuming rightIcon exists)
                              // This allows Flexbox inside GlassyListBtn to wrap the text correctly.
                              rightIcon={statusIcon}
                            />
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              </LinearGradient>

              {/* --- Down Arrow --- */}
              {canScroll && !atBottom && (
                <View
                  pointerEvents="none"
                  className="absolute bottom-[-10px] z-20 items-center justify-center w-full"
                >
                  <Ionicons
                    name="chevron-down"
                    size={24}
                    color="white"
                    style={{ opacity: 0.8 }}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      {/* Account Suspended Modal */}
      <PopupModal
        isVisible={isSuspendedPopupVisible}
        onClose={() => setIsSuspendedPopupVisible(false)}
        // 1. Leave heading undefined to use custom inline layout inside the icon prop
        icon={
          <View
            style={{
              width: Math.min(width * 0.85, 360),
              alignItems: "center",
              marginTop: -10,
            }}
          >
            {/* Inline Icon & Title */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              {/* Red Exclamation Circle */}
              <LinearGradient
                colors={["#E53935", "#B71C1C"]}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
                >
                  !
                </Text>
              </LinearGradient>

              <Text
                style={{ color: "white", fontSize: 24, fontWeight: "bold" }}
              >
                Disciplinary Suspension
              </Text>
            </View>

            {/* Full-width Red Divider */}
            <View
              style={{ height: 2, backgroundColor: "#991B1B", width: "100%" }}
            />
          </View>
        }
        // 2. Custom text styling to match the screenshot's lighter font weight
        content={
          <Text
            style={{
              color: "white",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 20,
              fontWeight: "500",
              marginTop: 8,
            }}
          >
            You are temporarily suspended from answering due high number of
            Inappropriate Language
          </Text>
        }
        primaryText="OK"
        onPrimary={() => {
          setIsSuspendedPopupVisible(false);
        }}
        theme="dark"
      />

      {/* Locked Question Modal */}
      <PopupModal
        isVisible={isLockedPopupVisible}
        onClose={() => setIsLockedPopupVisible(false)}
        icon={
          <View
            style={{
              width: Math.min(width * 0.85, 360),
              alignItems: "center",
              marginTop: -10,
            }}
          >
            {/* Inline Icon & Title */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              {/* Orange Lock Circle */}
              <LinearGradient
                colors={["#F59E51", "#EA580C"]}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name="lock-closed" size={20} color="white" />
              </LinearGradient>

              <Text
                style={{ color: "white", fontSize: 22, fontWeight: "bold" }}
              >
                Question Locked
              </Text>
            </View>

            {/* Full-width Orange Divider */}
            <View
              style={{
                height: 2,
                backgroundColor: "#EA580C",
                width: "100%",
                opacity: 0.8,
              }}
            />
          </View>
        }
        content={
          <Text
            style={{
              color: "white",
              fontSize: 16,
              textAlign: "center",
              lineHeight: 22,
              fontWeight: "500",
              marginTop: 8,
            }}
          >
            This question is currently locked. Complete previous requirements to
            unlock it.
          </Text>
        }
        primaryText="Understood"
        onPrimary={() => setIsLockedPopupVisible(false)}
        theme="dark"
      />
    </LinearGradient>
  );
}
