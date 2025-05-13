import React from "react";
import { LogBox, SafeAreaView } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import AuthNavigator from "./src/navigation/AuthNavigator";

// Ignore specific warnings (optional)
// LogBox.ignoreLogs([
//   "Animated: `useNativeDriver`",
//   "componentWillReceiveProps has been renamed",
// ]);

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <AuthNavigator />
      </SafeAreaView>
    </AuthProvider>
  );
}
