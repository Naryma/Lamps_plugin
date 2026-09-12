 (function () {
  'use strict';

  if (window.local_lists_plugin_ready) return;
  window.local_lists_plugin_ready = true;

  var STORAGE_KEY = 'local_lists_data';
  var GIST_TOKEN_KEY = 'local_lists_github_token';
  var GIST_ID_KEY = 'local_lists_gist_id';
  var TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  // ── Іконки SVG ────────────────────────────────────────────────────────
  var ICON_SETTINGS = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  var ICON_STAR_SVG = '<svg width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://w3.org"><path d="M15.6162 7.10981L15.8464 7.55198L16.3381 7.63428L22.2841 8.62965C22.8678 8.72736 23.0999 9.44167 22.6851 9.86381L18.4598 14.1641L18.1104 14.5196L18.184 15.0127L19.0748 20.9752C19.1622 21.5606 18.5546 22.002 18.025 21.738L12.6295 19.0483L12.1833 18.8259L11.7372 19.0483L6.34171 21.738C5.81206 22.002 5.20443 21.5606 5.29187 20.9752L6.18264 15.0127L6.25629 14.5196L5.9069 14.1641L1.68155 9.86381C1.26677 9.44167 1.49886 8.72736 2.08255 8.62965L8.02855 7.63428L8.52022 7.55198L8.75043 7.10981L11.5345 1.76241C11.8078 1.23748 12.5589 1.23748 12.8322 1.76241L15.6162 7.10981Z" stroke="currentColor" stroke-width="2.2"></path></svg>';
  var ICON_UP = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
  var ICON_DOWN = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
  var ICON_CHECKED = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect><polyline points="7 12 11 16 17 8"></polyline></svg>';
  var ICON_UNCHECKED = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" ry="3" opacity="0.4"></rect></svg>';

  function addLang() {
    if (!Lampa.Lang || !Lampa.Lang.add) return;
    Lampa.Lang.add({
      settings_local_lists_settings: { uk: 'Налаштування списків', ru: 'Настройки списков', en: 'Lists Settings' },
      local_lists_title: { uk: 'Мої списки', ru: 'Мои списки', en: 'My Lists' },
      local_lists_button: { uk: 'Списки', ru: 'Списки', en: 'Lists' },
      local_lists_settings: { uk: 'Налаштування списків', ru: 'Настройки списков', en: 'Lists Settings' },
      local_lists_github_auth: { uk: 'GitHub Token', ru: 'GitHub Token', en: 'GitHub Token' },
      local_lists_no_token: { uk: 'Спочатку потрібна авторизація (вкажіть GitHub Token)', ru: 'Сначала требуется авторизация (укажите GitHub Token)', en: 'Authorization required first' },
      local_lists_cloud_backup: { uk: 'Синхронізувати з хмарою', ru: 'Синхронизировать с облаком', en: 'Sync with Cloud' },
      local_lists_cloud_overwrite: { uk: 'Перезаписати списки в хмарі', ru: 'Перезаписать списки в облаке', en: 'Overwrite lists in Cloud' },
      local_lists_cloud_overwrite_confirm: { uk: 'Перезаписати хмару поточними списками?', ru: 'Перезаписать облако текущими списками?', en: 'Overwrite cloud?' },
      local_lists_cloud_overwritten: { uk: 'Дані в хмарі успішно перезаписано', ru: 'Данные в облаке успешно перезаписаны', en: 'Cloud data overwritten' },
      local_lists_cloud_restore: { uk: 'Відновити з хмари', ru: 'Восстановить из облака', en: 'Restore from Cloud' },
      local_lists_cloud_restore_confirm: { uk: 'Замінити локальні списки даними з хмари?', ru: 'Заменить локальные списки данными из облака?', en: 'Replace local lists?' },
      local_lists_cloud_restored: { uk: 'Дані з хмари успішно відновлено', ru: 'Данные из облака успешно восстановлены', en: 'Data restored from cloud' },
      local_lists_create: { uk: 'Створити список', ru: 'Создать список', en: 'Create list' },
      local_lists_new_name: { uk: 'Назва списку', ru: 'Название списка', en: 'List name' },
      local_lists_added: { uk: 'Додано', ru: 'Добавлено', en: 'Added' },
      local_lists_removed: { uk: 'Вилучено', ru: 'Удалено', en: 'Removed' },
      local_lists_remove_item: { uk: 'Вилучити список', ru: 'Удалить список', en: 'Remove list' },
      local_lists_remove_card: { uk: 'Вилучити фільм', ru: 'Удалить фильм', en: 'Remove movie' },
      local_lists_import_trakt: { uk: 'Імпорт з Trakt.tv', ru: 'Импорт с Trakt.tv', en: 'Import from Trakt.tv' },
      local_lists_import_pick_file: { uk: 'Оберіть ZIP-архів експорту Trakt.tv', ru: 'Выберите ZIP-архив экспорта Trakt.tv', en: 'Select Trakt ZIP' },
      local_lists_import_reading: { uk: 'Читаю архів…', ru: 'Читаю архив…', en: 'Reading archive…' },
      local_lists_import_progress: { uk: 'Імпортую списки…', ru: 'Импортирую списки…', en: 'Importing lists…' },
      local_lists_import_done: { uk: 'Імпорт завершено', ru: 'Импорт завершён', en: 'Import complete' },
      local_lists_import_error: { uk: 'Не вдалося прочитати архів', ru: 'Не удалось прочитать архив', en: 'Failed to read archive' },
      local_lists_import_no_lists: { uk: 'У архіві не знайдено файл lists-lists.json', ru: 'В архиве не найден файл lists-lists.json', en: 'lists-lists.json not found' },
      local_lists_edit_menu: { uk: 'Редагувати списки', ru: 'Редактировать списки', en: 'Edit Lists' }
    });
  }

  function tr(key) { return (Lampa.Lang && Lampa.Lang.translate) ? Lampa.Lang.translate(key) : key; }

  function escapeHtml(str) {
    return (str == null ? '' : String(str))
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isPerson(data) {
    return !!data && !!(data.profile_path || data.known_for_department || typeof data.gender !== 'undefined');
  }

  function resolvePoster(path) {
    if (!path) return './img/img_broken.svg';
    if (path.indexOf('http') === 0) return path;
    return 'https://tmdb.org' + path;
  }

  function normalizeCard(raw) {
    var source = raw.movie || raw.card || raw.data || raw || {};
    var poster = source.poster_path || source.img || '';
    return {
      id: source.id,
      method: source.method || (source.first_air_date ? 'tv' : 'movie'),
      title: source.title || source.name || '',
      poster_path: poster,
      img: resolvePoster(poster),
      release_date: source.release_date || source.first_air_date || ''
    };
  }

  var Lists = {
    getAll: function () { return Lampa.Storage.get(STORAGE_KEY, []); },
    getVisible: function () {
      return this.getAll().filter(function (l) { return !l.hidden; });
    },
    save: function (l) { Lampa.Storage.set(STORAGE_KEY, l); },
    get: function (id) {
      var all = this.getAll();
      for (var i = 0; i < all.length; i++) {
        if (all[i].id === id) return all[i];
      }
      return null;
    },
    create: function (name) {
      var l = this.getAll();
      var newList = { id: 'list_' + Date.now(), name: name, hidden: false, items: [] };
      l.push(newList); this.save(l); return newList;
    },
    remove: function (id) { 
      this.save(this.getAll().filter(function(l){ return l.id !== id; })); 
    },
    addItem: function (listId, card) {
      if (!card || card.id == null) return;
      var l = this.getAll();
      var list = null;
      for (var i = 0; i < l.length; i++) {
        if (l[i].id === listId) { list = l[i]; break; }
      }
      if (!list) return;
      var n = normalizeCard(card);
      var cardIdStr = String(n.id);
      if (list.items.some(function(item){ return String(item.id) === cardIdStr; })) return;
      list.items.push(n); 
      this.save(l);
    },
    removeItem: function (listId, itemId) {
      if (itemId == null) return;
      var l = this.getAll();
      var list = null;
      for (var i = 0; i < l.length; i++) {
        if (l[i].id === listId) { list = l[i]; break; }
      }
      if (!list) return;
      var itemIdStr = String(itemId);
      list.items = list.items.filter(function(item){ return String(item.id) !== itemIdStr; });
      this.save(l);
    },
    isCardInAny: function (id) {
      if (id == null) return false;
      var idStr = String(id);
      var all = this.getAll();
      for (var i = 0; i < all.length; i++) {
        if (all[i].items && all[i].items.some(function (it) { return String(it.id) === idStr; })) {
          return true;
        }
      }
      return false;
    }
  };

  function refreshCardIcon(object) {
    if (!object || !object.card || !object.data || isPerson(object.data)) return;
    var $iconHolder = $('.card__icons-inner', object.card);
    if (!$iconHolder.length) return;

    var id = object.data.id;
    var inList = Lists.isCardInAny(id);

