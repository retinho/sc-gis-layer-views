// Run with Node.js >=22.13: node tests/layer-selection.mjs
// Executes the real pure TypeScript modules without an ExB installation.
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import { stripTypeScriptTypes } from 'node:module'

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'layer-views-test-'))
async function load(relative) {
  const source = await readFile(new URL(relative, import.meta.url), 'utf8')
  const output = join(temporaryDirectory, basename(relative).replace(/\.ts$/, '.mjs'))
  await writeFile(output, stripTypeScriptTypes(source))
  return import(pathToFileURL(output).href)
}
const { getLeafKeys, getSelectionState, toggleSelection } = await load('../src/setting/layer-selection.ts')
const { buildLayerTree } = await load('../src/setting/build-layer-tree.ts')
const leaf = (key) => ({ key, title: 'Same title', children: [], selectable: true })
const a = leaf('a'), b = leaf('b'), c = leaf('c')
const inner = { key: 'inner', title: 'Inner', children: [b, c], selectable: false }
const group = { key: 'group', title: 'Group', children: [a, inner], selectable: false }
const empty = { key: 'empty', title: 'Empty', children: [], selectable: false }
assert.deepEqual(getLeafKeys(group), ['a', 'b', 'c'])
const original = ['unrelated', 'missing-saved-key']
const all = toggleSelection(group, original, true)
assert.deepEqual(original, ['unrelated', 'missing-saved-key'])
assert.deepEqual(all, ['unrelated', 'missing-saved-key', 'a', 'b', 'c'])
assert.deepEqual(getSelectionState(group, new Set(all)), { checked: true, indeterminate: false, disabled: false })
const partial = toggleSelection(b, all, false)
assert.deepEqual(getSelectionState(group, new Set(partial)), { checked: false, indeterminate: true, disabled: false })
assert.equal(getSelectionState(inner, new Set(partial)).indeterminate, true)
assert.deepEqual(toggleSelection(group, partial, false), original)
assert.deepEqual(toggleSelection(group, all, true), all)
assert.deepEqual(getSelectionState(empty, new Set()), { checked: false, indeterminate: false, disabled: true })
assert.deepEqual(toggleSelection(empty, original, true), original)
assert.deepEqual(JSON.parse(JSON.stringify({ selectedLayerKeys: partial })).selectedLayerKeys, partial)

const collection = (items) => ({ toArray: () => [...items] })
const feature = (id) => ({ type: 'feature', id, title: 'Same title' })
const service = (id) => ({ type: 'map-image', id, title: 'Service', sublayers: collection([
  { id: 2, title: 'Bottom', sublayers: collection([]) },
  { id: 1, title: 'Top group', sublayers: collection([{ id: 0, title: 'Nested', sublayers: collection([]) }]) }
]) })
const mapLayers = [feature('base-feature'), { type: 'group', id: 'g', title: 'Group', layers: collection([feature('f1'), feature('f2')]) }, service('m1'), service('m2')]
const nodes = buildLayerTree(mapLayers)
assert.deepEqual(nodes.map((n) => JSON.parse(n.key)[0]), ['layer:m2', 'layer:m1', 'layer:g', 'layer:base-feature'])
assert.deepEqual(nodes[2].children.map((n) => JSON.parse(n.key).at(-1)), ['layer:f2', 'layer:f1'])
assert.equal(nodes[0].children[0].title, 'Top group')
const keys = nodes.flatMap(getLeafKeys)
assert.equal(new Set(keys).size, keys.length, 'Repeated sublayer IDs in separate services must remain distinct')
assert.equal(mapLayers[0].id, 'base-feature', 'Building the tree must not reorder live collections')
assert.equal(buildLayerTree([{ type: 'group', id: 'empty', layers: collection([]) }])[0].selectable, false)
assert.equal(buildLayerTree([{ type: 'unsupported', id: 'unsupported' }])[0].selectable, false)
// Regression: configured WebMaps resolve without a MapView or instanceof check.
const { resolveConfiguredWebMaps } = await load('../src/setting/configured-webmaps.ts')
const sources = {
  map1: { id: 'map1', type: 'WEB_MAP', itemId: 'portal-item-1', portalUrl: 'https://example.org/portal', label: 'Map one' },
  map2: { id: 'map2', type: 'WEB_MAP', itemId: 'portal-item-2' },
  scene: { id: 'scene', type: 'WEB_SCENE', itemId: 'scene-item' },
  child: { id: 'child', type: 'FEATURE_LAYER' }
}
assert.deepEqual(resolveConfiguredWebMaps([{ dataSourceId: 'map1' }], sources, 'WEB_MAP'), [
  { dataSourceId: 'map1', itemId: 'portal-item-1', portalUrl: 'https://example.org/portal', label: 'Map one' }
])
assert.equal(resolveConfiguredWebMaps([{ dataSourceId: 'missing', mainDataSourceId: 'map1' }], sources, 'WEB_MAP')[0].itemId, 'portal-item-1')
assert.equal(resolveConfiguredWebMaps([{ dataSourceId: 'child', rootDataSourceId: 'map1' }], sources, 'WEB_MAP')[0].itemId, 'portal-item-1')
assert.equal(resolveConfiguredWebMaps([{ dataSourceId: 'map1' }, { dataSourceId: 'map1' }, { dataSourceId: 'map2' }], sources, 'WEB_MAP').length, 2)
assert.deepEqual(resolveConfiguredWebMaps([{ dataSourceId: 'scene' }], sources, 'WEB_MAP'), [])
assert.deepEqual(resolveConfiguredWebMaps(undefined, undefined, 'WEB_MAP'), [])
assert.equal(resolveConfiguredWebMaps([{ dataSourceId: 'map2' }], sources, 'WEB_MAP')[0].label, 'portal-item-2')
console.log('Layer selection and tree mapping assertions passed.')

await rm(temporaryDirectory, { recursive: true, force: true })
