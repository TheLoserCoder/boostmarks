import React from 'react';
import type { ProjectionClient } from '../bookmarks/application/ports';
import { BookmarkExplorer } from '../bookmarks/ui/BookmarkExplorer';

export function ManagerApp({ client }: { client: ProjectionClient }) {
  return (
    <main className="page" aria-labelledby="manager-title">
      <h1 id="manager-title">Проводник закладок</h1>
      <BookmarkExplorer client={client} />
    </main>
  );
}
