// src/components/profile/ProfileHeader.tsx
import React from "react";
import { View, Text, TextInput } from "react-native";

type Props = {
  name: string;
  editing: boolean;
  saving: boolean;
  onNameChange: (v: string) => void;
};

export const ProfileHeader = ({
  name,
  editing,
  saving,
  onNameChange,
}: Props) => {
  const displayName = name?.trim() || "Username";
  return (
    <View className="items-center justify-center px-4 pt-4">
      {/* Avatar kept on top of overlapping card */}
      <View
        className="h-24 w-24 rounded-full bg-[#F5C9A7] items-center justify-center shadow-md"
        style={{ zIndex: 20, elevation: 20 }}
      />
      {/* Name/Input: ensure it sits above the card too */}
      <View
        className="mt-3 w-full items-center"
        style={{ position: "relative", zIndex: 10, elevation: 10 }}
      >
        {editing ? (
          <TextInput
            className={`text-center text-[18px] font-extrabold text-zinc-900 bg-white border border-[#E8E2D9] rounded-xl px-3 py-2 w-11/12 ${
              saving ? "opacity-60" : ""
            }`}
            style={{ maxWidth: 320, minHeight: 48 }}
            value={name}
            onChangeText={onNameChange}
            placeholder="Your name"
            placeholderTextColor="#9A9A9A"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            textContentType="name"
            editable={!saving}
          />
        ) : (
          <Text className="text-center text-[20px] font-extrabold text-zinc-900">
            {displayName}
          </Text>
        )}
      </View>
    </View>
  );
};
