(function () {
    'use strict';

    if (window.lampa_mouse_fix_injected) return;
    window.lampa_mouse_fix_injected = true;

    function initMouseFix() {
        // Системне налаштування навігації всередині Lampa
        if (window.Lampa && window.Lampa.Storage) {
            window.Lampa.Storage.set('navigation_type', 'mouse');
        }

        // Новий, більш жорсткий перехоплювач кліків аеромишки
        window.addEventListener('click', function (e) {
            // Шукаємо будь-який елемент інтерфейсу Lampa під курсором, який можна натиснути
            var target = e.target.closest('.navigation-item, .card, .menu__item, .button, .selector, [selectable]');
            
            if (target) {
                e.preventDefault();
                e.stopPropagation();

                // 1. Примусово переводимо фокус Lampa на цей елемент
                if (window.Lampa && window.Lampa.Navigator) {
                    window.Lampa.Navigator.focused(target);
                }

                // 2. Імітуємо клік через вбудований механізм дій Lampa
                var clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                target.dispatchEvent(clickEvent);

                // 3. Дублюємо натисканням клавіші ENTER для надійності Android TV
                var enterEvent = new KeyboardEvent('keydown', {
                    bubbles: true, cancelable: true, keyCode: 13, which: 13
                });
                target.dispatchEvent(enterEvent);
            }
        }, true);

        // Покращений скролінг (Drag & Scroll) для списків фільмів
        var isDown = false;
        var startX, scrollLeft, scrollTarget;

        window.addEventListener('mousedown', function(e) {
            scrollTarget = e.target.closest('.scroll__content, .items-line, .stub-row, .full-start__channels');
            if (!scrollTarget) return;
            isDown = true;
            startX = e.pageX - scrollTarget.offsetLeft;
            scrollLeft = scrollTarget.scrollLeft;
        });

        window.addEventListener('mouseleave', function() { isDown = false; });
        window.addEventListener('mouseup', function() { isDown = false; });

        window.addEventListener('mousemove', function(e) {
            if(!isDown || !scrollTarget) return;
            e.preventDefault();
            var x = e.pageX - scrollTarget.offsetLeft;
            var walk = (x - startX) * 2; // Збільшили швидкість прокрутки
            scrollTarget.scrollLeft = scrollLeft - walk;
        });
    }

    if (window.Lampa) {
        initMouseFix();
    } else {
        document.addEventListener('app:ready', initMouseFix);
    }
})();
