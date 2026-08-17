import { rm } from 'node:fs/promises'

for (const directory of ['firefox', 'chromium', 'packages']) {
  await rm(new URL(`../dist/${directory}`, import.meta.url), {
    force: true,
    recursive: true,
  })
}
