/*
 * home.js
 * Dashboard: remaining money, monthly summary, buckets, recent transactions.
 */

MT.guard();

const thisMonth = MT.month(MT.today());
const base = MT.incomeBase();
const monthTx = MT.monthTx(thisMonth);

const income = MT.sum(monthTx, 'income');
const spent = MT.sum(monthTx, 'expense');
const remaining = base.amount - spent;
const profitLoss = income - spent;

// ---------- Remaining card ----------
$('rem').textContent = MT.money(remaining);
$('rem').className = 'big ' + (remaining < 0 ? 'neg' : '');
$('remsub').textContent = 'of ' + MT.money(base.amount) + ' planned (' + base.source + ')';

const usedPercent = Math.min(Math.max(spent / (base.amount || 1) * 100, 0), 100);
$('rembar').style.width = usedPercent + '%';

if (spent > base.amount) {
    $('rembar').className = 'over';
}

// ---------- Summary row ----------
$('inc').textContent = MT.money(income);
$('exp').textContent = MT.money(spent);
$('pl').textContent = (profitLoss < 0 ? '-' : '') + MT.money(Math.abs(profitLoss));
$('pl').className = profitLoss < 0 ? 'neg' : 'pos';

// ---------- Budget buckets ----------
const spentByCat = MT.spentByCat(thisMonth);

$('buckets').innerHTML = MT.data.categories.map(function (c) {
    const planned = base.amount * c.pct / 100;
    const used = spentByCat[c.name] || 0;
    const width = planned ? Math.min(used / planned * 100, 100) : 0;

    return '' +
        '<div class="bk">' +
            '<div class="split">' +
                '<span>' + MT.esc(c.name) + '</span>' +
                '<span class="sub">' + MT.money(used) + ' / ' + MT.money(planned) + '</span>' +
            '</div>' +
            '<div class="bar"><i class="' + (used > planned ? 'over' : '') + '" style="width:' + width + '%"></i></div>' +
        '</div>';
}).join('');

// ---------- Recent transactions (latest 5) ----------
const recent = MT.data.transactions
    .slice()
    .sort(function (a, b) {
        return b.date.localeCompare(a.date) || b.id - a.id;
    })
    .slice(0, 5);

$('recent').innerHTML = recent.length
    ? recent.map(function (t) { return MT.txRow(t); }).join('')
    : '<div class="empty">Nothing yet. Tap + to add your first one.</div>';
