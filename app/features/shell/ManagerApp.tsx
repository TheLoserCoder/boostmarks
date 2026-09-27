import React from 'react';
import type { BookmarkCommands, ProjectionClient } from '../bookmarks/application/ports';
import { BookmarkExplorer } from '../bookmarks/ui/BookmarkExplorer';

export function ManagerApp({ client, commands }: { client: ProjectionClient; commands: BookmarkCommands }) {
  return (
    <main className="page" aria-labelledby="manager-title">
      <h1 id="manager-title">Проводник закладок</h1>
      <BookmarkExplorer client={client} commands={commands} />
    </main>
  );
}
