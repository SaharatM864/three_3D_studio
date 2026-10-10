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

const webglPostprocessingMessage =
  "WebGL post-processing does not work with WebGPU; add TSL nodes in src/scene/pipeline/ instead (see docs/architecture.md).";

const webglCloudsMessage =
  "This clouds entry is WebGL only (GLSL + postprocessing); WebGPU clouds go through src/scene/clouds/three-clouds.ts (see docs/architecture.md).";

const webglImports = [
  { name: "postprocessing", message: webglPostprocessingMessage },
  { name: "@react-three/postprocessing", message: webglPostprocessingMessage },
  { name: "@takram/three-clouds", message: webglCloudsMessage },
  { name: "@takram/three-clouds/r3f", message: webglCloudsMessage },
  { name: "@yong_three/three-clouds", message: webglCloudsMessage },
  { name: "@yong_three/three-clouds/r3f", message: webglCloudsMessage },
];

// @takram/* is alpha and typed against an older @types/three; only the
// adapter files may import it, so upgrades and casts stay in one place.
const takramImports = {
  group: ["@takram/**"],
  message:
    'Import @takram/* through "src/scene/atmosphere/takram.ts", "src/scene/pipeline/takram.ts" or "src/scene/clouds/three-clouds.ts" (see docs/architecture.md).',
};

const rapierImports = {
  group: ["@dimforge/**", "@react-three/rapier", "@react-three/rapier/**"],
  message:
    'Import Rapier through "src/physics/rapier.ts" and keep bodies in PhysicsWorld (see docs/architecture.md).',
};

const cameraControlsImports = {
  regex: "^camera-controls(/.*)?$",
  message:
    'Import camera-controls through "src/scene/camera/camera-controls.ts" (see docs/architecture.md).',
};

const dreiCameraImports = [
  {
    name: "@react-three/drei",
    importNames: [
      "CameraControls",
      "CameraControlsImpl",
      "OrbitControls",
      "MapControls",
      "TrackballControls",
      "ArcballControls",
      "FlyControls",
      "FirstPersonControls",
      "PointerLockControls",
      "DeviceOrientationControls",
      "PerspectiveCamera",
      "OrthographicCamera",
    ],
    message:
      "The canvas camera has one owner: drive it through src/scene/camera/ (see docs/architecture.md).",
  },
];

const cloudsForkImports = {
  group: ["@yong_three/**"],
  message:
    'Import the WebGPU clouds through "src/scene/clouds/three-clouds.ts" (see docs/architecture.md).',
};

const oceanInternalImports = {
  group: [
    "**/ocean/simulation/**",
    "**/ocean/surface/**",
    "**/ocean/underwater/**",
  ],
  message:
    'Use the ocean through "src/scene/ocean/create-ocean.ts" or "src/scene/ocean/ocean.tsx" (see docs/architecture.md).',
};

// model/, timeline/ and presets/ stay pure TypeScript so preview and export
// share one deterministic evaluator.
const pureModuleMessage =
  "src/model, src/timeline and src/presets must stay framework-free (see docs/architecture.md).";

const pureModuleImports = [
  { name: "react", message: pureModuleMessage },
  { name: "react-dom", message: pureModuleMessage },
  { name: "three", message: pureModuleMessage },
];

const pureModulePatterns = {
  group: [
    "react/**",
    "react-dom/**",
    "three/**",
    "@react-three/**",
    "@takram/**",
    "@yong_three/**",
    "camera-controls",
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
};

const physicsModuleMessage =
  "src/physics may use three's math classes only: no React, GPU nodes or app layers (see docs/architecture.md).";

const physicsModuleImports = [
  { name: "react", message: physicsModuleMessage },
  { name: "react-dom", message: physicsModuleMessage },
  { name: "three/webgpu", message: physicsModuleMessage },
  { name: "three/tsl", message: physicsModuleMessage },
];

const physicsModulePatterns = {
  group: [
    "react/**",
    "react-dom/**",
    "@react-three/**",
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
  message: physicsModuleMessage,
};

const projectCameraImports = {
  group: ["@/scene/camera/**"],
  message:
    "Projects do not own the camera: set playground.spawn or the clip camera instead (see docs/project-authoring.md).",
};

const crossProjectImports = {
  group: ["@/projects/*/**"],
  message:
    'Projects must not import other projects; use "./" inside your own project (see docs/project-authoring.md).',
};

function restrictImports({ files, paths = [], patterns = [] }) {
  return {
    ...(files && { files }),
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...mediabunnyImports,
            ...webglImports,
            ...dreiCameraImports,
            ...paths,
          ],
          patterns: [...patterns, oceanInternalImports],
        },
      ],
    },
  };
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  restrictImports({
    patterns: [
      takramImports,
      cloudsForkImports,
      cameraControlsImports,
      rapierImports,
    ],
  }),
  restrictImports({
    files: ["src/model/**", "src/timeline/**", "src/presets/**"],
    paths: pureModuleImports,
    patterns: [pureModulePatterns, rapierImports],
  }),
  restrictImports({
    files: ["src/physics/**"],
    paths: physicsModuleImports,
    patterns: [
      physicsModulePatterns,
      takramImports,
      cloudsForkImports,
      cameraControlsImports,
      rapierImports,
    ],
  }),
  restrictImports({
    files: ["src/physics/rapier.ts"],
    paths: physicsModuleImports,
    patterns: [
      physicsModulePatterns,
      takramImports,
      cloudsForkImports,
      cameraControlsImports,
    ],
  }),
  restrictImports({
    files: ["src/projects/*/**"],
    patterns: [
      crossProjectImports,
      projectCameraImports,
      takramImports,
      cloudsForkImports,
      cameraControlsImports,
      rapierImports,
    ],
  }),
  restrictImports({
    files: ["src/scene/atmosphere/takram.ts", "src/scene/pipeline/takram.ts"],
    patterns: [cloudsForkImports, cameraControlsImports, rapierImports],
  }),
  restrictImports({
    files: ["src/scene/clouds/three-clouds.ts"],
    patterns: [cameraControlsImports, rapierImports],
  }),
  restrictImports({
    files: ["src/scene/camera/camera-controls.ts"],
    patterns: [takramImports, cloudsForkImports, rapierImports],
  }),
  {
    files: ["src/export/mediabunny.ts", "src/export/aac-fallback.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
