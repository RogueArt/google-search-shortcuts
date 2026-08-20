# AMO source-code build instructions

This source archive contains the original, human-readable project files used to
build Google Search Shortcuts. It excludes `node_modules`, `dist`, bundled
JavaScript, and other generated output. Third-party build dependencies are
installed from the exact versions in `package-lock.json`.

## Build environment

- Windows, macOS, or Linux; no platform-specific tools are required.
- Node.js 22.13.0 or newer. The release was verified with Node.js 24.13.0.
- npm 10 or newer. npm is included with supported Node.js installations; the
  release was verified with npm 11.12.1.
- Internet access is needed only while `npm ci` downloads the open-source build
  dependencies.

Install Node.js and npm from <https://nodejs.org/en/download>, then confirm the
versions:

```text
node --version
npm --version
```

No global npm packages, environment variables, credentials, or native build
tools are required.

## Reproduce the submitted Firefox add-on

From the root of the extracted source archive, run:

```text
npm ci
npm run build-for-amo
```

The command performs every technical build step, creates the production
Webpack bundles, packages the browser extensions, creates the versioned source
archive, and verifies the manifests and every file inside all ZIP archives.

The Firefox add-on submitted to AMO is produced at:

```text
dist/packages/google-search-shortcuts-firefox.zip
```

The accompanying reviewer source archive is produced at:

```text
dist/packages/google-search-shortcuts-2.1.0-source.zip
```

The Chromium package is also generated from the same source at
`dist/packages/google-search-shortcuts-chromium.zip`; it is not part of the
Firefox submission.

The complete verification suite can be rerun with `npm run check`. Tests are
not required to reproduce the submitted Firefox package.
