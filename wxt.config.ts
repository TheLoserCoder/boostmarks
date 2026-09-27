import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'app',
  modules: ['@wxt-dev/module-react'],
  manifest: ({ browser }) => ({
    name: 'Boostmarks',
    description: 'Bookmark manager',
    permissions: ['bookmarks'],
    ...(browser === 'firefox' ? {
      browser_specific_settings: {
        gecko: {
          id: 'boostmarks@thelosercoder.github',
          data_collection_permissions: { required: ['none'] },
        },
      },
    } : {}),
  }),
});
