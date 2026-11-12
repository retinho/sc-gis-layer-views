import type Layer from 'esri/layers/Layer'
import type GroupLayer from 'esri/layers/GroupLayer'
import type MapImageLayer from 'esri/layers/MapImageLayer'

// Keep failed branches identifiable; one unavailable service must not block unrelated themes.
export async function loadOperationalLayers(layers: readonly Layer[], parent: string[] = []): Promise<string[]> {
  const results = await Promise.all(layers.map(async (layer): Promise<string[]> => {
    const path = [...parent, `layer:${layer.id}`]
    const failures: string[] = []
    try {
      await layer.load()
      if (layer.type === 'map-image') await (layer as MapImageLayer).loadAll()
    } catch { failures.push(JSON.stringify(path)) }
    if (layer.type === 'group') failures.push(...await loadOperationalLayers((layer as GroupLayer).layers.toArray(), path))
    return failures
  }))
  return results.flat()
}
export function assertThemeAvailable(selected: readonly string[], unavailable: readonly string[]): void {
  for (const key of selected) {
    const path: string[] = JSON.parse(key)
    if (unavailable.some((failed) => {
      const prefix: string[] = JSON.parse(failed)
      return prefix.every((part, index) => path[index] === part)
    })) throw new Error('layerUnavailable')
  }
}
