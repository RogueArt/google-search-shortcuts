import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import yauzl from 'yauzl'

const FIREFOX_ID = '{10bdbdc0-e1da-4471-96a3-8f4dd6ed38a3}'
const TARGETS = ['firefox', 'chromium']
const packageJson = JSON.parse(await readFile('package.json', 'utf8'))

function readZip(filename) {
  return new Promise((resolve, reject) => {
    yauzl.open(
      filename,
      { lazyEntries: true, validateEntrySizes: true },
      (openError, zipFile) => {
        if (openError) {
          reject(openError)
          return
        }

        const entries = new Map()
        zipFile.on('error', reject)
        zipFile.on('end', () => resolve(entries))
        zipFile.on('entry', entry => {
          const normalized = path.posix.normalize(entry.fileName)
          if (
            path.posix.isAbsolute(entry.fileName)
            || normalized === '..'
            || normalized.startsWith('../')
          ) {
            reject(new Error(`Unsafe ZIP entry: ${entry.fileName}`))
            return
          }
          if (entries.has(entry.fileName)) {
            reject(new Error(`Duplicate ZIP entry: ${entry.fileName}`))
            return
          }
          if (entry.fileName.endsWith('/')) {
            zipFile.readEntry()
            return
          }

          zipFile.openReadStream(entry, (streamError, stream) => {
            if (streamError) {
              reject(streamError)
              return
            }

            const chunks = []
            stream.on('error', reject)
            stream.on('data', chunk => chunks.push(chunk))
            stream.on('end', () => {
              entries.set(entry.fileName, Buffer.concat(chunks))
              zipFile.readEntry()
            })
          })
        })
        zipFile.readEntry()
      },
    )
  })
}

const sharedAssets = ['content.css', 'popup.css', 'popup.html', 'popup.js', 'script.js']
const sharedContents = new Map()

for (const target of TARGETS) {
  const outputDirectory = `dist/${target}`
  const manifest = JSON.parse(
    await readFile(`${outputDirectory}/manifest.json`, 'utf8'),
  )
  const action = manifest.browser_action || manifest.action

  assert.equal(manifest.version, packageJson.version)
  assert.equal(action.default_popup, 'popup.html')
  assert.deepEqual(manifest.permissions, ['storage'])
  assert.equal('host_permissions' in manifest, false)
  assert.equal(manifest.content_scripts[0].run_at, 'document_end')

  if (target === 'firefox') {
    assert.equal(manifest.manifest_version, 2)
    assert.equal('action' in manifest, false)
    assert.equal(manifest.browser_specific_settings.gecko.id, FIREFOX_ID)
    assert.deepEqual(
      manifest.browser_specific_settings.gecko.data_collection_permissions,
      { required: ['none'] },
    )
  } else {
    assert.equal(manifest.manifest_version, 3)
    assert.equal('browser_action' in manifest, false)
    assert.equal('browser_specific_settings' in manifest, false)
    assert.equal(manifest.minimum_chrome_version, '95')
  }

  const requiredFiles = [
    'manifest.json',
    ...sharedAssets,
    ...manifest.content_scripts.flatMap(contentScript => [
      ...contentScript.js,
      ...(contentScript.css || []),
    ]),
  ]
  const expectedFiles = [...new Set(requiredFiles)].sort()
  const actualFiles = (await readdir(outputDirectory)).sort()
  assert.deepEqual(actualFiles, expectedFiles)

  const builtFiles = new Map()
  for (const file of expectedFiles) {
    builtFiles.set(file, await readFile(`${outputDirectory}/${file}`))
  }

  for (const file of sharedAssets) {
    if (!sharedContents.has(file)) sharedContents.set(file, builtFiles.get(file))
    assert.equal(
      builtFiles.get(file).equals(sharedContents.get(file)),
      true,
      `${file} must be byte-identical across browser builds`,
    )
  }

  const zipPath = `dist/packages/google-search-shortcuts-${target}.zip`
  const archivedFiles = await readZip(zipPath)
  assert.deepEqual([...archivedFiles.keys()].sort(), expectedFiles)

  for (const file of expectedFiles) {
    assert.equal(
      archivedFiles.get(file).equals(builtFiles.get(file)),
      true,
      `${target}/${file} must be byte-identical in the ZIP and unpacked build`,
    )
  }
}

console.log('Verified Firefox MV2 and Chromium MV3 packages, shared assets, manifests, and ZIP contents.')
