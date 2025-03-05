import { defineConfig } from "vite";
import * as path from "path";
import oxlintPlugin from "vite-plugin-oxlint";

export default defineConfig({
  plugins: [
    oxlintPlugin({
      configFile: "oxlintrc.json",
    }),
  ],
  assetsInclude: ["assets/root.css", "**/*/*.ttf"],
  base: "/",
  build: {
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core/"),
      "@components": path.resolve(__dirname, "./src/components"),
    },
  },
  preview: {
    port: 5550,
  },
});
