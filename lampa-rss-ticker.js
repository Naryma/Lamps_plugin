(function () {
    'use strict';

    if (window.lampa_rss_ticker_inited) return;
    window.lampa_rss_ticker_inited = true;

    // Замовчувані налаштування
    var DEFAULT_URL = 'https://news.google.com/rss?hl=uk&gl=UA&ceid=UA:uk';
    var PROXY_URL = 'https://api.allorigins.win/raw?url=';
    
    var timer = null;
    var $tickerContainer = null;
    var $tickerContent = null;

    // --- 1. ІНІЦІАЛІЗАЦІЯ НАЛАШТУВАНЬ В LAMPA ---
    function initSettings() {
        Lampa.Settings.add({
            title: 'RSS Стрічка',
            component: 'rss_ticker',
            icon: `<svg height="24" viewBox="0 0 24 24" width="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg>`,
            param: {
                name: 'rss_ticker',
                value: 'rss_ticker'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'rss_ticker',
            param: {
                name: 'rss_ticker_enabled',
                type: 'select',
                values: {
                    true: 'Увімкнено',
                    false: 'Вимкнено'
                },
                default: 'true'
            },
            field: {
                name: 'Статус стрічки',
                description: 'Показувати рухомий рядок новин'
            },
            onChange: function (value) {
                if (value === 'true') {
                    showTicker();
                    loadRSS();
                } else {
                    hideTicker();
                }
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'rss_ticker',
            param: {
                name: 'rss_ticker_url',
                type: 'input',
                default: DEFAULT_URL
            },
            field: {
                name: 'URL RSS-стрічки',
                description: 'Посилання на XML/RSS потік новин'
            },
            onChange: function () {
                loadRSS();
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'rss_ticker',
            param: {
                name: 'rss_ticker_speed',
                type: 'select',
                values: {
                    '60': 'Повільно (60с)',
                    '40': 'Звичайно (40с)',
                    '25': 'Швидко (25с)'
                },
                default: '40'
            },
            field: {
                name: 'Швидкість руху',
                description: 'Час повного проходження стрічки'
            },
            onChange: function () {
                applySpeed();
            }
        });
    }

    // --- 2. СТВОРЕННЯ UI ТА СТИЛІВ ---
    function injectStyles() {
        if ($('#lampa-rss-styles').length) return;

        var style = document.createElement('style');
        style.id = 'lampa-rss-styles';
        style.textContent = `
            .lampa-rss-ticker-wrap {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 36px;
                background: rgba(10, 10, 10, 0.85);
                backdrop-filter: blur(4px);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                color: #e0e0e0;
                overflow: hidden;
                z-index: 1000;
                font-size: 15px;
                line-height: 36px;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .lampa-rss-ticker-wrap.hide-ticker {
                opacity: 0;
                display: none !important;
            }
            .lampa-rss-ticker-content {
                display: inline-block;
                white-space: nowrap;
                padding-left: 100%;
                will-change: transform;
                animation-name: lampa-rss-scroll;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
            }
            @keyframes lampa-rss-scroll {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(-100%, 0, 0); }
            }
        `;
        document.head.appendChild(style);
    }

    function createUI() {
        if ($tickerContainer) return;

        injectStyles();
        $tickerContainer =$('<div class="lampa-rss-ticker-wrap"><div class="lampa-rss-ticker-content">Завантаження новин RSS...</div></div>');
        $tickerContent =$tickerContainer.find('.lampa-rss-ticker-content');
        $('body').append($tickerContainer);

        applySpeed();
        
        if (Lampa.Storage.get('rss_ticker_enabled', 'true') === 'false') {
            hideTicker();
        }
    }

    function applySpeed() {
        if (!$tickerContent) return;
        var speed = Lampa.Storage.get('rss_ticker_speed', '40');
        $tickerContent.css('animation-duration', speed + 's');
    }

    function showTicker() {
        if ($tickerContainer)$tickerContainer.removeClass('hide-ticker');
    }

    function hideTicker() {
        if ($tickerContainer)$tickerContainer.addClass('hide-ticker');
    }

    // --- 3. ЗАВАНТАЖЕННЯ ТА ПАРСИНГ ---
    function loadRSS() {
        if (Lampa.Storage.get('rss_ticker_enabled', 'true') === 'false') return;

        var feedUrl = Lampa.Storage.get('rss_ticker_url', DEFAULT_URL);
        var requestUrl = PROXY_URL + encodeURIComponent(feedUrl);

        $.ajax({
            url: requestUrl,
            type: 'GET',
            dataType: 'text',
            timeout: 8000
        }).done(function (xmlText) {
            parseRSS(xmlText);
        }).fail(function () {
            updateContent('Помилка завантаження RSS. Перевірте URL у налаштуваннях.');
        });
    }

    function parseRSS(xmlText) {
        try {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            var items = xmlDoc.querySelectorAll('item title, entry title');
            var titles = [];

            for (var i = 0; i < Math.min(items.length, 20); i++) {
                var text = items[i].textContent.trim();
                if (text) titles.push(text);
            }

            if (titles.length > 0) {
                updateContent(titles.join('   •   '));
            } else {
                updateContent('Немає доступних новин у цій стрічці');
            }
        } catch (e) {
            updateContent('Помилка парсингу RSS даних');
        }
    }

    function updateContent(text) {
        if (!$tickerContent) return;

        // Перезапуск анімації через RAF для уникнення замилювання чи збоїв ТВ
        $tickerContent.css('animation-name', 'none');$tickerContent.text(text);

        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
                $tickerContent.css('animation-name', 'lampa-rss-scroll');
            });
        });
    }

    // --- 4. ІНТЕГРАЦІЯ З ПОДІЯМИ LAMPA ---
    function listenEvents() {
        // Ховаємо стрічку, коли вмикається відеоплеєр
        Lampa.Player.listener.follow('state', function (e) {
            if (e.type === 'play' || e.type === 'start') {
                hideTicker();
            } else if (e.type === 'destroy' || e.type === 'stop') {
                if (Lampa.Storage.get('rss_ticker_enabled', 'true') === 'true') {
                    showTicker();
                }
            }
        });
    }

    // --- 5. ТОЧКА ВХОДУ ---
    function start() {
        initSettings();
        createUI();
        loadRSS();
        listenEvents();

        // Автооновлення кожні 15 хвилин
        clearInterval(timer);
        timer = setInterval(loadRSS, 15 * 60 * 1000);
    }

    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
