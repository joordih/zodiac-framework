console.log("🚀 Zodiac Framework is starting...");

import { SauceContainer } from "./core/injection/sauceContainer.ts";
import { Router } from "./core/routing/router.ts";

console.log("🚀 Zodiac Framework is initializing mainly instances...");
SauceContainer.autoRegister();
Router.init();

console.log("🚀 Zodiac Framework is initializing managers...");

console.log("🚀 Zodiac Framework is initializing components...");
import "./test/services/api-data.test.ts";
import "./test/components/api-card.test.ts";
