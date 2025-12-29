import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LogBox, View, ActivityIndicator, StyleSheet, Text, Platform } from "react-native";
import * as Updates from "expo-updates";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { trpc, trpcClient } from "@/lib/trpc";
import { ErrorBoundary } from "@/components/ErrorBoundary";

if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('Global error handler:', error, 'isFatal:', isFatal);
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

try {
  SplashScreen.preventAutoHideAsync();
} catch (error) {
  console.error('Error preventing splash screen auto hide:', error);
}

LogBox.ignoreLogs([
  'source.uri',
  'Failed prop type',
  'Warning:',
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      networkMode: 'offlineFirst',
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="log/daily" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="log/meltdown" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="calendar" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="settings/shared-access" options={{ headerShown: false, title: 'Shared Access' }} />
      <Stack.Screen name="settings/invite-therapist" options={{ headerShown: false, title: 'Invite Therapist' }} />
      <Stack.Screen name="settings/reminders" options={{ headerShown: false, title: 'Reminders' }} />
      <Stack.Screen name="settings/customization" options={{ headerShown: false, title: 'Customization' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log("[updates] runtimeVersion:", (Updates as any)?.runtimeVersion);
        console.log("[updates] channel:", (Updates as any)?.channel);
        console.log("[updates] updateId:", (Updates as any)?.updateId);
        console.log("[updates] isEmbeddedLaunch:", (Updates as any)?.isEmbeddedLaunch);
        console.log("[updates] isEnabled:", (Updates as any)?.isEnabled);
        console.log("[updates] platform:", Platform.OS);

        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log("[updates] OTA updates disabled");

        setAppIsReady(true);
      } catch (e) {
        console.error("Error during app initialization:", e);
        setHasError(true);
        setAppIsReady(true);
      } finally {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.error("Error hiding splash screen:", error);
        }
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to initialize app</Text>
        <Text style={styles.errorSubtext}>Please restart the app</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <AuthProvider>
            <AppProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </AppProvider>
          </AuthProvider>
        </trpc.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
  },
});
