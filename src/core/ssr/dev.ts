import { Bundler } from './bundler';

async function startDev() {
  try {
    console.log('Starting development server with SSR...');
    
    const bundler = new Bundler({
      mode: 'development',
      port: 3000,
      ssrPort: 3001,
    });
    
    await bundler.startDev();
    
    console.log('Development server started!');
    console.log('Client: http://localhost:3000');
    console.log('SSR: http://localhost:3001');
    
    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('Stopping development server...');
      await bundler.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start development server:', error);
    process.exit(1);
  }
}

startDev();