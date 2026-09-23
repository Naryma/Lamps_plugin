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
  var ICON_KEY = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  var ICON_CLOUD_UP = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M12 13v6"/><path d="m15 16-3-3-3 3"/></svg>';
  var ICON_CLOUD_OVERWRITE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  var ICON_CLOUD_DOWN = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M12 19v-6"/><path d="m9 16 3 3 3-3"/></svg>';
  var ICON_IMPORT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
  var ICON_STAR_SVG = '<svg width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.6162 7.10981L15.8464 7.55198L16.3381 7.63428L22.2841 8.62965C22.8678 8.72736 23.0999 9.44167 22.6851 9.86381L18.4598 14.1641L18.1104 14.5196L18.184 15.0127L19.0748 20.9752C19.1622 21.5606 18.5546 22.002 18.025 21.738L12.6295 19.0483L12.1833 18.8259L11.7372 19.0483L6.34171 21.738C5.81206 22.002 5.20443 21.5606 5.29187 20.9752L6.18264 15.0127L6.25629 14.5196L5.9069 14.1641L1.68155 9.86381C1.26677 9.44167 1.49886 8.72736 2.08255 8.62965L8.02855 7.63428L8.52022 7.55198L8.75043 7.10981L11.5345 1.76241C11.8078 1.23748 12.5589 1.23748 12.8322 1.76241L15.6162 7.10981Z" stroke="currentColor" stroke-width="2.2"></path></svg>';
  
  var ICON_EDIT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
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
      local_lists_no_token: { 
        uk: 'Спочатку потрібна авторизація (вкажіть GitHub Token)', 
        ru: 'Сначала требуется авторизация (укажите GitHub Token)', 
        en: 'Authorization required first (specify GitHub Token)' 
      },
      local_lists_cloud_backup: { uk: 'Синхронізувати з хмарою (списки + вибране)', ru: 'Синхронизировать с облаком (списки + избранное)', en: 'Sync with Cloud (lists + favorites)' },
      local_lists_cloud_overwrite: { uk: 'Перезаписати списки в хмарі', ru: 'Перезаписать списки в облаке', en: 'Overwrite lists in Cloud' },
      local_lists_cloud_overwrite_confirm: { uk: 'Перезаписати хмару поточними списками?', ru: 'Перезаписать облако текущими списками?', en: 'Overwrite cloud with current lists?' },
      local_lists_cloud_overwritten: { uk: 'Дані в хмарі успішно перезаписано', ru: 'Данные в облаке успешно перезаписаны', en: 'Cloud data successfully overwritten' },
      local_lists_cloud_restore: { uk: 'Відновити з хмари', ru: 'Восстановить из облака', en: 'Restore from Cloud' },
      local_lists_cloud_restore_confirm: { uk: 'Замінити локальні списки даними з хмари?', ru: 'Заменить локальные списки данными из облака?', en: 'Replace local lists with cloud data?' },
      local_lists_cloud_restored: { uk: 'Дані з хмари успішно відновлено', ru: 'Данные из облака успешно восстановлены', en: 'Data successfully restored from cloud' },
      local_lists_synced: { uk: 'Успішно синхронізовано', ru: 'Успешно синхронизировано', en: 'Successfully synchronized' },
      local_lists_create: { uk: 'Створити список', ru: 'Создать список', en: 'Create list' },
      local_lists_new_name: { uk: 'Назва списку', ru: 'Название списка', en: 'List name' },
      local_lists_added: { uk: 'Додано', ru: 'Добавлено', en: 'Added' },
      local_lists_removed: { uk: 'Вилучено', ru: 'Удалено', en: 'Removed' },
      local_lists_remove_item: { uk: 'Вилучити список', ru: 'Удалить список', en: 'Remove list' },
      local_lists_remove_card: { uk: 'Вилучити фільм', ru: 'Удалить фильм', en: 'Remove movie' },
      local_lists_import_trakt: { uk: 'Імпорт з Trakt.tv', ru: 'Импорт с Trakt.tv', en: 'Import from Trakt.tv' },
      local_lists_import_pick_file: { uk: 'Оберіть ZIP-архів експорту Trakt.tv', ru: 'Выберите ZIP-архив экспорта Trakt.tv', en: 'Select Trakt.tv export ZIP' },
      local_lists_import_reading: { uk: 'Читаю архів…', ru: 'Читаю архив…', en: 'Reading archive…' },
      local_lists_import_progress: { uk: 'Імпортую списки…', ru: 'Импортирую списки…', en: 'Importing lists…' },
      local_lists_import_done: { uk: 'Імпорт завершено', ru: 'Импорт завершён', en: 'Import complete' },
      local_lists_import_error: { uk: 'Не вдалося прочитати архів', ru: 'Не удалось прочитать архив', en: 'Failed to read archive' },
      local_lists_import_no_lists: { uk: 'У архіві не знайдено файл lists-lists.json', ru: 'В архиве не найден файл lists-lists.json', en: 'lists-lists.json not found in archive' },
      local_lists_edit_menu: { uk: 'Редагувати списки', ru: 'Редактировать списки', en: 'Edit Lists' },
      local_lists_edit_title: { uk: 'Управління списками', ru: 'Управление списками', en: 'Manage Lists' },
      local_lists_empty: { uk: 'Списків поки немає', ru: 'Списков пока нет', en: 'No lists yet' }
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
    return 'https://image.tmdb.org/t/p/w300' + path;
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
    get: function (id) { return this.getAll().filter(function(l){ return l.id === id; })[0]; },
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
      var list = l.filter(function(i){ return i.id === listId; })[0];
      if (!list) return;
      var n = normalizeCard(card);
      if (list.items.some(function(i){ return String(i.id) === String(n.id); })) return;
      list.items.push(n); 
      this.save(l);
    },
    removeItem: function (listId, itemId) {
      if (itemId == null) return;
      var l = this.getAll();
      var list = l.filter(function(i){ return i.id === listId; })[0];
      if (!list) return;
      list.items = list.items.filter(function(i){ return String(i.id) !== String(itemId); });
      this.save(l);
    },
    isCardInAny: function (id) {
      if (id == null) return false;
      var all = this.getAll();
      for (var i = 0; i < all.length; i++) {
        if (all[i].items && all[i].items.some(function (it) { return String(it.id) === String(id); })) {
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

    var $starIcon = $('.icon--star', $iconHolder);
    var hasIcon = $starIcon.length !== 0;
    var hasHiddenIcon = hasIcon && $starIcon.hasClass('hide');

    if (inList) {
      if (!hasIcon) {
        $iconHolder.prepend(Lampa.Template.get('local-lists-star-icon'));
      } else if (hasHiddenIcon) {
        $starIcon.removeClass('hide');
      }
    } else {
      if (hasIcon && !hasHiddenIcon) {
        $starIcon.addClass('hide');
      }
    }
  }

  function getActiveCard() {
    var active = Lampa.Activity.active();
    if (active) {
      if (active.card) return active.card;
      if (active.activity && active.activity.card) return active.activity.card;
    }
    return null;
  }

  function refreshBookmarkIcon() {
    var card = getActiveCard();
    if (!card) return;

    var inList = Lists.isCardInAny(card.id);
    var favStates = inList ? {} : (Lampa.Favorite ? Lampa.Favorite.check(card) : {});
    var anyFavorite = inList || Object.keys(favStates).filter(function (favType) {
      return favType !== 'history' && favType !== 'any';
    }).some(function (favType) {
      return !!favStates[favType];
    });

    var active = Lampa.Activity.active();
    if (active && active.activity) {
      var $svg = $(".button--book svg path", active.activity.render());
      if (anyFavorite) {
        $svg.attr('fill', 'currentColor');
      } else {
        $svg.attr('fill', 'transparent');
      }
    }
  }

  // ── Smart Merge (збереження hidden під час синхронізації) ───────────
  function mergeCardItems(localItems, remoteItems) {
    localItems = Array.isArray(localItems) ? localItems : [];
    remoteItems = Array.isArray(remoteItems) ? remoteItems : [];
    var map = {};
    var res = [];

    remoteItems.concat(localItems).forEach(function (item) {
      if (!item || item.id == null) return;
      var key = String(item.id);
      if (!map[key]) {
        map[key] = Object.assign({}, item);
        res.push(map[key]);
      } else {
        Object.assign(map[key], item);
      }
    });

    return res;
  }

  function mergeLists(localLists, remoteLists) {
    localLists = Array.isArray(localLists) ? localLists : [];
    remoteLists = Array.isArray(remoteLists) ? remoteLists : [];
    var result = [];
    var matchedRemoteIndices = {};

    localLists.forEach(function (locList) {
      var rIndex = -1;
      for (var i = 0; i < remoteLists.length; i++) {
        if (matchedRemoteIndices[i]) continue;
        var r = remoteLists[i];
        if (r.id === locList.id || (r.name && locList.name && r.name.trim().toLowerCase() === locList.name.trim().toLowerCase())) {
          rIndex = i;
          break;
        }
      }

      if (rIndex !== -1) {
        matchedRemoteIndices[rIndex] = true;
        var remList = remoteLists[rIndex];
        result.push({
          id: locList.id || remList.id,
          name: locList.name || remList.name,
          hidden: locList.hidden !== undefined ? locList.hidden : (remList.hidden || false),
          items: mergeCardItems(locList.items, remList.items)
        });
      } else {
        result.push(locList);
      }
    });

    remoteLists.forEach(function (remList, idx) {
      if (!matchedRemoteIndices[idx]) {
        result.push(remList);
      }
    });

    return result;
  }

  function mergeFavorites(localFav, remoteFav) {
    localFav = (localFav && typeof localFav === 'object') ? localFav : {};
    remoteFav = (remoteFav && typeof remoteFav === 'object') ? remoteFav : {};

    var merged = {};
    var allKeys = Object.keys(localFav).concat(Object.keys(remoteFav));

    allKeys.forEach(function (key) {
      if (merged[key]) return;
      var lVal = localFav[key];
      var rVal = remoteFav[key];

      if (Array.isArray(lVal) || Array.isArray(rVal)) {
        var arrL = Array.isArray(lVal) ? lVal : [];
        var arrR = Array.isArray(rVal) ? rVal : [];
        var map = {};
        var list = [];

        arrR.concat(arrL).forEach(function (item) {
          if (!item) return;
          var idKey = (typeof item === 'object') ? (item.id || JSON.stringify(item)) : String(item);
          if (!map[idKey]) {
            map[idKey] = true;
            list.push(item);
          }
        });
        merged[key] = list;
      } else if (typeof lVal === 'object' && typeof rVal === 'object' && lVal && rVal) {
        merged[key] = Object.assign({}, rVal, lVal);
      } else {
        merged[key] = lVal !== undefined ? lVal : rVal;
      }
    });

    return merged;
  }

  // ── GitHub Cloud ───────────────────────────────────────────────────────
  var Cloud = {
    checkAuth: function () {
      var token = (Lampa.Storage.get(GIST_TOKEN_KEY, '') || '').trim();
      if (!token) {
        Lampa.Noty.show(tr('local_lists_no_token'));
        return false;
      }
      return token;
    },

    request: function (method, url, data, callback, errorCallback) {
      var token = this.checkAuth();
      if (!token) {
        Lampa.Loading.stop();
        return;
      }

      $.ajax({
        url: url,
        method: method,
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github.v3+json'
        },
        data: data ? JSON.stringify(data) : null,
        success: callback,
        error: function (xhr) {
          if (errorCallback) {
            errorCallback(xhr);
          } else {
            Lampa.Loading.stop();
            Lampa.Noty.show('GitHub Error (' + (xhr ? xhr.status : 'unknown') + ')');
          }
        }
      });
    },

    getGist: function (callback) {
      var _this = this;
      var id = Lampa.Storage.get(GIST_ID_KEY, '');

      if (id) {
        this.request('GET', 'https://api.github.com/gists/' + id, null, function (res) {
          callback(res);
        }, function (xhr) {
          if (xhr && xhr.status === 404) {
            Lampa.Storage.set(GIST_ID_KEY, '');
            _this.findGist(callback);
          } else {
            Lampa.Loading.stop();
            Lampa.Noty.show('GitHub Error');
          }
        });
      } else {
        this.findGist(callback);
      }
    },

    findGist: function (callback) {
      var _this = this;
      this.request('GET', 'https://api.github.com/gists?per_page=100', null, function (res) {
        if (Array.isArray(res)) {
          var found = res.filter(function (g) {
            return g.files && (g.files['lampa_local_lists.json'] || g.files['lampa_native_favorite.json']);
          })[0];
          if (found) {
            Lampa.Storage.set(GIST_ID_KEY, found.id);
            _this.request('GET', 'https://api.github.com/gists/' + found.id, null, callback);
            return;
          }
        }
        callback(null);
      });
    },

    backup: function () {
      if (!this.checkAuth()) return;

      var _this = this;
      Lampa.Loading.start();

      this.getGist(function (gist) {
        var remoteLists = [];
        var remoteFav = {};

        if (gist && gist.files) {
          if (gist.files['lampa_local_lists.json']) {
            try { remoteLists = JSON.parse(gist.files['lampa_local_lists.json'].content); } catch (e) {}
          }
          if (gist.files['lampa_native_favorite.json']) {
            try { remoteFav = JSON.parse(gist.files['lampa_native_favorite.json'].content); } catch (e) {}
          }
        }

        var mergedLists = mergeLists(Lists.getAll(), remoteLists);
        var mergedFav = mergeFavorites(Lampa.Storage.get('favorite', {}), remoteFav);

        Lists.save(mergedLists);
        Lampa.Storage.set('favorite', mergedFav);

        var data = {
          description: 'Lampa Local Lists & Favorites Sync',
          files: {
            'lampa_local_lists.json': { content: JSON.stringify(mergedLists, null, 2) },
            'lampa_native_favorite.json': { content: JSON.stringify(mergedFav, null, 2) }
          }
        };

        var gistId = gist ? gist.id : Lampa.Storage.get(GIST_ID_KEY, '');

        _this.request(
          gistId ? 'PATCH' : 'POST',
          gistId ? 'https://api.github.com/gists/' + gistId : 'https://api.github.com/gists',
          data,
          function (res) {
            if (res && res.id) Lampa.Storage.set(GIST_ID_KEY, res.id);
            Lampa.Loading.stop();
            Lampa.Noty.show(tr('local_lists_synced'));
          }
        );
      });
    },

    overwrite: function () {
      if (!this.checkAuth()) return;

      var _this = this;
      Lampa.Modal.open({
        title: tr('local_lists_cloud_overwrite'),
        html: $('<div>' + tr('local_lists_cloud_overwrite_confirm') + '</div>'),
        size: 'small',
        buttons: [
          {
            name: 'Так',
            select: function () {
              Lampa.Modal.close();
              Lampa.Loading.start();

              var currentLists = Lists.getAll();
              var currentFav = Lampa.Storage.get('favorite', {});

              var data = {
                description: 'Lampa Local Lists & Favorites Sync',
                files: {
                  'lampa_local_lists.json': { content: JSON.stringify(currentLists, null, 2) },
                  'lampa_native_favorite.json': { content: JSON.stringify(currentFav, null, 2) }
                }
              };

              var gistId = Lampa.Storage.get(GIST_ID_KEY, '');

              _this.request(
                gistId ? 'PATCH' : 'POST',
                gistId ? 'https://api.github.com/gists/' + gistId : 'https://api.github.com/gists',
                data,
                function (res) {
                  if (res && res.id) Lampa.Storage.set(GIST_ID_KEY, res.id);
                  Lampa.Loading.stop();
                  Lampa.Noty.show(tr('local_lists_cloud_overwritten'));
                }
              );
            }
          },
          {
            name: 'Ні',
            select: function () { Lampa.Modal.close(); }
          }
        ]
      });
    },

    restore: function () {
      if (!this.checkAuth()) return;

      var _this = this;
      Lampa.Modal.open({
        title: tr('local_lists_cloud_restore'),
        html: $('<div>' + tr('local_lists_cloud_restore_confirm') + '</div>'),
        size: 'small',
        buttons: [
          {
            name: 'Так',
            select: function () {
              Lampa.Modal.close();
              Lampa.Loading.start();

              _this.getGist(function (gist) {
                if (gist && gist.files) {
                  if (gist.files['lampa_local_lists.json']) {
                    try {
                      var remoteLists = JSON.parse(gist.files['lampa_local_lists.json'].content);
                      Lists.save(remoteLists);
                    } catch (e) {}
                  }
                  if (gist.files['lampa_native_favorite.json']) {
                    try {
                      var remoteFav = JSON.parse(gist.files['lampa_native_favorite.json'].content);
                      Lampa.Storage.set('favorite', remoteFav);
                    } catch (e) {}
                  }
                }
                Lampa.Loading.stop();
                Lampa.Noty.show(tr('local_lists_cloud_restored'));
              });
            }
          },
          {
            name: 'Ні',
            select: function () { Lampa.Modal.close(); }
          }
        ]
      });
    }
  };

  // ── Модальне вікно управління списками (Manage Lists) ───────────────
  function openManageListsModal() {
    function render() {
      var lists = Lists.getAll();
      var $wrap = $('<div class="local-lists-manage"></div>');

      if (!lists.length) {
        $wrap.append('<div class="local-lists-empty" style="padding: 1em; text-align: center;">' + tr('local_lists_empty') + '</div>');
      } else {
        lists.forEach(function (list, index) {
          var $row = $(
            '<div class="selector local-lists-manage__item" style="display:flex; align-items:center; justify-content:space-between; padding:0.8em; margin-bottom:0.4em; background:rgba(255,255,255,0.05); border-radius:0.5em;">' +
              '<div class="local-lists-manage__title" style="flex-grow:1; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + escapeHtml(list.name) + '</div>' +
              '<div class="local-lists-manage__actions" style="display:flex; gap:0.5em; align-items:center;">' +
                '<div class="selector local-lists-btn--toggle" style="padding:0.3em; cursor:pointer;" title="Hide/Show">' + (list.hidden ? ICON_UNCHECKED : ICON_CHECKED) + '</div>' +
                '<div class="selector local-lists-btn--up" style="padding:0.3em; cursor:pointer;" title="Up">' + ICON_UP + '</div>' +
                '<div class="selector local-lists-btn--down" style="padding:0.3em; cursor:pointer;" title="Down">' + ICON_DOWN + '</div>' +
                '<div class="selector local-lists-btn--edit" style="padding:0.3em; cursor:pointer;" title="Rename">' + ICON_EDIT + '</div>' +
                '<div class="selector local-lists-btn--delete" style="padding:0.3em; cursor:pointer; color:#ff5252;" title="Delete">&times;</div>' +
              '</div>' +
            '</div>'
          );

          $row.find('.local-lists-btn--toggle').on('hover:enter', function () {
            list.hidden = !list.hidden;
            Lists.save(lists);
            refreshModal();
          });

          $row.find('.local-lists-btn--up').on('hover:enter', function () {
            if (index > 0) {
              var tmp = lists[index];
              lists[index] = lists[index - 1];
              lists[index - 1] = tmp;
              Lists.save(lists);
              refreshModal();
            }
          });

          $row.find('.local-lists-btn--down').on('hover:enter', function () {
            if (index < lists.length - 1) {
              var tmp = lists[index];
              lists[index] = lists[index + 1];
              lists[index + 1] = tmp;
              Lists.save(lists);
              refreshModal();
            }
          });

          $row.find('.local-lists-btn--edit').on('hover:enter', function () {
            Lampa.Input.edit({
              title: tr('local_lists_new_name'),
              value: list.name,
              free: true
            }, function (newName) {
              if (newName && newName.trim()) {
                list.name = newName.trim();
                Lists.save(lists);
                refreshModal();
              }
            });
          });

          $row.find('.local-lists-btn--delete').on('hover:enter', function () {
            Lists.remove(list.id);
            refreshModal();
          });

          $wrap.append($row);
        });
      }

      return $wrap;
    }

    function refreshModal() {
      var $newContent = render();
      $('.local-lists-manage').replaceWith($newContent);
      Lampa.Controller.toggle('modal');
    }

    Lampa.Modal.open({
      title: tr('local_lists_edit_title'),
      html: render(),
      size: 'medium',
      onBack: function () {
        Lampa.Modal.close();
        Lampa.Controller.toggle('content');
      }
    });
  }

  // ── Імпорт з Trakt.tv ────────────────────────────────────────────────
  function loadJSZip(callback) {
    if (window.JSZip) {
      callback();
      return;
    }
    Lampa.Loading.start();
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js')
      .done(function () {
        Lampa.Loading.stop();
        callback();
      })
      .fail(function () {
        Lampa.Loading.stop();
        Lampa.Noty.show(tr('local_lists_import_error'));
      });
  }

  function startTraktImport() {
    loadJSZip(function () {
      var $input = $('<input type="file" accept=".zip" style="display:none;">');
      $('body').append($input);

      $input.on('change', function (e) {
        var file = e.target.files[0];
        $input.remove();
        if (!file) return;

        Lampa.Loading.start();
        Lampa.Noty.show(tr('local_lists_import_reading'));

        var jszip = new window.JSZip();
        jszip.loadAsync(file).then(function (zip) {
          var listsFile = zip.file('lists-lists.json') || zip.file(/lists-lists\.json$/i)[0];
          var itemsFile = zip.file('lists-items.json') || zip.file(/lists-items\.json$/i)[0];

          if (!listsFile) {
            Lampa.Loading.stop();
            Lampa.Noty.show(tr('local_lists_import_no_lists'));
            return;
          }

          Promise.all([
            listsFile.async('text'),
            itemsFile ? itemsFile.async('text') : Promise.resolve('[]')
          ]).then(function (results) {
            try {
              var rawLists = JSON.parse(results[0]);
              var rawItems = JSON.parse(results[1]);

              Lampa.Noty.show(tr('local_lists_import_progress'));
              processTraktData(rawLists, rawItems);
            } catch (err) {
              Lampa.Loading.stop();
              Lampa.Noty.show(tr('local_lists_import_error'));
            }
          });
        }).catch(function () {
          Lampa.Loading.stop();
          Lampa.Noty.show(tr('local_lists_import_error'));
        });
      });

      $input.trigger('click');
    });
  }

  function processTraktData(rawLists, rawItems) {
    var createdMap = {};

    rawLists.forEach(function (l) {
      var listName = l.name || l.title || 'Trakt List';
      var newList = Lists.create(listName);
      createdMap[l.slug || l.id || listName] = newList.id;
    });

    var tasks = [];

    rawItems.forEach(function (item) {
      var listSlug = item.list_slug || (item.list ? item.list.slug : null);
      var listId = createdMap[listSlug] || (Object.keys(createdMap).length ? createdMap[Object.keys(createdMap)[0]] : null);
      if (!listId) return;

      var type = item.type || (item.movie ? 'movie' : (item.show ? 'tv' : 'movie'));
      var media = item[type] || item.movie || item.show;
      if (!media) return;

      var tmdbId = media.ids ? media.ids.tmdb : null;
      if (tmdbId) {
        tasks.push({ listId: listId, tmdbId: tmdbId, type: type, title: media.title, year: media.year });
      }
    });

    var current = 0;
    function fetchNext() {
      if (current >= tasks.length) {
        Lampa.Loading.stop();
        Lampa.Noty.show(tr('local_lists_import_done'));
        return;
      }

      var task = tasks[current];
      current++;

      var tmdbUrl = 'https://api.themoviedb.org/3/' + task.type + '/' + task.tmdbId + '?api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.get('language', 'uk');

      $.ajax({
        url: tmdbUrl,
        method: 'GET',
        success: function (res) {
          res.method = task.type;
          Lists.addItem(task.listId, res);
          setTimeout(fetchNext, 150);
        },
        error: function () {
          Lists.addItem(task.listId, {
            id: task.tmdbId,
            method: task.type,
            title: task.title || 'Movie ' + task.tmdbId,
            release_date: task.year ? String(task.year) : ''
          });
          setTimeout(fetchNext, 100);
        }
      });
    }

    fetchNext();
  }

  // ── Випливаюче меню додання у список ───────────
  function showAddToListMenu(card) {
    var lists = Lists.getAll();
    var items = [];

    items.push({
      title: tr('local_lists_create'),
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      action: 'create'
    });

    lists.forEach(function (list) {
      var inThis = list.items && list.items.some(function (i) { return String(i.id) === String(card.id); });
      items.push({
        title: (inThis ? '✓ ' : '') + list.name,
        listId: list.id,
        inThis: inThis,
        action: 'toggle'
      });
    });

    Lampa.Select.show({
      title: tr('local_lists_button'),
      items: items,
      onSelect: function (a) {
        if (a.action === 'create') {
          Lampa.Input.edit({
            title: tr('local_lists_new_name'),
            value: '',
            free: true
          }, function (name) {
            if (name && name.trim()) {
              var newList = Lists.create(name.trim());
              Lists.addItem(newList.id, card);
              Lampa.Noty.show(tr('local_lists_added'));
              refreshBookmarkIcon();
            }
          });
        } else if (a.action === 'toggle') {
          if (a.inThis) {
            Lists.removeItem(a.listId, card.id);
            Lampa.Noty.show(tr('local_lists_removed'));
          } else {
            Lists.addItem(a.listId, card);
            Lampa.Noty.show(tr('local_lists_added'));
          }
          refreshBookmarkIcon();
        }
      },
      onBack: function () {
        Lampa.Controller.toggle('content');
      }
    });
  }

  // ── Інтеграція кнопки в картку фільму ──────────────────────────────────
  function injectCardButton() {
    Lampa.Listener.follow('full', function (e) {
      if (e.type === 'complite') {
        var render = e.object.activity.render();
        var card = e.data.movie || e.object.card;
        if (!card || isPerson(card)) return;

        var $buttons = render.find('.full-start-new__buttons, .full-start__buttons');
        if ($buttons.length && !$buttons.find('.button--local-lists').length) {
          var $btn = $(
            '<div class="full-start__button selector button--local-lists">' +
              '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>' +
              '<span>' + tr('local_lists_button') + '</span>' +
            '</div>'
          );

          $btn.on('hover:enter', function () {
            showAddToListMenu(card);
          });

          $buttons.append($btn);
        }
        refreshBookmarkIcon();
      }
    });
  }

  // ── Шаблон для зірочки у списку каток ─────────────────────────────────
  function registerTemplate() {
    Lampa.Template.add('local-lists-star-icon', '<div class="card__icon icon--star" style="color:#ffd700;">' + ICON_STAR_SVG + '</div>');
  }

  function injectCardIcons() {
    Lampa.Listener.follow('card', function (e) {
      if (e.type === 'build') {
        refreshCardIcon(e.object);
      }
    });
  }

  // ── Власний компонент відображення списків у Lampa ────────────────────
  function Component(object) {
    var comp = this;
    var scroll = new Lampa.Scroll({ mask: true, over: true });
    var files = new Lampa.Files();
    var last;

    this.create = function () {
      this.activity.loader = false;

      var lists = Lists.getVisible();
      if (!lists.length) {
        var empty = new Lampa.Empty({ title: tr('local_lists_empty') });
        scroll.append(empty.render());
      } else {
        lists.forEach(function (list) {
          if (!list.items || !list.items.length) return;

          var line = new Lampa.Line({
            title: list.name,
            type: 'cards',
            noswap: true
          });

          line.onItem = function (item) {
            Lampa.Activity.push({
              url: item.data.method + '/' + item.data.id,
              component: 'full',
              id: item.data.id,
              method: item.data.method,
              card: item.data
            });
          };

          var lineRender = line.render();
          scroll.append(lineRender);

          list.items.forEach(function (item) {
            var card = new Lampa.Card(item, { card_small: true });
            card.build();
            line.append(card.render());
          });
        });
      }

      return scroll.render();
    };

    this.start = function () {
      Lampa.Controller.add('content', {
        toggle: function () {
          Lampa.Controller.collectionSet(scroll.render());
          Lampa.Controller.collectionFocus(last || false, scroll.render());
        },
        left: function () { Lampa.Controller.toggle('menu'); },
        up: function () { Lampa.Navigator.move('up'); },
        down: function () { Lampa.Navigator.move('down'); },
        back: function () { Lampa.Activity.backward(); }
      });

      Lampa.Controller.toggle('content');
    };

    this.pause = function () {};
    this.stop = function () {};
    this.destroy = function () {
      scroll.destroy();
    };
  }

  // ── Головне меню та Налаштування ──────────────────────────────────────
  function injectMenu() {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') {
        var menu = Lampa.Menu.get();
        if (menu) {
          menu.push({
            title: tr('local_lists_title'),
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
            component: 'local_lists',
            page: 'local_lists'
          });
        }
      }
    });

    Lampa.Component.add('local_lists', Component);
  }

  function injectSettings() {
    Lampa.SettingsMain.add();

    Lampa.Listener.follow('settings', function (e) {
      if (e.type === 'open' && e.name === 'main') {
        var $body = e.body;
        var $btn = $(
          '<div class="settings-folder selector" data-component="local_lists_settings">' +
            '<div class="settings-folder__icon">' + ICON_SETTINGS + '</div>' +
            '<div class="settings-folder__name">' + tr('local_lists_settings') + '</div>' +
          '</div>'
        );

        $btn.on('hover:enter', function () {
          openSettingsPage();
        });

        $body.find('.settings-folders').append($btn);
      }
    });
  }

  function openSettingsPage() {
    var html = $('<div class="settings-list"></div>');

    // GitHub Token
    var $token = $(
      '<div class="settings-param selector" data-type="input">' +
        '<div class="settings-param__name">' + tr('local_lists_github_auth') + '</div>' +
        '<div class="settings-param__value">' + (Lampa.Storage.get(GIST_TOKEN_KEY, '') ? '••••••••' : 'Не вказано') + '</div>' +
      '</div>'
    );
    $token.on('hover:enter', function () {
      Lampa.Input.edit({
        title: tr('local_lists_github_auth'),
        value: Lampa.Storage.get(GIST_TOKEN_KEY, ''),
        free: true
      }, function (val) {
        Lampa.Storage.set(GIST_TOKEN_KEY, (val || '').trim());
        $token.find('.settings-param__value').text(val ? '••••••••' : 'Не вказано');
      });
    });
    html.append($token);

    // Sync
    var $sync = $(
      '<div class="settings-param selector">' +
        '<div class="settings-param__name">' + tr('local_lists_cloud_backup') + '</div>' +
      '</div>'
    );
    $sync.on('hover:enter', function () { Cloud.backup(); });
    html.append($sync);

    // Overwrite
    var $overwrite = $(
      '<div class="settings-param selector">' +
        '<div class="settings-param__name">' + tr('local_lists_cloud_overwrite') + '</div>' +
      '</div>'
    );
    $overwrite.on('hover:enter', function () { Cloud.overwrite(); });
    html.append($overwrite);

    // Restore
    var $restore = $(
      '<div class="settings-param selector">' +
        '<div class="settings-param__name">' + tr('local_lists_cloud_restore') + '</div>' +
      '</div>'
    );
    $restore.on('hover:enter', function () { Cloud.restore(); });
    html.append($restore);

    // Manage Lists
    var $manage = $(
      '<div class="settings-param selector">' +
        '<div class="settings-param__name">' + tr('local_lists_edit_menu') + '</div>' +
      '</div>'
    );
    $manage.on('hover:enter', function () { openManageListsModal(); });
    html.append($manage);

    // Trakt Import
    var $import = $(
      '<div class="settings-param selector">' +
        '<div class="settings-param__name">' + tr('local_lists_import_trakt') + '</div>' +
      '</div>'
    );
    $import.on('hover:enter', function () { startTraktImport(); });
    html.append($import);

    Lampa.Modal.open({
      title: tr('local_lists_settings'),
      html: html,
      size: 'medium',
      onBack: function () {
        Lampa.Modal.close();
        Lampa.Controller.toggle('settings');
      }
    });
  }

  // ── Ініціалізація плагіна ──────────────────────────────────────────────
  function init() {
    addLang();
    registerTemplate();
    injectCardButton();
    injectCardIcons();
    injectMenu();
    injectSettings();
  }

  if (window.appready) {
    init();
  } else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') init();
    });
  }
})();
