import { Redirect } from "expo-router";

export default function Index() {
  // 👇 Redirect to your main screen or auth
  return <Redirect href="/(auth)/login" />;
}
