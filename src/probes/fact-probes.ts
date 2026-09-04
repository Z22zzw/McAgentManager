export interface FileFacts {
  exists: boolean
  isDirectory: boolean
  isSymlink: boolean
  bytes: number
}

export interface ProcessFacts { running: boolean; uid?: number; command?: string }
export interface PortFacts { listening: boolean; port: number; address: string }
export interface JavaFacts { executable: string; major: number; usable: boolean }

export interface FileProbe { inspect(path: string): Promise<FileFacts> }
export interface ProcessProbe { inspect(pid: number): Promise<ProcessFacts> }
export interface PortProbe { inspect(port: number, address?: string): Promise<PortFacts> }
export interface JavaProbe { inspect(executable: string): Promise<JavaFacts> }

export interface FactSnapshot {
  file?: FileFacts
  process?: ProcessFacts
  port?: PortFacts
  java?: JavaFacts
}
