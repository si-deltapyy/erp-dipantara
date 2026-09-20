import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'

export default function clearTestHotFile(): void {
    const hotFile = resolve('public/hot')
    if (existsSync(hotFile) && readFileSync(hotFile, 'utf8').trim() === 'http://127.0.0.1:5174') {
        unlinkSync(hotFile)
    }
}
