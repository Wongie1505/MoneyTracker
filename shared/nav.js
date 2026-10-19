/*
 * nav.js
 * Adds the bottom tab bar. Each page marks itself with data-page on <body>.
 */
(function () {

    // [folder/file name, label, icon]
    const tabs = [
        ['home',         'Home',         '🏠'],
        ['transactions', 'Transactions', '💸'],
        ['budget',       'Budget',       '🎯'],
        ['reports',      'Reports',      '📊']
    ];

    const currentPage = document.body.dataset.page;
    const nav = document.createElement('nav');
    nav.className = 'tabbar';

    nav.innerHTML = tabs.map(function (tab) {
        const name = tab[0];
        const active = currentPage === name ? 'on' : '';

        return '<a href="../' + name + '/' + name + '.html" class="' + active + '">' +
                   '<span>' + tab[2] + '</span>' + tab[1] +
               '</a>';
    }).join('');

    document.body.appendChild(nav);

})();
