import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAllLinkGroups,
  getAllTopLevelLinks,
  isActionablyVisible,
} from '../src/google-results.js'
import { createDom, setRect } from '../test-support/dom.js'

function setAnchorRect(documentRef, id, dimensions) {
  return setRect(documentRef.getElementById(id), dimensions)
}

test('main results are ordered by visual position instead of raw DOM order', () => {
  const { window } = createDom(`
    <main id="rso">
      <article><a id="lower" href="/lower"><h3>Lower</h3></a></article>
      <article><a id="upper" href="/upper"><h3>Upper</h3></a></article>
    </main>
  `)
  setAnchorRect(window.document, 'lower', { top: 600, left: 20 })
  setAnchorRect(window.document, 'upper', { top: 100, left: 20 })

  assert.deepEqual(
    getAllTopLevelLinks(window.document).map(link => link.id),
    ['upper', 'lower'],
  )
})

test('same-row results use left-to-right order with DOM order as final tie-breaker', () => {
  const { window } = createDom(`
    <main id="rso">
      <article><a id="right" href="/right"><h3>Right</h3></a></article>
      <article><a id="left" href="/left"><h3>Left</h3></a></article>
    </main>
  `)
  setAnchorRect(window.document, 'right', { top: 100, left: 300 })
  setAnchorRect(window.document, 'left', { top: 102, left: 20 })

  assert.deepEqual(
    getAllTopLevelLinks(window.document).map(link => link.id),
    ['left', 'right'],
  )
})

test('row tolerance produces stable buckets instead of a non-transitive sort', () => {
  const { window } = createDom(`
    <main id="rso">
      <article><a id="middle" href="/middle"><h3>Middle</h3></a></article>
      <article><a id="bottom" href="/bottom"><h3>Bottom</h3></a></article>
      <article><a id="top" href="/top"><h3>Top</h3></a></article>
    </main>
  `)
  setAnchorRect(window.document, 'middle', { top: 103, left: 100 })
  setAnchorRect(window.document, 'bottom', { top: 106, left: 0 })
  setAnchorRect(window.document, 'top', { top: 100, left: 200 })

  assert.deepEqual(
    getAllTopLevelLinks(window.document).map(link => link.id),
    ['middle', 'top', 'bottom'],
  )
})

test('overlapping main candidates at identical geometry are included only once', () => {
  const { window } = createDom(`
    <main id="rso">
      <article><a id="collapsed" href="/collapsed"><h3>Collapsed duplicate</h3></a></article>
      <article><a id="primary" href="/primary"><h3>Primary</h3></a></article>
    </main>
  `)
  setAnchorRect(window.document, 'primary', { top: 100, left: 20, width: 200 })
  setAnchorRect(window.document, 'collapsed', { top: 100, left: 20, width: 300 })
  window.document.elementFromPoint = () => {
    return window.document.querySelector('#primary h3')
  }

  assert.deepEqual(
    getAllTopLevelLinks(window.document).map(link => link.id),
    ['primary'],
  )
})

test('overlapping detailed candidates at identical geometry are traversed once', () => {
  const { window } = createDom(`
    <main id="rso">
      <article>
        <a id="main" href="/main"><h3>Main</h3></a>
        <a id="first" href="/first"><span>First overlay</span></a>
        <a id="second" href="/second"><span>Second overlay</span></a>
      </article>
    </main>
  `)
  setAnchorRect(window.document, 'main', { top: 100, left: 20 })
  setAnchorRect(window.document, 'first', { top: 200, left: 20, width: 200 })
  setAnchorRect(window.document, 'second', { top: 200, left: 20, width: 300 })

  const [result] = getAllLinkGroups(window.document)
  assert.equal(result.subLinks.length, 1)
})

test('multiple mains in one rso child receive only sublinks from their unique scope', () => {
  const { window } = createDom(`
    <main id="rso">
      <section>
        <article>
          <a id="m1" href="/m1"><h3>Main one</h3></a>
          <a id="s1" href="/s1"><span>Sublink one</span></a>
        </article>
        <article>
          <a id="m2" href="/m2"><h3>Main two</h3></a>
          <a id="s2" href="/s2"><span>Sublink two</span></a>
        </article>
      </section>
    </main>
  `)

  setAnchorRect(window.document, 'm1', { top: 100 })
  setAnchorRect(window.document, 's1', { top: 140 })
  setAnchorRect(window.document, 'm2', { top: 300 })
  setAnchorRect(window.document, 's2', { top: 340 })

  const groups = getAllLinkGroups(window.document)
  assert.deepEqual(groups.map(group => ({
    main: group.mainLink.id,
    details: group.subLinks.map(link => link.id),
  })), [
    { main: 'm1', details: ['s1'] },
    { main: 'm2', details: ['s2'] },
  ])
})

test('detailed candidates exclude clipped, overlapping, hidden, and noisy links', () => {
  const { window } = createDom(`
    <main id="rso">
      <article id="clipper" style="overflow-x: hidden">
        <a id="main" href="/main"><h3>Main</h3></a>
        <a id="good" href="/good"><span>Good sublink</span></a>
        <a id="clipped" href="/clipped"><span>Clipped module</span></a>
        <a id="overlap" href="/overlap"><span>Overlapping module</span></a>
        <a id="above" href="/above"><span>Visually above main</span></a>
        <a id="hidden" href="/hidden" style="visibility: hidden"><span>Hidden</span></a>
        <span style="opacity: 0">
          <a id="transparent" href="/transparent"><span>Transparent ancestor</span></a>
        </span>
        <span aria-hidden="true">
          <a id="ariaHidden" href="/aria-hidden"><span>ARIA hidden ancestor</span></a>
        </span>
        <a id="answers" href="/answers"><span>12 answers</span></a>
        <a id="timestamp" href="/timestamp"><span>42:35</span></a>
        <a id="readmore" href="/read"><span>Read more</span></a>
      </article>
    </main>
  `)

  setRect(window.document.getElementById('clipper'), {
    top: 80,
    left: 0,
    width: 500,
    height: 500,
  })
  setAnchorRect(window.document, 'main', { top: 100, left: 20 })
  setAnchorRect(window.document, 'good', { top: 150, left: 20 })
  setAnchorRect(window.document, 'clipped', { top: 150, left: 499 })
  setAnchorRect(window.document, 'overlap', { top: 100, left: 20, width: 120 })
  setAnchorRect(window.document, 'above', { top: 40, left: 20 })
  setAnchorRect(window.document, 'hidden', { top: 200, left: 20 })
  setAnchorRect(window.document, 'transparent', { top: 210, left: 20 })
  setAnchorRect(window.document, 'ariaHidden', { top: 220, left: 20 })
  setAnchorRect(window.document, 'answers', { top: 250, left: 20 })
  setAnchorRect(window.document, 'timestamp', { top: 300, left: 20 })
  setAnchorRect(window.document, 'readmore', { top: 350, left: 20 })

  const [result] = getAllLinkGroups(window.document)
  assert.deepEqual(result.subLinks.map(link => link.id), ['good'])
})

test('results below the viewport remain actionable', () => {
  const { window } = createDom(`
    <main id="rso">
      <article><a id="below" href="/below"><h3>Below fold</h3></a></article>
    </main>
  `)
  const below = setAnchorRect(window.document, 'below', { top: 3000, left: 20 })

  assert.equal(isActionablyVisible(below), true)
  assert.deepEqual(getAllTopLevelLinks(window.document).map(link => link.id), ['below'])
})

test('a detailed candidate visually above its main is excluded without clipping CSS', () => {
  const { window } = createDom(`
    <main id="rso">
      <article>
        <a id="main" href="/main"><h3>Main</h3></a>
        <a id="above" href="/above"><span>Above</span></a>
        <a id="below" href="/below"><span>Below</span></a>
      </article>
    </main>
  `)
  setAnchorRect(window.document, 'main', { top: 300 })
  setAnchorRect(window.document, 'above', { top: 100 })
  setAnchorRect(window.document, 'below', { top: 350 })

  const [result] = getAllLinkGroups(window.document)
  assert.deepEqual(result.subLinks.map(link => link.id), ['below'])
})

test('links outside rso and layout-hidden links are ignored', () => {
  const { window } = createDom(`
    <a id="outside" href="/outside"><h3>Outside</h3></a>
    <main id="rso">
      <article><a id="hidden" href="/hidden"><h3>Hidden</h3></a></article>
    </main>
  `)
  setAnchorRect(window.document, 'outside', { top: 10 })
  const hidden = window.document.getElementById('hidden')
  hidden.getClientRects = () => []

  assert.deepEqual(getAllTopLevelLinks(window.document), [])
})

test('a child of a zero-sized overflow container is not actionable', () => {
  const { window } = createDom(`
    <main id="rso">
      <article id="collapsed" style="overflow: hidden">
        <a id="child" href="/child"><h3>Collapsed child</h3></a>
      </article>
    </main>
  `)
  setRect(window.document.getElementById('collapsed'), {
    top: 100,
    width: 0,
    height: 0,
  })
  setAnchorRect(window.document, 'child', { top: 100, width: 200, height: 30 })

  assert.equal(isActionablyVisible(window.document.getElementById('child')), false)
})
