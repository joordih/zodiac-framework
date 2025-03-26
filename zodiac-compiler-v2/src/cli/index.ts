#!/usr/bin/env node
import * as path from 'path'
import * as fs from 'fs'
import * as glob from 'glob'
import { ProjectCompiler } from '../core/compiler/project-compiler'

interface CliArgs {
  projectPath: string
  outDir: string
  entryDir?: string
  mode?: 'development' | 'production'
  ssr?: boolean
  port?: number
  target?: 'framework' | 'app' | 'all'
}

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index > -1 ? process.argv[index + 1] : undefined
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function findTypeScriptFiles(dir: string): string[] {
  return glob.sync('**/*.{ts,tsx}', {
    cwd: dir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**']
  })
}

async function main() {
  try {
    const args: CliArgs = {
      projectPath: getArgValue('-p') || getArgValue('--project') || '',
      outDir: getArgValue('-o') || getArgValue('--output') || '',
      entryDir: getArgValue('-e') || getArgValue('--entry') || '',
      mode: (getArgValue('-m') || getArgValue('--mode') || 'production') as 'development' | 'production',
      ssr: hasFlag('--ssr'),
      port: parseInt(getArgValue('--port') || '3000', 10),
      target: (getArgValue('-t') || getArgValue('--target') || 'app') as 'framework' | 'app' | 'all'
    }

    if (!args.projectPath || !args.outDir) {
      console.error(`
Usage: zodiac-compiler-v2 -p <tsconfig.json> -o <outDir> [options]

Options:
  -p, --project <path>    Path to tsconfig.json
  -o, --output <dir>      Output directory
  -e, --entry <dir>       Entry directory (default: src)
  -m, --mode <mode>       Build mode (development|production) (default: production)
  -t, --target <target>   Build target (framework|app|all) (default: app)
                         - framework: Build only the framework core
                         - app: Build only the application
                         - all: Build both framework and application
  --ssr                   Enable SSR support
  --port <number>         Dev server port (default: 3000)

Examples:
  # Build framework core
  zodiac-compiler-v2 -p tsconfig.json -o dist -t framework

  # Build application with SSR in development mode
  zodiac-compiler-v2 -p tsconfig.json -o dist -t app -m development --ssr

  # Build everything in production mode
  zodiac-compiler-v2 -p tsconfig.json -o dist -t all -m production --ssr
      `)
      process.exit(1)
    }

    const projectDir = process.cwd()
    const srcDir = args.entryDir 
      ? path.resolve(projectDir, args.entryDir)
      : path.resolve(projectDir, 'src')

    if (!fs.existsSync(srcDir)) {
      console.error(`Source directory not found: ${srcDir}`)
      process.exit(1)
    }

    const foundFiles = findTypeScriptFiles(srcDir)
    const outDir = path.resolve(projectDir, args.outDir)

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true })
    }

    // Common compiler options
    const compilerOptions = {
      outDir,
      minify: args.mode === 'production',
      lazy: true,
      entryPoints: foundFiles,
      mode: args.mode,
      ssr: args.ssr,
      port: args.port,
      target: args.target
    }

    if (args.ssr && args.target !== 'framework') {
      // First build the server bundle
      console.log(`Building SSR server bundle${args.target === 'all' ? ' with framework' : ''}...`)
      const serverCompiler = new ProjectCompiler({
        ...compilerOptions,
        isServer: true
      })
      await serverCompiler.compileProject()
      
      // Then build the client bundle
      console.log(`Building client bundle${args.target === 'all' ? ' with framework' : ''}...`)
      const clientCompiler = new ProjectCompiler({
        ...compilerOptions,
        isServer: false
      })
      await clientCompiler.compileProject()
    } else {
      // Regular build
      const buildType = args.target === 'framework' ? 'framework core' : 
                       args.target === 'all' ? 'framework and application' : 
                       'application'
      console.log(`Building ${buildType} in ${args.mode} mode...`)
      const compiler = new ProjectCompiler(compilerOptions)
      await compiler.compileProject()
    }

    if (args.mode === 'production') {
      console.log(`
Build completed successfully!
${args.target === 'framework' ? `
Framework core output:
- ${path.join(outDir, 'framework/zodiac-core.js')}
- ${path.join(outDir, 'framework/zodiac-polyfills.js')}` : ''}
${args.target === 'app' || args.target === 'all' ? `
Application output:
- ${path.join(outDir, 'main.js')}
${args.ssr ? `- ${path.join(outDir, 'server/server.js')}` : ''}` : ''}`)
    }

  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

main()