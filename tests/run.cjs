const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const root = path.resolve(__dirname, '..')
const build = fs.mkdtempSync(path.join(os.tmpdir(), 'layer-views-tests-'))
const tsc = process.env.TYPESCRIPT_PATH || require.resolve('typescript/bin/tsc')
const sdk = process.env.ARCGIS_TYPES || path.dirname(require.resolve('@arcgis/core/interfaces.d.ts'))
try {
  const config = path.join(build, 'tsconfig.json')
  fs.writeFileSync(config, JSON.stringify({
    compilerOptions: {
      strict: true, noEmitOnError: true, target: 'ES2020', module: 'commonjs', skipLibCheck: true,
      baseUrl: sdk, paths: { 'esri/*': ['./*'] }, outDir: path.join(build, 'compiled')
    },
    files: [path.join(root, 'src/runtime/utils/map-state.ts')]
  }))
  const compile = spawnSync(process.execPath, [tsc, '-p', config], { stdio: 'inherit' })
  if (compile.status !== 0) process.exitCode = 1
  else {
    const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.test.cjs')).map(file => path.join(__dirname, file))
    const run = spawnSync(process.execPath, ['--test', ...files], {
      stdio: 'inherit', env: { ...process.env, VIEW_TEST_BUILD: path.join(build, 'compiled') }
    })
    process.exitCode = run.status ?? 1
  }
} finally { fs.rmSync(build, { recursive: true, force: true }) }
