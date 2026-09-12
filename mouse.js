(function () {
    'use strict';

    if (window.lampa_mouse_fix_injected) return;
    window.lampa_mouse_fix_injected = true;

    function initMouseFix() {
        // Примусово вмикаємо режим миші в налаштуваннях Lampa для правильного рендерингу
        if (window.Lampa && window.Lampa.Storage) {
            window.Lampa.Storage.set('navigation_type', 'mouse');
        }

        // Перехоплюємо клік аеромишки та конвертуємо його в подію "ОК" для Lampa
        document.addEventListener('click', function (e) {
            var target = e.target.closest('.navigation-item, .card, .menu__item, .button, .selector');
            if (target) {
                e.preventDefault();
                e.stopPropagation();
                
                // Емулюємо натискання клавіші Enter (код 13) для Android TV
                var enterEvent = new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 13,
                    which: 13
                });
                target.dispatchEvent(enterEvent);
            }
        }, true);

        // Покращуємо скролінг стрічок фільмів за допомогою перетягування мишкою (Drag & Scroll)
        var isDown = false;
        var startX, scrollLeft, scrollTarget;

        document.addEventListener('mousedown', function(e) {
            scrollTarget = e.target.closest('.scroll__content, .items-line, .stub-row');
            if (!scrollTarget) return;
            isDown = true;
            startX = e.pageX - scrollTarget.offsetLeft;
            scrollLeft = scrollTarget.scrollLeft;
        });

        document.addEventListener('mouseleave', function() { isDown = false; });
        document.addEventListener('mouseup', function() { isDown = false; });

        document.addEventListener('mousemove', function(e) {
            if(!isDown || !scrollTarget) return;
            e.preventDefault();
            var x = e.pageX - scrollTarget.offsetLeft;
            var walk = (x - startX) * 1.5; // Швидкість прокрутки
            scrollTarget.scrollLeft = scrollLeft - walk;
        });
    }

    // Чекаємо повного завантаження інтерфейсу Lampa
    if (window.Lampa) {
        initMouseFix();
    } else {
        document.addEventListener('app:ready', initMouseFix);
    }
})();
