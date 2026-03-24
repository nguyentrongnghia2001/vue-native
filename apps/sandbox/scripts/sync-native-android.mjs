import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const sandboxRoot = path.resolve(__dirname, '..')

const sourceBase = path.join(
  sandboxRoot,
  'native',
  'android',
  'src',
  'main',
  'java',
  'com',
  'vuenative',
  'bridge',
)

const targetBase = path.join(
  sandboxRoot,
  'android',
  'app',
  'src',
  'main',
  'java',
  'com',
  'vuenative',
  'bridge',
)

const files = [
  'VueNativeHostBridgeModule.kt',
  'VueNativeHostBridgePackage.kt',
]

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function copyFile(from, to) {
  fs.copyFileSync(from, to)
}

if (!fs.existsSync(path.join(sandboxRoot, 'android'))) {
  console.error('[sync-native-android] Missing android/ project. Run prebuild first: expo prebuild --platform android')
  process.exit(1)
}

if (!fs.existsSync(sourceBase)) {
  console.error(`[sync-native-android] Missing source folder: ${sourceBase}`)
  process.exit(1)
}

ensureDir(targetBase)

for (const file of files) {
  const from = path.join(sourceBase, file)
  const to = path.join(targetBase, file)

  if (!fs.existsSync(from)) {
    console.error(`[sync-native-android] Missing source file: ${from}`)
    process.exit(1)
  }

  copyFile(from, to)
  console.log(`[sync-native-android] Copied ${file}`)
}

console.log('[sync-native-android] Done. Next: register VueNativeHostBridgePackage in android/app/src/main/java/**/MainApplication.kt')
