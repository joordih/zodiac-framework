# Zodiac Compiler

A custom compiler for the Zodiac Framework that provides minification and lazy loading capabilities.

## Features

- 🔍 **AST-based Parsing**: Uses TypeScript's compiler API to parse and analyze code
- 📦 **Minification**: Reduces code size by removing whitespace and mangling identifiers
- 🔄 **Lazy Loading**: Analyzes dependencies and generates lazy loading maps
- 🛠️ **CLI Interface**: Easy-to-use command line interface
- 📝 **TypeScript Support**: Full TypeScript support with type checking

## Installation

```bash
npm install zodiac-compiler
```

## Usage

### Command Line Interface

```bash
zodiac-compiler -i src/index.ts -o dist
```

Options:
- `-i, --input <file>`: Input file to compile
- `-o, --output <dir>`: Output directory (default: dist)
- `--no-minify`: Disable minification
- `--no-lazy`: Disable lazy loading
- `-h, --help`: Show help message

### Programmatic Usage

```typescript
import { Parser, Minifier, DependencyAnalyzer } from 'zodiac-compiler';

// Parse the code
const parser = new Parser('src/index.ts');
const ast = parser.parse();

// Analyze dependencies
const analyzer = new DependencyAnalyzer(ast);
const dependencies = analyzer.analyze();
const lazyLoadMap = analyzer.generateLazyLoadMap();

// Minify the code
const source = fs.readFileSync('src/index.ts', 'utf-8');
const minifier = new Minifier(source, ast);
const minified = minifier.minify();
```

## Output

The compiler generates two types of output:

1. **Minified Code**: The original code with whitespace removed and identifiers mangled
2. **Lazy Load Map**: A JSON file containing dependency information for lazy loading

Example lazy-load-map.json:
```json
{
  "ProductCard": ["product.model.ts", "product.service.ts"],
  "UserProfile": ["user.model.ts", "auth.service.ts"]
}
```

## How It Works

1. **Parsing**: The compiler uses TypeScript's compiler API to parse the source code into an AST
2. **Dependency Analysis**: Analyzes imports and class dependencies to create a dependency graph
3. **Minification**: Removes whitespace, comments, and mangles identifiers while preserving functionality
4. **Lazy Loading**: Generates a map of dependencies for each class to enable lazy loading

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT 