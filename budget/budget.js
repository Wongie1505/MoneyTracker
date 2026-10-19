/*
 * budget.js
 * Edit budget categories as percentages of the monthly ceiling.
 */

MT.guard();

const cats = MT.data.categories;

// ---------- Draw everything ----------
function draw() {
    const base = MT.incomeBase();
    const spentByCat = MT.spentByCat(MT.month(MT.today()));

    // Ceiling card
    $('base').textContent = MT.money(base.amount);
    $('src').textContent = 'Based on ' + base.source;

    // Allocation total (should be 100% or less)
    const totalPct = cats.reduce(function (sum, c) {
        return sum + c.pct;
    }, 0);

    let message = 'Allocated: ' + totalPct + '%';

    if (totalPct > 100) {
        message += ' (over 100%, fix this)';
    } else if (totalPct < 100) {
        message += ' (' + (100 - totalPct) + '% unplanned)';
    }

    $('tot').textContent = message;
    $('tot').className = 'sub ' + (totalPct > 100 ? 'neg' : '');

    // One card per category
    $('cats').innerHTML = cats.map(function (c, i) {
        const planned = base.amount * c.pct / 100;
        const used = spentByCat[c.name] || 0;
        const width = planned ? Math.min(used / planned * 100, 100) : 0;

        return '' +
            '<div class="card">' +
                '<div class="row">' +
                    '<input class="nm" data-n="' + i + '" value="' + MT.esc(c.name) + '">' +
                    '<input class="pc" type="number" min="0" max="100" data-p="' + i + '" value="' + c.pct + '">' +
                    '<span>%</span>' +
                    '<button class="x" data-d="' + i + '">✕</button>' +
                '</div>' +
                '<div class="sub">' +
                    'Plan ' + MT.money(planned) +
                    ' · Spent ' + MT.money(used) +
                    ' · Left ' + MT.money(planned - used) +
                '</div>' +
                '<div class="bar"><i class="' + (used > planned ? 'over' : '') + '" style="width:' + width + '%"></i></div>' +
            '</div>';
    }).join('');
}

// ---------- Rename a category or change its percentage ----------
document.addEventListener('change', function (e) {
    const nameIndex = e.target.dataset.n;
    const pctIndex = e.target.dataset.p;

    if (nameIndex !== undefined) {
        const oldName = cats[nameIndex].name;
        const newName = e.target.value.trim() || oldName;

        // Keep past expenses attached to the renamed category
        MT.data.transactions.forEach(function (t) {
            if (t.type === 'expense' && t.category === oldName) {
                t.category = newName;
            }
        });

        cats[nameIndex].name = newName;
    }

    if (pctIndex !== undefined) {
        cats[pctIndex].pct = Math.max(0, Number(e.target.value) || 0);
    }

    MT.save();
    draw();
});

// ---------- Delete a category ----------
document.addEventListener('click', function (e) {
    const index = e.target.dataset.d;

    if (index !== undefined && confirm('Delete category? Its past transactions stay but lose their budget.')) {
        cats.splice(index, 1);
        MT.save();
        draw();
    }
});

// ---------- Add a category ----------
$('add').onclick = function () {
    const name = prompt('Category name?');

    if (name) {
        cats.push({ name: name.trim(), pct: 0 });
        MT.save();
        draw();
    }
};

draw();
