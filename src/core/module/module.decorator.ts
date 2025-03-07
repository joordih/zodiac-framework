import { SauceContainer } from "../injection/sauceContainer.ts";
import { IZodiacModule } from "./module.interface.ts";

export function ZodiacModule(config: IZodiacModule): ClassDecorator {
  return (target: any) => {
    if (config.providers) {
      for (const provider of config.providers) {
        if (provider.useClass) {
          SauceContainer.register(provider.provide, provider.useClass);
        } else if (provider.useValue !== undefined) {
          SauceContainer.registerValue(provider.provide, provider.useValue);
        } else if (provider.useFactory) {
          SauceContainer.registerFactory(
            provider.provide,
            provider.useFactory,
            provider.deps
          );
        }
      }
    }

    Reflect.defineMetadata("zodiac:module", config, target);

    if (config.imports) {
      for (const importedModule of config.imports) {
        const metadata = Reflect.getMetadata("zodiac:module", importedModule);
        if (metadata) {
          if (metadata.exports) {
            for (const exportedItem of metadata.exports) {
              const exportedMetadata =
                Reflect.getMetadata("zodiac:component", exportedItem) ||
                Reflect.getMetadata("zodiac:service", exportedItem);

              if (exportedMetadata) {
                if (exportedMetadata.token) {
                  SauceContainer.register(exportedMetadata.token, exportedItem);
                }
              }
            }
          }
        }
      }
    }
  };
}
