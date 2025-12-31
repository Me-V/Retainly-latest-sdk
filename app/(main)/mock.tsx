import { View } from "react-native";
import LatexView from "@/components/LatexView";

export default function ExampleScreen() {
  return (
    <View style={{ padding: 20, backgroundColor: '#000000' }}>
      <LatexView latex={"\\frac{11 + x}{x^3} + 2x(5 - x)"} />
    </View>
  );
}
