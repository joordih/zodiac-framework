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

await import("./test/components/api-card.test.ts");
await import("./test/components/admin-panel.ts");
await import("./test/components/dashboard.ts");
console.log("✅ Components loaded");

Router.init();
console.log("✅ Router initialized");
