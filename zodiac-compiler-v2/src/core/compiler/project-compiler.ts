import { Configuration } from '@rspack/core'
import * as path from 'path'
import * as fs from 'fs'

interface ProjectCompilerOptions {
  outDir: string
  minify: boolean
  lazy: boolean
  entryPoints: string[]
}

export class ProjectCompiler {
  private rspackConfig: Configuration

  constructor(private options: ProjectCompilerOptions) {
    const projectRoot = process.cwd()

    this.rspackConfig = {
      target: ['web'],
      entry: {
        main: path.resolve(projectRoot, 'src/index.ts')
      },
      output: {
        path: this.options.outDir,
        filename: '[name].js',
        chunkFilename: this.options.lazy ? 'chunks/[name].[contenthash].js' : '[name].js',
        publicPath: '/'
      },
      optimization: {
        minimize: this.options.minify,
        splitChunks: this.options.lazy ? {
          chunks: 'async',
          minSize: 20000,
          maxSize: 50000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10
            },
            framework: {
              test: /[\\/]src[\\/]core[\\/]/,
              name: 'framework',
              chunks: 'all',
              priority: 5
            },
            components: {
              test: /[\\/]src[\\/]test[\\/]components[\\/]/,
              name: (module: any) => {
                const identifier = module?.identifier() || ''
                const componentName = identifier.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'unknown'
                return `component-${componentName}`
              },
              chunks: 'async',
              priority: 0
            }
          }
        } : false
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: {
              loader: 'builtin:swc-loader',
              options: {
                jsc: {
                  parser: {
                    syntax: 'typescript',
                    tsx: true,
                    decorators: true
                  },
                  transform: {
                    react: {
                      pragma: 'h',
                      pragmaFrag: 'Fragment'
                    },
                    decoratorMetadata: true,
                    legacyDecorator: true
                  }
                }
              }
            }
          },
          {
            test: /\.css$/,
            type: 'css'
          },
          {
            test: /\.(png|svg|jpg|jpeg|gif)$/i,
            type: 'asset/resource'
          }
        ]
      },
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        alias: {
          '@': path.resolve(projectRoot, 'src'),
          '@core': path.resolve(projectRoot, 'src/core'),
          '@polyfills': path.resolve(projectRoot, 'src/core/polyfills'),
          'happy-dom': false,
          'jsdom': false,
          'querystring': require.resolve('querystring-es3')
        },
        preferRelative: true,
        mainFields: ['browser', 'module', 'main'],
        fallback: {
          querystring: require.resolve('querystring-es3'),
          zlib: require.resolve('browserify-zlib'),
          url: require.resolve('url/'),
          path: require.resolve('path-browserify'),
          util: require.resolve('util/'),
          stream: require.resolve('stream-browserify'),
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
          crypto: require.resolve('crypto-browserify'),
          buffer: require.resolve('buffer/'),
          assert: require.resolve('assert/'),
          fs: false,
          net: false,
          tls: false,
          child_process: false,
          vm: false,
          'perf_hooks': false
        }
      },
      resolveLoader: {
        modules: ['node_modules']
      },
      context: projectRoot,
      plugins: [
        new (require('@rspack/core').ProvidePlugin)({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser'
        }),
        new (require('@rspack/core').DefinePlugin)({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
          'global': 'globalThis'
        })
      ]
    }
  }

  async compileProject(): Promise<void> {
    const rspack = require('@rspack/core')
    const compiler = rspack(this.rspackConfig)

    return new Promise((resolve, reject) => {
      compiler.run((err: any, stats: any) => {
        if (err) {
          reject(err)
          return
        }

        if (stats.hasErrors()) {
          const info = stats.toJson()
          console.error('Build errors:', info.errors)
          reject(new Error('Build failed with errors'))
          return
        }

        console.log(stats.toString({
          colors: true,
          chunks: false,
          modules: false
        }))

        resolve()
      })
    })
  }
} 