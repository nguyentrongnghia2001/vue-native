const path = require('path')

const expoPackageDir = path.dirname(require.resolve('expo/package.json'))
const expoBabelTransformer = require(
  require.resolve('@expo/metro-config/build/babel-transformer.js', {
    paths: [expoPackageDir],
  }),
)

const SCRIPT_BLOCK_RE = /<script\b[^>]*>([\s\S]*?)<\/script>/i
const TEMPLATE_BLOCK_RE = /<template\b[^>]*>([\s\S]*?)<\/template>/i
const TEMPLATE_MARKER_RE = /\/\*\s*__VUE_TEMPLATE__\s*\*\//

function extractBlock(source, regex, label, filename) {
  const match = source.match(regex)
  if (!match) {
    throw new Error(`[vue-transformer] Missing <${label}> block in ${filename}`)
  }

  return match[1].trim()
}

function transformVueSource(source, filename) {
  const script = extractBlock(source, SCRIPT_BLOCK_RE, 'script', filename)
  const template = extractBlock(source, TEMPLATE_BLOCK_RE, 'template', filename)

  if (!TEMPLATE_MARKER_RE.test(script)) {
    throw new Error(
      `[vue-transformer] Missing template marker /* __VUE_TEMPLATE__ */ in ${filename}`,
    )
  }

  const injectedScript = script.replace(
    TEMPLATE_MARKER_RE,
    `template: ${JSON.stringify(template)},`,
  )

  return {
    src: injectedScript,
    filename: filename.replace(/\.vue$/i, '.ts'),
  }
}

module.exports.transform = function transform(params) {
  if (!params.filename.endsWith('.vue')) {
    return expoBabelTransformer.transform(params)
  }

  const vueSource = transformVueSource(params.src, params.filename)

  return expoBabelTransformer.transform({
    ...params,
    src: vueSource.src,
    filename: vueSource.filename,
  })
}