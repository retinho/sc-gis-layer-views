const assert = require('node:assert/strict')
const { test } = require('node:test')
const path = require('node:path')
const { decodeViewState, encodeViewState, createViewUrl, validateViewState } = require(path.join(process.env.VIEW_TEST_BUILD, 'view-state.js'))
const empty = () => ({ version: 2, internal: [], external: [] })
const wms = () => ({ type: 'WMS', id: 'wms-1', url: 'https://example.org/wms', title: 'Gewässer 日本 🗺️', opacity: 0.4, visible: false, sublayers: [{ name: 'water', visible: false, sublayers: [] }] })

test('Unicode and WMS visibility round-trip without unsafe URL characters', () => {
  const state = { ...empty(), external: [wms()] }
  const encoded = encodeViewState(state)
  assert.match(encoded, /^[A-Za-z0-9_-]+$/)
  assert.deepEqual(decodeViewState(encoded), validateViewState(state))
})
test('preserves app ID, locale, other parameters and hash', () => {
  const url = new URL(createViewUrl('https://host/experience/?id=app&locale=fr&view_state=old#data_s=id:123', empty()))
  assert.equal(url.searchParams.get('id'), 'app')
  assert.equal(url.searchParams.get('locale'), 'fr')
  assert.equal(url.hash, '#data_s=id:123')
  assert.equal(url.searchParams.getAll('view_state').length, 1)
  assert.deepEqual(decodeViewState(url.href), empty())
})
test('reads historical Latin-1 encoding with German umlauts', () => {
  const legacy = { internal: [{ id: 'x', visible: false }], external: [{ type: 'WMS', url: 'https://host/wms', title: 'Gewässer', opacity: 1, sublayers: [{ name: 'wasser', title: 'Wasser' }] }] }
  const state = decodeViewState(btoa(JSON.stringify(legacy)))
  assert.equal(state.external[0].title, 'Gewässer')
  assert.equal(state.external[0].visible, true)
  assert.equal(state.external[0].sublayers[0].visible, true)
})
test('repairs plus signs lost by URLSearchParams in historical URLs', () => {
  const legacy = { internal: [], external: [{ ...wms(), title: '~~~' }] }
  const encoded = btoa(JSON.stringify(legacy))
  assert.ok(encoded.includes('+'))
  assert.equal(decodeViewState(encoded.replace(/\+/g, ' ')).external[0].title, '~~~')
})
test('preserves WMTS active layer, style, matrix and image format', () => {
  const state = { ...empty(), external: [{ type: 'WMTS', url: 'https://host/wmts', title: 'Tiles', opacity: 1, visible: true, serviceMode: 'KVP', activeLayer: { id: 'layer', styleId: 'grey', tileMatrixSetId: '2056', imageFormat: 'image/png' } }] }
  assert.deepEqual(decodeViewState(encodeViewState(state)), validateViewState(state))
})
test('rejects malformed JSON, encoding and unsupported future versions', () => {
  for (const data of ['!', btoa('{'), btoa(JSON.stringify({ ...empty(), version: 99 }))]) assert.throws(() => decodeViewState(data))
})
test('rejects missing arrays and non-boolean visibility', () => {
  assert.throws(() => validateViewState({ internal: [] }))
  assert.throws(() => validateViewState({ ...empty(), internal: [{ id: 'a', visible: 'false' }] }))
})
test('rejects non-HTTP service URLs and embedded credentials', () => {
  for (const url of ['javascript:alert(1)', 'file:///local', 'https://user:pass@host/wms']) assert.throws(() => validateViewState({ ...empty(), external: [{ ...wms(), url }] }))
})
test('rejects invalid opacity and service types', () => {
  for (const opacity of [-1, 2, NaN, '0.5']) assert.throws(() => validateViewState({ ...empty(), external: [{ ...wms(), opacity }] }))
  assert.throws(() => validateViewState({ ...empty(), external: [{ ...wms(), type: 'FEATURE' }] }))
})
test('rejects duplicate IDs, oversized inputs and excessive hierarchies', () => {
  assert.throws(() => validateViewState({ ...empty(), external: [wms(), wms()] }))
  assert.throws(() => decodeViewState('A'.repeat(200001)))
  let nested = { name: 'a', visible: true, sublayers: [] }
  for (let i = 0; i < 12; i++) nested = { ...nested, sublayers: [nested] }
  assert.throws(() => validateViewState({ ...empty(), external: [{ ...wms(), sublayers: [nested] }] }))
})
test('reads old WMTS links without activeLayer information', () => {
  const state = decodeViewState(btoa(JSON.stringify({ internal: [], external: [{ type: 'WMTS', url: 'https://host/wmts', title: 'Tiles', opacity: 1, sublayers: [] }] })))
  assert.equal(state.external[0].activeLayer, undefined)
})
