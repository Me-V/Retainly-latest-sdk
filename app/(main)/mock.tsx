import QuestionRenderer from "@/components/QuestionRenderer";
import { View } from "react-native";

export default function App() {
  const apiData =
    "For real x, the minimum value of <equation>(x-1)^2 + (x-4)^2</equation> is:";

  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 50 }}>
      <QuestionRenderer content={apiData} />
    </View>
  );
}
