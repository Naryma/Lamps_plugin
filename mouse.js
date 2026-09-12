(function () {
    'use strict';

    if (window.lampa_ultra_mouse_fixed) return;
    window.lampa_ultra_mouse_fixed = true;

    function initUltraMouseFix() {
        // Примусово ламаємо стандартне блокування миші в Lampa
        if (window.Lampa && window.Lampa.Storage) {
            window.Lampa.Storage.set('navigation_type', 'mouse');
        }

        // Перехоплюємо подію ПЕРЕД тим, як її заблокує ядро Lampa
        window.addEventListener('mousedown', function (e) {
            // Шукаємо картку фільму або кнопку меню під курсором
            var target = e.target.closest('.card, .navigation-item, .menu__item, .button, .selector');
            if (!target) return;

            // Зупиняємо стандартний обробник Lampa, який ламає фокус
            e.preventDefault();
            e.stopPropagation();

            // Змушуємо Lampa примусово підсвітити те, куди ми клікнули
            if (window.Lampa && window.Lampa.Navigator) {
                window.Lampa.Navigator.focused(target);
            }

            // Штучно викликаємо подію Enter через рідний механізм Lampa
            setTimeout(function() {
                var triggerEvent = new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 13,
                    which: 13,
                    keyCode: 13
                });
                target.dispatchEvent(triggerEvent);
                
                // Якщо це картка, пробуємо штовхнути її через її власний дата-атрибут
                if (target.click) target.click();
            }, 10);
        }, true); // Флаг true обов'язковий — він перехоплює подію першим у системі
    }

    if (window.Lampa) {
        initUltraMouseFix();
    } else {
        document.addEventListener('app:ready', initUltraMouseFix);
    }
})();
