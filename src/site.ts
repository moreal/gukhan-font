/** Published repository. Pages is served at /gukhanmun-font/ on this owner's github.io host. */
const REPOSITORY = 'moreal/gukhanmun-font'

export function pagesRepo(): string {
  return 'gukhanmun-font'
}

export function pagesBase(): string {
  return `/${pagesRepo()}/`
}

export function pagesOrigin(): string {
  return `https://moreal.github.io/${pagesRepo()}`
}

export function githubOrigin(): string {
  return `https://github.com/${REPOSITORY}`
}
