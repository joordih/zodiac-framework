import { Bundler } from './bundler';

async function buildProd() {
  try {
    console.log('Building production bundle with SSR support...');
    
    const bundler = new Bundler({
      mode: 'production',
      outDir: 'dist',
    });
    
    await bundler.build();
    
    console.log('Production build completed successfully!');
    console.log('To start the production server, run: node src/core/ssr/prod.ts');
  } catch (error) {
    console.error('Failed to build production bundle:', error);
    process.exit(1);
  }
}

buildProd();