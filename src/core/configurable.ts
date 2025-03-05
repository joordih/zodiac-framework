export function Configurable(config: Record<string, any>): ClassDecorator {
  return (target) => {
    Object.defineProperty(target.prototype, "__config__", {
      value: config,
      writable: false,
    });
  };
}
