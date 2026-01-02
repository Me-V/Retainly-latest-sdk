// ExampleScreen.tsx
import { View } from "react-native";
import LatexView from "@/components/LatexView";

const apiData = {
  // 🔴 BAD: JavaScript removes the single backslashes
  // content: `... \( x^2 ...`

  // 🟢 GOOD: Double backslashes preserve the LaTeX format
  content: `The well known Pythagorean theorem \\( x^2 + y^2 = z^2 \\) was proved to be invalid for other exponents.
Meaning the next equation has no integer solutions:

\\[ x^n + y^n = z^n \\]`,
};

export default function ExampleScreen() {
  return (
    <View style={{ flex: 1, paddingTop: 50, backgroundColor: "#f5f5f5" }}>
      <LatexView latex={apiData.content} />
    </View>
  );
}
