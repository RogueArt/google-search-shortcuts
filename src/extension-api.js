/** @typedef {import('./types.js').ExtensionApi} ExtensionApi */

/**
 * @param {(typeof globalThis) & {browser?: ExtensionApi, chrome?: ExtensionApi}} [globalObject]
 * @returns {ExtensionApi | null}
 */
export function getExtensionApi(globalObject = globalThis) {
  const api = globalObject.browser || globalObject.chrome

  if (
    !api
    || !api.storage
    || !api.storage.local
    || !api.storage.onChanged
  ) {
    return null
  }

  return api
}
