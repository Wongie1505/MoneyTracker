/*
 * settings.js
 * Edit estimated income, back up / restore data, reset the app.
 */

MT.guard();

$('est').value = MT.data.settings.estIncome;

// ---------- Save estimated income ----------
$('saveEst').onclick = function () {
    MT.data.settings.estIncome = Number($('est').value) || 0;
    MT.save();
    alert('Saved.');
};

// ---------- Export backup ----------
$('exp').onclick = MT.exportJSON;

// ---------- Import backup ----------
$('imp').onclick = function () {
    $('file').click();
};

$('file').onchange = function (e) {
    const file = e.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function () {
        try {
            MT.importJSON(reader.result);
            alert('Restored.');
            location.href = '../home/home.html';
        } catch (err) {
            alert('That file is not a valid backup.');
        }
    };

    reader.readAsText(file);
};

// ---------- Delete everything ----------
$('reset').onclick = function () {
    if (confirm('Delete everything? Export a backup first.')) {
        MT.reset();
        location.href = '../index.html';
    }
};
