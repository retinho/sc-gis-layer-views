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
// Visibility application uses live layer objects while reset uses a saved snapshot.
const { collectVisibility, snapshotVisibility, themeVisibility, applyVisibility } = await load('../src/runtime/layer-visibility.ts')
const v1 = { ...feature('one'), visible: true }
const v2 = { ...feature('two'), visible: false }
const nested = { type: 'group', id: 'nested', visible: false, visibilityMode: 'inherited', layers: collection([v2]) }
const vg = { type: 'group', id: 'group', visible: true, visibilityMode: 'exclusive', layers: collection([v1, nested]) }
const other = { ...feature('other'), visible: true }
const live = collectVisibility([vg, other])
const defaults = snapshotVisibility(live)
const selectedKey = JSON.stringify(['layer:group', 'layer:nested', 'layer:two'])
applyVisibility(live, themeVisibility(live, [selectedKey]))
assert.equal(vg.visible, true)
assert.equal(nested.visible, true)
assert.equal(v2.visible, true)
assert.equal(v1.visible, false)
assert.equal(other.visible, false)
assert.equal(vg.visibilityMode, 'independent')
assert.equal(nested.visibilityMode, 'independent')
// Manual changes are allowed, and clicking Show again restores the theme.
v1.visible = true
applyVisibility(live, themeVisibility(live, [selectedKey]))
assert.equal(v1.visible, false)
applyVisibility(live, defaults)
assert.deepEqual(snapshotVisibility(live), defaults)
applyVisibility(live, themeVisibility(live, []))
assert.equal(vg.visible, false)
assert.equal(other.visible, false)
applyVisibility(live, defaults)
const beforeMissing = snapshotVisibility(live)
assert.throws(() => themeVisibility(live, ['missing']), /missingLayers/)
assert.deepEqual(snapshotVisibility(live), beforeMissing)
assert.throws(() => applyVisibility(live, { ...defaults, missing: { visible: true } }), /missingLayers/)
assert.deepEqual(snapshotVisibility(live), beforeMissing)
// Sublayers use the same keys as the administrator tree.
const svc = service('service'); svc.visible = true
const serviceNodes = collectVisibility([svc])
const serviceKey = buildLayerTree([svc]).flatMap(getLeafKeys)[0]
const servicePlan = themeVisibility(serviceNodes, [serviceKey])
assert.equal(servicePlan[serviceNodes[0].key].visible, true)
assert.equal(servicePlan[serviceKey].visible, true)
// A one-time setter failure rolls back all preceding changes.
let throwOnce = true
let failureValue = false
const failingTarget = { get visible() { return failureValue }, set visible(value) { if (throwOnce) { throwOnce = false; throw new Error('setter failed') } failureValue = value } }
const rollbackNodes = [{ key: 'first', target: { visible: false }, children: [] }, { key: 'failure', target: failingTarget, children: [] }]
assert.throws(() => applyVisibility(rollbackNodes, { first: { visible: true }, failure: { visible: true } }), /setter failed/)
assert.equal(rollbackNodes[0].target.visible, false)
assert.equal(failureValue, false)
// Dialog edits must never mutate persisted configuration before Apply.
const { createThemeDraft, mergeThemeDraft } = await load('../src/setting/theme-draft.ts')
const persisted = Object.freeze({ id: 'theme-one', name: 'Original', webMapKey: 'original-map', selectedLayerKeys: Object.freeze(['a']) })
const draft = createThemeDraft(persisted)
draft.name = ' Edited '
draft.webMapKey = 'other-map'
draft.selectedLayerKeys.push('b')
assert.equal(persisted.name, 'Original')
assert.equal(persisted.webMapKey, 'original-map')
assert.deepEqual(persisted.selectedLayerKeys, ['a'])
assert.deepEqual(createThemeDraft(persisted), { ...persisted, selectedLayerKeys: ['a'] }, 'Reopening after Cancel must use the persisted values')
const otherTheme = { id: 'other', name: 'Other' }
const applied = mergeThemeDraft([persisted, otherTheme], draft)
assert.equal(applied[0].name, 'Edited')
assert.equal(applied[0].webMapKey, 'other-map')
assert.deepEqual(applied[0].selectedLayerKeys, ['a', 'b'])
assert.equal(applied[1], otherTheme)
draft.selectedLayerKeys.push('c')
assert.deepEqual(applied[0].selectedLayerKeys, ['a', 'b'], 'Apply must not retain mutable draft arrays')
assert.deepEqual(mergeThemeDraft([otherTheme], draft), [otherTheme], 'Do not resurrect a deleted theme')
console.log('Layer selection and tree mapping assertions passed.')

await rm(temporaryDirectory, { recursive: true, force: true })
