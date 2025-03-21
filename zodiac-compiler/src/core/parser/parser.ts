import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { Program, Statement, ClassDeclaration, ImportDeclaration } from '../ast/types';

export class Parser {
  private program: ts.Program;
  private sourceFile: ts.SourceFile;
  private checker: ts.TypeChecker;

  constructor(filePath: string) {
    const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json');
    if (!configPath) {
      throw new Error('Could not find tsconfig.json');
    }

    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const compilerOptions = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath)
    );

    compilerOptions.options.jsx = ts.JsxEmit.React;
    compilerOptions.options.jsxFactory = 'h';
    compilerOptions.options.jsxFragmentFactory = 'Fragment';

    const outDir = compilerOptions.options.outDir || 'dist';
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    this.program = ts.createProgram([filePath], compilerOptions.options);
    this.sourceFile = this.program.getSourceFile(filePath) as ts.SourceFile;
    if (!this.sourceFile) {
      throw new Error(`Could not find source file: ${filePath}`);
    }
    this.checker = this.program.getTypeChecker();
  }

  parse(): Program {
    const statements: Statement[] = [];
    const sourceFile = this.sourceFile;

    function visit(node: ts.Node) {
      if (ts.isClassDeclaration(node)) {
        statements.push(parseClassDeclaration(node));
      } else if (ts.isImportDeclaration(node)) {
        statements.push(parseImportDeclaration(node));
      }
      ts.forEachChild(node, visit);
    }

    function parseClassDeclaration(node: ts.ClassDeclaration): ClassDeclaration {
      return {
        type: 'ClassDeclaration',
        start: node.getStart(),
        end: node.getEnd(),
        id: {
          type: 'Identifier',
          name: node.name?.text || '',
          start: node.name?.getStart() || 0,
          end: node.name?.getEnd() || 0
        },
        body: {
          type: 'ClassBody',
          start: node.members[0].getStart(),
          end: node.members[node.members.length - 1].getEnd(),
          body: node.members.map(member => {
            if (ts.isMethodDeclaration(member)) {
              return {
                type: 'MethodDefinition',
                start: member.getStart(),
                end: member.getEnd(),
                key: {
                  type: 'Identifier',
                  name: member.name.getText(),
                  start: member.name.getStart(),
                  end: member.name.getEnd()
                },
                value: {
                  type: 'FunctionExpression',
                  start: member.getStart(),
                  end: member.getEnd(),
                  id: undefined,
                  params: member.parameters.map(param => ({
                    type: 'Identifier',
                    name: param.name.getText(),
                    start: param.name.getStart(),
                    end: param.name.getEnd()
                  })),
                  body: {
                    type: 'BlockStatement',
                    start: member.body?.getStart() || 0,
                    end: member.body?.getEnd() || 0,
                    body: []
                  }
                },
                kind: member.kind === ts.SyntaxKind.MethodDeclaration ? 'method' : 'constructor',
                static: member.modifiers?.some(mod => mod.kind === ts.SyntaxKind.StaticKeyword) || false
              };
            }
            return null;
          }).filter(Boolean) as any[]
        }
      };
    }

    function parseImportDeclaration(node: ts.ImportDeclaration): ImportDeclaration {
      return {
        type: 'ImportDeclaration',
        start: node.getStart(),
        end: node.getEnd(),
        source: {
          type: 'Literal',
          value: node.moduleSpecifier.getText().replace(/['"]/g, ''),
          start: node.moduleSpecifier.getStart(),
          end: node.moduleSpecifier.getEnd()
        },
        specifiers: node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)
          ? node.importClause.namedBindings.elements.map(element => ({
              type: 'ImportSpecifier',
              start: element.getStart(),
              end: element.getEnd(),
              imported: {
                type: 'Identifier',
                name: element.name.getText(),
                start: element.name.getStart(),
                end: element.name.getEnd()
              },
              local: {
                type: 'Identifier',
                name: element.name.getText(),
                start: element.name.getStart(),
                end: element.name.getEnd()
              }
            }))
          : []
      };
    }

    visit(sourceFile);

    return {
      type: 'Program',
      start: sourceFile.getStart(),
      end: sourceFile.getEnd(),
      body: statements
    };
  }
} 