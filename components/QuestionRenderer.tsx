import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LatexView from "./LatexView";

type Props = {
  content: string;
};

export default function QuestionRenderer({ content }: Props) {
  // Regex to capture <equation>...</equation>
  // The parenthesis () in split means "keep the delimiter in the result array"
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
              <LatexView latex={rawLatex} color="#000000" />
            </View>
          );
        }

        // 2. Handle Regular Text (Skip empty parts)
        if (part.trim() === "") return null;

        return (
          <Text key={index} style={styles.text}>
            {part}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row", // Align items horizontally
    flexWrap: "wrap", // 🟢 CRITICAL: Allows content to wrap like a paragraph
    alignItems: "center", // Vertically center math with text
  },
  text: {
    fontSize: 20,
    color: "#000000",
    lineHeight: 30, // Slightly increased line height for better readability
  },
  latexContainer: {
    marginHorizontal: 4, // Space around the equation
    // Do NOT set a fixed width/height here; let LatexView handle it
  },
});
