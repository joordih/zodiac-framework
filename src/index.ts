import "reflect-metadata";
console.log("🚀 Zodiac Framework is starting...");

import { SauceContainer } from "./core/injection/sauceContainer";
import { Router } from "./core/routing/router";
export { Inject } from "./core/injection/inject";
export { Injectable } from "./core/injection/injectable";
export { Lazy } from "./core/lazy/lazy";
export { Middleware } from "./core/middleware/middleware";
export { Render } from "./core/render/vdom";

// Import services
import "./test/services/api-data";
import "./test/services/theme-service";

console.log("🚀 Zodiac Framework is initializing main instances...");

import { DirectiveManager } from '@/core/directives/directive-manager';
import { TypedRouterService } from '@/core/router/typed/router-service';

// Register core services
SauceContainer.register('typed-router-service', TypedRouterService);
SauceContainer.register('directive-manager', DirectiveManager);

// Initialize core services
const initializeServices = async () => {
  const routerService = await SauceContainer.resolve('typed-router-service') as TypedRouterService;
  const directiveManager = await SauceContainer.resolve('directive-manager') as DirectiveManager;

  if (routerService && typeof routerService.onInit === 'function') {
    await routerService.onInit();
  }

  if (directiveManager && typeof directiveManager.onInit === 'function') {
    await directiveManager.onInit();
  }

  await SauceContainer.autoRegister();
  console.log("✅ Services initialized");
};

// Import and register components
const registerComponents = async () => {
  try {
    await Promise.all([
      import("./test/components/dashboard/overview"),
      import("./test/components/api-card"),
      import("./test/components/admin-panel"),
      import("./test/components/dashboard"),
      import("./test/components/work-dashboard"),
      import("./test/components/setup-component"),
    ]);
    console.log("✅ Components registered");
  } catch (error) {
    console.error("Error registering components:", error);
    throw error;
  }
};

// Initialize the application
const initializeApp = async () => {
  try {
    // First initialize services
    await initializeServices();
    
    // Then register components
    await registerComponents();
    
    // Initialize router with history mode and wait for it to be ready
    Router.init({ mode: 'history' });
    console.log("✅ Router initialized");

  } catch (error) {
    console.error("Error initializing application:", error);
  }
};

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
} else {
  initializeApp();
}
