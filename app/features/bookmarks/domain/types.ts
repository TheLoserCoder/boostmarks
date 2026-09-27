export type BookmarkKind = 'folder' | 'bookmark' | 'separator';

export interface BookmarkNode {
  id: string;
  parentId: string | null;
  title: string;
  url?: string;
  kind: BookmarkKind;
  index: number;
  dateAdded?: number;
  dateGroupModified?: number;
  unmodifiable?: string;
}

/** Structural subset of the browser BookmarkTreeNode the projection cares about. */
export interface RawTreeNode {
  id: string;
  parentId?: string;
  title: string;
  url?: string;
  index?: number;
  type?: string;
  dateAdded?: number;
  dateGroupModified?: number;
  unmodifiable?: string;
  children?: RawTreeNode[];
}
