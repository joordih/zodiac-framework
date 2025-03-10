import "reflect-metadata";
import { SauceContainer } from "./core/injection/sauceContainer.ts";
import { Router } from "./core/routing/router.ts";
import "./test/services/api-data.test.ts";

console.log("🚀 Zodiac Framework is starting...");

export { Middleware } from "./core/middleware/middleware.ts";
export { Render } from "./core/render/vdom.ts";
export { Lazy } from "./core/lazy/lazy.ts";
export { Injectable } from "./core/injection/injectable.ts";
export { Inject } from "./core/injection/inject.ts";

<<<<<<< HEAD
=======
import "./test/services/api-data.test.ts";
import "./test/services/theme-service.ts";

>>>>>>> 68fa31bdb049ae3af3b5ca9a528b2c5de8e35126
console.log("🚀 Zodiac Framework is initializing main instances...");

await SauceContainer.autoRegister();
console.log("✅ Services initialized");

await import("./test/components/api-card.test.ts");
await import("./test/components/admin-panel.ts");
console.log("✅ Components loaded");

Router.init();
console.log("✅ Router initialized");
