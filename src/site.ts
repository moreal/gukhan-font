/**
 * Pages path follows the GitHub repository name. The default keeps the live
 * site at `/gukhan-font/` until the repository is renamed in GitHub Settings.
 * GitHub Actions sets `GITHUB_REPOSITORY` for the next build after that rename.
 */
const DEFAULT_REPOSITORY = 'morealdot/gukhan-font'

export function githubRepository(full = process.env.GITHUB_REPOSITORY ?? DEFAULT_REPOSITORY): string {
  return full.includes('/') ? full : DEFAULT_REPOSITORY
}

export function pagesRepo(full?: string): string {
  const name = githubRepository(full).split('/').pop()
  return name && name.length > 0 ? name : 'gukhan-font'
}

export function pagesBase(full?: string): string {
  return `/${pagesRepo(full)}/`
}

export function pagesOrigin(full?: string): string {
  const [owner, name] = githubRepository(full).split('/')
  return `https://${owner}.github.io/${name}`
}

export function githubOrigin(full?: string): string {
  return `https://github.com/${githubRepository(full)}`
}
