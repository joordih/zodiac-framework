console.log("🚀 Zodiac Framework is starting...");

import { SauceContainer } from "./core/injection/sauceContainer.ts";
import { Router } from "./core/routing/router.ts";

// Initialize core systems
console.log("🚀 Zodiac Framework is initializing main instances...");
SauceContainer.autoRegister();
Router.init();

export { Router } from "./core/routing/router.ts";
export { Middleware } from "./core/middleware/middleware.ts";
export { Render } from "./core/render/vdom.ts";
export { Lazy } from "./core/lazy/lazy.ts";
export { Injectable } from "./core/injection/injectable.ts";
export { Inject } from "./core/injection/inject.ts";

if (process.env.NODE_ENV === 'development') {
  import("./test/components/modern-api-card.ts");
  import("./test/services/api-data.test.ts");
  import("./test/components/api-card.test.ts");
}
