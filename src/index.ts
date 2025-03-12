import "reflect-metadata";
console.log("🚀 Zodiac Framework is starting...");

import { SauceContainer } from "./core/injection/sauceContainer.ts";
import { Router } from "./core/routing/router.ts";
export { Middleware } from "./core/middleware/middleware.ts";
export { Render } from "./core/render/vdom.ts";
export { Lazy } from "./core/lazy/lazy.ts";
export { Injectable } from "./core/injection/injectable.ts";
export { Inject } from "./core/injection/inject.ts";

import "./test/services/api-data.test.ts";
import "./test/services/theme-service.ts";

console.log("🚀 Zodiac Framework is initializing main instances...");

await SauceContainer.autoRegister();
console.log("✅ Services initialized");

// load components using Promise block and await
await Promise.all([
  import("./test/components/dashboard/overview.ts"),
  import("./test/components/api-card.test.ts"),
  import("./test/components/admin-panel.ts"),
  import("./test/components/dashboard.ts"),
]).then(() => {
  console.log("✅ Components loaded");
});

Router.init();
console.log("✅ Router initialized");
