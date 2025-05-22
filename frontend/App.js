import React from "react";
import { LogBox, SafeAreaView } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { AppNavigator, AuthNavigator } from "./src/navigation/AuthNavigator";
import { Platform } from "react-native";

if (Platform.OS === "web") {
  const style = document.createElement("style");
  style.textContent = `
    html, body {
      margin: 0;
      padding: 0;
      overflow: auto;
    }
  `;
  document.head.appendChild(style);
}

// Ignore specific warnings (optional)
LogBox.ignoreLogs([
  "Animated: `useNativeDriver`",
  "componentWillReceiveProps has been renamed",
]);

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <AppNavigator />
      </SafeAreaView>
    </AuthProvider>
  );
}
