import React from "react";
import { View } from "react-native";
import QuestionRenderer from "@/components/QuestionRenderer";

export default function App() {
  const apiData = String.raw`How many factors does <equation>2^3 \cdot 3^5 \cdot 5^1</equation> have?`;

  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 50 }}>
      <QuestionRenderer content={apiData} />
    </View>
  );
}
