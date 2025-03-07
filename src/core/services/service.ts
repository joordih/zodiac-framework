export interface IService {
  register(): void | Promise<void>;
  unregister(): void | Promise<void>;
}
