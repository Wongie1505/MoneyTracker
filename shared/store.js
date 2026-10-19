/*
 * store.js
 * The single source of truth for MoneyTracker.
 * Only transactions, categories and settings are stored.
 * Every total and average is calculated from them, never saved.
 */

// Shortcut for document.getElementById
const $ = function (id) {
    return document.getElementById(id);
};

const MT = (function () {

    const STORAGE_KEY = 'moneytracker_v1';

    // Starting data for a new user
    const DEFAULT_DATA = {
        settings: {
            onboarded: false,
            estIncome: 0
        },
        categories: [
            { name: 'Giving',      pct: 10 },
            { name: 'Basic needs', pct: 50 },
            { name: 'Savings',     pct: 15 },
            { name: 'Transport',   pct: 10 },
            { name: 'Personal',    pct: 10 },
            { name: 'Other',       pct: 5 }
        ],
        transactions: []
    };

    let data;

    // ---------- Load from localStorage ----------
    try {
        data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
        // Ignore and fall back to defaults
    }

    if (!data) {
        data = structuredClone(DEFAULT_DATA);
    }

    // ---------- Saving ----------
    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // ---------- Date helpers ----------

    // Today as YYYY-MM-DD in the user's local time
    function today() {
        const offset = new Date().getTimezoneOffset() * 60000;
        return new Date(Date.now() - offset).toISOString().slice(0, 10);
    }

    // "2026-10-19" becomes "2026-10"
    function month(dateString) {
        return dateString.slice(0, 7);
    }

    // ---------- Formatting ----------
    function money(amount) {
        return 'MK ' + Math.round(amount).toLocaleString();
    }

    // Stops user text from breaking the page (XSS safety)
    function esc(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return String(text).replace(/[&<>"']/g, function (char) {
            return map[char];
        });
    }

    // ---------- Calculations ----------

    // All transactions that fall in a given month ("YYYY-MM")
    function monthTx(m) {
        return data.transactions.filter(function (t) {
            return month(t.date) === m;
        });
    }

    // Total of one type ("income" or "expense") in a list
    function sum(list, type) {
        return list
            .filter(function (t) {
                return t.type === type;
            })
            .reduce(function (total, t) {
                return total + t.amount;
            }, 0);
    }

    // Spending ceiling for a month.
    // Uses the average of the last 3 months of real income when there are
    // at least 2 such months, otherwise falls back to the launch estimate.
    function incomeBase(m) {
        m = m || month(today());

        const incomeByMonth = {};

        data.transactions.forEach(function (t) {
            if (t.type === 'income' && month(t.date) < m) {
                const key = month(t.date);
                incomeByMonth[key] = (incomeByMonth[key] || 0) + t.amount;
            }
        });

        const lastMonths = Object.keys(incomeByMonth).sort().slice(-3);

        if (lastMonths.length >= 2) {
            const total = lastMonths.reduce(function (a, k) {
                return a + incomeByMonth[k];
            }, 0);

            return {
                amount: total / lastMonths.length,
                source: 'average of your last ' + lastMonths.length + ' months',
                actual: true
            };
        }

        return {
            amount: data.settings.estIncome,
            source: 'your estimate',
            actual: false
        };
    }

    // Expense totals per category for a month, e.g. { Giving: 5000 }
    function spentByCat(m) {
        const totals = {};

        monthTx(m).forEach(function (t) {
            if (t.type === 'expense') {
                totals[t.category] = (totals[t.category] || 0) + t.amount;
            }
        });

        return totals;
    }

    // ---------- Shared UI ----------

    // HTML for one transaction row. Pass true as the 2nd argument to show a delete button
    function txRow(t, showDelete) {
        const isIncome = t.type === 'income';
        const sign = isIncome ? '+' : '-';
        const colour = isIncome ? 'pos' : 'neg';

        let deleteBtn = '';
        if (showDelete) {
            deleteBtn = '<button class="x" data-id="' + t.id + '">✕</button>';
        }

        return '' +
            '<div class="tx">' +
                '<div>' +
                    '<b>' + esc(t.note || t.category) + '</b>' +
                    '<span class="sub">' + esc(t.category) + ' · ' + t.date + '</span>' +
                '</div>' +
                '<div class="row">' +
                    '<b class="' + colour + '">' + sign + money(t.amount) + '</b>' +
                    deleteBtn +
                '</div>' +
            '</div>';
    }

    // Send new users to onboarding
    function guard() {
        if (!data.settings.onboarded) {
            location.replace('../onboarding/onboarding.html');
        }
    }

    // ---------- Backup ----------
    function exportJSON() {
        const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');

        link.href = URL.createObjectURL(file);
        link.download = 'moneytracker-backup-' + today() + '.json';
        link.click();
    }

    // Throws if the file is not a valid MoneyTracker backup
    function importJSON(text) {
        const parsed = JSON.parse(text);

        if (!parsed.settings || !parsed.transactions || !parsed.categories) {
            throw new Error('Invalid backup');
        }

        data = parsed;
        save();
    }

    function reset() {
        data = structuredClone(DEFAULT_DATA);
        save();
    }

    // ---------- Offline support (only works when hosted) ----------
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('../sw.js');
    }

    // ---------- Public API ----------
    return {
        get data() { return data; },
        save: save,
        today: today,
        month: month,
        money: money,
        esc: esc,
        monthTx: monthTx,
        sum: sum,
        incomeBase: incomeBase,
        spentByCat: spentByCat,
        txRow: txRow,
        guard: guard,
        exportJSON: exportJSON,
        importJSON: importJSON,
        reset: reset
    };

})();
