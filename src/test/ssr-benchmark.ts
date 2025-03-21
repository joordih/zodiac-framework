import { renderApp } from '@/core/ssr/entry';
import { DashboardComponent } from '@/test/components/dashboard.tsx';
import { JSDOM } from 'jsdom';

interface BenchmarkResult {
  serverTime: number;
  clientTime: number;
  difference: number;
  diffPercentage: number;
  html: {
    server: string;
    client: string;
    match: boolean;
  };
}

export async function runSSRBenchmark(component: any = DashboardComponent, iterations: number = 10): Promise<BenchmarkResult> {
  console.log(`🧪 Running SSR benchmark (${iterations} iterations)...`);
  console.log(`🔍 Testing component: ${component.name || 'Anonymous Component'}`);
  
  
  let serverTotalTime = 0;
  let clientTotalTime = 0;
  let serverHtml = '';
  let clientHtml = '';
  
  
  console.log('📊 Server-side rendering...');
  // @ts-ignore
  const serverStart = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    const iterStart = performance.now();
    const result = await renderApp(component, '/dashboard');
    serverHtml = result.html; 
    const iterTime = performance.now() - iterStart;
    serverTotalTime += iterTime;
    
    if (i === 0 || i === iterations - 1) {
      console.log(`  Iteration ${i + 1}: ${iterTime.toFixed(2)}ms`);
    }
  }
  
  const serverAvgTime = serverTotalTime / iterations;
  console.log(`  Average server render time: ${serverAvgTime.toFixed(2)}ms`);
  
  
  console.log('📊 Client-side rendering...');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000',
    runScripts: 'dangerously'
  });
  
  // @ts-ignore
  const clientStart = performance.now();
  
  
  global.window = dom.window as any;
  global.document = dom.window.document;
  global.Element = dom.window.Element;
  global.HTMLElement = dom.window.HTMLElement;
  
  for (let i = 0; i < iterations; i++) {
    const iterStart = performance.now();
    
    
    const instance = new component();
    
    if (typeof instance.connectedCallback === 'function') {
      await instance.connectedCallback();
    }
    
    if (typeof instance.render === 'function') {
      instance.render();
    }
    
    
    if (instance.shadowRoot) {
      clientHtml = instance.shadowRoot.innerHTML;
    } else {
      console.warn('Component does not have shadowRoot, cannot extract client HTML');
    }
    
    const iterTime = performance.now() - iterStart;
    clientTotalTime += iterTime;
    
    if (i === 0 || i === iterations - 1) {
      console.log(`  Iteration ${i + 1}: ${iterTime.toFixed(2)}ms`);
    }
  }
  
  
  (global as any).window = undefined;
  (global as any).document = undefined;
  (global as any).Element = undefined;
  (global as any).HTMLElement = undefined;
  
  const clientAvgTime = clientTotalTime / iterations;
  console.log(`  Average client render time: ${clientAvgTime.toFixed(2)}ms`);
  
  
  const difference = serverAvgTime - clientAvgTime;
  const diffPercentage = (difference / clientAvgTime) * 100;
  
  
  const normalizedServerHtml = serverHtml.replace(/\s+/g, ' ').trim();
  const normalizedClientHtml = clientHtml.replace(/\s+/g, ' ').trim();
  const htmlMatch = normalizedServerHtml.includes(normalizedClientHtml);
  
  console.log(`\n📋 Benchmark Results:`);
  console.log(`  Server rendering: ${serverAvgTime.toFixed(2)}ms`);
  console.log(`  Client rendering: ${clientAvgTime.toFixed(2)}ms`);
  console.log(`  Difference: ${difference.toFixed(2)}ms (${diffPercentage.toFixed(2)}%)`);
  console.log(`  HTML Match: ${htmlMatch ? '✅ Yes' : '❌ No'}`);
  
  if (!htmlMatch) {
    console.log('\n⚠️ HTML Mismatch Details:');
    console.log('  Server HTML length:', normalizedServerHtml.length);
    console.log('  Client HTML length:', normalizedClientHtml.length);
  }
  
  return {
    serverTime: serverAvgTime,
    clientTime: clientAvgTime,
    difference,
    diffPercentage,
    html: {
      server: normalizedServerHtml,
      client: normalizedClientHtml,
      match: htmlMatch
    }
  };
}



if (import.meta.url === `file://${process.argv[1]}`) {
  runSSRBenchmark()
    .then(result => {
      console.log('\n✅ Benchmark completed successfully!');
      if (result.html.match) {
        console.log('✅ SSR is working correctly! Server and client HTML match.');
      } else {
        console.log('❌ SSR may have issues. Server and client HTML do not match perfectly.');
      }
    })
    .catch(error => {
      console.error('❌ Benchmark failed:', error);
    });
} 