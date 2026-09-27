import type { BookmarkNode } from './types';

function isSearchable(node: BookmarkNode): boolean {
  if (node.kind === 'separator') return false;
  return !(node.parentId === null && node.kind === 'folder' && node.title === '');
}

/** Simple substring search over titles and urls; advanced ranking stays out until the search task. */
export function searchNodes(nodes: BookmarkNode[], query: string): BookmarkNode[] {
  const needle = query.trim().toLocaleLowerCase();
  if (needle.length === 0) return [];

  return nodes.filter(node => {
    if (!isSearchable(node)) return false;
    const title = node.title.toLocaleLowerCase();
    const url = node.url?.toLocaleLowerCase() ?? '';
    return title.includes(needle) || url.includes(needle);
  });
}
