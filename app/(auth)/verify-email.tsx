// app/(auth)/verify-email.tsx
import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { getAuth } from "firebase/auth";
import { useDispatch } from "react-redux";
import { signupWithEmailPassword } from "@/services/api.auth";
import { setUser } from "@/store/slices/authSlice";

export default function VerifyEmailScreen() {
  const { targetEmail } = useLocalSearchParams<{ targetEmail?: string }>();
  const dispatch = useDispatch();
  const [loading, setLoading] = React.useState(false);
  const auth = getAuth();

  const onContinue = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No Firebase user.");
      await user.reload();
      if (!user.emailVerified) {
        throw new Error("Email not verified yet. Open the link in your inbox.");
      }
      const idToken = await user.getIdToken(true);
      const res = await signupWithEmailPassword(user.email!, "ignored", idToken);
      if (!res?.token) throw new Error("No token returned by server.");
      dispatch(setUser({ token: res.token, userInfo: { email: user.email } }));
      router.replace("/(main)/profile"); // adjust to your StudentProfileScreen route
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#FFFFFF", "#E4C7A6"]} start={{x:0,y:0}} end={{x:0,y:1}} className="flex-1">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-[20px] text-center text-black mb-4">
          We sent a verification link to
        </Text>
        <Text className="text-[18px] text-orange-600 font-semibold text-center">
          {targetEmail || "your email"}
        </Text>
        <Text className="text-[14px] text-neutral-700 text-center mt-2">
          Open the email and tap the link, then press Continue.
        </Text>

        <TouchableOpacity
          onPress={onContinue}
          className={`mt-8 px-6 py-3 rounded-2xl bg-[#F98455] ${loading ? "opacity-60" : ""}`}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold">I verified, continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-3 rounded-2xl bg-neutral-200"
          activeOpacity={0.9}
        >
          <Text className="text-neutral-800 font-semibold">Back</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
