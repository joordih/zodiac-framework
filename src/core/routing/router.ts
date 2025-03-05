export class Router {
  private static routes = new Map<string, string>();

  static register(path: string, component: string) {
    this.routes.set(path, component);
  }

  static navigate(path: string) {
    if (this.routes.has(path)) {
      const container = document.querySelector("router-view");
      if (container) {
        container.innerHTML = `<${this.routes.get(path)}></${this.routes.get(path)}>`;
      }
    }
    history.pushState({}, "", path);
  }

  static init() {
    window.onpopstate = () => {
      this.navigate(location.pathname);
    };
    this.navigate(location.pathname);
  }
}