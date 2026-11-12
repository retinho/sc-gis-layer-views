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
  let stripped = stripTypeScriptTypes(source)
  const imports = [...stripped.matchAll(/from ['"](\.[^'"]+)['"]/g)]
  for (const match of imports) {
    const dependency = new URL(match[1] + '.ts', new URL(relative, import.meta.url))
    await load(dependency.href)
    stripped = stripped.replace(match[0], `from '${pathToFileURL(join(temporaryDirectory, basename(dependency.pathname).replace(/\.ts$/, '.mjs'))).href}'`)
  }
  await writeFile(output, stripped)
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
assert.deepEqual(createThemeDraft(persisted), { ...persisted, selectedLayerKeys: ['a'], externalLayers: [] }, 'Reopening after Cancel must use the persisted values')
const otherTheme = { id: 'other', name: 'Other' }
const applied = mergeThemeDraft([persisted, otherTheme], draft)
assert.equal(applied[0].name, 'Edited')
assert.equal(applied[0].webMapKey, 'other-map')
assert.deepEqual(applied[0].selectedLayerKeys, ['a', 'b'])
assert.equal(applied[1], otherTheme)
draft.selectedLayerKeys.push('c')
assert.deepEqual(applied[0].selectedLayerKeys, ['a', 'b'], 'Apply must not retain mutable draft arrays')
assert.deepEqual(mergeThemeDraft([otherTheme], draft), [otherTheme], 'Do not resurrect a deleted theme')
// External services: placement, ownership, rollback and asynchronous cancellation.
const { ExternalSession } = await load('../src/runtime/external-session.ts')
const { isValidExternalLayer } = await load('../src/shared/external-config.ts')
const mutableCollection = (items = []) => ({
  toArray: () => [...items], indexOf: (item) => items.indexOf(item),
  add(item, index = items.length) { items.splice(index, 0, item) },
  remove(item) { const index = items.indexOf(item); if (index >= 0) items.splice(index, 1) }
})
const originalLayer = { ...feature('original'), visible: true }
const target = { type: 'group', id: 'target', visible: false, visibilityMode: 'exclusive', layers: mutableCollection([originalLayer]) }
const unrelated = { ...feature('another-widget'), visible: true }
const map = { layers: mutableCollection([unrelated, target]) }
const savedDefaults = snapshotVisibility(collectVisibility(map.layers.toArray()))
const groupKey = JSON.stringify(['layer:target'])
const anchorKey = JSON.stringify(['layer:target', 'layer:original'])
const external = { id: 'external', type: 'WMS', url: 'https://example.org/wms', title: 'External', layerId: 'layer', serviceMode: 'KVP', visible: true, groupKey, beforeLayerKey: anchorKey }
const makeLayer = (entry, id) => ({ id, type: entry.type.toLowerCase(), visible: false, destroyed: false, destroy() { this.destroyed = true } })
const session = new ExternalSession(map, 'widget', async (entry, id) => {
  if (entry.layerId === 'failure') throw new Error('network')
  return makeLayer(entry, id)
})
const externalTheme = { id: 'theme', name: 'Theme', selectedLayerKeys: [], externalLayers: [external, { ...external, id: 'second', visible: false }] }
assert.equal(isValidExternalLayer(external), true)
assert.equal(isValidExternalLayer({ ...external, url: 'http://example.org' }), false)
assert.equal(isValidExternalLayer({ ...external, type: 'WMTS' }), false)
await session.apply(externalTheme, savedDefaults)
const added = target.layers.toArray()
assert.equal(added.length, 3)
assert.ok(added[2].id.endsWith('-external'), 'First configured entry must appear above the second')
assert.equal(added[2].visible, true)
assert.equal(added[1].visible, false)
assert.equal(target.visible, true, 'Visible external child must enable its parent')
assert.equal(target.visibilityMode, 'independent')
assert.equal(originalLayer.visible, false)
assert.equal(map.layers.toArray().includes(unrelated), true)
await assert.rejects(session.apply({ ...externalTheme, externalLayers: [{ ...external, layerId: 'failure' }] }, savedDefaults), /network/)
assert.deepEqual(target.layers.toArray(), added, 'Failed load must retain previous layers')
assert.equal(added[2].destroyed, false)
await assert.rejects(session.apply({ ...externalTheme, externalLayers: [{ ...external, groupKey: 'missing' }] }, savedDefaults), /externalTarget/)
assert.deepEqual(target.layers.toArray(), added)
await session.apply(externalTheme, savedDefaults)
assert.equal(target.layers.toArray().length, 3, 'Reapplying must not duplicate layers')
assert.equal(added[2].destroyed, true)
await session.apply({ id: 'empty', name: 'Empty', selectedLayerKeys: [] }, savedDefaults)
assert.deepEqual(target.layers.toArray(), [originalLayer], 'Switching to a theme without services removes all owned layers')
await session.apply({ ...externalTheme, externalLayers: [{ ...external, groupKey: undefined, beforeLayerKey: undefined }] }, savedDefaults)
assert.equal(map.layers.toArray()[0].type, 'wms', 'Root bottom placement')
await session.apply(undefined, savedDefaults)
assert.deepEqual(snapshotVisibility(collectVisibility(map.layers.toArray())), savedDefaults)
assert.deepEqual(target.layers.toArray(), [originalLayer])
assert.deepEqual(map.layers.toArray(), [unrelated, target], 'Reset must preserve other widgets’ layers')
let resolvePending
let pendingLayer
const pending = new ExternalSession(map, 'pending', (entry, id) => new Promise((resolve) => { pendingLayer = makeLayer(entry, id); resolvePending = resolve }))
const operation = pending.apply({ ...externalTheme, externalLayers: [external] }, savedDefaults)
pending.dispose()
resolvePending(pendingLayer)
assert.equal(await operation, false)
assert.equal(pendingLayer.destroyed, true)
assert.deepEqual(target.layers.toArray(), [originalLayer])
// Partial loading failure destroys successfully loaded peers without changing the map.
let successfulPeer
const failingBatch = new ExternalSession(map, 'batch', async (entry, id) => {
  if (entry.id === 'fail') throw undefined
  successfulPeer = makeLayer(entry, id)
  return successfulPeer
})
let rejectedBatch = false
try { await failingBatch.apply({ ...externalTheme, externalLayers: [external, { ...external, id: 'fail' }] }, savedDefaults) } catch { rejectedBatch = true }
assert.equal(rejectedBatch, true)
assert.equal(successfulPeer.destroyed, true)
assert.deepEqual(target.layers.toArray(), [originalLayer])
// If insertion itself fails, restore the previous theme and its visibility.
await session.apply({ ...externalTheme, externalLayers: [external] }, savedDefaults)
const beforeInsertionFailure = target.layers.toArray()
const beforeInsertionVisibility = snapshotVisibility(collectVisibility(map.layers.toArray()))
const originalAdd = target.layers.add
let rejectInsertion = true
target.layers.add = function (item, index) {
  if (rejectInsertion) { rejectInsertion = false; throw new Error('insertion failed') }
  return originalAdd.call(this, item, index)
}
await assert.rejects(session.apply(externalTheme, savedDefaults), /insertion failed/)
assert.deepEqual(target.layers.toArray(), beforeInsertionFailure)
assert.deepEqual(snapshotVisibility(collectVisibility(map.layers.toArray())), beforeInsertionVisibility)
target.layers.add = originalAdd
await session.apply(undefined, savedDefaults)
const configured = { ...persisted, externalLayers: [external] }
const externalDraft = createThemeDraft(configured)
externalDraft.externalLayers[0].title = 'Edited'
assert.equal(configured.externalLayers[0].title, 'External')
session.dispose()
// WMS with inherited extent: SDK 4.32 clone() can dereference null fullExtent.
const { configureWmsSelection } = await load('../src/shared/wms-selection.ts')
const wmsChild = { visible: false, sublayers: null }
const wmsSelected = { name: 'selected', visible: false, fullExtent: null, spatialReferences: [2056], dimensions: [{ name: 'time' }], sublayers: { forEach: (fn) => fn(wmsChild) }, clone() { throw new TypeError('Cannot read properties of null (reading clone)') } }
const wms = { findSublayerByName: (name) => name === 'selected' ? wmsSelected : undefined, spatialReferences: [2056], sublayers: [], spatialReference: undefined }
const mn95 = { wkid: 2056, isWebMercator: false }
configureWmsSelection(wms, 'selected', mn95)
assert.equal(wms.sublayers[0], wmsSelected, 'Use the loaded sublayer without cloning or discarding metadata')
assert.equal(wmsSelected.visible, true)
assert.equal(wmsChild.visible, true)
assert.equal(wms.spatialReference, mn95)
assert.throws(() => configureWmsSelection(wms, 'missing', mn95), /invalidService/)
assert.throws(() => configureWmsSelection(wms, 'selected', { wkid: 4326 }), /serviceProjection/)
// Reconcile paths by stable IDs, with service-scoped sublayer identities.
const { referenceIssues, resolveReference, referenceIdentity } = await load('../src/setting/reconcile.ts')
const pathKey = (...parts) => JSON.stringify(parts)
const movedLeaf = { key: pathKey('layer:new-group', 'layer:stable'), title: 'Moved', selectable: true, children: [] }
const movedGroup = { key: pathKey('layer:new-group'), title: 'New group', isGroup: true, selectable: false, children: [movedLeaf] }
const staleKey = pathKey('layer:old-group', 'layer:stable')
const missingKey = pathKey('layer:deleted')
const staleTheme = { id: 'stale', name: 'Stale', selectedLayerKeys: [staleKey, missingKey] }
let issues = referenceIssues(staleTheme, [movedGroup])
assert.equal(issues.length, 2)
assert.equal(issues[0].matches[0].key, movedLeaf.key)
assert.equal(issues[1].matches.length, 0)
let repaired = resolveReference(staleTheme, issues[0], movedLeaf.key)
assert.deepEqual(staleTheme.selectedLayerKeys, [staleKey, missingKey], 'Reconciliation must not mutate persisted data')
repaired = resolveReference(repaired, referenceIssues(repaired, [movedGroup])[0])
assert.deepEqual(repaired.selectedLayerKeys, [movedLeaf.key])
assert.equal(referenceIssues(repaired, [movedGroup]).length, 0)
assert.deepEqual(resolveReference(staleTheme, issues[0], 'invalid'), staleTheme)
const duplicateIdentity = { ...movedLeaf, key: pathKey('layer:other-group', 'layer:stable') }
assert.equal(referenceIssues(staleTheme, [movedGroup, duplicateIdentity])[0].matches.length, 2)
assert.notEqual(referenceIdentity(pathKey('layer:service1', 'sublayer:0')), referenceIdentity(pathKey('layer:service2', 'sublayer:0')))
assert.equal(referenceIdentity(pathKey('layer:old', 'layer:service1', 'sublayer:5', 'sublayer:0')), referenceIdentity(pathKey('layer:new', 'layer:service1', 'sublayer:0')))
assert.equal(referenceIdentity('invalid-json'), '')
const nestedTarget = { ...movedGroup, key: pathKey('layer:parent', 'layer:target'), children: [{ ...movedLeaf, key: pathKey('layer:parent', 'layer:target', 'layer:stable') }] }
const staleExternal = { ...staleTheme, selectedLayerKeys: [], externalLayers: [{ ...external, groupKey: pathKey('layer:target'), beforeLayerKey: pathKey('layer:target', 'layer:stable') }] }
issues = referenceIssues(staleExternal, [nestedTarget])
assert.equal(issues.length, 1, 'Resolve group before its anchor')
assert.equal(issues[0].kind, 'group')
repaired = resolveReference(staleExternal, issues[0], issues[0].matches[0].key)
issues = referenceIssues(repaired, [nestedTarget])
assert.equal(issues[0].kind, 'anchor')
repaired = resolveReference(repaired, issues[0], issues[0].matches[0].key)
assert.equal(referenceIssues(repaired, [nestedTarget]).length, 0)
const rootFallback = resolveReference(staleExternal, referenceIssues(staleExternal, [nestedTarget])[0])
assert.equal(rootFallback.externalLayers[0].groupKey, undefined)
assert.equal(rootFallback.externalLayers[0].beforeLayerKey, undefined)
assert.equal(rootFallback.externalLayers[0].url, external.url, 'Cleaning placement retains the service')
assert.equal(referenceIssues({ ...staleTheme, selectedLayerKeys: [] }, [movedGroup]).length, 0, 'New layers must not be auto-selected')
// Owned layers must be removed from their current container, including on disposal.
for (const action of ['reset', 'switch', 'dispose']) {
  const movingSession = new ExternalSession(map, 'moving', async (entry, id) => makeLayer(entry, id))
  await movingSession.apply({ ...externalTheme, externalLayers: [external] }, savedDefaults)
  const movedOwned = target.layers.toArray().find((layer) => layer !== originalLayer)
  target.layers.remove(movedOwned)
  map.layers.add(movedOwned)
  if (action === 'dispose') movingSession.dispose()
  else await movingSession.apply(action === 'reset' ? undefined : { id: 'empty', name: 'Empty', selectedLayerKeys: [] }, savedDefaults)
  assert.equal(map.layers.toArray().includes(movedOwned), false, action + ' must detach reparented services')
  assert.equal(movedOwned.destroyed, true)
  assert.equal(map.layers.toArray().includes(unrelated), true)
}
// Rollback after reparenting restores the service to its actual location.
const reparentRollback = new ExternalSession(map, 'rollback-moved', async (entry, id) => makeLayer(entry, id))
await reparentRollback.apply({ ...externalTheme, externalLayers: [external] }, savedDefaults)
const reparented = target.layers.toArray().find((layer) => layer !== originalLayer)
target.layers.remove(reparented); map.layers.add(reparented)
const mapBefore = map.layers.toArray()
const addBefore = target.layers.add
target.layers.add = () => { throw new Error('cannot insert') }
await assert.rejects(reparentRollback.apply({ ...externalTheme, externalLayers: [external] }, savedDefaults), /cannot insert/)
assert.deepEqual(map.layers.toArray(), mapBefore)
assert.equal(reparented.destroyed, false)
target.layers.add = addBefore
// A detached group is still discoverable via the SDK parent reference.
const detachedParent = { layers: mutableCollection([]) }
map.layers.remove(reparented); detachedParent.layers.add(reparented); reparented.parent = detachedParent
reparentRollback.dispose()
assert.deepEqual(detachedParent.layers.toArray(), [])
assert.equal(reparented.destroyed, true)
// Reset must still clean up when an unavailable service has omitted saved sublayers.
const partialSession = new ExternalSession(map, 'partial', async (entry, id) => makeLayer(entry, id))
await partialSession.apply({ ...externalTheme, externalLayers: [external] }, savedDefaults)
await partialSession.apply(undefined, { ...savedDefaults, missingUnavailableChild: { visible: true } })
assert.deepEqual(target.layers.toArray(), [originalLayer])
const { loadOperationalLayers, assertThemeAvailable } = await load('../src/shared/layer-loading.ts')
const failedLayer = { id: 'down', type: 'map-image', load: async () => { throw new Error('offline') } }
let healthyLoaded = false
const healthyLayer = { id: 'up', type: 'feature', load: async () => { healthyLoaded = true } }
const loadGroup = { id: 'container', type: 'group', load: async () => {}, layers: collection([failedLayer, healthyLayer]) }
const failures = await loadOperationalLayers([loadGroup])
assert.equal(healthyLoaded, true)
assert.deepEqual(failures, [pathKey('layer:container', 'layer:down')])
assert.doesNotThrow(() => assertThemeAvailable([pathKey('layer:container', 'layer:up')], failures))
assert.throws(() => assertThemeAvailable([pathKey('layer:container', 'layer:down', 'sublayer:0')], failures), /layerUnavailable/)
assert.doesNotThrow(() => assertThemeAvailable([], failures))
assert.doesNotThrow(() => assertThemeAvailable([pathKey('layer:container', 'layer:downstream')], failures))
const failedChildren = { id: 'subfailure', type: 'map-image', load: async () => {}, loadAll: async () => { throw new Error('children unavailable') } }
assert.deepEqual(await loadOperationalLayers([failedChildren]), [pathKey('layer:subfailure')])
console.log('Layer selection, visibility, dialog drafts and external-service lifecycle assertions passed.')

await rm(temporaryDirectory, { recursive: true, force: true })
