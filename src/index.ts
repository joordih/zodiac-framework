import "reflect-metadata";
console.log("🚀 Zodiac Framework is starting...");

import { SauceContainer } from "./core/injection/sauceContainer.ts";
import { Router } from "./core/routing/router.ts";
export { Inject } from "./core/injection/inject.ts";
export { Injectable } from "./core/injection/injectable.ts";
export { Lazy } from "./core/lazy/lazy.ts";
export { Middleware } from "./core/middleware/middleware.ts";
export { Render } from "./core/render/vdom.ts";

import "./test/services/api-data.ts";
import "./test/services/theme-service.ts";

console.log("🚀 Zodiac Framework is initializing main instances...");


import { DirectiveManager } from '@/core/directives/directive-manager';
import { TypedRouterService } from '@/core/router/typed/router-service';


SauceContainer.register('typed-router-service', TypedRouterService);
SauceContainer.register('directive-manager', DirectiveManager);


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

await Promise.all([
  import("./test/components/dashboard/overview.ts"),
  import("./test/components/api-card.ts"),
  import("./test/components/admin-panel.ts"),
  import("./test/components/dashboard.tsx"),
  import("./test/components/work-dashboard.ts"),
  import("./test/components/setup-component.ts"),
]);

Router.init();
console.log("✅ Router initialized");
