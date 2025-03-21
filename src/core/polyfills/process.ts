const globalObj = typeof global !== 'undefined' ? global : window;

const process = {
  env: {
    NODE_ENV: 'development',
    DEBUG: false
  },
  platform: 'browser',
  version: '',
  versions: {},
  browser: true,
  arch: 'x64',
  pid: 0,
  ppid: 0,
  title: 'browser',
  argv: [],
  argv0: '',
  execArgv: [],
  execPath: '',
  cwd: () => '/',
  chdir: () => {},
  exit: () => {},
  kill: () => {},
  nextTick: (callback: Function) => setTimeout(callback, 0),
  uptime: () => 0,
  hrtime: () => [0, 0],
  cpuUsage: () => ({ user: 0, system: 0 }),
  memoryUsage: () => ({
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
    rss: 0
  })
};


(globalObj as any).process = process;

export default process; 