import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      contracts: "src/contracts.ts",
      compile: "src/compile.ts",
    },
    format: ["esm"],
    outDir: "dist",
    target: "node22",
    platform: "node",
    bundle: true,
    splitting: false,
    clean: true,
    dts: true,
  },
  {
    entry: { browser: "src/browser.ts" },
    format: ["esm"],
    outDir: "dist",
    target: "es2022",
    platform: "browser",
    bundle: true,
    splitting: false,
    clean: false,
    dts: true,
  },
]);
