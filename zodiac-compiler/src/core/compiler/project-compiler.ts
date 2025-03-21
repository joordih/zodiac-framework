import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { Parser } from '../parser/parser';
import { Minifier } from '../minifier/minifier';
import { DependencyAnalyzer } from '../analyzer/dependency-analyzer';

interface ProjectCompilerOptions {
  outDir: string;
  minify?: boolean;
  lazy?: boolean;
  entryPoints: string[];
  exclude?: string[];
}

export class ProjectCompiler {
  private processedFiles: Set<string> = new Set();
  private compiledFiles: Map<string, string> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private chunks: Map<string, Set<string>> = new Map();

  constructor(private options: ProjectCompilerOptions) {
    this.options.minify = this.options.minify ?? false;
    this.options.lazy = this.options.lazy ?? false;
    this.options.exclude = this.options.exclude ?? [];
  }

  private getCompilerOptions(): ts.CompilerOptions {
    return {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.React,
      jsxFactory: 'h',
      jsxFragmentFactory: 'Fragment',
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      isolatedModules: true,
      verbatimModuleSyntax: true,
      skipLibCheck: true,
      lib: ['DOM', 'DOM.Iterable', 'ESNext'],
      outDir: this.options.outDir,
      sourceMap: true,
      declaration: true,
      noEmit: false,
      allowJs: true,
      resolveJsonModule: true
    };
  }

  private async processFile(filePath: string): Promise<void> {
    if (this.processedFiles.has(filePath)) return;
    if (this.shouldExclude(filePath)) return;

    this.processedFiles.add(filePath);

    try {
      const source = fs.readFileSync(filePath, 'utf-8');
      const parser = new Parser(filePath);
      const ast = parser.parse();
      
      const analyzer = new DependencyAnalyzer(ast);
      const dependencies = analyzer.analyze(filePath);
      
      for (const [importPath] of Array.from(dependencies.imports.entries())) {
        const resolvedPath = this.resolveImportPath(filePath, importPath);
        if (resolvedPath) {
          if (!this.dependencyGraph.has(filePath)) {
            this.dependencyGraph.set(filePath, new Set());
          }
          this.dependencyGraph.get(filePath)!.add(resolvedPath);
          await this.processFile(resolvedPath);
        }
      }

      const compilerOptions = this.getCompilerOptions();
      let output = this.transformImports(source, filePath);
      
      const result = ts.transpileModule(output, {
        compilerOptions,
        fileName: filePath,
        reportDiagnostics: true
      });

      if (result.diagnostics && result.diagnostics.length > 0) {
        result.diagnostics.forEach(diagnostic => {
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
          console.warn(`Warning in ${filePath}: ${message}`);
        });
      }

      output = result.outputText;
      
      if (this.options.minify) {
        const minifier = new Minifier(output, ast);
        output = minifier.minify();
      }

      const outPath = this.getOutputPath(filePath);
      const outDir = path.dirname(outPath);
      
      // Create output directory before writing files
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      // Write the JS file
      fs.writeFileSync(outPath, output);
      
      // Write the source map if it exists
      if (result.sourceMapText) {
        fs.writeFileSync(`${outPath}.map`, result.sourceMapText);
      }

      this.compiledFiles.set(filePath, output);

    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      throw error;
    }
  }

  private getOutputPath(filePath: string): string {
    const relativePath = path.relative(process.cwd(), filePath);
    return path.join(
      this.options.outDir,
      relativePath.replace(/\.tsx?$/, '.js')
    );
  }

  private transformImports(source: string, filePath: string): string {
    return source.replace(
      /(import[\s\S]*?from\s+['"])([\.\/].*?)(['"])/g,
      (match, start, importPath, end) => {
        if (!importPath.endsWith('.js')) {
          importPath = importPath.replace(/\.tsx?$/, '.js');
          if (!importPath.endsWith('.js')) {
            importPath = `${importPath}.js`;
          }
        }
        return `${start}${importPath}${end}`;
      }
    );
  }

  private shouldExclude(filePath: string): boolean {
    if (!this.options.exclude || this.options.exclude.length === 0) {
      return false;
    }

    return this.options.exclude.some((pattern: string) => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(filePath);
    });
  }

  private resolveImportPath(fromPath: string, importPath: string): string | null {
    try {
      const projectRoot = process.cwd();
      
      
      if (importPath.startsWith('@/')) {
        const srcPath = path.join(projectRoot, 'src');
        const resolvedPath = path.join(srcPath, importPath.slice(2));
        
        if (!resolvedPath.endsWith('.ts')) {
          return resolvedPath + '.ts';
        }
        return resolvedPath;
      }

      
      if (importPath.startsWith('.')) {
        const resolvedPath = path.resolve(path.dirname(fromPath), importPath);
        
        if (!resolvedPath.endsWith('.ts')) {
          return resolvedPath + '.ts';
        }
        return resolvedPath;
      }

      
      try {
        return require.resolve(importPath, { paths: [projectRoot] });
      } catch {
        
        const srcPath = path.join(projectRoot, 'src');
        const resolvedPath = path.join(srcPath, importPath);
        if (!resolvedPath.endsWith('.ts')) {
          return resolvedPath + '.ts';
        }
        return resolvedPath;
      }
    } catch (error) {
      console.warn(`Warning: Could not resolve import path ${importPath} from ${fromPath}`);
      return null;
    }
  }

  async compileProject(): Promise<void> {
    console.log(`\nCompiling ${this.options.entryPoints.length} files...`);
    
    
    await Promise.all(this.options.entryPoints.map(entry => this.processFile(entry)));

    
    if (this.options.lazy) {
      const visited = new Set<string>();
      
      for (const file of Array.from(this.processedFiles)) {
        if (!visited.has(file)) {
          const chunk = new Set<string>();
          this.traverseChunk(file, chunk, visited);
          this.chunks.set(file, chunk);
        }
      }

      
      this.chunks.forEach((files, entryPoint) => {
        const chunkId = this.generateChunkId(entryPoint);
        this.updateImportsForChunk(files, chunkId);
      });
    }

    
    if (!fs.existsSync(this.options.outDir)) {
      fs.mkdirSync(this.options.outDir, { recursive: true });
    }

    
    for (const [filePath, content] of Array.from(this.compiledFiles.entries())) {
      const outPath = this.getOutputPath(filePath);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, content);
      console.log(`Written: ${outPath}`);
    }

    
    if (this.options.lazy) {
      const lazyLoadMap = this.generateLazyLoadMap();
      fs.writeFileSync(
        path.join(this.options.outDir, 'lazy-load-map.json'),
        JSON.stringify(lazyLoadMap, null, 2)
      );
    }

    
    const indexPath = path.join(this.options.outDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      const indexContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zodiac App</title>
  </head>
  <body>
    <script type="module" src="./src/index.js"></script>
  </body>
</html>`;
      fs.writeFileSync(indexPath, indexContent);
      console.log('Created:', indexPath);
    }

    console.log('Compilation completed successfully!');
  }

  private traverseChunk(file: string, chunk: Set<string>, visited: Set<string>): void {
    visited.add(file);
    chunk.add(file);

    const dependencies = this.dependencyGraph.get(file) || new Set();
    for (const dep of Array.from(dependencies)) {
      if (!visited.has(dep)) {
        this.traverseChunk(dep, chunk, visited);
      }
    }
  }

  private generateChunkId(filePath: string): string {
    return path.basename(filePath, path.extname(filePath)) + '_' + 
           Buffer.from(filePath).toString('base64').slice(0, 8);
  }

  private updateImportsForChunk(files: Set<string>, chunkId: string): void {
    files.forEach(file => {
      let content = this.compiledFiles.get(file) || '';
      content = content.replace(
        /import\s+.*?\s+from\s+['"](.+?)['"]/g,
        (match, importPath) => {
          const resolvedPath = this.resolveImportPath(file, importPath);
          if (resolvedPath && files.has(resolvedPath)) {
            return `import /* webpackChunkName: "${chunkId}" */ ${match}`;
          }
          return match;
        }
      );
      this.compiledFiles.set(file, content);
    });
  }

  private generateLazyLoadMap(): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    this.dependencyGraph.forEach((deps, file) => {
      map[this.generateChunkId(file)] = Array.from(deps).map(dep => 
        path.relative(process.cwd(), dep)
      );
    });
    return map;
  }
}