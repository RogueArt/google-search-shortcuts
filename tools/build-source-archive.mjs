import { createWriteStream } from 'node:fs'
import { lstat, mkdir, readFile, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import yazl from 'yazl'

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const packageJson = JSON.parse(
  await readFile(path.join(projectRoot, 'package.json'), 'utf8'),
)
const sourceFiles = JSON.parse(
  await readFile(path.join(projectRoot, 'tools/source-files.json'), 'utf8'),
)
const outputDirectory = path.join(projectRoot, 'dist/packages')
const archiveName = `google-search-shortcuts-${packageJson.version}-source.zip`
const archivePath = path.join(outputDirectory, archiveName)
const temporaryPath = `${archivePath}.tmp`
const fixedTimestamp = new Date('1980-01-01T00:00:00.000Z')

function validateSourceFiles(files) {
  const uniqueFiles = new Set()

  for (const file of files) {
    if (
      typeof file !== 'string'
      || file.includes('\\')
      || path.isAbsolute(file)
      || path.posix.isAbsolute(file)
      || path.posix.normalize(file) !== file
      || file === '..'
      || file.startsWith('../')
    ) {
      throw new Error(`Unsafe source archive path: ${String(file)}`)
    }
    if (uniqueFiles.has(file)) {
      throw new Error(`Duplicate source archive path: ${file}`)
    }
    uniqueFiles.add(file)
  }

  return [...uniqueFiles].sort()
}

const archivedFiles = validateSourceFiles(sourceFiles)
await mkdir(outputDirectory, { recursive: true })
await rm(temporaryPath, { force: true })

const zipFile = new yazl.ZipFile()
const archiveCompleted = pipeline(
  zipFile.outputStream,
  createWriteStream(temporaryPath, { flags: 'wx' }),
)
let zipEnded = false

try {
  for (const file of archivedFiles) {
    const absolutePath = path.resolve(projectRoot, file)

    if (!absolutePath.startsWith(`${projectRoot}${path.sep}`)) {
      throw new Error(`Source archive path escaped the project: ${file}`)
    }
    const fileDetails = await lstat(absolutePath)
    if (!fileDetails.isFile() || fileDetails.isSymbolicLink()) {
      throw new Error(`Source archive entry must be a regular file: ${file}`)
    }

    zipFile.addFile(absolutePath, file, {
      compress: true,
      mode: 0o100644,
      mtime: fixedTimestamp,
    })
  }

  zipEnded = true
  zipFile.end()
  await archiveCompleted
  await rm(archivePath, { force: true })
  await rename(temporaryPath, archivePath)
} catch (error) {
  if (!zipEnded) zipFile.end()
  await archiveCompleted.catch(() => {})
  await rm(temporaryPath, { force: true })
  throw error
}

console.log(`Created ${path.relative(projectRoot, archivePath)} with ${archivedFiles.length} source files.`)
