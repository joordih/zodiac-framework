console.log("🚀 Zodiac Framework is starting...");

import { SauceContainer } from "./core/injection/sauceContainer.ts";
import { Router } from "./core/routing/router.ts";
export { Middleware } from "./core/middleware/middleware.ts";
export { Render } from "./core/render/vdom.ts";
export { Lazy } from "./core/lazy/lazy.ts";
export { Injectable } from "./core/injection/injectable.ts";
export { Inject } from "./core/injection/inject.ts";

// Importar servicios primero
import "./test/services/api-data.test.ts";

console.log("🚀 Zodiac Framework is initializing main instances...");
SauceContainer.autoRegister();
Router.init();

// Importar componentes después de que los servicios estén registrados
import("./test/components/api-card.test.ts");
import("./test/components/modern-api-card.ts");
