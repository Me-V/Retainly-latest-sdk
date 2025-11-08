import React from "react";
import { View } from "react-native";

type Props = {
  value: number; // 0-100
  trackClassName?: string;
  fillClassName?: string;
  trackColor?: string;
  fillColor?: string;
  height?: number;
};

export const ProgressBar: React.FC<Props> = ({
  value,
  trackClassName = "w-full rounded-full overflow-hidden bg-neutral-300",
  fillClassName = "rounded-full",
  trackColor,
  fillColor,
  height = 10,
}) => {
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  return (
    <View
      className={trackClassName}
      style={{ height, backgroundColor: trackColor }}
    >
      <View
        className={fillClassName}
        style={{ width: `${clamped}%`, height, backgroundColor: fillColor }}
      />
    </View>
  );
};
