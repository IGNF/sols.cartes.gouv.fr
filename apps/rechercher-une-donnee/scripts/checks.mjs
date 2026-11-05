// Pure checks shared by lint and tests.

/** Minimal sanity checks of config/default.toml (no TOML parser dependency). */
export function checkConfig(toml, upstream) {
  const problems = []
  const expectLine = (pattern, message) => {
    if (!pattern.test(toml)) problems.push(`config/default.toml: ${message}`)
  }
  expectLine(/^\[global\]$/m, 'missing [global] section')
  expectLine(/^geonetwork4_api_url = "https:\/\/[^"]+"$/m, 'geonetwork4_api_url must be an https URL')
  const datahubUrl = upstream.baseHref.replace(/\/$/, '')
  expectLine(new RegExp(`^datahub_url = "${datahubUrl}"$`, 'm'), `datahub_url must be "${datahubUrl}"`)
  expectLine(/^config_filters\.\w+ = \[.+\]$/m, '[search] config_filters (sols scope) is missing')
  if (/\t/.test(toml)) problems.push('config/default.toml: tabs are not allowed')
  for (const [index, line] of toml.split('\n').entries()) {
    if (!quotesBalanced(line)) problems.push(`config/default.toml:${index + 1}: unbalanced quotes`)
  }
  return problems
}

/** Every patch file must be listed in doc/catalogue-patches.md. */
export function checkPatchesDocumented(patchNames, patchesDoc) {
  return patchNames
    .filter((name) => !patchesDoc.includes(name))
    .map((name) => `patches/${name} is not listed in doc/catalogue-patches.md`)
}

/** True when every ' or " string opened on the line is closed before the end or a comment. */
export function quotesBalanced(line) {
  let open = null
  for (const char of line) {
    if (open) {
      if (char === open) open = null
    } else if (char === '"' || char === "'") {
      open = char
    } else if (char === '#') {
      break
    }
  }
  return open === null
}

/** Patch 0002 hardcodes the base href in project.json: it must match upstream.json. */
export function checkBaseHrefPatch(patchText, upstream) {
  const match = patchText.match(/^\+\s*"baseHref": "([^"]+)",$/m)
  if (!match) return ['patch 0002: no baseHref line found']
  return match[1] === upstream.baseHref
    ? []
    : [`patch 0002: baseHref "${match[1]}" differs from upstream.json "${upstream.baseHref}"`]
}
