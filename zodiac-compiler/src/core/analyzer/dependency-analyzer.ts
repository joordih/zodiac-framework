import { Program, ImportDeclaration, ClassDeclaration } from '../ast/types';
import * as fs from 'fs';
import * as path from 'path';
import { Parser } from '../parser/parser';

export interface DependencyInfo {
  imports: Map<string, Set<string>>;
  exports: Map<string, Set<string>>;
  dependencies: Map<string, Set<string>>;
}

export class DependencyAnalyzer {
  private program: Program;
  private dependencyInfo: DependencyInfo;
  private visitedFiles: Set<string> = new Set();
  private projectRoot: string;

  constructor(program: Program) {
    this.program = program;
    this.dependencyInfo = {
      imports: new Map(),
      exports: new Map(),
      dependencies: new Map()
    };
    this.projectRoot = process.cwd();
  }

  private resolveImportPath(importPath: string, fromPath: string): string | null {
    try {
      const projectRoot = this.projectRoot

      if (importPath.startsWith('@/')) {
        const srcPath = path.join(projectRoot, 'src')
        const resolvedPath = path.join(srcPath, importPath.slice(2))
        return this.addTsExtension(resolvedPath)
      }

      if (importPath.startsWith('.')) {
        const resolvedPath = path.resolve(path.dirname(fromPath), importPath)
        return this.addTsExtension(resolvedPath)
      }

      try {
        return require.resolve(importPath, { paths: [projectRoot] })
      } catch {
        const srcPath = path.join(projectRoot, 'src')
        return this.addTsExtension(path.join(srcPath, importPath))
      }
    } catch (error) {
      console.warn(`Warning: Could not resolve import path ${importPath} from ${fromPath}`)
      return null
    }
  }

  private addTsExtension(filePath: string): string {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return filePath
    
    
    if (fs.existsSync(`${filePath}.tsx`)) return `${filePath}.tsx`
    return `${filePath}.ts`
  }

  private analyzeImport(node: ImportDeclaration, currentFile: string): void {
    const source = node.source.value;
    if (typeof source !== 'string') {
      console.warn('Warning: Import source must be a string');
      return;
    }

    const resolvedPath = this.resolveImportPath(source, currentFile);
    if (!resolvedPath) {
      console.warn(`Warning: Could not resolve import path ${source} from ${currentFile}`);
      return;
    }

    if (!this.dependencyInfo.imports.has(resolvedPath)) {
      this.dependencyInfo.imports.set(resolvedPath, new Set());
    }

    if (node.specifiers) {
      node.specifiers.forEach(specifier => {
        if (specifier.imported?.name) {
          this.dependencyInfo.imports.get(resolvedPath)?.add(specifier.imported.name);
        }
      });
    }

    if (!this.visitedFiles.has(resolvedPath)) {
      this.analyzeFile(resolvedPath);
    }
  }

  private analyzeClass(node: ClassDeclaration): void {
    const className = node.id.name;
    const dependencies = new Set<string>();

    
    if (node.body) {
      node.body.body.forEach(member => {
        if (member.type === 'MethodDefinition') {
          this.analyzeMethodDependencies(member, dependencies);
        }
      });
    }

    this.dependencyInfo.dependencies.set(className, dependencies);
  }

  private analyzeMethodDependencies(member: any, dependencies: Set<string>): void {
    if (member.value && member.value.body) {
      const visit = (node: any) => {
        if (node.type === 'CallExpression') {
          if (node.callee.type === 'Identifier') {
            dependencies.add(node.callee.name);
          } else if (node.callee.type === 'MemberExpression') {
            dependencies.add(node.callee.object.name);
          }
        }
        if ('body' in node) {
          (node as any).body.forEach(visit);
        }
      };

      member.value.body.body.forEach(visit);
    }
  }

  private analyzeFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: File does not exist: ${filePath}`);
      return;
    }

    this.visitedFiles.add(filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parser = new Parser(filePath);
      const ast = parser.parse();

      ast.body.forEach(node => {
        if (node.type === 'ImportDeclaration') {
          this.analyzeImport(node as ImportDeclaration, filePath);
        } else if (node.type === 'ClassDeclaration') {
          this.analyzeClass(node as ClassDeclaration);
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not analyze file ${filePath}:`, error);
    }
  }

  analyze(currentFile: string): DependencyInfo {
    this.analyzeFile(currentFile);
    return this.dependencyInfo;
  }

  generateLazyLoadMap(): Map<string, string[]> {
    const lazyLoadMap = new Map<string, string[]>();

    this.dependencyInfo.dependencies.forEach((deps, className) => {
      const requiredFiles = new Set<string>();
      
      deps.forEach(dep => {
        this.dependencyInfo.imports.forEach((imports, file) => {
          if (imports.has(dep)) {
            requiredFiles.add(file);
          }
        });
      });

      lazyLoadMap.set(className, Array.from(requiredFiles));
    });

    return lazyLoadMap;
  }
} 