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
    // Enable source maps for debugging
    sourcemap: true,
    // Improve build performance
    minify: 'terser',
    // Configure rollup options
    rollupOptions: {
      output: {
        // Chunk files by type
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
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
  // SSR specific options
  ssr: {
    // External dependencies that shouldn't be bundled for SSR
    external: ['express'],
    // Force noExternal for dependencies that must be bundled for SSR
    noExternal: ['reflect-metadata'],
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['express', 'reflect-metadata'],
  },
  // Configure server options
  server: {
    // Enable HMR
    hmr: true,
    // Configure proxy for API requests if needed
    proxy: {
      // Example: '/api': 'http://localhost:8080'
    }
  }
});