# About

Google Search Shortcuts is a Chrome and Firefox extension that adds much-needed
keyboard shortcuts and navigation to Google search.

Add the extension to your browser here:
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/google-search-shortcuts/)
- Chrome (Coming Soon!)
- Edge (Coming Soon!)

# Features

To use shortcuts, go to [Google search](https://www.google.com/) and click
anywhere on the page away from the search bar. Shortcuts DO NOT work when
focused on the search bar.

Shortcuts:
- `k` - Move one search result up
- `j` - Move one search result down
- `Enter` - Navigates current tab to the link
- `Shift+Enter` - Opens a new window with the link
- `Ctrl+Enter` - Opens new tab in background for the highlighted link

# Developers

## Prerequisites

1. Install [NodeJS v12 or above](https://nodejs.org/en/download/).

## Installation

1. Clone this repository from GitHub
```bash
git clone https://github.com/RogueArt/google-search-shortcuts
```
2. Install the required dependencies
```bash
cd google-search-shortcuts # G into folder if you haven't alread
npm install
```
3. To build a minified and version of the zipped source code:
```bash
npm run build
```
**Note:** 
The minified script.js and manifest.json files will be placed in the `dist/src` directory and a zipped version of those same files will be created in the `dist/zip` directory after running this command.

## Running

Follow the directions for adding a developer (unverified) extension for your respective browser:
- [Chrome](https://developer.chrome.com/docs/extensions/mv3/getstarted/#unpacked)
- [Firefox](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#trying_it_out)
- [Edge](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading)

# TO-DO

- Add support for different Google domains (e.g. co.ca, co.in)
- Highlight whole box rather than just the link
- Allow navigation by pressing a number on the keyboard
  - Add a super element to indicate what number each link is
- Add `Shift+L` to open all "People also ask links"