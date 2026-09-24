(function () {
    'use strict';

    if (typeof Lampa === 'undefined' || window.lampa_rss_ticker_inited) return;
    window.lampa_rss_ticker_inited = true;

    // ---------- РљРѕРЅСЃС‚Р°РЅС‚Рё ----------
    var DEFAULT_URL   = 'https://news.google.com/rss?hl=uk&gl=UA&ceid=UA:uk';
    var DEFAULT_PROXY = 'https://api.allorigins.win/raw?url=';
    var MAX_ITEMS     = 20;
    var REFRESH_MS    = 15 * 60 * 1000;
    var TIMEOUT_MS    = 8000;
    var SEPARATOR     = '   \u2022   ';
    var CACHE_KEY     = 'rss_ticker_cache';
    var ANIM_NAME     = 'lampa-rss-scroll';

    var ICON = '<svg height="24" viewBox="0 0 24 24" width="24" fill="none" stroke="currentColor" stroke-width="2">' +
               '<path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path>' +
               '<circle cx="5" cy="19" r="1"></circle></svg>';

    // ---------- РЎС‚Р°РЅ ----------
    var started    = false;
    var timer      = null;
    var xhr        = null;
    var reqId      = 0;
    var hasNews    = false;
    var playerOpen = false;
    var $wrap      = null;
    var $content   = null;

    // ---------- РҐРµР»РїРµСЂРё ----------
    function opt(name, def) { return Lampa.Storage.get(name, def); }
    function toBool(v) { return v === true || v === 'true'; }
    function isEnabled() { return toBool(opt('rss_ticker_enabled', 'true')); }
    // Lampa Р·Р±РµСЂС–РіР°С” Р·РЅР°С‡РµРЅРЅСЏ РїС–СЃР»СЏ onChange, С‚РѕРјСѓ С‡РёС‚Р°С”РјРѕ Р№РѕРіРѕ Р· РЅРµРІРµР»РёРєРѕСЋ Р·Р°С‚СЂРёРјРєРѕСЋ
    function later(fn) { setTimeout(fn, 0); }

    function getFeedUrl() {
        var url = String(opt('rss_ticker_url', DEFAULT_URL) || '').trim();
        return /^https?:\/\//i.test(url) ? url : DEFAULT_URL;
    }

    function readCache(url) {
        try {
            var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            return c && c.url === url && c.text ? c.text : '';
        } catch (e) { return ''; }
    }

    function writeCache(url, text) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ url: url, text: text })); } catch (e) {}
    }

    // ---------- 1. РќР°Р»Р°С€С‚СѓРІР°РЅРЅСЏ ----------
    function initSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addComponent({
            component: 'rss_ticker',
            name: 'RSS РЎС‚СЂС–С‡РєР°',
            icon: ICON
        });

        Lampa.SettingsApi.addParam({
            component: 'rss_ticker',
            param: { name: 'rss_ticker_enabled', type: 'trigger', default: true },
            field: { name: 'РЎС‚Р°С‚СѓСЃ СЃС‚СЂС–С‡РєРё', description: 'РџРѕРєР°Р·СѓРІР°С‚Рё СЂСѓС…РѕРјРёР№ СЂСЏРґРѕРє РЅРѕРІРёРЅ' },
            onChange: function () {
                later(function () {
                    updateVisibility();
                    if (isEnabled()) loadRSS();
                });
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'rss_ticker',
            param: { name: 'rss_ticker_url', type: 'input', default: DEFAULT_URL },
            field: { name: 'URL RSS-СЃС‚СЂС–С‡РєРё', description: 'РџРѕСЃРёР»Р°РЅРЅСЏ РЅР° XML/RSS/Atom РїРѕС‚С–Рє РЅРѕРІРёРЅ' },
            onChange: function () { later(reloadFeed); }
        });

        Lampa.SettingsApi.addParam({
            component: 'rss_ticker',
            param: {
                name: 'rss_ticker_pxs',
                type: 'select',
                values: { '50': 'РџРѕРІС–Р»СЊРЅРѕ', '80': 'Р—РІРёС‡Р°Р№РЅРѕ', '120': 'РЁРІРёРґРєРѕ' },
                default: '80'
            },
            field: { name: 'РЁРІРёРґРєС–СЃС‚СЊ СЂСѓС…Сѓ', description: 'РЁРІРёРґРєС–СЃС‚СЊ РЅРµ Р·Р°Р»РµР¶РёС‚СЊ РІС–Рґ РґРѕРІР¶РёРЅРё С‚РµРєСЃС‚Сѓ' },
            onChange: function () { later(restartAnimation); }
        });

        Lampa.SettingsApi.addParam({
            component: 'rss_ticker',
            param: {
                name: 'rss_ticker_bottom',
                type: 'select',
                values: { '0': 'РќРµРјР°С”', '30': '30 px', '60': '60 px', '90': '90 px' },
                default: '0'
            },
            field: { name: 'Р’С–РґСЃС‚СѓРї Р·РЅРёР·Сѓ', description: 'РЇРєС‰Рѕ СЃС‚СЂС–С‡РєР° РїРµСЂРµРєСЂРёРІР°С” РЅРёР¶РЅС” РјРµРЅСЋ Р°Р±Рѕ РЅР° РўР’ РѕР±СЂС–Р·Р°С”С‚СЊСЃСЏ РєСЂР°С”Рј РµРєСЂР°РЅР°' },
            onChange: function () { later(applyPosition); }
        });

        Lampa.SettingsApi.addParam({
            component: 'rss_ticker',
            param: { name: 'rss_ticker_proxy', type: 'input', default: '' },
            field: {
                name: 'РЎРІС–Р№ CORS-РїСЂРѕРєСЃС–',
                description: 'РќРµРѕР±РѕРІКјСЏР·РєРѕРІРѕ. РџСЂРµС„С–РєСЃ, РґРѕ СЏРєРѕРіРѕ РґРѕРґР°С”С‚СЊСЃСЏ Р·Р°РєРѕРґРѕРІР°РЅРёР№ URL СЃС‚СЂС–С‡РєРё. РЇРєС‰Рѕ РїРѕСЂРѕР¶РЅСЊРѕ: СЃРїРѕС‡Р°С‚РєСѓ РЅР°РїСЂСЏРјСѓ, РїРѕС‚С–Рј С‡РµСЂРµР· allorigins.win'
            },
            onChange: function () { later(reloadFeed); }
        });
    }

    // ---------- 2. UI ----------
    function injectStyles() {
        if (document.getElementById('lampa-rss-styles')) return;

        var css = [
            '.lampa-rss-ticker-wrap{position:fixed;left:0;bottom:0;width:100%;height:36px;',
            'background:rgba(10,10,10,.92);border-top:1px solid rgba(255,255,255,.1);color:#e0e0e0;',
            'overflow:hidden;z-index:1000;font-size:15px;line-height:36px;pointer-events:none}',
            '.lampa-rss-ticker-wrap.hide-ticker{display:none}',
            '.lampa-rss-ticker-content{display:inline-block;white-space:nowrap;padding-left:100%;will-change:transform;',
            '-webkit-animation-timing-function:linear;animation-timing-function:linear;',
            '-webkit-animation-iteration-count:infinite;animation-iteration-count:infinite}',
            '@-webkit-keyframes ' + ANIM_NAME + '{from{-webkit-transform:translate3d(0,0,0)}to{-webkit-transform:translate3d(-100%,0,0)}}',
            '@keyframes ' + ANIM_NAME + '{from{transform:translate3d(0,0,0)}to{transform:translate3d(-100%,0,0)}}'
        ].join('');

        var style = document.createElement('style');
        style.id = 'lampa-rss-styles';
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    function createUI() {
        if ($wrap) return;

        injectStyles();
        $wrap = $('<div class="lampa-rss-ticker-wrap hide-ticker"><div class="lampa-rss-ticker-content"></div></div>');
        $content = $wrap.find('.lampa-rss-ticker-content');
        $('body').append($wrap);

        applyPosition();
        showCachedOrLoading();
        updateVisibility();
    }

    function applyPosition() {
        if (!$wrap) return;
        $wrap.css('bottom', (parseInt(opt('rss_ticker_bottom', '0'), 10) || 0) + 'px');
    }

    // РЁРІРёРґРєС–СЃС‚СЊ Сѓ px/СЃ: С‚СЂРёРІР°Р»С–СЃС‚СЊ СЂР°С…СѓС”С‚СЊСЃСЏ РІС–Рґ СЂРµР°Р»СЊРЅРѕС— С€РёСЂРёРЅРё С‚РµРєСЃС‚Сѓ
    function restartAnimation() {
        if (!$content || $wrap.hasClass('hide-ticker')) return;

        var el = $content[0];
        el.style.webkitAnimationName = 'none';
        el.style.animationName = 'none';

        var width = el.offsetWidth; // РїСЂРёРјСѓСЃРѕРІРёР№ reflow + РІРёРјС–СЂ
        if (!width) return;

        var pxs = parseInt(opt('rss_ticker_pxs', '80'), 10) || 80;
        var dur = Math.max(10, Math.round(width / pxs)) + 's';

        el.style.webkitAnimationDuration = dur;
        el.style.animationDuration = dur;
        el.style.webkitAnimationName = ANIM_NAME;
        el.style.animationName = ANIM_NAME;
    }

    function isPlayerOpen() {
        if (playerOpen) return true;
        try { return !!(Lampa.Player && Lampa.Player.opened && Lampa.Player.opened()); } catch (e) { return false; }
    }

    function updateVisibility() {
        if (!$wrap) return;
        var show = isEnabled() && !isPlayerOpen();
        var wasHidden = $wrap.hasClass('hide-ticker');

        $wrap.toggleClass('hide-ticker', !show);
        if (show && wasHidden) restartAnimation();
    }

    function setText(text) {
        if (!$content) return;
        $content.text(text);
        restartAnimation();
    }

    function showCachedOrLoading() {
        var cached = readCache(getFeedUrl());
        hasNews = !!cached;
        setText(cached || 'Р—Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ РЅРѕРІРёРЅ RSS...');
    }

    // ---------- 3. Р—Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ С‚Р° РїР°СЂСЃРёРЅРі ----------
    function parseRSS(xmlText) {
        try {
            var doc = new DOMParser().parseFromString(xmlText, 'text/xml');
            if (!doc || doc.getElementsByTagName('parsererror').length) return null; // РЅРµ XML

            var nodes = doc.getElementsByTagName('item');
            if (!nodes.length) nodes = doc.getElementsByTagName('entry');

            var titles = [];
            for (var i = 0; i < nodes.length && titles.length < MAX_ITEMS; i++) {
                // getElementsByTagName('title') РЅРµ С‡С–РїР°С” <media:title> С‚Р° РїРѕРґС–Р±РЅС–
                var t = nodes[i].getElementsByTagName('title')[0];
                var text = t ? t.textContent.replace(/\s+/g, ' ').trim() : '';
                if (text) titles.push(text);
            }
            return titles;
        } catch (e) {
            return null;
        }
    }

    function buildRoutes(feedUrl) {
        var custom = String(opt('rss_ticker_proxy', '') || '').trim();
        if (custom) return [custom + encodeURIComponent(feedUrl)];
        return [feedUrl, DEFAULT_PROXY + encodeURIComponent(feedUrl)];
    }

    function fetchFeed(routes, index, id, onOk, onFail) {
        if (index >= routes.length) return onFail();

        xhr = $.ajax({ url: routes[index], type: 'GET', dataType: 'text', timeout: TIMEOUT_MS })
            .done(function (text) {
                if (id !== reqId) return; // Р·Р°СЃС‚Р°СЂС–Р»РёР№ Р·Р°РїРёС‚
                var titles = parseRSS(text);
                if (titles) onOk(titles);
                else fetchFeed(routes, index + 1, id, onOk, onFail);
            })
            .fail(function (jq, status) {
                if (id !== reqId || status === 'abort') return;
                fetchFeed(routes, index + 1, id, onOk, onFail);
            });
    }

    function loadRSS() {
        if (!isEnabled()) return;

        if (xhr) { try { xhr.abort(); } catch (e) {} }
        var id = ++reqId;
        var feedUrl = getFeedUrl();

        fetchFeed(buildRoutes(feedUrl), 0, id, function (titles) {
            if (!titles.length) {
                hasNews = false;
                setText('РќРµРјР°С” РґРѕСЃС‚СѓРїРЅРёС… РЅРѕРІРёРЅ Сѓ С†С–Р№ СЃС‚СЂС–С‡С†С–');
                return;
            }
            var text = titles.join(SEPARATOR);
            hasNews = true;
            writeCache(feedUrl, text);
            setText(text);
        }, function () {
            // РЇРєС‰Рѕ РІР¶Рµ С” СЃС‚Р°СЂС– РЅРѕРІРёРЅРё, РЅРµ РїРµСЂРµС‚РёСЂР°С”РјРѕ С—С… РїРѕРјРёР»РєРѕСЋ
            if (!hasNews) setText('РџРѕРјРёР»РєР° Р·Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ RSS. РџРµСЂРµРІС–СЂС‚Рµ URL Р°Р±Рѕ РїСЂРѕРєСЃС– РІ РЅР°Р»Р°С€С‚СѓРІР°РЅРЅСЏС….');
        });
    }

    function reloadFeed() {
        showCachedOrLoading();
        loadRSS();
    }

    // ---------- 4. РџРѕРґС–С— Lampa ----------
    function listenEvents() {
        try {
            var pl = Lampa.Player && Lampa.Player.listener;
            if (!pl) return;

            pl.follow('start',   function () { playerOpen = true;  updateVisibility(); });
            pl.follow('destroy', function () { playerOpen = false; updateVisibility(); });

            // РЎСѓРјС–СЃРЅС–СЃС‚СЊ Р·С– Р·Р±С–СЂРєР°РјРё, РґРµ РїРѕРґС–С— РїСЂРёС…РѕРґСЏС‚СЊ С‡РµСЂРµР· 'state'
            pl.follow('state', function (e) {
                if (!e) return;
                if (e.type === 'play' || e.type === 'start') { playerOpen = true; updateVisibility(); }
                else if (e.type === 'destroy' || e.type === 'stop') { playerOpen = false; updateVisibility(); }
            });
        } catch (e) {}
    }

    // ---------- 5. РўРѕС‡РєР° РІС…РѕРґСѓ ----------
    function start() {
        if (started) return;
        started = true;

        try { initSettings(); } catch (e) { console.log('RSS ticker: settings error', e); }
        createUI();
        listenEvents();
        loadRSS();

        clearInterval(timer);
        timer = setInterval(loadRSS, REFRESH_MS);
    }

    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
