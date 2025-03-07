import { Injectable } from "@/core/injection/injectable.ts";
import { Configurable } from "@/core/configurable.ts";
import { IService } from "@/core/services/service.ts";
import { ServiceData } from "@/core/services/decorator.ts";
import { InjectionScope } from "@/core/injection/injection-scope.ts";

@Injectable()
@ServiceData({
  token: "api-service",
  scope: InjectionScope.SINGLETON,
})
@Configurable({ baseUrl: "http://localhost:8080/" })
export class ApiService implements IService {
  private config!: { baseUrl: string };

  constructor() {
    this.config = (this as any).__config__;
  }
  register(): void {
    console.log("ApiService registered!");
  }
  unregister(): void {
    console.log("ApiService unregistered!");
  }

  async fetchData(): Promise<void> {
    console.log(`Fetching data from ${this.config.baseUrl}`);

    await fetch(this.config.baseUrl)
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error(error));
  }
}
