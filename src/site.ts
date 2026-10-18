/** Published repository. The Pages path is this name, not the name GitHub still has checked out. */
const REPOSITORY = 'morealdot/gukhanmun-font'

export function pagesRepo(): string {
  return 'gukhanmun-font'
}

export function pagesBase(): string {
  return `/${pagesRepo()}/`
}

export function pagesOrigin(): string {
  return `https://morealdot.github.io/${pagesRepo()}`
}

export function githubOrigin(): string {
  return `https://github.com/${REPOSITORY}`
}
