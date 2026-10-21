/*
 * Money Tracker (vanilla version)
 * Tracks income and expenses and shows them against a 10-15-70 budget.
 * All data is stored in localStorage on this device.
 */

// =====================================================
// Settings you may want to change
// =====================================================
const STORAGE_KEY = 'money_tracker_state_vanilla';
const LOW_BALANCE = 10000;

const EXPENSE_CATEGORIES = ['food', 'airtime', 'transport', 'rent', 'utilities', 'giving', 'savings', 'other'];
const INCOME_CATEGORIES = ['family', 'friends', 'gigs', 'other'];

// Pie chart colours per expense category
const CATEGORY_COLORS = {
    food: '#6f8f72',
    airtime: '#d1a54a',
    transport: '#5f8aa8',
    rent: '#b5584a',
    utilities: '#8d6fa8',
    giving: '#c98b5a',
    savings: '#3f7f6d',
    other: '#9a9a8f'
};

// The 10-15-70 budget.
// "goal"  = you want to reach the target (giving, savings)
// "limit" = you want to stay under the target (living)
// "categories: null" means every category not claimed by another bucket.
// The percentages add up to 95, so the last 5% is shown as an unplanned buffer.
const BUDGET = [
    { label: 'Giving',  percent: 10, kind: 'goal',  categories: ['giving'] },
    { label: 'Savings', percent: 15, kind: 'goal',  categories: ['savings'] },
    { label: 'Living',  percent: 70, kind: 'limit', categories: null }
];

// =====================================================
// Small helpers
// =====================================================
let transactionType = 'expense';
let deferredInstallPrompt = null;

function $(id) {
    return document.getElementById(id);
}

function money(value) {
    return 'MWK ' + Math.round(value).toLocaleString('en-US');
}

function titleCase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

// Stops user text from breaking the page
function escapeHtml(value) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    };

    return String(value).replace(/[&<>'"]/g, function (char) {
        return map[char];
    });
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// Shows the small pop-up message
function notify(message) {
    const toast = $('toast');

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(notify.timer);
    notify.timer = setTimeout(function () {
        toast.classList.remove('show');
    }, 2600);
}

function sumAmounts(list) {
    return list.reduce(function (total, t) {
        return total + t.amount;
    }, 0);
}

// =====================================================
// Saved data
// =====================================================
function blankState() {
    return {
        initialBalance: 0,
        monthlyIncome: 0,
        transactions: [],
        lastNotificationTime: 0
    };
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (saved && Array.isArray(saved.transactions)) {
            // Merge with defaults so older saves get any new fields
            return Object.assign(blankState(), saved);
        }
    } catch (error) {
        // Corrupt data: fall through to a blank state
    }

    return blankState();
}

function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// =====================================================
// Calculations
// =====================================================
function balance(state) {
    const net = state.transactions.reduce(function (total, t) {
        return total + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

    return state.initialBalance + net;
}

// Sunday to Saturday of the week containing "date"
function weekBounds(date) {
    date = date || new Date();

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return [start, end];
}

function thisWeek(state) {
    const bounds = weekBounds();

    return state.transactions.filter(function (t) {
        return t.timestamp >= bounds[0].getTime() && t.timestamp <= bounds[1].getTime();
    });
}

function thisMonth(state) {
    const now = new Date();

    return state.transactions.filter(function (t) {
        const d = new Date(t.timestamp);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
}

function onlyType(list, type) {
    return list.filter(function (t) {
        return t.type === type;
    });
}

// Finds which budget bucket a category belongs to
function bucketFor(category) {
    const named = BUDGET.find(function (b) {
        return b.categories && b.categories.includes(category);
    });

    return named || BUDGET.find(function (b) {
        return b.categories === null;
    });
}

// =====================================================
// Drawing the screen
// =====================================================
function render() {
    const state = loadState();
    const currentBalance = balance(state);
    const week = thisWeek(state);
    const bounds = weekBounds();

    // Balance card
    $('balance').textContent = money(currentBalance);
    $('balance').classList.toggle('low', currentBalance <= LOW_BALANCE);
    $('balanceHint').textContent = currentBalance <= LOW_BALANCE
        ? 'Your balance is getting low.'
        : 'Keep checking where your money goes.';

    // Weekly numbers
    const weekIncome = sumAmounts(onlyType(week, 'income'));
    const weekSpent = sumAmounts(onlyType(week, 'expense'));
    const weekNet = weekIncome - weekSpent;

    $('weeklyIncome').textContent = money(weekIncome);
    $('weeklyExpenses').textContent = money(weekSpent);
    $('weeklyNet').textContent = (weekNet < 0 ? '−' : '') + money(Math.abs(weekNet));
    $('weeklyNet').className = weekNet < 0 ? 'expense' : (weekNet > 0 ? 'income' : '');
    $('weekRange').textContent = formatDate(bounds[0].getTime()) + ' – ' + formatDate(bounds[1].getTime());

    renderBudget(state);
    renderTransactions(state);
    renderBreakdown(week);
    renderHistory(state);
}

function renderBudget(state) {
    const income = state.monthlyIncome;
    const monthTx = thisMonth(state);
    const expenses = onlyType(monthTx, 'expense');

    $('monthName').textContent = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    // Nothing to compare against until an income is set
    if (!(income > 0)) {
        $('budgetList').innerHTML = '<p class="empty">Set your monthly income in Settings to see your budget.</p>';
        $('budgetSummary').textContent = '';
        return;
    }

    // Add up this month's spending per bucket
    const spentByBucket = {};

    expenses.forEach(function (t) {
        const bucket = bucketFor(t.category);
        spentByBucket[bucket.label] = (spentByBucket[bucket.label] || 0) + t.amount;
    });

    // One row per bucket
    $('budgetList').innerHTML = BUDGET.map(function (bucket) {
        const target = income * bucket.percent / 100;
        const spent = spentByBucket[bucket.label] || 0;
        const width = Math.min(spent / target * 100, 100);

        let barClass = '';
        let note = '';

        if (bucket.kind === 'limit') {
            barClass = spent > target ? 'over' : '';
            note = spent > target
                ? 'Over by ' + money(spent - target)
                : money(target - spent) + ' left to spend';
        } else {
            barClass = spent >= target ? 'done' : '';
            note = spent >= target
                ? 'Target reached'
                : money(target - spent) + ' to go';
        }

        return '' +
            '<div>' +
                '<div class="budget-head">' +
                    '<span>' + bucket.label + ' · ' + bucket.percent + '%</span>' +
                    '<strong>' + money(spent) + ' / ' + money(target) + '</strong>' +
                '</div>' +
                '<span class="bar"><i class="' + barClass + '" style="width:' + width + '%"></i></span>' +
                '<p class="budget-note">' + note + '</p>' +
            '</div>';
    }).join('');

    // Summary line: buffer, and money in vs out
    const planned = BUDGET.reduce(function (total, b) {
        return total + b.percent;
    }, 0);

    const bufferPercent = 100 - planned;
    const received = sumAmounts(onlyType(monthTx, 'income'));
    const spentTotal = sumAmounts(expenses);

    $('budgetSummary').textContent =
        'Unplanned buffer (' + bufferPercent + '%): ' + money(income * bufferPercent / 100) +
        ' · Received ' + money(received) + ' · Spent ' + money(spentTotal);
}

function renderTransactions(state) {
    const latest = state.transactions
        .slice()
        .sort(function (a, b) {
            return b.timestamp - a.timestamp;
        })
        .slice(0, 8);

    if (!latest.length) {
        $('transactions').innerHTML = '<p class="empty">No transactions yet.</p>';
        return;
    }

    $('transactions').innerHTML = latest.map(function (t) {
        const sign = t.type === 'income' ? '+' : '−';

        return '' +
            '<article class="transaction">' +
                '<div class="transaction-info">' +
                    '<p class="transaction-title">' + escapeHtml(t.title) + '</p>' +
                    '<p class="transaction-meta">' + titleCase(escapeHtml(t.category)) + ' · ' + formatDate(t.timestamp) + '</p>' +
                '</div>' +
                '<div class="transaction-right">' +
                    '<div class="transaction-amount ' + t.type + '">' + sign + money(t.amount) + '</div>' +
                    '<button class="delete-button" data-delete="' + escapeHtml(t.id) + '" type="button">Delete</button>' +
                '</div>' +
            '</article>';
    }).join('');
}

// Pie chart and legend of this week's expenses by category
function renderBreakdown(week) {
    const totals = {};

    onlyType(week, 'expense').forEach(function (t) {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
    });

    const entries = Object.entries(totals).sort(function (a, b) {
        return b[1] - a[1];
    });

    if (!entries.length) {
        $('weekPie').classList.add('hidden');
        $('categoryBreakdown').innerHTML = '<p class="empty">Add expenses to see your categories.</p>';
        return;
    }

    const total = entries.reduce(function (sum, entry) {
        return sum + entry[1];
    }, 0);

    // Build the pie slices as a conic-gradient
    let start = 0;

    const slices = entries.map(function (entry, index) {
        const isLast = index === entries.length - 1;
        const end = isLast ? 100 : start + entry[1] / total * 100;
        const slice = colorFor(entry[0]) + ' ' + start + '% ' + end + '%';

        start = end;
        return slice;
    });

    $('weekPie').style.background = 'conic-gradient(' + slices.join(', ') + ')';
    $('weekPie').classList.remove('hidden');

    // Legend: colour dot, category, amount, share of the week
    $('categoryBreakdown').innerHTML = entries.map(function (entry) {
        const percent = Math.round(entry[1] / total * 100);

        return '' +
            '<div class="breakdown-row">' +
                '<span class="legend-dot" style="background:' + colorFor(entry[0]) + '"></span>' +
                '<span>' + titleCase(escapeHtml(entry[0])) + '</span>' +
                '<strong>' + money(entry[1]) + '</strong>' +
                '<span class="legend-pct">' + percent + '%</span>' +
            '</div>';
    }).join('');
}

function colorFor(category) {
    return CATEGORY_COLORS[category] || '#9a9a8f';
}

// One row for every earlier week that has activity, newest first
function renderHistory(state) {
    const currentStart = weekBounds()[0].getTime();
    const weeks = {};

    state.transactions.forEach(function (t) {
        const start = weekBounds(new Date(t.timestamp))[0].getTime();

        // The current week is shown above, so skip it here
        if (start >= currentStart) {
            return;
        }

        if (!weeks[start]) {
            weeks[start] = { income: 0, spent: 0 };
        }

        if (t.type === 'income') {
            weeks[start].income += t.amount;
        } else {
            weeks[start].spent += t.amount;
        }
    });

    const starts = Object.keys(weeks).map(Number).sort(function (a, b) {
        return b - a;
    });

    if (!starts.length) {
        $('weekHistory').innerHTML = '<p class="empty">Earlier weeks will appear here.</p>';
        return;
    }

    $('weekHistory').innerHTML = starts.map(function (start) {
        const week = weeks[start];
        const net = week.income - week.spent;

        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        return '' +
            '<div class="history-row">' +
                '<div class="history-range">' + formatDate(start) + ' – ' + formatDate(end.getTime()) + '</div>' +
                '<div class="history-nums">' +
                    '<span class="income">+' + money(week.income) + '</span>' +
                    '<span class="expense">−' + money(week.spent) + '</span>' +
                    '<strong class="' + (net < 0 ? 'expense' : 'income') + '">Net ' + (net < 0 ? '−' : '') + money(Math.abs(net)) + '</strong>' +
                '</div>' +
            '</div>';
    }).join('');
}

// =====================================================
// Entry form: expense or income wording and categories
// =====================================================
function applyType() {
    const isIncome = transactionType === 'income';
    const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    $('entryHeading').textContent = isIncome ? 'Where did money come from?' : 'Where did money go?';
    $('titleLabel').textContent = isIncome ? 'Details' : 'What was it for?';
    $('categoryLabel').textContent = isIncome ? 'From' : 'Category';
    $('title').placeholder = isIncome ? 'e.g. pocket money, logo gig' : 'e.g. lunch, airtime';

    $('category').innerHTML = categories.map(function (c) {
        return '<option value="' + c + '">' + titleCase(c) + '</option>';
    }).join('');
}

// =====================================================
// Adding and deleting transactions
// =====================================================
function addTransaction(event) {
    event.preventDefault();

    const title = $('title').value.trim();
    const amount = Number($('amount').value);
    const category = $('category').value;

    if (!title || !Number.isFinite(amount) || amount <= 0) {
        notify('Enter a description and a valid amount.');
        return;
    }

    const state = loadState();

    state.transactions.push({
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        title: title.toLowerCase(),
        amount: Math.abs(amount),
        type: transactionType,
        category: category,
        timestamp: Date.now()
    });

    saveState(state);

    // Clear the form but keep the chosen category
    $('transactionForm').reset();
    $('category').value = category;

    render();
    notify((transactionType === 'expense' ? 'Expense' : 'Income') + ' saved.');
    $('title').focus();
}

function deleteTransaction(event) {
    const id = event.target.dataset.delete;

    if (!id) {
        return;
    }

    const state = loadState();

    state.transactions = state.transactions.filter(function (t) {
        return t.id !== id;
    });

    saveState(state);
    render();
    notify('Transaction deleted.');
}

// =====================================================
// Export and import
// =====================================================
function download(filename, content, type) {
    const blob = new Blob([content], { type: type });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    URL.revokeObjectURL(link.href);
}

function exportJson() {
    download('money-tracker-backup.json', JSON.stringify(loadState(), null, 2), 'application/json');
}

function csvEscape(value) {
    return '"' + String(value).replace(/"/g, '""') + '"';
}

function exportCsv() {
    const state = loadState();
    let running = state.initialBalance;

    const rows = [['Date', 'Time', 'Title', 'Amount', 'Type', 'Category', 'Balance']];

    // Oldest first so the running balance makes sense
    state.transactions
        .slice()
        .sort(function (a, b) {
            return a.timestamp - b.timestamp;
        })
        .forEach(function (t) {
            running += t.type === 'income' ? t.amount : -t.amount;

            const d = new Date(t.timestamp);

            rows.push([
                d.toISOString().slice(0, 10),
                d.toTimeString().slice(0, 8),
                t.title,
                t.amount,
                t.type,
                t.category,
                running.toFixed(2)
            ]);
        });

    const csv = rows.map(function (row) {
        return row.map(csvEscape).join(',');
    }).join('\n');

    download('money-tracker-export.csv', csv, 'text/csv');
}

// Turns CSV text into a list of transactions
function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);

    if (lines.length < 2) {
        throw new Error('CSV has no rows.');
    }

    // Skip the header row
    return lines.slice(1).map(function (line, index) {
        const parts = line
            .match(/("(?:[^"]|"")*"|[^,]*)/g)
            .filter(Boolean)
            .slice(0, 7)
            .map(function (value) {
                return value.replace(/^"|"$/g, '').replace(/""/g, '"');
            });

        const date = parts[0];
        const time = parts[1];
        const title = parts[2];
        const amount = parts[3];
        const type = parts[4];
        const category = parts[5];

        return {
            id: 'import_' + Date.now() + '_' + index,
            title: title.toLowerCase().trim(),
            amount: Math.abs(Number(amount)),
            type: type.trim(),
            category: (category || 'other').toLowerCase().trim(),
            timestamp: new Date(date + 'T' + time).getTime()
        };
    }).filter(function (t) {
        return t.title
            && Number.isFinite(t.amount)
            && (t.type === 'income' || t.type === 'expense')
            && Number.isFinite(t.timestamp);
    });
}

async function importFile(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    try {
        const text = await file.text();

        if (file.name.toLowerCase().endsWith('.json')) {
            // JSON backup replaces everything
            const imported = JSON.parse(text);

            if (!Array.isArray(imported.transactions)) {
                throw new Error('Invalid JSON backup.');
            }

            saveState({
                initialBalance: Number(imported.initialBalance) || 0,
                monthlyIncome: Number(imported.monthlyIncome) || 0,
                transactions: imported.transactions,
                lastNotificationTime: Number(imported.lastNotificationTime) || 0
            });
        } else {
            // CSV rows are added to what you already have
            const state = loadState();
            state.transactions.push(...parseCsv(text));
            saveState(state);
        }

        render();
        notify('Data imported.');
    } catch (error) {
        notify(error.message || 'Could not import that file.');
    }

    // Allow picking the same file again
    event.target.value = '';
}

// =====================================================
// Settings buttons
// =====================================================

// Asks for an amount and saves it into one field of the state
function askForAmount(question, field, doneMessage) {
    const state = loadState();
    const value = prompt(question, String(state[field] || ''));

    if (value === null) {
        return;
    }

    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) {
        notify('Please enter a valid amount.');
        return;
    }

    state[field] = amount;
    saveState(state);
    render();
    notify(doneMessage);
}

function clearAll() {
    if (confirm('Delete all transactions and reset your balance and income?')) {
        localStorage.removeItem(STORAGE_KEY);
        render();
        notify('All data cleared.');
    }
}

// =====================================================
// Weekly reminder (only fires while the app is open)
// =====================================================
function checkReminder() {
    const now = new Date();
    const state = loadState();
    const lastReminder = Number(state.lastNotificationTime || 0);
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    // Saturday after 8pm, at most once a week
    const due = now.getDay() === 6 && now.getHours() >= 20 && (Date.now() - lastReminder) >= oneWeek;

    if (!due) {
        return;
    }

    const spent = sumAmounts(onlyType(thisWeek(state), 'expense'));
    const message = 'You spent ' + money(spent) + ' this week.';

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Money Tracker reminder', { body: message });
    } else {
        notify('Weekly check-in: ' + message);
    }

    state.lastNotificationTime = Date.now();
    saveState(state);
}

// =====================================================
// Start up
// =====================================================

// Set up the entry form for the default type (expense)
applyType();

// Form and list
$('transactionForm').addEventListener('submit', addTransaction);
$('transactions').addEventListener('click', deleteTransaction);

// Expense / Income switch
document.querySelectorAll('.type-button').forEach(function (button) {
    button.addEventListener('click', function () {
        transactionType = button.dataset.type;

        document.querySelectorAll('.type-button').forEach(function (b) {
            b.classList.toggle('active', b === button);
        });

        applyType();
    });
});

// Settings
$('monthlyIncomeButton').addEventListener('click', function () {
    askForAmount('Your estimated monthly income in MWK:', 'monthlyIncome', 'Monthly income saved.');
});

$('startingBalanceButton').addEventListener('click', function () {
    askForAmount('Starting balance in MWK:', 'initialBalance', 'Starting balance saved.');
});

$('exportJsonButton').addEventListener('click', exportJson);
$('exportCsvButton').addEventListener('click', exportCsv);
$('importFile').addEventListener('change', importFile);
$('clearButton').addEventListener('click', clearAll);

// Install button (shown when the browser says the app can be installed)
window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    $('installButton').classList.remove('hidden');
});

$('installButton').addEventListener('click', async function () {
    if (!deferredInstallPrompt) {
        return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;

    deferredInstallPrompt = null;
    $('installButton').classList.add('hidden');
});

// Ask for notification permission on the first tap
if ('Notification' in window && Notification.permission === 'default') {
    document.addEventListener('click', function () {
        Notification.requestPermission();
    }, { once: true });
}

render();
checkReminder();
setInterval(checkReminder, 60000);