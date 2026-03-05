"use client";

import { createAuthClient } from "better-auth/client";
import { clientEnv } from "@repo/env/client";

// The auth client points to the REST API where better-auth is mounted.
// All sign-in / sign-up / sign-out requests go through /api/auth/* on the REST
// server — the Next.js frontend never handles auth tokens directly.
export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_REST_URL,
});

// Re-export the most common methods for ergonomic imports
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  updateUser,
  deleteUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
} = authClient;
