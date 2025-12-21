import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL?.trim();

  // In Expo, EXPO_PUBLIC_* variables are substituted at build time.
  // If the value isn't set for the TestFlight build, throwing here will crash
  // the app at launch (before React can render an error boundary).
  if (baseUrl) return baseUrl;

  console.warn(
    "[trpc] Missing EXPO_PUBLIC_RORK_API_BASE_URL; tRPC calls will fail until it is configured."
  );

  // Keep the app running; callers will see network errors instead of a launch crash.
  return "http://localhost";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
