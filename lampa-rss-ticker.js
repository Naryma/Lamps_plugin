(function () {
    'use strict';

    if (typeof Lampa === 'undefined' || window.lampa_rss_ticker_inited) return;
    window.lampa_rss_ticker_inited = true;

    // ---------- Constants ----------
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

    // ---------- State ----------
    var started    = false;
    var timer      = null;
    var xhr        = null;
    var reqId      = 0;
    var hasNews    = false;
    var playerOpen = false;
    var $wrap      = null;
    var $content   = null;

    // ---------- Helpers ----------
    function opt(name, def) { return Lampa.Storage.get(name, def); }
    function toBool(v) { return v === true || v === 'true'; }
    function isEnabled() { return toBool(opt('rss_ticker_enabled', 'true')); }
    // Lampa saves the value after onChange, so read it with a small delay
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

    // ---------- 1. Settings ----------
    function initSettings() {
        if (!Lampa.SettingsApi) return;

        Lampa.SettingsApi.addComponent({
            component: 'rss_ticker',
            name: 'RSS \u0421\u0442\u0440\u0456\u0447\u043a\u0430',
            icon: ICON
        });

        Lampa.SettingsApi.addParam({
            component: 'rss_ticker',
            param: { name: 'rss_ticker_enabled', type: 'trigger', default: true },
            field: { name: '\u0421\u0442\u0430\u0442\u0443\u0441 \u0441\u0442\u0440\u0456\u0447\u043a\u0438', description: '\u041f\u043e\u043a\u0430\u0437\u0443\u0432\u0430\u0442\u0438 \u0440\u0443\u0445\u043e\u043c\u0438\u0439 \u0440\u044f\u0434\u043e\u043a \u043d\u043e\u0432\u0438\u043d' },
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
            field: { name: 'URL RSS-\u0441\u0442\u0440\u0456\u0447\u043a\u0438', description: '\u041f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u043d\u0430 XML/RSS/Atom \u043f\u043e\u0442\u0456\u043a \u043d\u043e\u0432\u0438\u043d' },
            onChange: function () { later(reloadFeed); }
        });

        Lampa.SettingsApi.addParam({
            component: 'rss_ticker',
            param: {
                name: 'rss_ticker_pxs',
                type: 'select',
                values: { '50': '\u041f\u043e\u0432\u0456\u043b\u044c\u043d\u043e', '80': '\u0417\u0432\u0438\u0447\u0430\u0439\u043d\u043e', '120': '\u0428\u0432\u0438\u0434\u043a\u043e' },
                default: '80'
            },
            field: { name: '\u0428\u0432\u0438\u0434\u043a\u0456\u0441\u0442\u044c \u0440\u0443\u0445\u0443', description: '\u0428\u0432\u0438\u0434\u043a\u0456\u0441\u0442\u044c \u043d\u0435 \u0437\u0430\u043b\u0435\u0436\u0438\u0442\u044c \u0432\u0456\u0434 \u0434\u043e\u0432\u0436\u0438\u043d\u0438 \u0442\u0435\u043a\u0441\u0442\u0443' },
            onChange: function () { later(restartAnimation); }
        });

        Lampa.SettingsApi.addParam({
            component: 'rss_ticker',
            param: {
                name: 'rss_ticker_bottom',
                type: 'select',
                values: { '0': '\u041d\u0435\u043c\u0430\u0454', '30': '30 px', '60': '60 px', '90': '90 px' },
                default: '0'
            },
            field: { name: '\u0412\u0456\u0434\u0441\u0442\u0443\u043f \u0437\u043d\u0438\u0437\u0443', description: '\u042f\u043a\u0449\u043e \u0441\u0442\u0440\u0456\u0447\u043a\u0430 \u043f\u0435\u0440\u0435\u043a\u0440\u0438\u0432\u0430\u0454 \u043d\u0438\u0436\u043d\u0454 \u043c\u0435\u043d\u044e \u0430\u0431\u043e \u043d\u0430 \u0422\u0412 \u043e\u0431\u0440\u0456\u0437\u0430\u0454\u0442\u044c\u0441\u044f \u043a\u0440\u0430\u0454\u043c \u0435\u043a\u0440\u0430\u043d\u0430' },
            onChange: function () { later(applyPosition); }
        });

        Lampa.SettingsApi.addParam({
            component: 'rss_ticker',
            param: { name: 'rss_ticker_proxy', type: 'input', default: '' },
            field: {
                name: '\u0421\u0432\u0456\u0439 CORS-\u043f\u0440\u043e\u043a\u0441\u0456',
                description: '\u041d\u0435\u043e\u0431\u043e\u0432\u02bc\u044f\u0437\u043a\u043e\u0432\u043e. \u041f\u0440\u0435\u0444\u0456\u043a\u0441, \u0434\u043e \u044f\u043a\u043e\u0433\u043e \u0434\u043e\u0434\u0430\u0454\u0442\u044c\u0441\u044f \u0437\u0430\u043a\u043e\u0434\u043e\u0432\u0430\u043d\u0438\u0439 URL \u0441\u0442\u0440\u0456\u0447\u043a\u0438. \u042f\u043a\u0449\u043e \u043f\u043e\u0440\u043e\u0436\u043d\u044c\u043e: \u0441\u043f\u043e\u0447\u0430\u0442\u043a\u0443 \u043d\u0430\u043f\u0440\u044f\u043c\u0443, \u043f\u043e\u0442\u0456\u043c \u0447\u0435\u0440\u0435\u0437 allorigins.win'
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

    // Speed in px/s: duration is computed from the real text width
    function restartAnimation() {
        if (!$content || $wrap.hasClass('hide-ticker')) return;

        var el = $content[0];
        el.style.webkitAnimationName = 'none';
        el.style.animationName = 'none';

        var width = el.offsetWidth; // forced reflow + measure
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
        setText(cached || '\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f \u043d\u043e\u0432\u0438\u043d RSS...');
    }

    // ---------- 3. Loading and parsing ----------
    function parseRSS(xmlText) {
        try {
            var doc = new DOMParser().parseFromString(xmlText, 'text/xml');
            if (!doc || doc.getElementsByTagName('parsererror').length) return null; // not XML

            var nodes = doc.getElementsByTagName('item');
            if (!nodes.length) nodes = doc.getElementsByTagName('entry');

            var titles = [];
            for (var i = 0; i < nodes.length && titles.length < MAX_ITEMS; i++) {
                // getElementsByTagName('title') does not match <media:title> and similar
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
                if (id !== reqId) return; // stale request
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
                setText('\u041d\u0435\u043c\u0430\u0454 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0438\u0445 \u043d\u043e\u0432\u0438\u043d \u0443 \u0446\u0456\u0439 \u0441\u0442\u0440\u0456\u0447\u0446\u0456');
                return;
            }
            var text = titles.join(SEPARATOR);
            hasNews = true;
            writeCache(feedUrl, text);
            setText(text);
        }, function () {
            // If old news is already shown, do not overwrite it with an error
            if (!hasNews) setText('\u041f\u043e\u043c\u0438\u043b\u043a\u0430 \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f RSS. \u041f\u0435\u0440\u0435\u0432\u0456\u0440\u0442\u0435 URL \u0430\u0431\u043e \u043f\u0440\u043e\u043a\u0441\u0456 \u0432 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f\u0445.');
        });
    }

    function reloadFeed() {
        showCachedOrLoading();
        loadRSS();
    }

    // ---------- 4. Lampa events ----------
    function listenEvents() {
        try {
            var pl = Lampa.Player && Lampa.Player.listener;
            if (!pl) return;

            pl.follow('start',   function () { playerOpen = true;  updateVisibility(); });
            pl.follow('destroy', function () { playerOpen = false; updateVisibility(); });

            // Compatibility with builds where events come via 'state'
            pl.follow('state', function (e) {
                if (!e) return;
                if (e.type === 'play' || e.type === 'start') { playerOpen = true; updateVisibility(); }
                else if (e.type === 'destroy' || e.type === 'stop') { playerOpen = false; updateVisibility(); }
            });
        } catch (e) {}
    }

    // ---------- 5. Entry point ----------
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
