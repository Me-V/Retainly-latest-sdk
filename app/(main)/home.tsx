// src/screens/StudentProfileScreen.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useAppDispatch,
  useAppSelector,
} from "@/utils/profileHelpers/profile.storeHooks";
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
import { logout } from "@/services/api.auth";

export default function StudentProfileScreen() {
  const token = useAppSelector((s) => s.auth.token);
  const dispatch = useAppDispatch();

  const { classes, classesLoading, classNameById } = useClassOptions(
    token as string
  );
  const className = useMemo(
    () => classNameById, // stable reference
    [classNameById]
  );

  // Temporary mappers to pass into user hook before boards/streams exist
  const emptyMapper = makeNameById([]);

  const profile = useUserProfile({
    classNameById: className,
    streamNameById: emptyMapper,
    boardNameById: emptyMapper,
  });

  const viewClassName = className(profile.userData?.student_class);
  const { boards, boardsLoading, boardNameById } = useBoardOptions(
    token as string,
    profile.editing
      ? profile.form.student_class
      : String(profile.userData?.student_class ?? "")
  );

  const { streams, streamsLoading, streamNameById, isSenior } =
    useStreamOptions(
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
    try {
      if (token) await logout(token);
    } catch (e) {
      // optionally show a toast; proceed to clear local state
    } finally {
      dispatch(setUser({ token: undefined as any, userInfo: {} as any }));
      router.replace("/(auth)/login");
    }
  };
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
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[13px] text-neutral-500">App Name/logo</Text>
            <Text className="text-[11px] text-neutral-400"> </Text>
          </View>

          {/* Stacked avatar + card (overlap) */}
          <View className="w-full items-center mt-2">
            {/* Avatar group with outer ring */}
            <View className="items-center z-20">
              <View className="w-40 h-40 rounded-full bg-white/70 items-center justify-center">
                <View className="w-36 h-36 rounded-full bg-[#EFA37F] items-center justify-center shadow-md">
                  {/* camera glyph */}
                  <View className="w-10 h-10 bg-white rounded-[6px]" />
                </View>
              </View>
            </View>

            {/* Card pulled up to overlap avatar */}
            <View className="-mt-16 w-full z-10">
              <LinearGradient
                colors={["#FFEDCF", "#F7C9A6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                className="rounded-[28px] px-6 pt-10 pb-8 shadow-md"
              >
                {/* Username */}
                <Text className="text-center text-[32px] font-extrabold text-[#8E1E1E] my-8">
                  {profile.editing
                    ? profile.form.alias
                    : profile.userData?.alias ?? "Username"}
                </Text>

                {/* Class */}
                {/* <View className="mb-7">
                  <Text className="text-[16px] text-[#5b5147] mb-2">Class</Text>
                  {profile.editing ? (
                    <SelectField
                      label=""
                      selectedValue={profile.form.student_class}
                      onChange={(value) =>
                        profile.setForm((f) => ({ ...f, student_class: value }))
                      }
                      options={classes.map((c) => ({
                        id: c.id,
                        name: `Class ${c.name}`,
                      }))}
                      loading={classesLoading}
                      disabled={profile.saving}
                    />
                  ) : (
                    <Text className="text-[24px] text-black font-semibold">
                      {className(profile.userData?.student_class)}th
                    </Text>
                  )}
                </View> */}

                {/* Board + Stream two-columns */}
                {/* <View className="mb-7">
                  <View className="flex-row">
                    <View className="flex-1 pr-3">
                      <Text className="text-[16px] text-[#5b5147] mb-2">
                        Board
                      </Text>
                      {profile.editing ? (
                        <SelectField
                          label=""
                          selectedValue={profile.form.board}
                          onChange={(bid) => {
                            profile.setForm((f) => ({ ...f, board: bid }));
                            const bname = boardNameById(bid);
                            dispatch(
                              setSelectedBoardAction({ id: bid, name: bname })
                            );
                          }}
                          options={boards}
                          loading={boardsLoading}
                          disabled={profile.saving}
                          displayValue={(() => {
                            const val = profile.form.board;
                            const n = boardNameById(val);
                            return n && n !== String(val) ? n : "Select board";
                          })()}
                          emptyText="No boards available"
                        />
                      ) : (
                        <Text className="text-[24px] text-black font-semibold">
                          {(() => {
                            if (boardInfo?.name) return boardInfo.name;
                            const val = profile.userData?.board as any;
                            if (val == null || val === "") return "Board name";
                            const n = boardNameById(val);
                            return n && n !== String(val) ? n : "Board name";
                          })()}
                        </Text>
                      )}
                    </View>

                    <View className="flex-1 pl-3">
                      <Text className="text-[16px] text-[#5b5147] mb-2">
                        Stream
                      </Text>
                      {profile.editing ? (
                        <SelectField
                          label=""
                          selectedValue={profile.form.stream}
                          onChange={(sid) => {
                            profile.setForm((f) => ({ ...f, stream: sid }));
                            const sname = streamNameById(sid);
                            dispatch(
                              setSelectedStreamAction({ id: sid, name: sname })
                            );
                          }}
                          options={streams}
                          loading={streamsLoading}
                          disabled={profile.saving}
                          displayValue={
                            profile.editing
                              ? streamNameById(profile.form.stream) ||
                                "Select stream"
                              : streamNameById(profile.userData?.stream)
                          }
                          emptyText="No streams available"
                        />
                      ) : (
                        <Text className="text-[24px] text-black font-semibold">
                          {streamNameById(profile.userData?.stream) ||
                            "Science or Arts"}
                        </Text>
                      )}
                    </View>
                  </View>
                </View> */}

                {/* School */}
                <View className="mb-7">
                  <Text className="text-[16px] text-[#5b5147] mb-2">
                    School
                  </Text>
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

                {/* Email with verified icon */}
                <View className="mb-7">
                  <Text className="text-[16px] text-[#5b5147] mb-2">Email</Text>
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
                      </View>
                    ) : (
                      <View className="flex-row items-center">
                        <Text className="text-[20px] text-black font-semibold mr-2">
                          {profile.userData?.email ?? "xyz@gmail.com"}
                        </Text>
                        {profile.userData?.email_verified ? (
                          <VerifiedIcon />
                        ) : null}
                      </View>
                    )}
                  </View>
                </View>

                {/* Phone number with optional verified icon */}
                <View className="mb-10">
                  <Text className="text-[16px] text-[#5b5147] mb-2">
                    Phone Number
                  </Text>
                  {profile.editing ? (
                    <InfoRow
                      label=""
                      value={profile.form.phone_number}
                      editing={true}
                      onChangeText={(v) =>
                        profile.setForm((f) => ({ ...f, phone_number: v }))
                      }
                      keyboardType="phone-pad"
                      placeholder="+00 1234567890"
                      disabled={profile.saving}
                    />
                  ) : (
                    <View className="flex-row items-center">
                      <Text className="text-[20px] text-black font-semibold mr-2">
                        {profile.userData?.phone_number ?? "+00 1234567890"}
                      </Text>
                      {profile.userData?.phone_verified ? (
                        <VerifiedIcon />
                      ) : null}
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
                        ((profile.editing ? isSeniorSelected : isSeniorView) &&
                          !profile.form.stream) ||
                        !profile.emailValid
                          ? "opacity-60"
                          : ""
                      }`}
                      activeOpacity={0.9}
                      disabled={
                        !profile.hasChanges ||
                        profile.saving ||
                        ((profile.editing ? isSeniorSelected : isSeniorView) &&
                          !profile.form.stream) ||
                        !profile.emailValid
                      }
                    >
                      {profile.saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text className="text-white text-[24px] font-extrabold">
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
        </ScrollView>
      )}
    </LinearGradient>
  );
}
