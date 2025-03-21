#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { ProjectCompiler } from '../core/compiler/project-compiler';

interface CliArgs {
  projectPath: string;
  outDir: string;
  entryDir?: string;
}

function getArgValue(flag: string): string {
  const equalArg = process.argv.find(arg => arg.startsWith(`${flag}=`));
  if (equalArg) return equalArg.split('=')[1];

  const index = process.argv.indexOf(flag);
  if (index !== -1 && index + 1 < process.argv.length) {
    return process.argv[index + 1];
  }
  return '';
}

function findTypeScriptFiles(baseDir: string): string[] {
  console.log('Searching for TypeScript files in:', baseDir);
  
  
  const allFiles = glob.sync('**/*.{ts,tsx}', {
    cwd: baseDir,
    absolute: true,
    nodir: true,
    ignore: ['**/node_modules/**', '**/dist/**']
  });

  console.log('\nFound TypeScript files:');
  allFiles.forEach(file => console.log(`- ${path.relative(baseDir, file)}`));
  
  return allFiles;
}

async function main(): Promise<void> {
  try {
    const args: CliArgs = {
      projectPath: getArgValue('-p') || getArgValue('--project'),
      outDir: getArgValue('-o') || getArgValue('--output'),
      entryDir: getArgValue('-e') || getArgValue('--entry')
    };

    if (!args.projectPath || !args.outDir) {
      console.error('Usage: zodiac-compiler -p <tsconfig.json> -o <outDir> [-e <entryDir>]');
      process.exit(1);
    }

    const projectDir = process.cwd();
    console.log('Project directory:', projectDir);

    
    const srcDir = args.entryDir 
      ? path.resolve(projectDir, args.entryDir)
      : path.resolve(projectDir, 'src');

    if (!fs.existsSync(srcDir)) {
      console.error(`Source directory not found: ${srcDir}`);
      process.exit(1);
    }

    console.log('Source directory:', srcDir);

    
    const foundFiles = findTypeScriptFiles(srcDir);

    if (foundFiles.length === 0) {
      console.error('No TypeScript files found!');
      process.exit(1);
    }

    console.log(`\nFound ${foundFiles.length} TypeScript files`);

    
    const outDir = path.resolve(projectDir, args.outDir);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const compiler = new ProjectCompiler({
      outDir,
      minify: true,
      lazy: false,
      entryPoints: foundFiles
    });

    console.log('\nStarting compilation...');
    await compiler.compileProject();
    console.log('Compilation completed successfully!');

  } catch (error) {
    console.error('Compilation failed:', error);
    process.exit(1);
  }
}


main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

function printHelp(): void {
  console.log(`
Usage: zodiac-compiler [options] <entry-points...>

Options:
  -e, --entry <file>     Add an entry point (can be used multiple times)
  -o, --out-dir <dir>    Output directory (default: dist)
  -p, --project <file>   Use entry points from tsconfig.json
  --no-minify           Disable minification
  --no-lazy            Disable lazy loading
  --exclude <pattern>   Exclude files (comma-separated patterns)
  -h, --help           Show this help message
`);
}


function findTsFilesRecursively(dir: string): string[] {
  const files: string[] = [];
  
  try {
    if (!fs.existsSync(dir)) {
      return files;
    }
    
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        files.push(...findTsFilesRecursively(fullPath));
      } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts') && !entry.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.warn(`Warning: Error reading directory ${dir}: ${err}`);
  }
  
  return files;
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 