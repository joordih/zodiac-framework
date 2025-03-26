import { Configuration, HtmlRspackPlugin } from '@rspack/core'
import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'

interface ProjectCompilerOptions {
  outDir: string
  minify: boolean
  lazy: boolean
  entryPoints: string[]
  mode?: 'development' | 'production'
  ssr?: boolean
  isServer?: boolean
  port?: number
  target?: 'framework' | 'app' | 'all'
}

function getChunkName(filePath: string): string {
  const relativePath = path.relative(process.cwd(), filePath)
  const hash = crypto.createHash('md5').update(relativePath).digest('hex').slice(0, 8)
  const fileName = path.basename(filePath, path.extname(filePath))
  return `${fileName}.${hash}`
}

export class ProjectCompiler {
  private rspackConfig: Configuration | Configuration[]

  constructor(private options: ProjectCompilerOptions) {
    const projectRoot = process.cwd()
    const isDevelopment = this.options.mode === 'development'
    const isServerBuild = Boolean(this.options.isServer)

    if (this.options.target === 'framework' || this.options.target === 'all') {
      this.rspackConfig = this.createConfigs(projectRoot, isDevelopment, isServerBuild)
    } else {
      this.rspackConfig = this.createAppConfig(projectRoot, isDevelopment, isServerBuild)
    }
  }

  private createFrameworkConfig(projectRoot: string, isDev: boolean, isServer: boolean): Configuration {
    const polyfillsConfig = {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      util: require.resolve('util/'),
      assert: require.resolve('assert/'),
      url: require.resolve('url/'),
      path: require.resolve('path-browserify'),
      zlib: require.resolve('browserify-zlib'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      querystring: require.resolve('querystring-es3')
    }

    return {
      name: 'framework',
      mode: this.options.mode || 'production',
      target: isServer ? ['node'] : ['web'],
      devtool: isDev ? 'eval-source-map' : false,
      entry: {
        'zodiac-core': path.resolve(projectRoot, 'src/core/index.d.ts'),
        'zodiac-polyfills': path.resolve(projectRoot, 'src/core/polyfills/index.ts')
      },
      output: {
        path: path.join(this.options.outDir, 'framework'),
        filename: '[name].js',
        library: {
          type: isServer ? 'commonjs2' : 'umd',
          name: 'ZodiacFramework'
        },
        globalObject: 'this'
      },
      optimization: {
        minimize: !isServer && this.options.minify,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic'
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
                  },
                  target: 'es2020'
                },
                sourceMaps: isDev
              }
            }
          }
        ]
      },
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        alias: {
          '@core': path.resolve(projectRoot, 'src/core'),
          'crypto': polyfillsConfig.crypto
        },
        fallback: !isServer ? {
          ...polyfillsConfig,
          fs: false,
          net: false,
          tls: false,
          child_process: false,
          vm: false,
          'perf_hooks': false
        } : {}
      },
      plugins: [
        new (require('@rspack/core').DefinePlugin)({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || this.options.mode || 'production'),
          'process.env.FRAMEWORK': JSON.stringify(true),
          'global': isServer ? 'global' : 'globalThis'
        }),
        new (require('@rspack/core').ProvidePlugin)({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser'
        })
      ]
    }
  }

  private getTemplate(projectRoot: string): string {
    const indexContent = fs.readFileSync(path.resolve(projectRoot, 'index.html'), 'utf8');
    return indexContent.replace('<head>', '<head><base href="/">')
  };

  private createAppConfig(projectRoot: string, isDev: boolean, isServer: boolean): Configuration {
    const ssrEntry = path.resolve(projectRoot, 'src/core/ssr/entry.ts')
    
    return {
      name: 'app',
      mode: this.options.mode || 'production',
      target: isServer ? ['node'] : ['web'],
      devtool: isDev ? 'eval-source-map' : false,
      entry: isServer ? {
        server: ssrEntry
      } : {
        main: path.resolve(projectRoot, 'src/index.ts')
      },
      output: {
        path: isServer ? path.join(this.options.outDir, 'server') : this.options.outDir,
        filename: '[name].js',
        chunkFilename: 'chunks/[name].js',
        publicPath: '/',
        ...(isServer && {
          library: {
            type: 'commonjs2'
          }
        })
      },
      optimization: {
        minimize: !isServer && this.options.minify,
        splitChunks: !isServer && {
          cacheGroups: {
            framework: {
              test: /[\\/]src[\\/]core[\\/]/,
              name: 'zodiac',
              chunks: 'all',
              enforce: true,
              priority: 100,
              reuseExistingChunk: true
            },
            components: {
              test: /[\\/]src[\\/]test[\\/]components[\\/]/,
              name: (module: any) => {
                const identifier = module?.identifier() || '';
                if (!identifier) return 'unknown';
                return `component-${getChunkName(identifier)}`;
              },
              chunks: 'async',
              priority: 0
            }
          }
        }
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
                  },
                  target: 'es2020'
                },
                sourceMaps: isDev
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
          'querystring': require.resolve('querystring-es3'),
          'crypto': require.resolve('crypto-browserify')
        },
        preferRelative: true,
        mainFields: isServer ? ['module', 'main'] : ['browser', 'module', 'main'],
        fallback: !isServer ? {
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
        } : {}
      },
      plugins: [
        new (require('@rspack/core').DefinePlugin)({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || this.options.mode || 'production'),
          'process.env.SSR': JSON.stringify(!!this.options.ssr),
          'global': isServer ? 'global' : 'globalThis'
        }),
        ...(isServer ? [] : [
          new (require('@rspack/core').ProvidePlugin)({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser'
          }),
          new (require('@rspack/core').HtmlRspackPlugin)({
            template: path.resolve(projectRoot, 'index.html'),
            filename: 'index.html',
            title: 'Zodiac Framework',
            inject: true,
            scriptLoading: 'defer',
            templateContent: this.getTemplate(projectRoot)
          })
        ]),
        ...(isDev && !isServer ? [
          new (require('@rspack/core').HotModuleReplacementPlugin)()
        ] : [])
      ]
    }
  }

  private createConfigs(projectRoot: string, isDev: boolean, isServer: boolean): Configuration[] {
    const configs: Configuration[] = []

    if (this.options.target === 'framework') {
      configs.push(this.createFrameworkConfig(projectRoot, isDev, isServer))
    } else if (this.options.target === 'all') {
      configs.push(
        this.createFrameworkConfig(projectRoot, isDev, isServer),
        this.createAppConfig(projectRoot, isDev, isServer)
      )
    }

    return configs
  }

  async compileProject(): Promise<void> {
    const rspack = require('@rspack/core')
    const configs = Array.isArray(this.rspackConfig) ? this.rspackConfig : [this.rspackConfig]

    if (this.options.mode === 'development' && !this.options.isServer && this.options.target !== 'framework') {
      const devServer = new (require('@rspack/dev-server'))(rspack(configs[configs.length - 1]), {
        port: this.options.port,
        hot: true,
        historyApiFallback: true,
        setupMiddlewares: (middlewares: any, devServer: any) => {
          if (!this.options.ssr) return middlewares

          const ssrMiddleware = async (req: any, res: any, next: any) => {
            if (req.url.endsWith('.js') || req.url.endsWith('.css') || req.url.includes('__rspack_hmr__')) {
              return next()
            }

            try {
              const serverBundle = require(path.join(this.options.outDir, 'server/server.js'))
              const html = await serverBundle.render(req.url)
              res.send(html)
            } catch (error) {
              console.error('SSR Error:', error)
              next()
            }
          }

          return [...middlewares, { middleware: ssrMiddleware }]
        }
      })

      return new Promise((resolve) => {
        devServer.start().then(() => {
          console.log(`Dev server running at http://localhost:${this.options.port}`)
          resolve()
        })
      })
    }

    return Promise.all(configs.map(config => {
      return new Promise<void>((resolve, reject) => {
        const compiler = rspack(config)
        compiler.run((err: any, stats: any) => {
          if (err) {
            reject(err)
            return
          }

          if (stats.hasErrors()) {
            const info = stats.toJson()
            console.error(`Build errors for ${config.name}:`, info.errors)
            reject(new Error(`Build failed with errors for ${config.name}`))
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
    })).then(() => {})
  }
}