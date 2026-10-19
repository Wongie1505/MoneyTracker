/*
 * transactions.js
 * Add income or expenses and browse history by month.
 */

MT.guard();

let type = 'expense';

// ---------- Fill the form defaults ----------
$('cat').innerHTML = MT.data.categories.map(function (c) {
    return '<option>' + MT.esc(c.name) + '</option>';
}).join('');

$('date').value = MT.today();
$('mon').value = MT.month(MT.today());

// ---------- Expense / Income switch ----------
function setType(newType) {
    type = newType;

    $('tExp').className = type === 'expense' ? '' : 'ghost';
    $('tInc').className = type === 'income' ? '' : 'ghost';

    // Income has no category, so hide the picker
    $('catWrap').style.display = type === 'expense' ? '' : 'none';
}

$('tExp').onclick = function () { setType('expense'); };
$('tInc').onclick = function () { setType('income'); };

// ---------- Draw the history list ----------
function draw() {
    const list = MT.monthTx($('mon').value).sort(function (a, b) {
        return b.date.localeCompare(a.date) || b.id - a.id;
    });

    $('list').innerHTML = list.length
        ? list.map(function (t) { return MT.txRow(t, true); }).join('')
        : '<div class="empty">No transactions this month.</div>';
}

// ---------- Save a new transaction ----------
$('save').onclick = function () {
    const amount = Number($('amt').value);

    if (!(amount > 0)) {
        alert('Enter an amount.');
        return;
    }

    MT.data.transactions.push({
        id: Date.now(),
        type: type,
        amount: amount,
        category: type === 'income' ? 'Income' : $('cat').value,
        note: $('note').value.trim(),
        date: $('date').value || MT.today()
    });

    MT.save();

    // Reset the form and jump to the month of the new entry
    $('amt').value = '';
    $('note').value = '';
    $('mon').value = MT.month($('date').value);

    draw();
    $('amt').focus();
};

// ---------- Delete a transaction ----------
$('list').onclick = function (e) {
    const id = e.target.dataset.id;

    if (id && confirm('Delete this transaction?')) {
        MT.data.transactions = MT.data.transactions.filter(function (t) {
            return t.id != id;
        });

        MT.save();
        draw();
    }
};

// ---------- Start ----------
$('mon').onchange = draw;
draw();
$('amt').focus();
