// Keep SDK-dependent imports behind the framework SDK loader.
export async function bootThemeStartup<T>(loadSdk: () => Promise<unknown>, loadRuntime: () => Promise<T>, start: (runtime: T) => void): Promise<void> {
  await loadSdk()
  const runtime = await loadRuntime()
  start(runtime)
}
