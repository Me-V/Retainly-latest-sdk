// src/screens/StudentProfileScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  FlatList,
  Modal as RNModal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useAppDispatch,
  useAppSelector,
} from "@/utils/profileHelpers/profile.storeHooks";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useClassOptions } from "@/utils/profileHelpers/profile.useClassOptions";
import { useBoardOptions } from "@/utils/profileHelpers/profile.useBoardOptions";
import { useStreamOptions } from "@/utils/profileHelpers/profile.useStreamOptions";
import { useUserProfile } from "@/utils/profileHelpers/profile.useUserProfile";
import { makeNameById } from "@/utils/profileHelpers/profile.nameById";
import { setSelectedBoard as setSelectedBoardAction } from "@/store/slices/academicsSlice";
import { setUser } from "@/store/slices/authSlice";
import { router } from "expo-router";
import { logout, patchEmail } from "@/services/api.auth";
import {
  getAuth,
  sendEmailVerification,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "@/services/config";
import { BackIcon, MailOpenSVG } from "@/assets/logo";
import PopupModal from "@/components/Popup-modal";
import { signInWithPhoneNumber } from "@react-native-firebase/auth";
import { authforMobile } from "@/app/(auth)/mobile-auth";
import { GlowCard } from "@/components/Glow-Card";

export default function StudentProfileScreen() {
  const token = useAppSelector((s) => s.auth.token);
  const dispatch = useAppDispatch();

  const { classNameById } = useClassOptions(token as string);
  const className = useMemo(() => classNameById, [classNameById]);
  const countries = [
    { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳" },
    { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸" },
    { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
    { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦" },
    { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺" },
  ];
  const [busy, setBusy] = React.useState(false);
  const [verifLoading, setVerifLoading] = React.useState(false);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [successContent, setSuccessContent] = useState<string>("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Country Picker State
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);

  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  // Popup modal state
  const [popupVisible, setPopupVisible] = React.useState(false);
  const [popupHeading, setPopupHeading] = React.useState<string>("");
  const [popupContent, setPopupContent] = React.useState<string>("");
  const [popupPrimaryText, setPopupPrimaryText] = React.useState<string>("OK");
  const [popupDismissible, setPopupDismissible] = React.useState<boolean>(true);

  const showPopup = ({
    heading,
    content,
    primaryText = "OK",
    dismissible = true,
  }: {
    heading: string;
    content: string;
    primaryText?: string;
    dismissible?: boolean;
  }) => {
    setPopupHeading(heading);
    setPopupContent(content);
    setPopupPrimaryText(primaryText);
    setPopupDismissible(dismissible);
    setPopupVisible(true);
  };

  const closePopup = () => setPopupVisible(false);

  // Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // --- PHONE LOGIC ---
  const PHONE_RULES: Record<
    string,
    { exact?: number; min?: number; max?: number; example?: string }
  > = {
    IN: { exact: 10, example: "e.g., 9876543210" },
    US: { exact: 10, example: "e.g., 4155550133" },
    CA: { exact: 10, example: "e.g., 4165550133" },
    GB: { min: 9, max: 10, example: "e.g., 7123456789" },
    AU: { exact: 9, example: "e.g., 412345678" },
  };

  const isPhoneValidForCountry = (countryCode: string, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const rule = PHONE_RULES[countryCode];
    if (!digits)
      return { valid: false, reason: "Please enter your phone number." };
    if (!rule) {
      if (digits.length < 6 || digits.length > 14)
        return { valid: false, reason: "Enter a valid phone number." };
      return { valid: true };
    }
    if (rule.exact && digits.length !== rule.exact)
      return { valid: false, reason: `Enter a ${rule.exact}-digit number.` };
    if (rule.min && digits.length < rule.min)
      return { valid: false, reason: `Number seems too short.` };
    if (rule.max && digits.length > rule.max)
      return { valid: false, reason: `Number seems too long.` };
    return { valid: true };
  };

  const formatE164 = (dial: string, raw: string) =>
    `${dial}${raw.replace(/\D/g, "")}`;

  const mapFirebaseError = (err: any) => {
    const code = err?.code || "";
    if (code.includes("auth/invalid-phone-number"))
      return "Invalid phone number.";
    if (code.includes("auth/quota-exceeded")) return "SMS quota exceeded.";
    return err?.message || "Failed to send OTP.";
  };

  const maskPhone = (e164: string) => {
    const m = e164.match(/^(\+\d{1,3})(\d+)$/);
    if (!m) return e164;
    const cc = m[1];
    const rest = m[2];
    if (rest.length <= 4) return `${cc} ...${rest.slice(-2)}`;
    return `${cc} ...${rest.slice(-4)}`;
  };

  const sendSMS = async () => {
    setLoading(true);
    setStatus("");
    try {
      const validation = isPhoneValidForCountry(selectedCountry.code, phone);
      if (!validation.valid) {
        showPopup({
          heading: "Invalid phone number",
          content: validation.reason!,
        });
        return;
      }
      const fullNumber = formatE164(selectedCountry.dialCode, phone);

      const confirmation = await signInWithPhoneNumber(
        authforMobile,
        fullNumber
      );

      router.push({
        pathname: "/(auth)/verify-otp",
        params: {
          verificationId: confirmation.verificationId,
          phone: fullNumber,
          countryCode: selectedCountry.code,
          dialCode: selectedCountry.dialCode,
        },
      });

      const masked = maskPhone(fullNumber);
      setSuccessContent(`OTP sent to ${masked}.`);
      setSuccessVisible(true);
      setCountdown(60);
    } catch (err: any) {
      showPopup({
        heading: "Failed to send OTP",
        content: mapFirebaseError(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySelect = (country: any) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
  };

  const renderCountryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleCountrySelect(item)}
      className="flex-row items-center px-6 py-3 border-b border-gray-200"
    >
      <Text className="text-2xl mr-3">{item.flag}</Text>
      <View>
        <Text className="font-bold text-base">{item.name}</Text>
        <Text className="text-gray-600">{item.dialCode}</Text>
      </View>
    </TouchableOpacity>
  );

  // --- EMAIL LOGIC ---
  const sendVerificationForEditedEmail = async () => {
    const next = profile.form.email?.trim();
    if (!next) {
      showPopup({
        heading: "Email required",
        content: "Please enter your email address before verifying.",
      });
      return;
    }
    setVerifLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        next,
        "RandomPass123"
      );
      await sendEmailVerification(userCredential.user);
      setEmailSent(true);
    } catch (e: any) {
      showPopup({
        heading: "Verification not sent",
        content: "Error sending email.",
      });
    } finally {
      setVerifLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setConfirmLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        showPopup({
          heading: "Not signed in",
          content: "Please sign in again.",
        });
        return;
      }
      const idToken = await user.getIdToken(true);
      await patchEmail(token!, {
        email: profile.form.email,
        email_token: idToken,
      });
      dispatch(
        setUser({ token: token!, userInfo: { email: profile.form.email } })
      );
      showPopup({
        heading: "Email verified",
        content: "Your email has been updated.",
      });
      router.back();
    } catch (err: any) {
      showPopup({
        heading: "Verification incomplete",
        content: "Email not verified yet.",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const emptyMapper = makeNameById([]);
  const profile = useUserProfile({
    classNameById: className,
    streamNameById: emptyMapper,
    boardNameById: emptyMapper,
  });

  const viewClassName = className(profile.userData?.student_class);
  const { boards, boardNameById } = useBoardOptions(
    token as string,
    profile.editing
      ? profile.form.student_class
      : String(profile.userData?.student_class ?? "")
  );

  // const { isSenior } = useStreamOptions(
  //   token as string,
  //   profile.editing
  //     ? profile.form.student_class
  //     : String(profile.userData?.student_class ?? ""),
  //   profile.editing ? className(profile.form.student_class) : viewClassName
  // );

  // const isSeniorSelected = isSenior;
  // const isSeniorView = isSenior;

  React.useEffect(() => {
    const bid = profile.editing
      ? profile.form.board
      : String(profile.userData?.board ?? "");
    if (!bid) return;
    const bname = boardNameById(bid);
    if (bname && bname !== String(bid)) {
      dispatch(setSelectedBoardAction({ id: bid, name: bname }));
    }
  }, [
    boards,
    profile.form.board,
    profile.userData?.board,
    boardNameById,
    dispatch,
  ]);

  const onLogout = async () => {
    setBusy(true);
    try {
      if (token) await logout(token);
      dispatch(setUser({ token: undefined as any, userInfo: {} as any }));
      router.replace("/(auth)/login");
    } catch {
      dispatch(setUser({ token: undefined as any, userInfo: {} as any }));
      router.replace("/(auth)/login");
    } finally {
      setBusy(false);
    }
  };
  if (emailSent) {
    return (
      <LinearGradient
        colors={["#3B0A52", "#180323"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1 px-6"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="ml-1 mt-12">
            <TouchableOpacity onPress={() => router.back()}>
              <BackIcon color="white" />
            </TouchableOpacity>
          </View>
          <View className="items-center mt-16">
            <MailOpenSVG />
          </View>
          <GlowCard className="px-6 py-10 mt-10">
            <Text className="text-center text-white font-medium leading-7 text-[20px]">
              We have sent you a verification link on{"\n"}
              <Text className="text-[#F59E51] font-bold">
                {profile.form.email}
              </Text>
              {"\n"}please verify to continue
            </Text>
            <TouchableOpacity
              onPress={handleCheckVerification}
              disabled={confirmLoading}
              className="w-full mt-8 shadow-lg"
            >
              <LinearGradient
                colors={["#FF8A33", "#F59E51"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                className="rounded-3xl py-4"
                style={{ borderRadius: 24 }}
              >
                {confirmLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-center font-bold text-[16px]">
                    I verified, continue
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={sendVerificationForEditedEmail}>
              <Text className="text-[#F59E51] text-center font-medium text-[16px] mt-6">
                Resend link
              </Text>
            </TouchableOpacity>
          </GlowCard>
        </ScrollView>
        <PopupModal
          isVisible={popupVisible}
          onClose={closePopup}
          heading={popupHeading}
          content={popupContent}
          primaryText={popupPrimaryText}
          dismissible={popupDismissible}
        />
      </LinearGradient>
    );
  }

  // --- MAIN RENDER ---
  return (
    <LinearGradient
      // Warm tint at top-left (#5A1C44) fading to dark purple
      colors={["#5A1C44", "#3B0A52", "#3A0353"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      {profile.loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F98455" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
          >
            {/* Header */}
            <View className="mt-12 ml-6">
              <TouchableOpacity onPress={() => router.back()}>
                <BackIcon color="white" />
              </TouchableOpacity>
            </View>

            {/* Profile Picture */}
            <View className="items-center mt-4 mb-2">
              <View className="relative">
                <View className="w-36 h-36 rounded-full bg-[#2A1C3E]/50 items-center justify-center border border-white/20">
                  <View className="w-28 h-28 rounded-full bg-[#2A1C3E]/10 items-center justify-center border border-white/20">
                    <Ionicons name="camera" size={40} color="white" />
                  </View>
                </View>
              </View>
              <View className="mt-4">
                {profile.editing ? (
                  <TextInput
                    value={profile.form.alias}
                    onChangeText={(v) =>
                      profile.setForm((f) => ({ ...f, alias: v }))
                    }
                    className="text-white text-[24px] font-bold text-center border-b border-[#F59E51] pb-1 min-w-[150px]"
                    placeholder="Your Name"
                    placeholderTextColor="#FFFFFF80"
                    autoFocus
                  />
                ) : (
                  <Text className="text-white text-[24px] font-bold text-center">
                    {profile.userData?.alias ?? "Username"}
                  </Text>
                )}
              </View>
            </View>

            {/* --- GLOW CARD --- */}
            <GlowCard className="mx-6 mt-6 mb-10">
              <View className="px-8 py-10">
                {/* Class */}
                {/* <View className="mb-6">
                  <Text className="text-gray-400 text-[12px] uppercase mb-1">
                    Class
                  </Text>
                  {profile.editing ? (
                    <TextInput
                      value={profile.form.student_class}
                      onChangeText={(v) =>
                        profile.setForm((f) => ({ ...f, student_class: v }))
                      }
                      className="text-white text-[18px] font-medium border-b border-gray-600 pb-1"
                      placeholder="10, 11 or 12"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                  ) : (
                    <Text className="text-white text-[18px] font-medium">
                      {viewClassName || "10, 11 or 12"}
                    </Text>
                  )}
                </View> */}

                {/* Board & Stream */}
                {/* <View className="flex-row justify-between mb-6">
                  <View className="flex-1 mr-4">
                    <Text className="text-gray-400 text-[12px] uppercase mb-1">
                      Board
                    </Text>
                    {profile.editing ? (
                      <TextInput
                        value={profile.form.board}
                        onChangeText={(v) =>
                          profile.setForm((f) => ({ ...f, board: v }))
                        }
                        className="text-white text-[16px] font-medium border-b border-gray-600 pb-1"
                        placeholder="Board Name"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                      />
                    ) : (
                      <Text className="text-white text-[16px] font-medium">
                        {profile.userData?.board || "Board Name"}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-[12px] uppercase mb-1">
                      Stream
                    </Text>
                    {profile.editing ? (
                      <TextInput
                        value={profile.form.stream}
                        onChangeText={(v) =>
                          profile.setForm((f) => ({ ...f, stream: v }))
                        }
                        className="text-white text-[16px] font-medium border-b border-gray-600 pb-1"
                        placeholder="Science/Arts"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                      />
                    ) : (
                      <Text className="text-white text-[16px] font-medium">
                        {profile.userData?.stream || "Science or Arts"}
                      </Text>
                    )}
                  </View>
                </View> */}

                {/* School */}
                <View className="mb-10">
                  <Text className="text-gray-400 text-[12px] uppercase mb-1">
                    School
                  </Text>
                  {profile.editing ? (
                    <TextInput
                      value={profile.form.school}
                      onChangeText={(v) =>
                        profile.setForm((f) => ({ ...f, school: v }))
                      }
                      className="text-white text-[18px] font-medium border-b border-gray-600 pb-1"
                      placeholder="School's Name"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                  ) : (
                    <Text className="text-white text-[18px] font-medium">
                      {profile.userData?.school || "School's name"}
                    </Text>
                  )}
                </View>

                {/* Email */}
                <View className="mb-10">
                  <Text className="text-gray-400 text-[12px] uppercase mb-1">
                    Email
                  </Text>
                  <View className="flex-row items-center justify-between">
                    {profile.editing ? (
                      <TextInput
                        value={profile.form.email}
                        onChangeText={(v) =>
                          profile.setForm((f) => ({ ...f, email: v }))
                        }
                        className="flex-1 text-white text-[16px] font-medium border-b border-gray-600 pb-1 mr-2"
                        placeholder="xyz@gmail.com"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="email-address"
                      />
                    ) : (
                      <Text className="text-white text-[16px] font-medium">
                        {profile.userData?.email || "xyz@gmail.com"}
                      </Text>
                    )}

                    <View className="flex-row items-center gap-2">
                      {profile.userData?.email_verified ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#4ADE80"
                        />
                      ) : (
                        <Ionicons
                          name="alert-circle"
                          size={20}
                          color="#F59E51"
                        />
                      )}
                      <TouchableOpacity
                        onPress={() => profile.setEditing(true)}
                      >
                        <Feather name="edit-2" size={18} color="#F59E51" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {profile.editing && (
                    <TouchableOpacity
                      onPress={sendVerificationForEditedEmail}
                      className="mt-3 self-start px-4 py-2 rounded-2xl bg-[#F98455]"
                    >
                      {verifLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className="text-white text-[12px] font-medium">
                          Send Verification
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* PHONE NUMBER - WITH RESTORED SEND BUTTON */}
                <View className="mb-8">
                  <Text className="text-gray-400 text-[12px] uppercase mb-1">
                    Phone Number
                  </Text>
                  <View className="flex-row items-center justify-between">
                    {profile.editing ? (
                      <View className="flex-1">
                        {/* Country Code Trigger */}
                        <View className="flex-row items-center mb-1">
                          <TouchableOpacity
                            onPress={() => setShowCountryPicker(true)}
                            className="flex-row items-center mr-2 border-b border-gray-600 pb-1 mt-3"
                          >
                            <Text className="text-white text-[16px] mr-1">
                              {selectedCountry.flag}
                            </Text>
                            <Text className="text-white text-[16px]">
                              {selectedCountry.dialCode}
                            </Text>
                            <Feather
                              name="chevron-down"
                              size={14}
                              color="gray"
                            />
                          </TouchableOpacity>

                          <TextInput
                            value={phone}
                            onChangeText={setPhone}
                            className="flex-1 text-white text-[16px] font-medium border-b border-gray-600 pb-1 mr-2"
                            placeholder="1234567890"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            keyboardType="phone-pad"
                          />
                        </View>
                      </View>
                    ) : (
                      <Text className="text-white text-[16px] font-medium">
                        {profile.userData?.phone_number || "+XX XXX XXX XXXX"}
                      </Text>
                    )}

                    <View className="flex-row items-center gap-2">
                      {profile.userData?.phone_verified ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#4ADE80"
                        />
                      ) : (
                        <Feather name="shield-off" size={20} color="#F59E51" />
                      )}
                      <TouchableOpacity
                        onPress={() => profile.setEditing(true)}
                      >
                        <Feather name="edit-2" size={18} color="#F59E51" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* SEND SMS BUTTON - VISIBLE WHEN EDITING */}
                  {profile.editing && (
                    <TouchableOpacity
                      onPress={sendSMS}
                      disabled={loading}
                      className="mt-2 self-start px-4 py-2 rounded-2xl bg-[#F98455]"
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className="text-white text-[12px] font-medium">
                          Send Verification Code
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Update / Save Button */}
                <TouchableOpacity
                  onPress={
                    profile.editing
                      ? profile.save
                      : () => profile.setEditing(true)
                  }
                  disabled={profile.saving}
                  className="w-full shadow-lg"
                >
                  <LinearGradient
                    colors={["#FF8A33", "#F59E51"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    className="rounded-3xl py-4"
                    style={{ borderRadius: 24 }}
                  >
                    {profile.saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white text-center font-bold text-[18px]">
                        {profile.editing ? "Save" : "Update"}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </GlowCard>

            {/* Logout Button */}
            <TouchableOpacity onPress={onLogout} className="items-center mb-8">
              <Text className="text-[#F59E51] font-bold text-[20px]">
                Logout
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* MOVED MODAL OUTSIDE SCROLLVIEW TO ENSURE VISIBILITY */}
          <RNModal
            visible={showCountryPicker}
            animationType="slide"
            transparent
          >
            <View className="flex-1 bg-black/60 justify-end mt-10">
              <View className="bg-white rounded-t-[30px] max-h-[70vh] overflow-hidden pb-10">
                <View className="flex-row justify-between items-center py-5 px-6">
                  <Text className="text-lg font-bold text-gray-800">
                    Select Country
                  </Text>
                  <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                    <Text className="text-base font-semibold text-[#F98455]">
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={countries}
                  keyExtractor={(item) => item.code}
                  renderItem={renderCountryItem}
                  className="mb-4"
                />
              </View>
            </View>
          </RNModal>
        </KeyboardAvoidingView>
      )}

      {/* Global blocking spinner */}
      {(busy || verifLoading || confirmLoading) && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
          <View className="bg-[#2A1C3E] px-6 py-4 rounded-2xl border border-white/10 flex-row items-center">
            <ActivityIndicator size="small" color="#F98455" />
            <Text className="ml-3 text-white font-medium">Please wait…</Text>
          </View>
        </View>
      )}

      {/* Popup Modal */}
      <PopupModal
        isVisible={popupVisible}
        onClose={closePopup}
        heading={popupHeading}
        content={popupContent}
        primaryText={popupPrimaryText}
        dismissible={popupDismissible}
      />
    </LinearGradient>
  );
}
