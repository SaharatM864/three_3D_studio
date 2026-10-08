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

// @takram/* is alpha and typed against an older @types/three; only the two
// adapter files may import it, so upgrades and casts stay in one place.
const takramImports = {
  group: ["@takram/**"],
  message:
    'Import @takram/* through "src/scene/atmosphere/takram.ts" or "src/scene/pipeline/takram.ts" (see docs/architecture.md).',
};

// model/, timeline/ and presets/ stay pure TypeScript so preview and export
// share one deterministic evaluator.
const pureModuleMessage =
  "src/model, src/timeline and src/presets must stay framework-free (see docs/architecture.md).";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: mediabunnyImports, patterns: [takramImports] },
      ],
    },
  },
  {
    files: ["src/model/**", "src/timeline/**", "src/presets/**"],
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
                "@takram/**",
                "@/app/**",
                "@/audio/**",
                "@/compositing/**",
                "@/components/**",
                "@/export/**",
                "@/features/**",
                "@/game/**",
                "@/projects/**",
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
    files: ["src/projects/*/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: mediabunnyImports,
          patterns: [
            {
              group: ["@/projects/*/**"],
              message:
                'Projects must not import other projects; use "./" inside your own project (see docs/project-authoring.md).',
            },
            takramImports,
          ],
        },
      ],
    },
  },
  {
    files: ["src/scene/atmosphere/takram.ts", "src/scene/pipeline/takram.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: mediabunnyImports }],
    },
  },
  {
    files: ["src/export/mediabunny.ts", "src/export/aac-fallback.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
