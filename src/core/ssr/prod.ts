import { Bundler } from './bundler';

async function startProd() {
  try {
    console.log('Starting production server with SSR...');
    
    const bundler = new Bundler({
      mode: 'production',
      port: 3000,
    });
    
    await bundler.startProd();
    
    console.log('Production server started!');
    console.log('Server: http://localhost:3000');
    
    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('Stopping production server...');
      await bundler.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start production server:', error);
    process.exit(1);
  }
}

startProd();