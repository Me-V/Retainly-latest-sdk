// src/components/profile/InfoRow.tsx
import React from "react";
import { View, Text, TextInput } from "react-native";

type Props = {
  label: string;
  value?: string | number | null;
  editing?: boolean;
  onChangeText?: (v: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
  placeholder?: string;
  disabled?: boolean;
};

export const InfoRow = ({
  label,
  value,
  editing,
  onChangeText,
  keyboardType = "default",
  placeholder,
  disabled,
}: Props) => (
  <View className="flex-row items-start justify-between mb-3">
    <Text className="text-[13px] text-neutral-600 w-28">{label}</Text>
    {editing ? (
      <TextInput
        className={`flex-1 text-[14px] text-zinc-800 bg-white border border-[#E8E2D9] rounded-xl px-3 py-2 ${
          disabled ? "opacity-60" : ""
        }`}
        value={String(value ?? "")}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#9A9A9A"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        returnKeyType="done"
      />
    ) : (
      <Text className="text-[14px] text-zinc-800 flex-1">{value || "—"}</Text>
    )}
  </View>
);
