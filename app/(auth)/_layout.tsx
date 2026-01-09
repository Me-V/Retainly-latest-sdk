import { Stack } from "expo-router";
import { View } from "react-native";

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#3B0A52" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#3B0A52" },
        }}
      />
    </View>
  );
}
