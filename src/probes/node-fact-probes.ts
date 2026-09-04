import { lstat, stat } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createConnection } from 'node:net'
import type { FileProbe, FileFacts, JavaProbe, JavaFacts, PortProbe, PortFacts, ProcessProbe, ProcessFacts } from './fact-probes.js'

const execFileAsync = promisify(execFile)

export class NodeFileProbe implements FileProbe {
  async inspect(path: string): Promise<FileFacts> {
    try {
      const info = await lstat(path)
      return { exists: true, isDirectory: info.isDirectory(), isSymlink: info.isSymbolicLink(), bytes: info.size }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { exists: false, isDirectory: false, isSymlink: false, bytes: 0 }
      throw error
    }
  }
}

export class ProcProcessProbe implements ProcessProbe {
  async inspect(pid: number): Promise<ProcessFacts> {
    try {
      const info = await stat(`/proc/${pid}`)
      if (!info.isDirectory()) return { running: false }
      const [status, command] = await Promise.all([
        import('node:fs/promises').then((fs) => fs.readFile(`/proc/${pid}/status`, 'utf8')),
        import('node:fs/promises').then((fs) => fs.readFile(`/proc/${pid}/cmdline`, 'utf8')),
      ])
      const uid = /^Uid:\s+(\d+)/m.exec(status)?.[1]
      return { running: true, ...(uid === undefined ? {} : { uid: Number(uid) }), command: command.replaceAll('\0', ' ').trim() }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT' || (error as NodeJS.ErrnoException).code === 'ESRCH') return { running: false }
      throw error
    }
  }
}

export class TcpPortProbe implements PortProbe {
  inspect(port: number, address = '127.0.0.1'): Promise<PortFacts> {
    return new Promise((resolve) => {
      const socket = createConnection({ port, host: address })
      const finish = (listening: boolean) => { socket.destroy(); resolve({ listening, port, address }) }
      socket.once('connect', () => finish(true)); socket.once('error', () => finish(false)); socket.setTimeout(1000, () => finish(false))
    })
  }
}

export class ExecJavaProbe implements JavaProbe {
  async inspect(executable: string): Promise<JavaFacts> {
    try {
      const result = await execFileAsync(executable, ['-version'], { timeout: 5000, maxBuffer: 16 * 1024 })
      const output = `${result.stdout}\n${result.stderr}`
      const majorText = /version "(?:1\.)?(\d+)/.exec(output)?.[1]
      if (majorText === undefined) return { executable, major: 0, usable: false }
      return { executable, major: Number(majorText), usable: true }
    } catch { return { executable, major: 0, usable: false } }
  }
}
