import { renderApp } from '@/core/ssr/entry';
import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  isValid: boolean;
  serverContent: string;
  clientContent: string;
  diffCount: number;
  htmlMatch: boolean;
  contentMatch: boolean;
  hydrationWorkingCorrectly: boolean;
}

export async function validateSSR(component: any, outputDir: string = './ssr-validation'): Promise<ValidationResult> {
  console.log('🔍 Validating SSR for component:', component.name || 'Anonymous Component');
  
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  
  console.log('⚙️ Running server-side rendering...');
  const ssrResult = await renderApp(component, '/');
  const serverHtml = ssrResult.html;
  
  
  const serverOutputPath = path.join(outputDir, 'server-output.html');
  fs.writeFileSync(serverOutputPath, serverHtml);
  console.log(`✅ Server output written to: ${serverOutputPath}`);
  
  
  console.log('⚙️ Running client-side rendering...');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000',
    runScripts: 'dangerously'
  });
  
  
  global.window = dom.window as any;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.HTMLElement = dom.window.HTMLElement;
  
  
  const instance = new component();
  
  if (typeof instance.connectedCallback === 'function') {
    await instance.connectedCallback();
  }
  
  if (typeof instance.render === 'function') {
    instance.render();
  }
  
  
  let clientHtml = '';
  if (instance.shadowRoot) {
    clientHtml = instance.shadowRoot.innerHTML;
  } else {
    console.warn('⚠️ Component does not have shadowRoot, cannot extract client HTML');
    clientHtml = 'No shadowRoot available';
  }
  
  
  (global as any).window = undefined;
  (global as any).document = undefined;
  (global as any).Element = undefined;
  (global as any).HTMLElement = undefined;
  
  
  const clientOutputPath = path.join(outputDir, 'client-output.html');
  fs.writeFileSync(clientOutputPath, clientHtml);
  console.log(`✅ Client output written to: ${clientOutputPath}`);
  
  
  const normalizedServerHtml = serverHtml.replace(/\s+/g, ' ').trim();
  const normalizedClientHtml = clientHtml.replace(/\s+/g, ' ').trim();
  
  
  const htmlMatch = normalizedServerHtml.includes(normalizedClientHtml);
  
  
  let diffCount = 0;
  const minLength = Math.min(normalizedServerHtml.length, normalizedClientHtml.length);
  for (let i = 0; i < minLength; i++) {
    if (normalizedServerHtml[i] !== normalizedClientHtml[i]) {
      diffCount++;
    }
  }
  
  
  diffCount += Math.abs(normalizedServerHtml.length - normalizedClientHtml.length);
  
  
  const hydrationWorkingCorrectly = 
    normalizedServerHtml.includes('__INITIAL_STATE__') && 
    normalizedServerHtml.includes('shadowrootmode="open"');
  
  
  const diffOutputPath = path.join(outputDir, 'diff-view.html');
  const diffHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SSR Validation Results</title>
      <style>
        body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 2rem; }
        .container { display: flex; flex-direction: column; gap: 2rem; }
        .results { background-color: #f5f5f5; padding: 1rem; border-radius: 0.5rem; }
        .comparison { display: flex; gap: 1rem; }
        .column { flex: 1; }
        pre { white-space: pre-wrap; font-size: 0.875rem; padding: 1rem; background-color: #333; color: #fff; border-radius: 0.5rem; overflow: auto; max-height: 500px; }
        .success { color: #22c55e; }
        .warning { color: #f59e0b; }
        .error { color: #ef4444; }
        h2 { margin-top: 0; }
        .diff-highlight { background-color: #f87171; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>SSR Validation Results</h1>
        
        <div class="results">
          <h2>Validation Summary</h2>
          <p><strong>Component:</strong> ${component.name || 'Anonymous Component'}</p>
          <p><strong>HTML match:</strong> <span class="${htmlMatch ? 'success' : 'error'}">${htmlMatch ? 'Yes ✅' : 'No ❌'}</span></p>
          <p><strong>Difference count:</strong> <span class="${diffCount > 100 ? 'error' : diffCount > 0 ? 'warning' : 'success'}">${diffCount} characters</span></p>
          <p><strong>Hydration ready:</strong> <span class="${hydrationWorkingCorrectly ? 'success' : 'error'}">${hydrationWorkingCorrectly ? 'Yes ✅' : 'No ❌'}</span></p>
          <p><strong>Server HTML size:</strong> ${normalizedServerHtml.length} characters</p>
          <p><strong>Client HTML size:</strong> ${normalizedClientHtml.length} characters</p>
        </div>
        
        <div class="comparison">
          <div class="column">
            <h2>Server Output</h2>
            <pre>${normalizedServerHtml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>
          <div class="column">
            <h2>Client Output</h2>
            <pre>${normalizedClientHtml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  fs.writeFileSync(diffOutputPath, diffHtml);
  console.log(`✅ Visual comparison generated at: ${diffOutputPath}`);
  
  
  const isValid = htmlMatch && hydrationWorkingCorrectly;
  
  console.log('\n📋 Validation Results:');
  console.log(`  HTML Match: ${htmlMatch ? '✅ Yes' : '❌ No'}`);
  console.log(`  Difference count: ${diffCount} characters`);
  console.log(`  Hydration working: ${hydrationWorkingCorrectly ? '✅ Yes' : '❌ No'}`);
  console.log(`  Overall validation: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (isValid) {
    console.log('\n✅ SSR is working correctly!');
  } else {
    console.log('\n⚠️ SSR validation identified issues. Check the generated files for details.');
    console.log(`  📁 Open this file to visually inspect differences: ${diffOutputPath}`);
  }
  
  return {
    isValid,
    serverContent: serverHtml,
    clientContent: clientHtml,
    diffCount,
    htmlMatch,
    contentMatch: diffCount === 0,
    hydrationWorkingCorrectly
  };
}



if (import.meta.url === `file://${process.argv[1]}`) {
  
  import('@/test/components/dashboard.tsx').then(module => {
    const DashboardComponent = module.DashboardComponent;
    validateSSR(DashboardComponent)
      .then(result => {
        process.exit(result.isValid ? 0 : 1);
      })
      .catch(error => {
        console.error('❌ Validation failed with error:', error);
        process.exit(1);
      });
  }).catch(error => {
    console.error('❌ Failed to import component:', error);
    process.exit(1);
  });
} 