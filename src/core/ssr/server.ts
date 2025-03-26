import express from 'express';
import { Router } from '../routing/router';
import { VirtualDOM } from '../render/vdom';
import * as path from 'path';
import * as fs from 'fs';

export class SSRServer {
  private app = express();
  private port: number;
  private isProduction: boolean;
  private distPath: string;
  private indexTemplate: string;

  constructor(options: { port?: number; isProduction?: boolean; distPath?: string } = {}) {
    this.port = options.port || 3000;
    this.isProduction = options.isProduction || false;
    this.distPath = options.distPath || path.resolve(process.cwd(), this.isProduction ? 'dist' : '');
    
    // Load the index.html template
    const indexPath = path.resolve(process.cwd(), this.isProduction ? 'dist/index.html' : 'index.html');
    this.indexTemplate = fs.readFileSync(indexPath, 'utf-8');
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // Serve static files from the dist directory in production
    if (this.isProduction) {
      this.app.use(express.static(this.distPath));
    }
  }

  private setupRoutes() {
    // Handle all routes with SSR
    this.app.get('*', async (req, res) => {
      try {
        const url = req.originalUrl;
        
        // Initialize SSR context
        const ssrContext = {
          url,
          rendered: false,
          html: '',
        };

        // Render the app to string
        const appHtml = await this.renderToString(url, ssrContext);
        
        if (!ssrContext.rendered) {
          // If not rendered (e.g., 404), send appropriate status
          return res.status(404).send('Not Found');
        }

        // Insert the rendered app into the HTML template
        const html = this.indexTemplate.replace(
          '<body></body>',
          `<body>${appHtml}</body>`
        );

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        console.error('SSR Error:', error);
        res.status(500).send('Server Error');
      }
    });
  }

  private async renderToString(url: string, context: { url: string; rendered: boolean; html: string }): Promise<string> {
    try {
      // Initialize router if not already initialized
      if (!Router['initialized']) {
        Router.init();
      }

      // Navigate to the requested URL
      const routeContext = await Router.navigate(url, false);
      
      if (!routeContext) {
        context.rendered = false;
        return '';
      }
      
      // Get the component for the route
      const componentName = routeContext.component;
      
      // Create a VNode for the component
      const vnode = VirtualDOM.createVNodeFromComponent(componentName, {
        'data-route-path': url,
        'data-component': componentName
      });
      
      // Render the VNode to string
      const html = VirtualDOM.renderToString(vnode);
      
      context.rendered = true;
      return html;
    } catch (error) {
      console.error('Error rendering to string:', error);
      context.rendered = false;
      return '';
    }
  }

  private addHydrationScript(html: string): string {
    // Add a script to hydrate the app on the client
    const hydrationScript = `
      <script>
        window.__SSR_DATA__ = true;
      </script>
    `;
    
    return html.replace('</head>', `${hydrationScript}</head>`);
  }

  public start() {
    return new Promise<void>((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`SSR server running at http://localhost:${this.port}`);
        resolve();
      });
    });
  }
}