import React from 'react';
import { Bookmark } from 'lucide-react';
import type { BookmarkCommands, ProjectionClient } from '../bookmarks/application/ports';
import { BookmarkExplorer } from '../bookmarks/ui/BookmarkExplorer';
import { useI18n } from '../i18n/I18nProvider';

export function ManagerApp({ client, commands }: { client: ProjectionClient; commands: BookmarkCommands }) {
  const { t } = useI18n();

  return (
    <main className="page manager" aria-label={t('manager.main')}>
      <header className="tab-strip">
        <div className="tab-list" role="tablist" aria-label={t('manager.tabs')}>
          <div className="explorer-tab" role="tab" aria-selected="true" aria-controls="manager-tab-panel" tabIndex={0}>
            <Bookmark size={15} aria-hidden="true" />
            <span>{t('manager.tab')}</span>
          </div>
        </div>
      </header>
      <div className="manager-tab-panel" id="manager-tab-panel" role="tabpanel">
        <BookmarkExplorer client={client} commands={commands} />
      </div>
    </main>
  );
}
