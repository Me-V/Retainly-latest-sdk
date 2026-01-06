import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LatexView from "./LatexView";

type Props = {
  content: string;
  textColor?: string;
};

export default function QuestionRenderer({
  content,
  textColor = "#000000",
}: Props) {
  // Regex to capture <equation>...</equation>
  const parts = content.split(/(<equation>.*?<\/equation>)/g);

  return (
    <View style={styles.container}>
      {parts.map((part, index) => {
        // 1. Handle Equation
        if (part.startsWith("<equation>") && part.endsWith("</equation>")) {
          // Strip tags
          const rawLatex = part
            .replace("<equation>", "")
            .replace("</equation>", "");

          return (
            <View key={index} style={styles.latexContainer}>
              <LatexView latex={rawLatex} color={textColor} />
            </View>
          );
        }

        // 2. Handle Regular Text (Skip empty parts)
        if (part.trim() === "") return null;

        return (
          <Text key={index} style={[styles.text, { color: textColor }]}>
            {part}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    lineHeight: 30,
  },
  latexContainer: {
    marginHorizontal: 0,
  },
});
