import "react-native-reanimated";

import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DarkTheme, ThemeProvider, type Theme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import { colors } from "@/constants/tokens";
import { SessionProvider } from "@/lib/auth";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * The design is dark-only by intent, so the app doesn't follow the system
 * colour scheme. Navigation's theme is overridden to match the tokens, which
 * stops the default near-black from showing through during screen transitions.
 */
const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.foreground,
    border: colors.border,
    primary: colors.brand,
  },
};

/**
 * Root layout.
 *
 * Production holds the splash screen until a Supabase session and a workspace
 * membership both resolve, then gates the whole app behind
 * `<Stack.Protected guard={session && membership}>`. There is no auth here, so
 * the gate is gone and the app opens straight onto the feed — `/sign-in` is
 * still a real route, just not a wall.
 *
 * It also brought up a SQLite store and recovered interrupted recordings on
 * mount. The demo store is in memory and always ready, so there is nothing to
 * initialise.
 */
export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <ThemeProvider value={navigationTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            {/* Calls + Coaching, behind the persistent bottom navigation. */}
            <Stack.Screen name="(tabs)" />
            {/* Capture slides up over whichever tab you were on, so closing it
                returns you there. It is an action, not a tab. */}
            <Stack.Screen
              name="record"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen name="call/[id]" />
            {/* "Chat with note", opened from a call's Summary pane. */}
            <Stack.Screen name="chat/[id]" />
            {/* A detour out of the three primary actions, so it's a pushed
                screen with a back arrow — and no bottom navigation. */}
            <Stack.Screen name="account" />
            <Stack.Screen name="(auth)" />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
