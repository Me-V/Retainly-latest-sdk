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
import { InfoRow } from "@/components/profile/InfoRow";
import { useClassOptions } from "@/utils/profileHelpers/profile.useClassOptions";
import { useBoardOptions } from "@/utils/profileHelpers/profile.useBoardOptions";
import { useStreamOptions } from "@/utils/profileHelpers/profile.useStreamOptions";
import { useUserProfile } from "@/utils/profileHelpers/profile.useUserProfile";
import { makeNameById } from "@/utils/profileHelpers/profile.nameById";
import { setSelectedBoard as setSelectedBoardAction } from "@/store/slices/academicsSlice";
import { VerifiedIcon } from "@/assets/logo2";
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

export default function StudentProfileScreen() {
  const token = useAppSelector((s) => s.auth.token);
  const dispatch = useAppDispatch();

  const { classNameById } = useClassOptions(token as string);
  const className = useMemo(
    () => classNameById, // stable reference
    [classNameById]
  );
  const countries = [
    { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳" },
    { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸" },
    { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
    { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦" },
    { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺" },
  ];
  const [busy, setBusy] = React.useState(false); // generic blocking spinner (e.g., saving)
  const [verifLoading, setVerifLoading] = React.useState(false); // send verification loading
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [successContent, setSuccessContent] = useState<string>("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [confirmLoading, setConfirmLoading] = React.useState(false); // confirm verification loading
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

  // Firebase (kept inline to match your current structure)
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

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
      // Create or re-create a user account for verification email.
      // NOTE: In most apps you should update the existing Firebase user’s email
      // and send verification on that user, but this follows your current working code.
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        next,
        "RandomPass123"
      );

      await sendEmailVerification(userCredential.user);

      setEmailSent(true);
    } catch (e: any) {
      // Map common Firebase errors to friendly messages
      const code: string = e?.code || "";
      let msg = "Could not send verification email. Please try again.";
      if (code.includes("auth/invalid-email")) {
        msg = "The email address is invalid. Please enter a valid email.";
      } else if (code.includes("auth/email-already-in-use")) {
        msg =
          "This email is already in use. Use another email or sign in with this email.";
      } else if (code.includes("auth/too-many-requests")) {
        msg = "Too many attempts. Please wait a while and try again.";
      } else if (code.includes("auth/network-request-failed")) {
        msg = "Network error. Check your internet connection and try again.";
      }
      showPopup({ heading: "Verification not sent", content: msg });
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
          content: "Please sign in again and try to verify your email.",
        });
        return;
      }

      // Get a fresh ID token for backend verification
      const idToken = await user.getIdToken(true);

      // Your backend will verify this token and mark email as verified on your user.
      await patchEmail(token!, {
        email: profile.form.email,
        email_token: idToken,
      });

      // Update local store email; token remains unchanged
      dispatch(
        setUser({ token: token!, userInfo: { email: profile.form.email } })
      );

      showPopup({
        heading: "Email verified",
        content: "Your email has been verified and updated.",
      });

      // Return to profile view
      router.back();
    } catch (err: any) {
      const backendMsg =
        err?.response?.data?.detail ||
        "Email is not verified yet. Open the link sent to your inbox, then try again.";
      showPopup({ heading: "Verification incomplete", content: backendMsg });
    } finally {
      setConfirmLoading(false);
    }
  };

  // Temporary mappers to pass into user hook before boards/streams exist
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

  const { isSenior } = useStreamOptions(
    token as string,
    profile.editing
      ? profile.form.student_class
      : String(profile.userData?.student_class ?? ""),
    profile.editing ? className(profile.form.student_class) : viewClassName
  );

  // stream/board dispatch mirrors selection for view and store
  const isSeniorSelected = isSenior;
  const isSeniorView = isSenior;

  // Ensure Redux selectedBoard has the correct name once boards are loaded
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
      showPopup({
        heading: "Logout failed",
        content: "Could not logout right now. Clearing local session.",
      });
      dispatch(setUser({ token: undefined as any, userInfo: {} as any }));
      router.replace("/(auth)/login");
    } finally {
      setBusy(false);
    }
  };

  // Interstitial: email sent screen
  if (emailSent) {
    return (
      <LinearGradient
        colors={["#FFFFFF", "#E4C7A6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1 px-6"
      >
        <View className="ml-1 mt-3">
          <TouchableOpacity onPress={() => router.back()}>
            <BackIcon />
          </TouchableOpacity>
        </View>

        <View className="items-center mt-32">
          <Image
            source={require("@/assets/Illustration/Email-OTP.png")}
            className="w-[130px] h-[180px] mb-6"
          />
        </View>

        <View className="bg-[#FEFCF3] rounded-3xl px-6 py-8 mt-10 shadow-md">
          <Text className="text-center text-black font-medium leading-6 text-[20px]">
            We sent a verification link to{" "}
            <Text className="text-orange-500 font-semibold">
              {profile.form.email}
            </Text>{" "}
            — please verify to continue.
          </Text>

          <TouchableOpacity
            onPress={handleCheckVerification}
            disabled={confirmLoading}
            className={`bg-orange-500 rounded-full py-4 mt-8 shadow-md ${
              confirmLoading ? "opacity-60" : ""
            }`}
          >
            {confirmLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                I verified, continue
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={sendVerificationForEditedEmail}>
            <Text className="text-orange-500 text-center font-medium text-[16px] mt-4">
              Resend link
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-black font-medium text-xs text-center mt-20">
          Terms & Conditions
        </Text>

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
      if (digits.length < 6 || digits.length > 14) {
        return { valid: false, reason: "Enter a valid phone number." };
      }
      return { valid: true };
    }
    if (rule.exact && digits.length !== rule.exact) {
      return {
        valid: false,
        reason: `Enter a ${rule.exact}-digit number ${
          rule.example ? `(${rule.example})` : ""
        }`.trim(),
      };
    }
    if (rule.min && digits.length < rule.min) {
      return {
        valid: false,
        reason: `Number seems too short ${
          rule.example ? `(${rule.example})` : ""
        }`.trim(),
      };
    }
    if (rule.max && digits.length > rule.max) {
      return {
        valid: false,
        reason: `Number seems too long ${
          rule.example ? `(${rule.example})` : ""
        }`.trim(),
      };
    }
    return { valid: true };
  };

  const formatE164 = (dial: string, raw: string) =>
    `${dial}${raw.replace(/\D/g, "")}`;

  const mapFirebaseError = (err: any) => {
    const code: string = err?.code || "";
    if (code.includes("auth/invalid-phone-number"))
      return "The phone number format is invalid.";
    if (code.includes("auth/invalid-verification-code"))
      return "The OTP you entered is incorrect. Please try again.";
    if (
      code.includes("auth/code-expired") ||
      code.includes("auth/session-expired")
    )
      return "The OTP has expired. Please request a new one.";
    if (code.includes("auth/too-many-requests"))
      return "Too many attempts. Please try again later.";
    if (code.includes("auth/quota-exceeded"))
      return "OTP quota exceeded. Try again later.";
    return err?.message || "Something went wrong. Please try again.";
  };

  const maskPhone = (e164: string) => {
    // Keep country code, mask middle digits, show last 2
    // Example: +911234567890 -> +91 123****890
    const m = e164.match(/^(\+\d{1,3})(\d+)$/);
    if (!m) return e164;
    const cc = m[1];
    const rest = m[2];
    if (rest.length <= 4)
      return `${cc} ${"*".repeat(Math.max(0, rest.length - 2))}${rest.slice(
        -2
      )}`;
    const head = rest.slice(0, 3);
    const tail = rest.slice(-3);
    return `${cc} ${head}${"*".repeat(Math.max(0, rest.length - 6))}${tail}`;
  };

  // const mapApiError = (err: any) => {
  //   const detail =
  //     err?.response?.data?.detail ||
  //     err?.response?.data?.message ||
  //     err?.message;
  //   if (typeof detail === "string") {
  //     if (/network error/i.test(detail))
  //       return "Cannot reach the server. Check your internet connection or try again.";
  //     return detail;
  //   }
  //   return "We couldn't complete signup. Please try again.";
  // };

  const sendSMS = async () => {
    setLoading(true);
    setStatus("");
    try {
      // setLoading(true);
      // setStatus("");
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

      // Show success popup stating OTP is being/sent successfully
      const masked = maskPhone(fullNumber);
      setSuccessContent(
        `We have sent a 6-digit OTP to ${masked}. Enter it here to continue.`
      );
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

  // const verifyCode = async () => {
  //   try {
  //     if (!confirm) return;
  //     setLoading(true);
  //     setStatus("");

  //     if (!/^\d{6}$/.test(code)) {
  //       showPopup({
  //         heading: "Invalid OTP",
  //         content: "Please enter the 6-digit code sent to your phone.",
  //       });
  //       return;
  //     }

  //     await confirm.confirm(code);

  //     const user = authforMobile.currentUser;
  //     const idToken = await user?.getIdToken(true);
  //     if (!idToken) throw new Error("Failed to get ID token from Firebase.");
  //     console.log("%%%%%%%%%%%%%%%idToken", idToken);
  //     const fullNumber = formatE164(selectedCountry.dialCode, phone);
  //     console.log("%%%%%%%%%%%%%%%fullNumber", fullNumber);
  //     const data = await patchPhone(token!, {
  //       phone_number: fullNumber,
  //       phone_token: idToken,
  //     });

  //     if (data?.token) {
  //       dispatch(setUser({ token: data.token, userInfo: { fullNumber } }));
  //       router.replace("/(main)/animation");
  //       setStatus("Phone verified and authorized!");
  //     } else {
  //       showPopup({
  //         heading: "Signup incomplete",
  //         content: "No token received from backend. Please try again.",
  //       });
  //     }
  //   } catch (err: any) {
  //     const isAxios = !!(err?.isAxiosError || err?.response || err?.request);
  //     const message = isAxios ? mapApiError(err) : mapFirebaseError(err);
  //     showPopup({ heading: "Verification failed", content: message });
  //     setStatus(message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleResendOtp = async () => {
  //   if (countdown > 0) {
  //     return showPopup({
  //       heading: "Please wait",
  //       content: `Please wait ${countdown}s to resend`,
  //     });
  //   }
  //   try {
  //     const confirmation = await signInWithPhoneNumber(
  //       authforMobile,
  //       formatE164(selectedCountry.dialCode, phone)
  //     );
  //     setConfirm(confirmation);
  //     setCountdown(60); // Set countdown only after successful send
  //     showPopup({
  //       heading: "OTP resent successfully",
  //       content: "OTP resent successfully",
  //     });
  //   } catch (err) {
  //     showPopup({
  //       heading: "Failed to resend OTP",
  //       content: mapFirebaseError(err),
  //     });
  //   }
  // };

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

  // Main profile view
  return (
    <LinearGradient
      colors={["#FFFFFF", "#FFEFE1", "#D9BEA4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      {profile.loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F98455" />
          <Text className="mt-3 text-neutral-600">Loading profile…</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // ✅ helps on iOS
        >
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 60,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="ml-6 mt-5">
                <TouchableOpacity onPress={() => router.back()}>
                  <BackIcon />
                </TouchableOpacity>
              </View>
              {/* Top bar */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[13px] text-neutral-500 mt-10 mr-10">
                  App Name/logo
                </Text>
                <Text className="text-[11px] text-neutral-400"> </Text>
              </View>
            </View>

            {/* Stacked avatar + card (overlap) */}
            <View className="w-full items-center flex-1 justify-center">
              {/* Avatar group with outer ring */}
              <View className="items-center z-20">
                <View className="w-40 h-40 rounded-full bg-white/70 items-center justify-center">
                  <View className="w-36 h-36 rounded-full bg-[#EFA37F] items-center justify-center shadow-md">
                    <View className="w-10 h-10 bg-white rounded-[6px]" />
                  </View>
                </View>
              </View>

              {/* Card pulled up to overlap avatar */}
              <View className="-mt-16 w-full z-10 px-4 rounded-lg">
                <LinearGradient
                  colors={["#FFEDCF", "#F7C9A6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{
                    borderRadius: 22, // smooth corners (16px ≈ rounded-xl)
                    paddingHorizontal: 24,
                    paddingTop: 40,
                    paddingBottom: 32,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 4,
                  }}
                >
                  {/* Username */}
                  <View className="my-8">
                    {profile.editing ? (
                      <TextInput
                        className="text-center text-[24px] font-extrabold text-[#8E1E1E] bg-white rounded-2xl py-2"
                        placeholder="Enter your name"
                        placeholderTextColor="#9CA3AF"
                        value={profile.form.alias}
                        onChangeText={(v) =>
                          profile.setForm((f) => ({ ...f, alias: v }))
                        }
                        editable={!profile.saving}
                        autoFocus
                      />
                    ) : (
                      <Text className="text-center text-[24px] font-extrabold text-[#8E1E1E]">
                        {profile.userData?.alias ?? "Username"}
                      </Text>
                    )}
                  </View>

                  {/* School */}
                  <View className="mb-5">
                    <Text className="text-[16px] text-[#5b5147]">School</Text>
                    {profile.editing ? (
                      <InfoRow
                        label=""
                        value={profile.form.school}
                        editing={true}
                        onChangeText={(v) =>
                          profile.setForm((f) => ({ ...f, school: v }))
                        }
                        placeholder="School’s name"
                        disabled={profile.saving}
                      />
                    ) : (
                      <Text className="text-[24px] text-black font-semibold">
                        {profile.userData?.school || "School’s name"}
                      </Text>
                    )}
                  </View>

                  {/* Email with verified icon and verify button in edit mode */}
                  <View className="mb-5">
                    <Text className="text-[16px] text-[#5b5147]">Email</Text>
                    <View className="flex-row items-center">
                      {profile.editing ? (
                        <View className="flex-1">
                          <InfoRow
                            label=""
                            value={profile.form.email}
                            editing={true}
                            onChangeText={(v) =>
                              profile.setForm((f) => ({ ...f, email: v }))
                            }
                            keyboardType="email-address"
                            placeholder="you@example.com"
                            disabled={profile.saving}
                          />
                          <TouchableOpacity
                            onPress={sendVerificationForEditedEmail}
                            className={`self-start mt-3 px-4 py-2 rounded-2xl bg-[#F98455] ${
                              verifLoading ? "opacity-60" : ""
                            }`}
                            activeOpacity={0.9}
                            disabled={profile.saving || verifLoading}
                          >
                            {verifLoading ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text className="text-white font-semibold">
                                Send verification
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View className="flex-row items-center">
                          <Text className="text-[20px] text-black font-semibold mr-2">
                            {profile.userData?.email ?? "xyz@gmail.com"}
                          </Text>
                          {profile.userData?.email_verified ? (
                            <VerifiedIcon />
                          ) : (
                            <Feather
                              name="shield-off"
                              size={24}
                              color="black"
                            />
                          )}
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Phone number with optional verified icon */}
                  {/* Phone number with optional verified icon */}
                  <View className="mb-5">
                    <Text className="text-[16px] text-[#5b5147]">
                      Phone Number
                    </Text>

                    {profile.editing ? (
                      <View>
                        {/* Country Code + Input Row */}
                        <View className="flex-row items-center border border-gray-300 bg-white rounded-3xl overflow-hidden">
                          {/* Country Picker Button */}
                          <TouchableOpacity
                            onPress={() => setShowCountryPicker(true)}
                            activeOpacity={0.8}
                            className="flex-row items-center px-4 py-3 bg-gray-50 border-r border-gray-300"
                          >
                            <Text className="text-lg mr-2">
                              {selectedCountry.flag}
                            </Text>
                            <Text className="text-gray-900 font-semibold">
                              {selectedCountry.dialCode}
                            </Text>
                            <Feather
                              name="chevron-down"
                              size={18}
                              color="#6B7280"
                              className="ml-1"
                            />
                          </TouchableOpacity>

                          {/* Phone Number Input */}
                          <TextInput
                            className="flex-1 px-4 py-3 text-base text-gray-900"
                            placeholder="Enter phone number"
                            placeholderTextColor="#9CA3AF"
                            value={phone}
                            onChangeText={(text) => setPhone(text)}
                            autoComplete="tel"
                            keyboardType="phone-pad"
                            maxLength={15}
                          />
                        </View>

                        {/* Send Verification Code Button */}
                        <TouchableOpacity
                          className={`bg-[#F98455] py-4 rounded-3xl mt-6 shadow-md w-[60%] ${
                            loading ||
                            !isPhoneValidForCountry(selectedCountry.code, phone)
                              .valid
                              ? "opacity-60"
                              : ""
                          }`}
                          onPress={sendSMS}
                          disabled={
                            loading ||
                            !isPhoneValidForCountry(selectedCountry.code, phone)
                              .valid
                          }
                          activeOpacity={0.9}
                        >
                          {loading ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text className="text-white text-center font-semibold">
                              Send Verification Code
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View className="flex-row items-center">
                        <Text className="text-[20px] text-black font-semibold mr-2">
                          {profile.userData?.phone_number ?? "+XX XXXXXXXXX"}
                        </Text>
                        {profile.userData?.phone_verified ? (
                          <VerifiedIcon />
                        ) : (
                          <Feather name="shield-off" size={24} color="black" />
                        )}
                      </View>
                    )}
                  </View>

                  {/* Update button */}
                  {profile.editing ? (
                    <View className="items-center">
                      <TouchableOpacity
                        onPress={profile.save}
                        className={`w-64 py-4 rounded-3xl bg-[#F98455] items-center shadow-lg ${
                          !profile.hasChanges ||
                          profile.saving ||
                          ((profile.editing
                            ? isSeniorSelected
                            : isSeniorView) &&
                            !profile.form.stream) ||
                          !profile.emailValid
                            ? "opacity-60"
                            : ""
                        }`}
                        activeOpacity={0.9}
                        disabled={
                          !profile.hasChanges ||
                          profile.saving ||
                          ((profile.editing
                            ? isSeniorSelected
                            : isSeniorView) &&
                            !profile.form.stream) ||
                          !profile.emailValid
                        }
                      >
                        {profile.saving ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text className="text-white text-[20px] font-semibold">
                            Update
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="items-center">
                      <TouchableOpacity
                        onPress={() => profile.setEditing(true)}
                        className="w-64 py-4 rounded-3xl bg-[#F98455] items-center shadow-lg"
                        activeOpacity={0.9}
                      >
                        <Text className="text-white text-[24px] font-extrabold">
                          Update
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </LinearGradient>

                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity
                    onPress={onLogout}
                    className="mt-5 items-center"
                    activeOpacity={0.9}
                  >
                    <Text className="text-[#F98455] text-[24px] font-extrabold">
                      Logout
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <RNModal
              visible={showCountryPicker}
              animationType="slide"
              transparent
            >
              <View className="flex-1 bg-black/50 justify-center">
                <View className="bg-white mx-4 rounded-2xl max-h-[80vh] overflow-hidden">
                  <Text className="text-lg font-bold text-gray-800 py-5 px-6 border-b border-gray-100">
                    Select Country
                  </Text>
                  <FlatList
                    data={countries}
                    keyExtractor={(item) => item.code}
                    renderItem={renderCountryItem}
                    className="max-h-96"
                  />
                  <TouchableOpacity
                    className="py-5 items-center"
                    onPress={() => setShowCountryPicker(false)}
                  >
                    <Text className="text-base font-semibold text-brown-400">
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </RNModal>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Global blocking spinner overlay (e.g., during logout or other busy ops) */}
      {(busy || verifLoading || confirmLoading) && (
        <View className="absolute inset-0 bg-black/10 items-center justify-center">
          <View className="bg-white px-4 py-3 rounded-xl shadow">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#F98455" />
              <Text className="ml-2 text-neutral-800">Please wait…</Text>
            </View>
          </View>
        </View>
      )}

      {/* Centralized popup modal */}
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
