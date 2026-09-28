/**
 * Minimal translation dictionaries. Russian is the source of truth for the key
 * set: `en` is typed as a complete record, so a missing translation fails the
 * type check instead of silently falling back at runtime.
 *
 * Plural messages hold one template per CLDR plural category; the translator
 * picks the category with `Intl.PluralRules`. Russian uses one/few/many,
 * English one/other.
 */
export type PluralForms = Partial<Record<'one' | 'few' | 'many' | 'other', string>>;

export type Message = string | PluralForms;

export const ru = {
  'app.name': 'Boostmarks',
  'app.tagline': 'Проводник закладок',

  'nav.back': 'Назад',
  'nav.forward': 'Вперёд',
  'nav.up': 'Вверх',
  'nav.refresh': 'Обновить',
  'nav.settings': 'Настройки',
  'nav.home': 'Главная',

  'manager.main': 'Закладки',
  'manager.tabs': 'Вкладки',
  'manager.tab': 'Закладки',

  'explorer.region': 'Закладки',
  'explorer.loadError': 'Не удалось прочитать локальную проекцию.',
  'explorer.retry': 'Повторить',
  'explorer.loading': 'Загрузка…',
  'explorer.emptyProjection': 'В этой проекции пока нет закладок',

  'search.label': 'Поиск закладок',
  'search.placeholder': 'Название или адрес…',
  'search.clear': 'Очистить поиск',
  'search.clearFallback': 'Очистить: {label}',
  'search.found': 'Найдено: {count}',
  'search.results': 'Результаты поиска',
  'search.nothing': 'Ничего не найдено',
  'search.resultList': 'Найденные закладки',

  'status.projected': 'Закладок в проекции: {count}',

  'command.newFolder': 'Новая папка',

  'item.folder': 'Папка',
  'item.bookmark': 'Закладка',
  'item.separator': 'Разделитель',
  'item.element': 'Элемент',
  'item.pin': 'Закрепить «{title}»',
  'item.unpin': 'Открепить «{title}»',
  'item.drag': 'Перетащить «{title}»',

  'address.path': 'Путь к папке',
  'address.breadcrumbs': 'Путь',
  'address.edit': 'Ввести путь',
  'address.empty': 'Введите путь к папке',
  'address.notFound': 'Папка не найдена',
  'address.ambiguous': 'Найдено несколько папок с таким именем — уточните путь',

  'home.region': 'Главная',
  'home.empty': 'Папок пока нет. Создайте их в браузере или закрепите закладку в боковой панели.',
  'home.pinned': 'Закреплённые',
  'home.folders': 'Папки',
  'home.childCount': {
    one: '{count} элемент',
    few: '{count} элемента',
    many: '{count} элементов',
  },

  'quick.access': 'Быстрый доступ',
  'quick.home': 'Главная',
  'quick.root': 'Корень',

  'content.region': 'Содержимое папки',
  'content.empty': 'Папка пуста',
  'content.columns.name': 'Название',
  'content.columns.type': 'Тип',
  'content.columns.address': 'Адрес',

  'view.label': 'Вид',
  'view.list': 'Список',
  'view.table': 'Таблица',
  'view.grid': 'Сетка',

  'menu.actions': 'Действия',
  'menu.open': 'Открыть',
  'menu.openTab': 'Открыть в новой вкладке',
  'menu.createIn': 'Создать папку в «{title}»',
  'menu.move': 'Переместить…',
  'menu.moveToStart': 'В начало папки',
  'menu.pin': 'Закрепить в быстром доступе',
  'menu.unpin': 'Убрать из быстрого доступа',

  'dialog.cancel': 'Отмена',
  'dialog.create': 'Создать',
  'dialog.creating': 'Создание…',
  'dialog.move': 'Переместить',
  'dialog.moving': 'Перемещение…',

  'newFolder.title': 'Новая папка',
  'newFolder.description': 'Создать папку в «{title}»',
  'newFolder.name': 'Имя папки',
  'newFolder.open': 'Открыть новую папку',
  'newFolder.emptyName': 'Введите имя папки',

  'move.title': 'Переместить',
  'move.description': 'Куда переместить «{title}»? Укажите полный путь к папке через обратную косую черту.',
  'move.destination': 'Папка назначения',
  'move.placeholder': 'Например: Панель закладок\\Работа',
  'move.pathEmpty': 'Введите путь к папке назначения',
  'move.pathNotFound': 'Папка назначения не найдена',
  'move.pathAmbiguous': 'Путь неоднозначен: уточните папку назначения',
  'move.error.missingSource': 'Закладка больше не существует',
  'move.error.invalidParent': 'Нельзя переместить в эту папку',
  'move.error.cycle': 'Нельзя переместить папку внутрь самой себя',
  'move.error.unchanged': 'Элемент уже находится в этой папке',
  'move.error.unmodifiable': 'Этот элемент нельзя переместить',
  'move.error.failed': 'Не удалось переместить. Попробуйте ещё раз',

  'create.error.invalidParent': 'Папка назначения больше не существует',
  'create.error.failed': 'Не удалось создать папку. Попробуйте ещё раз',
  'create.error.duplicate': 'Папка с таким именем уже есть в этой папке',

  'drag.hint': 'Для перемещения с клавиатуры откройте контекстное меню строки.',
  'drag.start': 'Перетаскивание начато',
  'drag.startMany': 'Перетаскивание {count} элементов начато',
  'drag.end': 'Перетаскивание завершено',
  'drag.cancel': 'Перетаскивание отменено',
  'drag.failed': 'Не удалось переместить. Обновите закладки и попробуйте ещё раз',
  'drag.partial': 'Перемещено {moved} из {total}, часть не удалось переместить',
  'drag.moved': 'Перемещено «{source}» в «{target}»',
  'drag.movedBefore': '«{source}» перемещено перед «{target}»',
  'drag.movedMany': 'Перемещено {count} {noun} в «{target}»',
  'drag.movedManyBefore': 'Перемещено {count} {noun} перед «{target}»',
  'drag.movedSome': 'Перемещено {moved} из {total} {noun} в «{target}»',
  'drag.movedSomeBefore': 'Перемещено {moved} из {total} {noun} перед «{target}»',

  'item.noun': {
    one: 'элемент',
    few: 'элемента',
    many: 'элементов',
  },

  'options.title': 'Настройки',
  'options.section': 'Настройки расширения',
  'options.language': 'Язык',
  'options.locale.ru': 'Русский',
  'options.locale.en': 'English',
  'options.theme': 'Тема',
  'options.theme.system': 'Системная',
  'options.theme.dark': 'Тёмная',
  'options.theme.light': 'Светлая',
  'options.localNote': 'Все данные хранятся локально, в вашем браузере.',

  'popup.openManager': 'Открыть проводник',
} as const satisfies Record<string, Message>;

export type TranslationKey = keyof typeof ru;

export const en: Record<TranslationKey, Message> = {
  'app.name': 'Boostmarks',
  'app.tagline': 'Bookmark explorer',

  'nav.back': 'Back',
  'nav.forward': 'Forward',
  'nav.up': 'Up',
  'nav.refresh': 'Refresh',
  'nav.settings': 'Settings',
  'nav.home': 'Home',

  'manager.main': 'Bookmarks',
  'manager.tabs': 'Tabs',
  'manager.tab': 'Bookmarks',

  'explorer.region': 'Bookmarks',
  'explorer.loadError': 'Could not read the local projection.',
  'explorer.retry': 'Retry',
  'explorer.loading': 'Loading…',
  'explorer.emptyProjection': 'There are no bookmarks in this projection yet',

  'search.label': 'Search bookmarks',
  'search.placeholder': 'Name or address…',
  'search.clear': 'Clear search',
  'search.clearFallback': 'Clear: {label}',
  'search.found': 'Found: {count}',
  'search.results': 'Search results',
  'search.nothing': 'Nothing found',
  'search.resultList': 'Found bookmarks',

  'status.projected': 'Bookmarks in projection: {count}',

  'command.newFolder': 'New folder',

  'item.folder': 'Folder',
  'item.bookmark': 'Bookmark',
  'item.separator': 'Separator',
  'item.element': 'Item',
  'item.pin': 'Pin “{title}”',
  'item.unpin': 'Unpin “{title}”',
  'item.drag': 'Drag “{title}”',

  'address.path': 'Folder path',
  'address.breadcrumbs': 'Path',
  'address.edit': 'Enter a path',
  'address.empty': 'Enter a folder path',
  'address.notFound': 'Folder not found',
  'address.ambiguous': 'Several folders share this name — refine the path',

  'home.region': 'Home',
  'home.empty': 'No folders yet. Create them in the browser or pin a bookmark in the sidebar.',
  'home.pinned': 'Pinned',
  'home.folders': 'Folders',
  'home.childCount': {
    one: '{count} item',
    other: '{count} items',
  },

  'quick.access': 'Quick access',
  'quick.home': 'Home',
  'quick.root': 'Root',

  'content.region': 'Folder contents',
  'content.empty': 'This folder is empty',
  'content.columns.name': 'Name',
  'content.columns.type': 'Type',
  'content.columns.address': 'Address',

  'view.label': 'View',
  'view.list': 'List',
  'view.table': 'Table',
  'view.grid': 'Grid',

  'menu.actions': 'Actions',
  'menu.open': 'Open',
  'menu.openTab': 'Open in a new tab',
  'menu.createIn': 'Create a folder in “{title}”',
  'menu.move': 'Move…',
  'menu.moveToStart': 'Move to the beginning',
  'menu.pin': 'Pin to quick access',
  'menu.unpin': 'Remove from quick access',

  'dialog.cancel': 'Cancel',
  'dialog.create': 'Create',
  'dialog.creating': 'Creating…',
  'dialog.move': 'Move',
  'dialog.moving': 'Moving…',

  'newFolder.title': 'New folder',
  'newFolder.description': 'Create a folder in “{title}”',
  'newFolder.name': 'Folder name',
  'newFolder.open': 'Open the new folder',
  'newFolder.emptyName': 'Enter a folder name',

  'move.title': 'Move',
  'move.description': 'Where should “{title}” go? Enter the full folder path separated by backslashes.',
  'move.destination': 'Destination folder',
  'move.placeholder': 'For example: Bookmarks bar\\Work',
  'move.pathEmpty': 'Enter the destination folder path',
  'move.pathNotFound': 'Destination folder not found',
  'move.pathAmbiguous': 'The path is ambiguous: refine the destination folder',
  'move.error.missingSource': 'The bookmark no longer exists',
  'move.error.invalidParent': 'Cannot move into this folder',
  'move.error.cycle': 'A folder cannot be moved into itself',
  'move.error.unchanged': 'The item is already in this folder',
  'move.error.unmodifiable': 'This item cannot be moved',
  'move.error.failed': 'Could not move. Try again',

  'create.error.invalidParent': 'The destination folder no longer exists',
  'create.error.failed': 'Could not create the folder. Try again',
  'create.error.duplicate': 'A folder with this name already exists here',

  'drag.hint': 'To move with the keyboard, open the row context menu.',
  'drag.start': 'Dragging started',
  'drag.startMany': 'Dragging {count} items started',
  'drag.end': 'Dragging finished',
  'drag.cancel': 'Dragging cancelled',
  'drag.failed': 'Could not move. Refresh the bookmarks and try again',
  'drag.partial': 'Moved {moved} of {total}; some items could not be moved',
  'drag.moved': '“{source}” moved into “{target}”',
  'drag.movedBefore': '“{source}” moved before “{target}”',
  'drag.movedMany': 'Moved {count} {noun} into “{target}”',
  'drag.movedManyBefore': 'Moved {count} {noun} before “{target}”',
  'drag.movedSome': 'Moved {moved} of {total} {noun} into “{target}”',
  'drag.movedSomeBefore': 'Moved {moved} of {total} {noun} before “{target}”',

  'item.noun': {
    one: 'item',
    other: 'items',
  },

  'options.title': 'Settings',
  'options.section': 'Extension settings',
  'options.language': 'Language',
  'options.locale.ru': 'Russian',
  'options.locale.en': 'English',
  'options.theme': 'Theme',
  'options.theme.system': 'System',
  'options.theme.dark': 'Dark',
  'options.theme.light': 'Light',
  'options.localNote': 'All data stays local in your browser.',

  'popup.openManager': 'Open explorer',
};
