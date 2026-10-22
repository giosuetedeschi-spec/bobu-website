import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    // Browser JavaScript emitted from TypeScript by scripts/build-browser-games.ts.
    "public/**/*.js",
    "next-env.d.ts",
    // Not part of the Next.js app - skills, drafts, and reference material:
    ".claude/**",
    "_references/**",
    "projects/**",
  ]),
]);

export default eslintConfig;
