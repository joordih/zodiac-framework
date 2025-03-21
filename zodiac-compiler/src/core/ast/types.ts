export interface Node {
  type: string;
  start: number;
  end: number;
}

export interface Program extends Node {
  type: 'Program';
  body: Statement[];
}

export interface Statement extends Node {
  type: string;
}

export interface Expression extends Node {
  type: string;
}

export interface ClassDeclaration extends Statement {
  type: 'ClassDeclaration';
  id: Identifier;
  body: ClassBody;
  superClass?: Expression;
}

export interface ClassBody extends Node {
  type: 'ClassBody';
  body: MethodDefinition[];
}

export interface MethodDefinition extends Node {
  type: 'MethodDefinition';
  key: Identifier;
  value: FunctionExpression;
  kind: 'constructor' | 'method' | 'get' | 'set';
  static: boolean;
}

export interface FunctionExpression extends Expression {
  type: 'FunctionExpression';
  id?: Identifier;
  params: Identifier[];
  body: BlockStatement;
}

export interface BlockStatement extends Statement {
  type: 'BlockStatement';
  body: Statement[];
}

export interface Identifier extends Expression {
  type: 'Identifier';
  name: string;
}

export interface ImportDeclaration extends Statement {
  type: 'ImportDeclaration';
  source: Literal;
  specifiers: ImportSpecifier[];
}

export interface ImportSpecifier extends Node {
  type: 'ImportSpecifier';
  imported: Identifier;
  local: Identifier;
}

export interface Literal extends Expression {
  type: 'Literal';
  value: string | number | boolean | null;
}

export interface CallExpression extends Expression {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface MemberExpression extends Expression {
  type: 'MemberExpression';
  object: Expression;
  property: Identifier;
  computed: boolean;
} 