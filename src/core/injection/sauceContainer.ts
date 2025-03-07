export class SauceContainer {
  private static providers = new Map<string, any>();
  private static instances = new Map<string, any>();

  static register<T>(token: string, clazz: new (...args: any[]) => T) {
    if (!this.providers.has(token)) {
      console.log(`Registering provider for token: ${token}`);
      this.providers.set(token, clazz);
    }
  }

  static resolve<T>(token: string): T {
    if (!this.instances.has(token)) {
      const clazz = this.providers.get(token);
      if (clazz) {
        this.instances.set(token, new clazz());
      }
    }
    return this.instances.get(token);
  }

  static async autoRegister(): Promise<void> {
    console.log("Auto-registering providers...");

    for (const [token, _clazz] of this.providers) {
      if (!this.instances.has(token)) {
        console.log(`Registering ${token}`);
        this.resolve(token);
      }
    }

    const initPromises = Array.from(this.instances).map(
      async ([token, instance]) => {
        const clazz = this.providers.get(token);

        if (clazz && clazz.prototype.constructor.name === token) {
          console.log(`Initializing ${token} as a service`);

          if (
            typeof instance === "object" &&
            instance !== null &&
            "register" in instance
          ) {
            await Promise.resolve(
              (instance as { register: () => void | Promise<void> }).register()
            );
          }
        }
      }
    );

    await Promise.all(initPromises);
  }
}
