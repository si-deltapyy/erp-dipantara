import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { tmpdir } from 'node:os'

export default function clearTestHotFile(): void {
    const database = process.env.E2E_DATABASE
    if (
        database &&
        basename(database).startsWith('woodflow-e2e-') &&
        resolve(dirname(database)) === resolve(tmpdir())
    ) {
        for (const suffix of ['', '-wal', '-shm'])
            if (existsSync(database + suffix)) unlinkSync(database + suffix)
    }
    const hotFile = resolve('public/hot')
    if (existsSync(hotFile) && readFileSync(hotFile, 'utf8').trim() === 'http://127.0.0.1:5174') {
        unlinkSync(hotFile)
    }
}
