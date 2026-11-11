const assert = require('node:assert/strict')
const { test } = require('node:test')
const Module = require('node:module')
const path = require('node:path')

// Deliberately small SDK doubles: tests exercise map mutation and async sequencing, not SDK rendering.
class Collection {
  constructor(items = []) { this.items = items }
  toArray() { return [...this.items] }
  get length() { return this.items.length }
  includes(item) { return this.items.includes(item) }
  filter(fn) { return new Collection(this.items.filter(fn)) }
  find(fn) { return this.items.find(fn) }
  some(fn) { return this.items.some(fn) }
}
class Layer {
  constructor(props = {}) { Object.assign(this, { visible: true, opacity: 1, title: '', type: 'feature' }, props) }
  async load() { if (this.url?.includes('/fail')) throw new Error('Network error'); return this }
  destroy() { this.destroyed = true }
}
class WmsSublayer {
  constructor(props = {}) { Object.assign(this, { visible: true }, props); this.sublayers = props.sublayers instanceof Collection ? props.sublayers : new Collection(props.sublayers ?? []) }
  clone() { return new WmsSublayer({ ...this, sublayers: this.sublayers.toArray().map(x => x.clone()) }) }
}
class WmtsSublayer { constructor(props = {}) { Object.assign(this, props) } }
class WmsLayer extends Layer {
  constructor(props) { super(props); this.type = 'wms'; this.sublayers = new Collection([new WmsSublayer({ name: 'water', title: 'Service metadata' })]) }
}
class WmtsLayer extends Layer {
  constructor(props) { super(props); this.type = 'wmts'; this.serviceMode = props.serviceMode ?? 'RESTful'; this.sublayers = new Collection([new WmtsSublayer({ id: 'tiles', styles: [{ id: 'grey' }], tileMatrixSets: [{ id: '2056' }] })]); this.activeLayer ??= this.sublayers.toArray()[0] }
}
class GroupLayer extends Layer { constructor(props) { super(props); this.layers = new Collection(props.layers) } }
class MapDouble {
  constructor(layers = []) { this.layers = new Collection(layers) }
  findLayerById(id) {
    const find = layers => layers.flatMap(layer => layer instanceof GroupLayer ? [layer, ...layer.layers.toArray()] : [layer]).find(layer => layer.id === id)
    return find(this.layers.toArray())
  }
  removeMany(layers) { this.layers.items = this.layers.items.filter(layer => !layers.includes(layer)) }
  addMany(layers) { this.layers.items.push(...layers) }
  reorder(layer, index) { this.layers.items = this.layers.items.filter(item => item !== layer); this.layers.items.splice(index, 0, layer) }
}
const mocks = {
  'esri/core/Collection': Collection, 'esri/layers/GroupLayer': GroupLayer,
  'esri/layers/WMSLayer': WmsLayer, 'esri/layers/WMTSLayer': WmtsLayer,
  'esri/layers/support/WMSSublayer': WmsSublayer, 'esri/layers/support/WMTSSublayer': WmtsSublayer
}
const originalLoad = Module._load
let api
try {
  Module._load = function (id, parent, main) { return mocks[id] ? { default: mocks[id] } : originalLoad.call(this, id, parent, main) }
  api = require(path.join(process.env.VIEW_TEST_BUILD, 'map-state.js'))
} finally { Module._load = originalLoad }
const service = (extra = {}) => ({ id: 'existing', type: 'WMS', url: 'https://host/wms', title: 'Water', visible: false, opacity: 0.3, sublayers: [{ name: 'water', visible: false, sublayers: [] }], ...extra })
const state = external => ({ version: 2, internal: [], external })

test('repeated activation reuses existing WMS and preserves service metadata', async () => {
  const layer = new WmsLayer({ id: 'existing', url: 'https://host/wms' })
  const map = new MapDouble([layer])
  await api.applyMapState(map, state([service()]), () => true)
  await api.applyMapState(map, state([service()]), () => true)
  assert.equal(map.layers.toArray().length, 1)
  assert.equal(layer.visible, false)
  assert.equal(layer.opacity, 0.3)
  assert.equal(layer.sublayers.toArray()[0].title, 'Service metadata')
  assert.equal(layer.sublayers.toArray()[0].visible, false)
})
test('legacy links match existing services by URL without adding duplicates', async () => {
  const layer = new WmsLayer({ id: 'existing', url: 'https://host/wms' })
  const map = new MapDouble([layer])
  await api.applyMapState(map, state([service({ id: undefined })]), () => true)
  assert.deepEqual(map.layers.toArray(), [layer])
})
test('captures nested operational layers and excludes basemaps', async () => {
  const layer = new WmsLayer({ id: 'nested', url: 'https://host/wms' })
  const map = new MapDouble([new GroupLayer({ id: 'group', layers: [layer] })])
  map.basemap = { baseLayers: new Collection([new Layer({ id: 'base' })]) }
  const captured = await api.captureMapState(map)
  assert.deepEqual(captured.internal.map(item => item.id), ['group', 'nested'])
  assert.equal(captured.external[0].id, 'nested')
})
test('network failure leaves existing visibility and managed layers intact', async () => {
  const layer = new WmsLayer({ id: 'existing', url: 'https://host/wms' })
  const previous = new WmsLayer({ id: 'sc_ext_old', url: 'https://host/old' })
  const map = new MapDouble([layer, previous])
  await assert.rejects(api.applyMapState(map, state([service(), service({ id: 'bad', url: 'https://host/fail' })]), () => true))
  assert.equal(layer.visible, true)
  assert.deepEqual(map.layers.toArray(), [layer, previous])
  assert.equal(previous.destroyed, undefined)
})
test('cancelled restore never changes the map', async () => {
  const layer = new WmsLayer({ id: 'existing', url: 'https://host/wms' })
  const map = new MapDouble([layer])
  assert.equal(await api.applyMapState(map, state([service(), service({ id: 'new', url: 'https://host/new' })]), () => false), false)
  assert.equal(layer.visible, true)
  assert.equal(map.layers.toArray().length, 1)
})
test('replaces obsolete managed services, keeping unrelated map layers', async () => {
  const old = new WmsLayer({ id: 'sc_ext_old', url: 'https://host/old' })
  const feature = new Layer({ id: 'feature' })
  const map = new MapDouble([old, feature])
  await api.applyMapState(map, state([service({ id: 'sc_ext_new' })]), () => true)
  assert.equal(old.destroyed, true)
  assert.equal(map.layers.toArray().length, 2)
  assert.equal(map.findLayerById('feature'), feature)
  assert.equal(map.findLayerById('sc_ext_new').visible, false)
})
test('restores WMTS active selection and rejects unavailable styles before mutation', async () => {
  const layer = new WmtsLayer({ id: 'tiles', url: 'https://host/wmts' })
  const map = new MapDouble([layer])
  const selected = { id: 'tiles', styleId: 'grey', tileMatrixSetId: '2056', imageFormat: 'image/png' }
  const snapshot = { ...service({ id: 'tiles', url: layer.url }), type: 'WMTS', activeLayer: selected, serviceMode: 'RESTful' }
  await api.applyMapState(map, state([snapshot]), () => true)
  assert.equal(layer.activeLayer.styleId, 'grey')
  await assert.rejects(api.applyMapState(map, state([{ ...snapshot, visible: true, activeLayer: { ...selected, styleId: 'missing' } }]), () => true))
  assert.equal(layer.visible, false)
  assert.equal(layer.activeLayer.styleId, 'grey')
})
test('an unrelated layer with no usable URL does not block restoring other services', async () => {
  const broken = new WmsLayer({ id: 'unrelated', url: '' })
  const map = new MapDouble([broken])
  await api.applyMapState(map, state([service({ id: 'sc_ext_new' })]), () => true)
  assert.equal(map.layers.toArray().length, 2)
  assert.equal(map.findLayerById('unrelated'), broken)
})
test('selected child enables its hidden parent even if parent false comes last', async () => {
  const child = new Layer({ id: 'child', visible: false })
  const other = new Layer({ id: 'other', visible: false })
  const group = new GroupLayer({ id: 'group', visible: false, layers: [child, other] })
  await api.applyMapState(new MapDouble([group]), { ...state([]), internal: [{ id: 'child', visible: true }, { id: 'group', visible: false }] }, () => true)
  assert.equal(group.visible, true)
  assert.equal(child.visible, true)
  assert.equal(other.visible, false)
})
test('selected descendant enables every ancestor in nested groups', async () => {
  const child = new Layer({ id: 'child', visible: false })
  const inner = new GroupLayer({ id: 'inner', visible: false, layers: [child] })
  const outer = new GroupLayer({ id: 'outer', visible: false, layers: [inner] })
  await api.applyMapState(new MapDouble([outer]), { ...state([]), internal: [{ id: 'child', visible: true }] }, () => true)
  assert.equal(child.visible && inner.visible && outer.visible, true)
})
test('an unselected child with a live true flag does not open a hidden group', async () => {
  const child = new Layer({ id: 'child', visible: true })
  const group = new GroupLayer({ id: 'group', visible: false, layers: [child] })
  await api.applyMapState(new MapDouble([group]), state([]), () => true)
  assert.equal(group.visible, false)
})
test('capture and restore preserves a hidden group with locally visible children', async () => {
  const child = new WmsLayer({ id: 'child', url: 'https://host/wms', visible: true })
  const group = new GroupLayer({ id: 'group', visible: false, layers: [child] })
  const map = new MapDouble([group])
  const saved = await api.captureMapState(map)
  assert.equal(saved.internal.find(item => item.id === 'child').visible, false)
  assert.equal(saved.external[0].visible, false)
  await api.applyMapState(map, saved, () => true)
  assert.equal(group.visible, false)
})
test('external service selection also enables its existing WebMap group', async () => {
  const child = new WmsLayer({ id: 'existing', url: 'https://host/wms', visible: false })
  const group = new GroupLayer({ id: 'group', visible: false, layers: [child] })
  await api.applyMapState(new MapDouble([group]), state([service({ visible: true })]), () => true)
  assert.equal(group.visible, true)
  assert.equal(child.visible, true)
})
test('new services are inserted below WebMap layers by default, preserving their relative order', async () => {
  const base = new Layer({ id: 'webmap' })
  const map = new MapDouble([base])
  const snapshot = state([service({ id: 'sc_ext_a' }), service({ id: 'sc_ext_b', url: 'https://host/b' })])
  await api.applyMapState(map, snapshot, () => true)
  assert.deepEqual(map.layers.toArray().map(layer => layer.id), ['sc_ext_a', 'sc_ext_b', 'webmap'])
  await api.applyMapState(map, snapshot, () => true)
  assert.deepEqual(map.layers.toArray().map(layer => layer.id), ['sc_ext_a', 'sc_ext_b', 'webmap'])
})
test('admin can move the same added services to top and back to bottom', async () => {
  const map = new MapDouble([new Layer({ id: 'webmap' })])
  const snapshot = state([service({ id: 'sc_ext_a' }), service({ id: 'sc_ext_b', url: 'https://host/b' })])
  await api.applyMapState(map, snapshot, () => true, { externalLayerPosition: 'top' })
  assert.deepEqual(map.layers.toArray().map(layer => layer.id), ['webmap', 'sc_ext_a', 'sc_ext_b'])
  await api.applyMapState(map, snapshot, () => true, { externalLayerPosition: 'bottom' })
  assert.deepEqual(map.layers.toArray().map(layer => layer.id), ['sc_ext_a', 'sc_ext_b', 'webmap'])
})
test('disabled services stay in the tree and internal snapshots cannot override the admin choice', async () => {
  const map = new MapDouble()
  const snapshot = { ...state([service({ id: 'sc_ext_a', visible: true })]), internal: [{ id: 'sc_ext_a', visible: true }] }
  await api.applyMapState(map, snapshot, () => true, { externalLayerVisibility: 'hidden' })
  assert.equal(map.findLayerById('sc_ext_a').visible, false)
  assert.equal(map.layers.length, 1)
  map.findLayerById('sc_ext_a').visible = true
  await api.applyMapState(map, snapshot, () => true, { externalLayerVisibility: 'hidden' })
  assert.equal(map.findLayerById('sc_ext_a').visible, false)
})
test('enabled overrides a saved false visibility for added WMS and WMTS services', async () => {
  const map = new MapDouble()
  const snapshot = state([service({ id: 'sc_ext_a', visible: false }), { type: 'WMTS', id: 'sc_ext_b', url: 'https://host/wmts', title: 'Tiles', opacity: 1, visible: false }])
  await api.applyMapState(map, snapshot, () => true, { externalLayerVisibility: 'visible' })
  assert.equal(map.findLayerById('sc_ext_a').visible, true)
  assert.equal(map.findLayerById('sc_ext_b').visible, true)
})
test('saved default preserves mixed visibility of added services', async () => {
  const map = new MapDouble()
  await api.applyMapState(map, state([service({ id: 'sc_ext_a', visible: false }), service({ id: 'sc_ext_b', url: 'https://host/b', visible: true })]), () => true)
  assert.equal(map.findLayerById('sc_ext_a').visible, false)
  assert.equal(map.findLayerById('sc_ext_b').visible, true)
})
test('admin overrides do not move or disable original WebMap services', async () => {
  const wms = new WmsLayer({ id: 'existing', url: 'https://host/wms' })
  const feature = new Layer({ id: 'feature' })
  const map = new MapDouble([feature, wms])
  await api.applyMapState(map, state([service({ visible: true }), service({ id: 'sc_ext_new', url: 'https://host/new' })]), () => true,
    { externalLayerPosition: 'bottom', externalLayerVisibility: 'hidden' })
  assert.deepEqual(map.layers.toArray().map(layer => layer.id), ['sc_ext_new', 'feature', 'existing'])
  assert.equal(wms.visible, true)
  assert.equal(map.findLayerById('sc_ext_new').visible, false)
})
