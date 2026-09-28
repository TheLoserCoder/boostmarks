import React from 'react';
import { Bookmark } from 'lucide-react';
import type { BookmarkCommands, ProjectionClient } from '../bookmarks/application/ports';
import { BookmarkExplorer } from '../bookmarks/ui/BookmarkExplorer';

export function ManagerApp({ client, commands }: { client: ProjectionClient; commands: BookmarkCommands }) {
  return (
    <main className="page manager" aria-label="Закладки">
      <header className="tab-strip">
        <div className="tab-list" role="tablist" aria-label="Вкладки">
          <div className="explorer-tab" role="tab" aria-selected="true" aria-controls="manager-tab-panel" tabIndex={0}>
            <Bookmark size={15} aria-hidden="true" />
            <span>Закладки</span>
          </div>
        </div>
      </header>
      <div className="manager-tab-panel" id="manager-tab-panel" role="tabpanel">
        <BookmarkExplorer client={client} commands={commands} />
      </div>
    </main>
  );
}
