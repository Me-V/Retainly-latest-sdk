// src/components/profile/SelectField.tsx
import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import type { Option } from "@/utils/profileHelpers/profile.types";

type Props = {
  label: string;
  selectedValue: string;
  onChange: (v: string) => void;
  options: Option[];
  loading?: boolean;
  disabled?: boolean;
  displayValue?: string; // Optional top row text
  emptyText?: string;
};

export const SelectField = ({
  label,
  selectedValue,
  onChange,
  options,
  loading,
  disabled,
  displayValue,
  emptyText = "No options available",
}: Props) => (
  <View className="mb-3">
    <Text className="text-[13px] text-neutral-600 mb-1">{label}</Text>
    <View
      className={`bg-white border border-[#E8E2D9] rounded-xl overflow-hidden ${
        disabled ? "opacity-60" : ""
      }`}
    >
      {loading ? (
        <View className="px-3 py-3 flex-row items-center">
          <ActivityIndicator size="small" color="#F98455" />
          <Text className="ml-2 text-zinc-800">Loading…</Text>
        </View>
      ) : options.length === 0 ? (
        <View className="px-3 py-3">
          <Text className="text-zinc-700">{emptyText}</Text>
        </View>
      ) : (
        <>
          {displayValue !== undefined && (
            <View className="px-3 py-3 border-b border-[#EFE8DE]">
              <Text className="text-[14px] text-zinc-800">
                {displayValue || "Select"}
              </Text>
            </View>
          )}
          <Picker
            enabled={!disabled}
            selectedValue={selectedValue}
            onValueChange={(v) => onChange(String(v))}
          >
            {options.map((o) => (
              <Picker.Item key={o.id} label={o.name} value={o.id} />
            ))}
          </Picker>
        </>
      )}
    </View>
  </View>
);
