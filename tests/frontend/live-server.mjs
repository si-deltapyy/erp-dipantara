import { spawn, spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { tmpdir } from 'node:os'
const database = process.env.DB_DATABASE
if (
    !database ||
    !basename(database).startsWith('woodflow-e2e-') ||
    resolve(dirname(database)) !== resolve(tmpdir())
) {
    throw new Error('An isolated browser test database is required.')
}
writeFileSync(database, '', { flag: 'wx' })
const preparation = spawnSync('php', ['tests/frontend/prepare-live.php'], {
    stdio: 'inherit',
    env: process.env,
})
if (preparation.status !== 0) process.exit(preparation.status ?? 1)
const server = spawn('php', ['artisan', 'serve', '--host=127.0.0.1', '--port=8011'], {
    stdio: 'inherit',
    env: process.env,
})
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill())
server.on('exit', (code) => {
    process.exitCode = code ?? 0
})
