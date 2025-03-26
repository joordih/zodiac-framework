import { build, createServer, InlineConfig, ViteDevServer } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import { SSRServer } from './server';

export interface BundlerOptions {
  mode?: 'development' | 'production';
  port?: number;
  ssrPort?: number;
  outDir?: string;
  root?: string;
}

export class Bundler {
  private options: Required<BundlerOptions>;
  private viteServer: ViteDevServer | null = null;
  private ssrServer: SSRServer | null = null;

  constructor(options: BundlerOptions = {}) {
    this.options = {
      mode: options.mode || 'development',
      port: options.port || 3000,
      ssrPort: options.ssrPort || 3001,
      outDir: options.outDir || 'dist',
      root: options.root || process.cwd(),
    };
  }

  /**
   * Start the bundler in development mode with SSR
   */
  async startDev(): Promise<void> {
    if (this.options.mode !== 'development') {
      throw new Error('startDev can only be called in development mode');
    }

    // Create Vite dev server
    const viteConfig: InlineConfig = {
      root: this.options.root,
      server: {
        port: this.options.port,
      },
      optimizeDeps: {
        // Add dependencies that need to be pre-bundled
        include: ['express', 'reflect-metadata'],
      },
      build: {
        // Ensure source maps are generated
        sourcemap: true,
      },
    };

    this.viteServer = await createServer(viteConfig);
    await this.viteServer.listen();
    console.log(`Vite dev server running at http://localhost:${this.options.port}`);

    // Start SSR server
    this.ssrServer = new SSRServer({
      port: this.options.ssrPort,
      isProduction: false,
    });
    await this.ssrServer.start();
  }

  /**
   * Build the application for production
   */
  async build(): Promise<void> {
    if (this.options.mode !== 'production') {
      throw new Error('build can only be called in production mode');
    }

    console.log('Building client bundle...');
    
    // Build client bundle
    await build({
      root: this.options.root,
      build: {
        outDir: this.options.outDir,
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: path.resolve(this.options.root, 'index.html'),
          },
        },
      },
    });

    console.log('Building server bundle...');
    
    // Build server bundle
    await build({
      root: this.options.root,
      build: {
        outDir: path.join(this.options.outDir, 'server'),
        emptyOutDir: true,
        ssr: true,
        rollupOptions: {
          input: {
            server: path.resolve(this.options.root, 'src/core/ssr/server.ts'),
          },
          output: {
            format: 'esm',
          },
        },
      },
    });

    console.log('Build complete!');
  }

  /**
   * Start the production server
   */
  async startProd(): Promise<void> {
    if (this.options.mode !== 'production') {
      throw new Error('startProd can only be called in production mode');
    }

    // Check if build exists
    const distPath = path.resolve(this.options.root, this.options.outDir);
    if (!fs.existsSync(distPath)) {
      throw new Error(`Build directory ${distPath} does not exist. Run build first.`);
    }

    // Start SSR server in production mode
    this.ssrServer = new SSRServer({
      port: this.options.port,
      isProduction: true,
      distPath,
    });
    await this.ssrServer.start();
  }

  /**
   * Stop all servers
   */
  async stop(): Promise<void> {
    if (this.viteServer) {
      await this.viteServer.close();
      this.viteServer = null;
    }
    
    // SSR server doesn't have a stop method yet, but we could add one if needed
    this.ssrServer = null;
  }
}