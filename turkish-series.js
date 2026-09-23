/* Lampa.plugin — Турецькі серіали v4.1 (Оптимізований + Виправлено баги) */
(function () {
    'use strict';

    if (window.__turkish_series_plugin) return;
    window.__turkish_series_plugin = true;

    function wait(cb) {
        if (window.Lampa && Lampa.Api && Lampa.ContentRows) cb();
        else setTimeout(function () { wait(cb); }, 120);
    }

    wait(function () {

        function setting(name, def) {
            var v = Lampa.Storage.get(name, def);
            if (v === 'true') return true;
            if (v === 'false') return false;
            return (v === undefined || v === null) ? def : v;
        }

        function today() {
            return new Date().toISOString().slice(0, 10);
        }

        function pluginOn() {
            return setting('tr_series_enable', true) !== false;
        }

        var ROWS = [
            { key: 'tr_popular', title: 'Популярні турецькі серіали', def: true,
              sort: 'popularity.desc',
              filter: { with_origin_country: 'TR', with_original_language: 'tr' } },
            { key: 'tr_new', title: 'Нові турецькі серіали', def: true,
              sort: 'first_air_date.desc',
              filter: { with_origin_country: 'TR', with_original_language: 'tr', 'first_air_date.lte': today() } },
            { key: 'tr_top', title: 'Найкращі турецькі серіали', def: true,
              sort: 'vote_average.desc',
              filter: { with_origin_country: 'TR', with_original_language: 'tr', 'vote_count.gte': '30' } },
            { key: 'tr_airing', title: 'Зараз виходять (турецькі)', def: true,
              sort: 'popularity.desc',
              filter: { with_origin_country: 'TR', with_original_language: 'tr', 'air_date.gte': today() } },
            { key: 'tr_drama',   title: 'Турецькі драми',       def: true,  genre: 18 },
            { key: 'tr_soap',    title: 'Турецькі мелодрами',   def: true,  genre: 10766 },
            { key: 'tr_comedy',  title: 'Турецькі комедії',     def: true,  genre: 35 },
            { key: 'tr_crime',   title: 'Турецькі кримінальні', def: true,  genre: 80 },
            { key: 'tr_action',  title: 'Турецькі бойовики',    def: true,  genre: 10759 },
            { key: 'tr_mystery', title: 'Турецькі детективи',   def: false, genre: 9648 },
            { key: 'tr_fantasy', title: 'Турецькі фентезі',     def: false, genre: 10765 },
            { key: 'tr_war',     title: 'Турецькі історичні',   def: false, genre: 10768 },
            { key: 'tr_family',  title: 'Турецькі сімейні',     def: false, genre: 10751 }
        ];

        function buildUrl(r) {
            var q = 'discover/tv?sort_by=' + (r.sort || 'popularity.desc');
            if (r.filter) {
                for (var k in r.filter) q += '&' + k + '=' + encodeURIComponent(r.filter[k]);
            } else if (r.genre) {
                q += '&with_genres=' + r.genre +
                     '&with_origin_country=TR&with_original_language=tr' +
                     '&first_air_date.lte=' + today();
            } else {
                q += '&with_origin_country=TR&with_original_language=tr';
            }
            q += '&language=uk';
            return q;
        }

        // ===== SETTINGS =====
        if (Lampa.SettingsApi) {
            try {
                Lampa.SettingsApi.addComponent({
                    component: 'tr_diziler',
                    name: 'Турецькі серіали',
                    icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><text x="12" y="15" text-anchor="middle" font-size="9" font-weight="bold" fill="currentColor" stroke="none">TR</text></svg>'
                });
                Lampa.SettingsApi.addParam({
                    component: 'tr_diziler',
                    param: { name: 'tr_series_enable', type: 'trigger', default: true },
                    field: { name: 'Увімкнути плагін', description: 'Ряди на головній + пункт меню' }
                });
                Lampa.SettingsApi.addParam({
                    component: 'tr_diziler',
                    param: { name: 'tr_series_on_main', type: 'trigger', default: true },
                    field: { name: 'Ряди на головній сторінці', description: 'Додає турецькі ряди до головної (не замінює LampaUA)' }
                });
                Lampa.SettingsApi.addParam({
                    component: 'tr_diziler',
                    param: {
                        name: 'tr_series_limit',
                        type: 'select',
                        values: { '10': '10', '15': '15', '20': '20', '30': '30' },
                        default: '20'
                    },
                    field: { name: 'Карток у ряді' }
                });
                ROWS.forEach(function (r) {
                    Lampa.SettingsApi.addParam({
                        component: 'tr_diziler',
                        param: { name: r.key, type: 'trigger', default: r.def },
                        field: { name: r.title }
                    });
                });
            } catch (e) {
                console.log('[TR] settings error', e);
            }
        }

        // ===== DATA (Безпечне сортування та обробка) =====
        function normalize(list) {
            var seen = {};
            list = (list || []).filter(function (c) {
                if (!c || !c.poster_path) return false;
                var dateStr = c.first_air_date || '';
                var key = ((c.name || c.title || '') + '|' + dateStr.slice(0, 4)).toLowerCase();
                if (seen[key]) return false;
                seen[key] = true;
                c.promo = c.overview || '';
                c.promo_title = c.name || c.title || '';
                return true;
            });

            // Безпечне сортування з урахуванням порожніх дат
            list.sort(function (a, b) {
                var dateA = a.first_air_date || '0000-00-00';
                var dateB = b.first_air_date || '0000-00-00';
                return dateB.localeCompare(dateA);
            });
            return list;
        }

        function loadRow(title, url, ready) {
            Lampa.Api.list(
                { source: 'tmdb', url: url },
                function (json) {
                    json = json || {};
                    var lim = parseInt(setting('tr_series_limit', 20), 10) || 20;
                    json.results = normalize(json.results).slice(0, lim);
                    json.title = title;
                    json.name = title;
                    ready(json);
                },
                function () {
                    ready({ title: title, name: title, results: [] });
                }
            );
        }

        // ===== ДОДАВАННЯ РЯДІВ =====
        ROWS.forEach(function (r, i) {
            Lampa.ContentRows.add({
                name: r.key,
                title: r.title,
                screen: ['main'],
                index: 50 + i,
                call: function () {
                    if (!pluginOn()) return [];
                    if (setting('tr_series_on_main', true) === false) return [];
                    if (setting(r.key, r.def) === false) return [];
                    return function (ready) {
                        loadRow(r.title, buildUrl(r), ready);
                    };
                }
            });
        });

        // ===== ВІДКРИТТЯ КАТЕГОРІЇ =====
        function openCategory(r) {
            var filter = {};
            if (r.filter) {
                for (var k in r.filter) filter[k] = r.filter[k];
            } else if (r.genre) {
                filter.with_genres = String(r.genre);
                filter.with_origin_country = 'TR';
                filter.with_original_language = 'tr';
                filter['first_air_date.lte'] = today();
            } else {
                filter.with_origin_country = 'TR';
                filter.with_original_language = 'tr';
            }

            Lampa.Activity.push({
                url: 'discover/tv',
                title: r.title || 'Турецькі серіали',
                component: 'category_full',
                source: 'tmdb',
                page: 1,
                sort_by: r.sort || 'popularity.desc',
                card_type: true,
                filter: filter
            });
        }

        function openMenu() {
            var items = ROWS.filter(function (r) {
                return setting(r.key, r.def) !== false;
            }).map(function (r) {
                return { title: r.title, row: r };
            });
            if (!items.length) items = [{ title: ROWS[0].title, row: ROWS[0] }];

            if (Lampa.Select && Lampa.Select.show) {
                Lampa.Select.show({
                    title: 'Турецькі серіали',
                    items: items,
                    onSelect: function (a) { openCategory(a.row); },
                    onBack: function () {
                        try { Lampa.Controller.toggle('menu'); } catch (e) {}
                    }
                });
            } else {
                openCategory(items[0].row);
            }
        }

        // ===== МЕНЮ ТА ПОДІЇ =====
        var menuAdded = false;
        function addMenu() {
            if (menuAdded || !pluginOn()) return;
            if (!Lampa.Menu || typeof Lampa.Menu.addButton !== 'function') return;

            try {
                var icon = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><text x="12" y="15" text-anchor="middle" font-size="9" font-weight="bold" fill="currentColor" stroke="none">TR</text></svg>';
                Lampa.Menu.addButton(icon, 'Турецькі серіали', openMenu);
                menuAdded = true;
            } catch (e) {
                console.log('[TR] menu error', e);
            }
        }

        if (Lampa.Listener) {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') addMenu();
            });
            Lampa.Listener.follow('menu', function (e) {
                if (e.type === 'start') addMenu();
            });
        }

        // Запасний виклик для швидкого завантаження
        addMenu();

        console.log('[Turkish Series] v4.1 — Optimized & Bugfixed');
    });
})();
