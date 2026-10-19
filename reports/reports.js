/*
 * reports.js
 * Monthly report: summary, plan vs actual, 6 month trend.
 */

MT.guard();

$('mon').value = MT.month(MT.today());

// Month string "k" months before m, e.g. prevMonth("2026-03", 2) = "2026-01"
function prevMonth(m, k) {
    const parts = m.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1 - k, 1);

    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function draw() {
    const m = $('mon').value;
    const monthTx = MT.monthTx(m);

    const income = MT.sum(monthTx, 'income');
    const spent = MT.sum(monthTx, 'expense');
    const profitLoss = income - spent;

    // ---------- Summary ----------
    $('title').textContent = 'Report for ' + m;
    $('inc').textContent = MT.money(income);
    $('exp').textContent = MT.money(spent);
    $('pl').textContent = (profitLoss < 0 ? '-' : '') + MT.money(Math.abs(profitLoss));
    $('pl').className = profitLoss < 0 ? 'neg' : 'pos';

    // ---------- Plan vs actual ----------
    const base = MT.incomeBase(m);
    const spentByCat = MT.spentByCat(m);

    $('plan').innerHTML = MT.data.categories.map(function (c) {
        const planned = base.amount * c.pct / 100;
        const used = spentByCat[c.name] || 0;
        const width = planned ? Math.min(used / planned * 100, 100) : 0;

        return '' +
            '<div class="pv">' +
                '<div class="split">' +
                    '<span>' + MT.esc(c.name) + '</span>' +
                    '<span class="sub">' + MT.money(used) + ' / ' + MT.money(planned) + '</span>' +
                '</div>' +
                '<div class="bar"><i class="' + (used > planned ? 'over' : '') + '" style="width:' + width + '%"></i></div>' +
            '</div>';
    }).join('');

    // ---------- Six month chart ----------
    const months = [5, 4, 3, 2, 1, 0].map(function (k) {
        return prevMonth(m, k);
    });

    const totals = months.map(function (x) {
        const list = MT.monthTx(x);
        return [MT.sum(list, 'income'), MT.sum(list, 'expense')];
    });

    // Tallest bar sets the scale
    const max = Math.max(1, ...totals.flat());

    $('chart').innerHTML = months.map(function (x, i) {
        return '' +
            '<div class="col">' +
                '<div class="pair">' +
                    '<i class="a" style="height:' + (totals[i][0] / max * 100) + '%"></i>' +
                    '<i class="b" style="height:' + (totals[i][1] / max * 100) + '%"></i>' +
                '</div>' +
                x.slice(5) +
            '</div>';
    }).join('');
}

$('mon').onchange = draw;
$('pdf').onclick = function () { window.print(); };

draw();
