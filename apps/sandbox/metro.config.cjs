const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

config.resolver.sourceExts = [...config.resolver.sourceExts, 'vue']
config.transformer.babelTransformerPath = path.join(__dirname, 'scripts', 'vue-transformer.cjs')

module.exports = config
