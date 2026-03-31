const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Vue transformer: compile .vue files to JS
const vueTransformer = require('../sandbox/scripts/vue-transformer.cjs')

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('./vue-transformer.cjs'),
}

config.watchFolders = [
  workspaceRoot,
  path.resolve(workspaceRoot, 'packages/runtime-native'),
]

config.resolver = {
  ...config.resolver,
  extraNodeModules: new Proxy(
    {},
    {
      get: (target, name) => {
        const packageName = name
        const packagePath = path.resolve(workspaceRoot, `node_modules/${packageName}`)
        const runtimePath = path.resolve(workspaceRoot, `packages/runtime-native`)
        
        if (packageName === '@vue-native/runtime-native') {
          return runtimePath
        }
        
        try {
          require.resolve(packagePath)
          return packagePath
        } catch {
          return path.resolve(projectRoot, `node_modules/${packageName}`)
        }
      },
    },
  ),
}

module.exports = config
