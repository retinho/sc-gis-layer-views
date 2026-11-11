const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const root = path.resolve(__dirname, '..', 'src')
function translations(scope, locale) {
  let result
  const source = fs.readFileSync(path.join(root, scope, 'translations', locale + '.js'), 'utf8')
  vm.runInNewContext(source, { System: { register: (_dependencies, factory) => factory(value => { result = value }).execute() } })
  return result
}
test('runtime and settings have complete and consistent English, German and French keys', () => {
  const source = fs.readFileSync(path.join(root, 'runtime/translations/default.ts'), 'utf8')
  const english = JSON.parse(source.replace('export default ', ''))
  for (const scope of ['runtime', 'setting']) {
    assert.equal(fs.readFileSync(path.join(root, scope, 'translations/default.ts'), 'utf8'), source)
    for (const locale of ['de', 'fr']) {
      const localized = translations(scope, locale)
      assert.deepEqual(Object.keys(localized).sort(), Object.keys(english).sort())
      assert.ok(Object.values(localized).every(value => typeof value === 'string' && value.length))
      if (locale === 'de') assert.ok(!Object.values(localized).join('').includes('\u00df'))
    }
  }
})
