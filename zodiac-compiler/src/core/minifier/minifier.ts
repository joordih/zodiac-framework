import { Program, Node, Identifier } from '../ast/types';

export class Minifier {
  private source: string;
  private ast: Program;
  private usedNames: Set<string> = new Set();
  private nameMap: Map<string, string> = new Map();

  constructor(source: string, ast: Program) {
    this.source = source;
    this.ast = ast;
  }

  minify(): string {
    this.collectUsedNames();
    this.generateNameMap();
    return this.transform();
  }

  private collectUsedNames(): void {
    const visit = (node: Node) => {
      if (!node) return;
      
      if (node.type === 'Identifier') {
        this.usedNames.add((node as Identifier).name);
      }
      
      
      if ('body' in node) {
        if (Array.isArray((node as any).body)) {
          (node as any).body.forEach(visit);
        } else if ((node as any).body) {
          visit((node as any).body);
        }
      }
      
      
      ['declarations', 'expression', 'left', 'right', 'init', 'test', 'consequent', 'alternate']
        .forEach(prop => {
          if (prop in node) {
            const value = (node as any)[prop];
            if (Array.isArray(value)) {
              value.forEach(visit);
            } else if (value && typeof value === 'object') {
              visit(value);
            }
          }
        });
    };

    this.ast.body.forEach(visit);
  }

  private generateNameMap(): void {
    const reservedWords = new Set([
      'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
      'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
      'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
      'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
      'var', 'void', 'while', 'with', 'yield'
    ]);

    let counter = 0;
    const generateName = () => {
      let name = '_' + counter.toString(36);
      while (this.usedNames.has(name) || reservedWords.has(name)) {
        counter++;
        name = '_' + counter.toString(36);
      }
      return name;
    };

    this.usedNames.forEach(name => {
      if (!reservedWords.has(name)) {
        this.nameMap.set(name, generateName());
      }
    });
  }

  private transform(): string {
    let output = this.source;
    
    const visit = (node: Node) => {
      if (!node) return;
      
      if (node.type === 'Identifier' && this.nameMap.has((node as Identifier).name)) {
        const start = node.start;
        const end = node.end;
        const newName = this.nameMap.get((node as Identifier).name)!;
        output = output.slice(0, start) + newName + output.slice(end);
      }
      
      if ('body' in node) {
        const body = (node as any).body;
        if (Array.isArray(body)) {
          body.forEach(visit);
        } else if (body && typeof body === 'object') {
          visit(body);
        }
      }
      
      ['declarations', 'expression', 'left', 'right', 'init', 'consequent', 'alternate']
        .forEach(prop => {
          if (prop in node) {
            const value = (node as any)[prop];
            if (Array.isArray(value)) {
              value.forEach(visit);
            } else if (value && typeof value === 'object') {
              visit(value);
            }
          }
        });
    };

    visit(this.ast);
    return output;
  }

  private removeWhitespace(code: string): string {
    return code
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}()\[\]<>+=!&|,;:?])\s*/g, '$1')
      .replace(/\s*([{}()\[\]<>+=!&|,;:?])\s*/g, '$1')
      .replace(/\s*([{}()\[\]<>+=!&|,;:?])\s*/g, '$1')
      .replace(/\s+/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
      .trim();
  }
} 