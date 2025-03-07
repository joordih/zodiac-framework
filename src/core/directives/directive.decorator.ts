import { DirectiveDefinition, DirectiveConstructor } from "./directive.interface.ts";

export const DIRECTIVES_REGISTRY: DirectiveConstructor[] = [];

export function Directive(definition: DirectiveDefinition) {
  return function(target: any) {
    target.definition = definition;
    
    DIRECTIVES_REGISTRY.push(target as DirectiveConstructor);
    
    return target;
  };
}
