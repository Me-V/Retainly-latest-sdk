import React from "react";
import { View, Text } from "react-native";
import { GlowCard } from "@/components/Glow-Card";
import Svg, { Circle } from "react-native-svg";

type Props = {
  overallAverage: number;
  attempted: number;
  total: number;
};

const DailyProgressCard: React.FC<Props> = ({
  overallAverage,
  attempted,
  total,
}) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset =
    circumference - (overallAverage / 100) * circumference;

  return (
    <View className="flex-1">
      <GlowCard className="items-center justify-center flex-1 p-5">
        {/* Circle Container - Added mb-4 to create space between circle and text */}
        <View className="items-center justify-center w-[88px] h-[88px] my-8">
          {/* SVG Background + Progress - Placed absolutely behind the text */}
          <Svg width="88" height="88" style={{ position: "absolute" }}>
            {/* Background circle */}
            <Circle
              stroke="rgba(255, 255, 255, 0.1)"
              fill="none"
              cx="44"
              cy="44"
              r={radius}
              strokeWidth="3"
            />

            {/* Progress */}
            <Circle
              stroke="#FF8D28"
              fill="none"
              cx="44"
              cy="44"
              r={radius}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 44 44)"
            />
          </Svg>

          {/* Percentage - Naturally centered by parent's justify-center/items-center */}
          <Text className="text-white font-bold text-[20px]">
            {Number(overallAverage.toFixed(1))}%
          </Text>
        </View>

        {/* Title */}
        <Text className="text-white text-[16px] font-bold text-center mb-1.5">
          Your Progress
        </Text>

        {/* Subtitle - Adjusted leading for better multiline readability */}
        <Text className="text-white/70 text-[13px] text-center leading-[20px]">
          You have completed{"\n"}
          {attempted}/{total} question
        </Text>
      </GlowCard>
    </View>
  );
};

export default DailyProgressCard;
