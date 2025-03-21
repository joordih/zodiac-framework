#!/usr/bin/env node
import * as path from 'path'
import * as fs from 'fs'
import * as glob from 'glob'
import { ProjectCompiler } from '../core/compiler/project-compiler'

interface CliArgs {
  projectPath: string
  outDir: string
  entryDir?: string
}

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index > -1 ? process.argv[index + 1] : undefined
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
      entryDir: getArgValue('-e') || getArgValue('--entry') || ''
    }

    if (!args.projectPath || !args.outDir) {
      console.error('Usage: zodiac-compiler-v2 -p <tsconfig.json> -o <outDir> [-e <entryDir>]')
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

    const compiler = new ProjectCompiler({
      outDir,
      minify: true,
      lazy: true,
      entryPoints: foundFiles
    })

    console.log('Starting compilation...')
    await compiler.compileProject()
    console.log('Compilation completed successfully!')

  } catch (error) {
    console.error('Compilation failed:', error)
    process.exit(1)
  }
}

main() 