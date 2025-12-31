import { View } from "react-native";
import LatexView from "@/components/LatexView";

export default function ExampleScreen() {
  return (
    <View style={{ flex: 1 }}>
      <LatexView latex={"\\frac{11 + x}{x^3} + 2x(5 - x)"} color="#000000" />
    </View>
  );
}
