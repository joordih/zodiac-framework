import { renderApp } from '@/core/ssr/entry';
import { DashboardComponent } from '@/test/components/dashboard.tsx';

async function testSSR() {
  console.log('🧪 Testing direct SSR rendering of Dashboard component...');
  console.log('Rendering component class: DashboardComponent');
  
  try {
    
    console.log('Letting SSR pipeline handle component initialization...');
    const result = await renderApp(DashboardComponent, '/dashboard');
    
    console.log('\n✅ SSR Result:');
    console.log('====================');
    console.log('HTML:');
    console.log(result.html);
    console.log('\n====================');
    console.log('State:', result.state);
    console.log('Headers:', result.headers);
  } catch (error) {
    console.error('❌ SSR Test failed:', error);
  }
}


testSSR(); 