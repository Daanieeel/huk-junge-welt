#!/usr/bin/env bun
import { spawn } from "child_process";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load .env file
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, ".env");
const result = config({ path: envPath });

if (result.error) {
  console.error("Failed to load .env file:", result.error);
  process.exit(1);
}

// Spawn turbo with the loaded environment variables
const turboArgs = process.argv.slice(2);
const turboProcess = spawn("turbo", turboArgs, {
  env: process.env,
  stdio: "inherit",
});

turboProcess.on("exit", (code) => {
  process.exit(code || 0);
});
