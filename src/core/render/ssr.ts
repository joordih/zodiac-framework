import { Window, IElement, IText } from 'happy-dom';
import { VNode } from './vdom';

export class SSR {
  private static window = new Window({
    url: 'http://localhost:3000'
  });

  // @ts-ignore
  private static document = this.window.document;

  static async renderToString(instance: any): Promise<string> {
    try {
      
      let template = '';
      
      console.log('SSR: Available methods:', Object.getOwnPropertyNames(
        Object.getPrototypeOf(instance)
      ).filter(m => typeof instance[m] === 'function').join(', '));
      
      
      if (typeof instance.render === 'function') {
        console.log('SSR: Found render method, calling it...');
        try {
          
          const result = instance.render();
          if (typeof result === 'string') {
            console.log('SSR: Render returned string template');
            template = result;
          } else {
            console.log('SSR: Render did not return a string', typeof result);
          }
        } catch (error) {
          console.error('SSR: Error calling render method:', error);
        }
      }
      
      
      if (!template && instance.shadowRoot && instance.shadowRoot.innerHTML) {
        console.log('SSR: Getting template from shadowRoot.innerHTML');
        template = instance.shadowRoot.innerHTML;
      } else if (!template && instance.innerHTML) {
        
        console.log('SSR: Getting template from innerHTML');
        template = instance.innerHTML;
      }
      
      
      if (!template) {
        for (const prop of Object.getOwnPropertyNames(instance)) {
          const value = instance[prop];
          if (typeof value === 'string' && 
             (value.includes('<div') || value.includes('<span'))) {
            console.log(`SSR: Found potential template in property: ${prop}`);
            template = value;
            break;
          }
        }
      }
      
      if (!template) {
        console.warn('SSR: Unable to get template from component');
        template = '<div class="ssr-placeholder">Component content not available for SSR</div>';
      }

      
      let componentName = 'dashboard-component';
      
      
      if (instance.originalTagName) {
        
        componentName = instance.originalTagName;
      } else if (instance.constructor && instance.constructor.originalTagName) {
        
        componentName = instance.constructor.originalTagName;
      } else if (instance.constructor && instance.constructor.tagName) {
        
        componentName = instance.constructor.tagName;
      } else if (instance.tagName) {
        
        componentName = instance.tagName.toLowerCase();
      } else if (instance.constructor && instance.constructor.name && 
                instance.constructor.name !== 'HTMLElement') {
        
        componentName = instance.constructor.name;
      }

      if (template) {
        console.log(`SSR: Generated template for ${componentName}, length: ${template.length}`);
      } else {
        console.log(`SSR: No template generated for ${componentName}`);
      }

      
      return `
        <template shadowrootmode="open">
          ${template}
        </template>
        <${componentName} 
          data-component="${componentName}"
          data-route-path="/dashboard">
        </${componentName}>
      `;
    } catch (error) {
      console.error('SSR rendering failed:', error);
      return '';
    }
  }

  private static createFromElement(element: IElement): VNode {
    if (!element) {
      return { type: 'div', props: {}, children: [] };
    }

    const props: Record<string, any> = {};
    Array.from(element.attributes).forEach((attr) => {
      props[attr.name] = attr.value;
    });

    const children: VNode[] = [];
    Array.from(element.children).forEach((child) => {
      if (child && typeof child === 'object' && 'tagName' in child) {
        children.push(this.createFromElement(child as IElement));
      } else if (child && typeof child === 'object' && 'textContent' in child) {
        children.push({
          type: 'text',
          props: { textContent: (child as IText).textContent || '' },
          children: []
        });
      }
    });

    return {
      type: element.tagName.toLowerCase(),
      props,
      children
    };
  }

  private static vdomToString(node: VNode): string {
    if (node.type === 'text') {
      return node.props.textContent || '';
    }

    const props = Object.entries(node.props)
      .map(([key, value]) => ` ${key}="${value}"`)
      .join('');

    const children = node.children
      .map(child => this.vdomToString(child as VNode))
      .join('');

    return `<${node.type}${props}>${children}</${node.type}>`;
  }
} 