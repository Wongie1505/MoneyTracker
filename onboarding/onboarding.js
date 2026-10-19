/*
 * onboarding.js
 * First launch: collect estimated income and the category split.
 */

const cats = MT.data.categories;

// ---------- Draw the editable category rows ----------
$('cats').innerHTML = cats.map(function (c, i) {
    return '' +
        '<div class="cat">' +
            '<input value="' + MT.esc(c.name) + '" data-n="' + i + '">' +
            '<input type="number" min="0" max="100" value="' + c.pct + '" data-p="' + i + '">' +
        '</div>';
}).join('');

// ---------- Show the running percentage total ----------
function total() {
    const inputs = document.querySelectorAll('[data-p]');
    let t = 0;

    inputs.forEach(function (input) {
        t += Number(input.value) || 0;
    });

    const over = t > 100;

    $('tot').textContent = 'Total: ' + t + '%' + (over ? ' (over 100%, you would plan to spend more than you make)' : '');
    $('tot').className = 'sub ' + (over ? 'neg' : '');

    return t;
}

document.addEventListener('input', total);
total();

// ---------- Save and continue ----------
$('go').onclick = function () {
    const income = Number($('inc').value);

    if (!(income > 0)) {
        alert('Enter your estimated monthly income.');
        return;
    }

    if (total() > 100) {
        alert('Your split is over 100%. Reduce it.');
        return;
    }

    // Copy the edited names and percentages back into the data
    document.querySelectorAll('[data-n]').forEach(function (input) {
        const i = input.dataset.n;
        cats[i].name = input.value.trim() || cats[i].name;
    });

    document.querySelectorAll('[data-p]').forEach(function (input) {
        cats[input.dataset.p].pct = Number(input.value) || 0;
    });

    MT.data.settings.estIncome = income;
    MT.data.settings.onboarded = true;
    MT.save();

    location.href = '../home/home.html';
};
