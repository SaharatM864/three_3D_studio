import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// A second bundled copy of mediabunny breaks its `instanceof` checks.
const mediabunnyImports = [
  {
    name: "mediabunny",
    message: 'Import from "@/export/mediabunny" (single entry point).',
  },
  {
    name: "@mediabunny/aac-encoder",
    message:
      'Load it lazily via ensureAacEncoder() in "@/export/aac-fallback".',
  },
];

// project/, timeline/ and presets/ stay pure TypeScript so preview and export
// share one deterministic evaluator.
const pureModuleMessage =
  "src/project, src/timeline and src/presets must stay framework-free (see docs/architecture.md).";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      "no-restricted-imports": ["error", { paths: mediabunnyImports }],
    },
  },
  {
    files: ["src/project/**", "src/timeline/**", "src/presets/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...mediabunnyImports,
            { name: "react", message: pureModuleMessage },
            { name: "react-dom", message: pureModuleMessage },
            { name: "three", message: pureModuleMessage },
          ],
          patterns: [
            {
              group: [
                "react/**",
                "react-dom/**",
                "three/**",
                "@react-three/**",
                "@/app/**",
                "@/audio/**",
                "@/clips/**",
                "@/compositing/**",
                "@/components/**",
                "@/export/**",
                "@/features/**",
                "@/game/**",
                "@/scene/**",
                "@/stores/**",
              ],
              message: pureModuleMessage,
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/export/mediabunny.ts", "src/export/aac-fallback.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
