/** Preserve search filters when advancing a paginated endpoint. */
export function pagedResourceUrl(path: string, page: number) {
  return `${path}${path.includes('?') ? '&' : '?'}page=${page}`;
}
