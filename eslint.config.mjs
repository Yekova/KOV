import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Skills tiers, posés par la CLI `skills` et gérés par elle. Leur code
    // d'exemple déclenche des avertissements qu'on ne peut pas corriger en
    // amont, et le bruit ferait perdre la valeur d'un lint à zéro.
    ".agents/**",
  ]),
]);

export default eslintConfig;
