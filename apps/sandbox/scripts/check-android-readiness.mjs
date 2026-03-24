import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const sandboxRoot = path.resolve(__dirname, '..')

const requiredPaths = [
  path.join(sandboxRoot, 'android'),
  path.join(sandboxRoot, 'android', 'app', 'src', 'main', 'java'),
  path.join(sandboxRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
  path.join(sandboxRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'vuenative', 'bridge', 'VueNativeHostBridgeModule.kt'),
  path.join(sandboxRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'vuenative', 'bridge', 'VueNativeHostBridgePackage.kt'),
]

const mainApplicationCandidates = []

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }

    if (entry.name === 'MainApplication.kt' || entry.name === 'MainApplication.java') {
      mainApplicationCandidates.push(full)
    }
  }
}

const missing = requiredPaths.filter(p => !fs.existsSync(p))

if (missing.length > 0) {
  console.error('[check-android-readiness] Missing required paths:')
  for (const m of missing) {
    console.error(` - ${m}`)
  }
  console.error('[check-android-readiness] Not ready yet. Run prebuild + sync first.')
  process.exit(1)
}

walk(path.join(sandboxRoot, 'android', 'app', 'src', 'main', 'java'))

if (mainApplicationCandidates.length === 0) {
  console.warn('[check-android-readiness] Could not find MainApplication.kt/java automatically.')
  console.warn('[check-android-readiness] Please verify package registration manually.')
  process.exit(0)
}

let registrationFound = false

for (const file of mainApplicationCandidates) {
  const content = fs.readFileSync(file, 'utf8')
  const hasImport = content.includes('VueNativeHostBridgePackage')
  const hasRegistration = content.includes('VueNativeHostBridgePackage()') || content.includes('new VueNativeHostBridgePackage()')

  if (hasImport && hasRegistration) {
    registrationFound = true
    console.log(`[check-android-readiness] Registration found in ${file}`)
    break
  }
}

if (!registrationFound) {
  console.error('[check-android-readiness] Bridge package is not registered in MainApplication.')
  console.error('[check-android-readiness] Add import + packages.add(VueNativeHostBridgePackage()).')
  process.exit(1)
}

console.log('[check-android-readiness] Android native integration looks ready.')
