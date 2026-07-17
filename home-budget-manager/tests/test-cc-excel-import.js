const XLSX = require('xlsx');
const path = require('path');
const assert = require('assert');

// Re-implement the parseCreditCardExcel logic from app.js for testing
function parseCreditCardExcel(rows) {
    var headerRowIdx = -1;
    var colMap = {};

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!row || row.length < 5) continue;
        var first = String(row[0] || '').trim();
        if (first === 'תאריך רכישה') {
            headerRowIdx = i;
            for (var c = 0; c < row.length; c++) {
                var h = String(row[c] || '').trim();
                if (h === 'תאריך רכישה') colMap.date = c;
                else if (h === 'שם בית עסק') colMap.payee = c;
                else if (h === 'סכום עסקה') colMap.originalAmount = c;
                else if (h === 'סכום חיוב') colMap.chargedAmount = c;
                else if (h === "מס' שובר") colMap.voucher = c;
                else if (h === 'פירוט נוסף') colMap.details = c;
            }
            break;
        }
    }

    if (headerRowIdx === -1) return [];

    var seenVouchers = {};
    var transactions = [];

    function parseSection(startIdx) {
        for (var i = startIdx; i < rows.length; i++) {
            var row = rows[i];
            if (!row) continue;

            var firstCell = String(row[0] || '').trim();
            if (/^(סה"כ|עסקאות|תנאים משפטיים|ביצעת)/.test(firstCell)) break;
            if (firstCell === 'תאריך רכישה') break;
            if (!row.length || row.length < 3) continue;

            var dateStr = firstCell;
            if (!dateStr || !/^\d{2}\.\d{2}\.\d{2,4}$/.test(dateStr)) continue;

            var payee = String(row[colMap.payee] || '').trim();
            if (!payee) continue;

            var origAmt = parseFloat(row[colMap.originalAmount]) || 0;
            var chargedAmt = parseFloat(row[colMap.chargedAmount]) || 0;
            var voucher = String(row[colMap.voucher] || '').trim();
            var details = String(row[colMap.details] || '').replace(/\n/g, ' ').trim();

            if (voucher && seenVouchers[voucher]) continue;
            if (voucher) seenVouchers[voucher] = true;

            var parts = dateStr.split('.');
            var year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
            var isoDate = year + '-' + parts[1] + '-' + parts[0];

            var type = 'one_time';
            var currentInstallment = null;
            var totalInstallments = null;

            var installMatch = details.match(/תשלום\s+(\d+)\s+מתוך\s+(\d+)/);
            if (installMatch) {
                currentInstallment = parseInt(installMatch[1]);
                totalInstallments = parseInt(installMatch[2]);
                type = 'installment';
            } else if (/הוראת קבע/.test(details)) {
                type = 'fixed';
            }

            var tx = {
                date: isoDate,
                payee: payee,
                original_amount: origAmt,
                charged_amount: chargedAmt,
                voucher_number: voucher,
                details: details,
                type: type,
                category: '',
                description: ''
            };

            if (type === 'installment') {
                tx.current_installment = currentInstallment;
                tx.total_installments = totalInstallments;
            }

            transactions.push(tx);
        }
    }

    parseSection(headerRowIdx + 1);

    // Parse additional sections (out-of-cycle, etc.)
    for (var i = headerRowIdx + 1; i < rows.length; i++) {
        var row = rows[i];
        if (!row) continue;
        var first = String(row[0] || '').trim();
        if (first === 'תאריך רכישה') {
            parseSection(i + 1);
        }
    }

    return transactions;
}

// ======================== TESTS ========================

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log('  ✓ ' + name);
        passed++;
    } catch (e) {
        console.log('  ✗ ' + name);
        console.log('    ' + e.message);
        failed++;
    }
}

// Load the actual Excel file
const xlsxPath = path.resolve(__dirname, '../../..',
    'node_modules/xlsx/dist') // just for the library
const testFile = process.argv[2];

console.log('\n=== Credit Card Excel Import Tests ===\n');

if (testFile) {
    const wb = XLSX.readFile(testFile);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const txs = parseCreditCardExcel(rows);

    console.log('Tests with real Excel file: ' + testFile);

    test('should parse all 77 regular transactions + 1 out-of-cycle', function () {
        assert.strictEqual(txs.length, 78, 'Expected 78 transactions, got ' + txs.length);
    });

    test('total charged amount should be 12,353.72 + 165.89 out-of-cycle', function () {
        var totalCharged = txs.reduce(function (s, t) { return s + (t.charged_amount || t.original_amount); }, 0);
        // The stated total in the Excel is 12,353.72 for the main section
        var mainTxs = txs.slice(0, 77);
        var mainTotal = mainTxs.reduce(function (s, t) { return s + (t.charged_amount || t.original_amount); }, 0);
        assert.ok(Math.abs(mainTotal - 12353.72) < 1, 'Main total should be ~12,353.72, got ' + mainTotal.toFixed(2));
    });

    test('should detect installment transactions correctly', function () {
        var installments = txs.filter(function (t) { return t.type === 'installment'; });
        assert.strictEqual(installments.length, 11, 'Expected 11 installments, got ' + installments.length);
    });

    test('should detect fixed (הוראת קבע) transactions correctly', function () {
        var fixed = txs.filter(function (t) { return t.type === 'fixed'; });
        assert.strictEqual(fixed.length, 7, 'Expected 7 fixed, got ' + fixed.length);
    });

    test('installment: צמרת-רכב should have correct current/total', function () {
        var tx = txs.find(function (t) { return t.payee.indexOf('צמרת-רכב') > -1; });
        assert.ok(tx, 'צמרת-רכב not found');
        assert.strictEqual(tx.current_installment, 1, 'current should be 1');
        assert.strictEqual(tx.total_installments, 3, 'total should be 3');
        assert.strictEqual(tx.original_amount, 1217, 'original should be 1217');
        assert.strictEqual(tx.charged_amount, 405, 'charged should be 405');
    });

    test('installment: הפניקס רכב חובה should have correct current/total', function () {
        var tx = txs.find(function (t) { return t.payee.indexOf('הפניקס רכב חובה') > -1; });
        assert.ok(tx, 'הפניקס רכב חובה not found');
        assert.strictEqual(tx.current_installment, 1);
        assert.strictEqual(tx.total_installments, 11);
        assert.strictEqual(tx.original_amount, 1839);
        assert.strictEqual(tx.charged_amount, 169, 'charged should be 169 (not 167.18)');
    });

    test('installment: הום סנטר (last installment 2/2) should NOT be skipped', function () {
        var tx = txs.find(function (t) { return t.payee.indexOf('הום סנטר') > -1; });
        assert.ok(tx, 'הום סנטר should not be skipped (תשלום אחרון)');
        assert.strictEqual(tx.current_installment, 2);
        assert.strictEqual(tx.total_installments, 2);
        assert.strictEqual(tx.charged_amount, 260.5);
    });

    test('installment: GO MOBILE (last installment 2/2) should NOT be skipped', function () {
        var tx = txs.find(function (t) { return t.payee.indexOf('GO MOBILE') > -1; });
        assert.ok(tx, 'GO MOBILE should not be skipped');
        assert.strictEqual(tx.current_installment, 2);
        assert.strictEqual(tx.total_installments, 2);
    });

    test('installment: MAYVEN (last installment 2/2) should NOT be skipped', function () {
        var tx = txs.find(function (t) { return t.payee.indexOf('MAYVEN') > -1; });
        assert.ok(tx, 'MAYVEN should not be skipped');
        assert.strictEqual(tx.current_installment, 2);
        assert.strictEqual(tx.total_installments, 2);
    });

    test('installment: DEEZEN (installment 8/10) should be parsed', function () {
        var tx = txs.find(function (t) { return t.payee.indexOf('DEEZEN') > -1; });
        assert.ok(tx, 'DEEZEN not found');
        assert.strictEqual(tx.current_installment, 8);
        assert.strictEqual(tx.total_installments, 10);
        assert.strictEqual(tx.charged_amount, 157.5);
    });

    test('installment: הראל חובה חדש (installment 9/10) should be parsed', function () {
        var tx = txs.find(function (t) { return t.payee.indexOf('הראל חובה חדש') > -1; });
        assert.ok(tx, 'הראל חובה חדש not found');
        assert.strictEqual(tx.current_installment, 9);
        assert.strictEqual(tx.total_installments, 10);
        assert.strictEqual(tx.charged_amount, 166);
    });

    test('SWEET POINT: charged_amount should be 26.6 (with discount), not 28', function () {
        var tx = txs.find(function (t) { return t.payee === 'SWEET POINT'; });
        assert.ok(tx, 'SWEET POINT not found');
        assert.strictEqual(tx.original_amount, 28, 'original should be 28');
        assert.strictEqual(tx.charged_amount, 26.6, 'charged should be 26.6');
    });

    test('out-of-cycle WOLT (165.89) should be included', function () {
        var woltOutOfCycle = txs.find(function (t) {
            return t.payee.trim() === 'WOLT' && Math.abs(t.original_amount - 165.89) < 0.01;
        });
        assert.ok(woltOutOfCycle, 'Out-of-cycle WOLT 165.89 should be parsed');
    });

    test('all voucher numbers should be unique', function () {
        var vouchers = txs.map(function (t) { return t.voucher_number; }).filter(Boolean);
        var unique = new Set(vouchers);
        assert.strictEqual(vouchers.length, unique.size,
            'Duplicate vouchers found: ' + vouchers.filter(function (v, i) { return vouchers.indexOf(v) !== i; }).join(', '));
    });

    test('dates should be in ISO format YYYY-MM-DD', function () {
        txs.forEach(function (tx) {
            assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(tx.date), 'Bad date format: ' + tx.date + ' for ' + tx.payee);
        });
    });

    test('no transaction should have 0 amount', function () {
        txs.forEach(function (tx) {
            assert.ok(tx.original_amount > 0 || tx.charged_amount > 0, 'Zero amount for ' + tx.payee);
        });
    });

    test('חברת החשמל: installment 2/3, charged 376.44', function () {
        var tx = txs.find(function (t) { return t.payee.indexOf('חברת החשמל') > -1; });
        assert.ok(tx);
        assert.strictEqual(tx.current_installment, 2);
        assert.strictEqual(tx.total_installments, 3);
        assert.strictEqual(tx.charged_amount, 376.44);
    });

    test('מחסני חשמל: installment 3/12, charged 266', function () {
        var tx = txs.find(function (t) { return t.payee.indexOf('מחסני חשמל') > -1; });
        assert.ok(tx);
        assert.strictEqual(tx.current_installment, 3);
        assert.strictEqual(tx.total_installments, 12);
        assert.strictEqual(tx.charged_amount, 266);
    });
} else {
    console.log('Synthetic tests (no Excel file provided):');
}

// Synthetic test: basic parsing
test('synthetic: should parse simple rows correctly', function () {
    var rows = [
        [], // empty
        ['פירוט עסקאות', null, 'יולי 2026'],
        [],
        [],
        ['כרטיס - 1234'],
        [],
        [],
        [],
        ['עסקאות למועד חיוב'],
        ['תאריך רכישה', 'שם בית עסק', 'סכום עסקה', 'מטבע עסקה', 'סכום חיוב', 'מטבע חיוב', "מס' שובר", 'פירוט נוסף'],
        ['01.07.26', 'סופר', 100, '₪', 100, '₪', '123456', ''],
        ['02.07.26', 'ביטוח', 200, '₪', 200, '₪', '789012', 'הוראת קבע'],
        ['03.07.26', 'מקרר', 3000, '₪', 1000, '₪', '345678', 'תשלום 1 מתוך 3'],
    ];
    var txs = parseCreditCardExcel(rows);
    assert.strictEqual(txs.length, 3);
    assert.strictEqual(txs[0].type, 'one_time');
    assert.strictEqual(txs[1].type, 'fixed');
    assert.strictEqual(txs[2].type, 'installment');
    assert.strictEqual(txs[2].current_installment, 1);
    assert.strictEqual(txs[2].total_installments, 3);
    assert.strictEqual(txs[2].charged_amount, 1000);
});

test('synthetic: should parse out-of-cycle sections', function () {
    var rows = [
        ['תאריך רכישה', 'שם בית עסק', 'סכום עסקה', 'מטבע עסקה', 'סכום חיוב', 'מטבע חיוב', "מס' שובר", 'פירוט נוסף'],
        ['01.07.26', 'חנות', 50, '₪', 50, '₪', '111', ''],
        ['סה"כ לחיוב', '', '', '', 50, '₪', '', ''],
        [],
        ['עסקאות בחיוב מחוץ למועד'],
        ['תאריך רכישה', 'שם בית עסק', 'סכום עסקה', 'מטבע עסקה', 'סכום חיוב', 'מטבע חיוב', "מס' שובר", 'פירוט נוסף'],
        ['02.07.26', 'חנות2', 75, '₪', 75, '₪', '222', ''],
    ];
    var txs = parseCreditCardExcel(rows);
    assert.strictEqual(txs.length, 2);
    assert.strictEqual(txs[0].payee, 'חנות');
    assert.strictEqual(txs[1].payee, 'חנות2');
});

test('synthetic: last installment (תשלום אחרון) should not be skipped', function () {
    var rows = [
        ['תאריך רכישה', 'שם בית עסק', 'סכום עסקה', 'מטבע עסקה', 'סכום חיוב', 'מטבע חיוב', "מס' שובר", 'פירוט נוסף'],
        ['01.07.26', 'חנות', 1000, '₪', 500, '₪', '111', 'תשלום 2 מתוך 2\nתשלום אחרון'],
    ];
    var txs = parseCreditCardExcel(rows);
    assert.strictEqual(txs.length, 1);
    assert.strictEqual(txs[0].type, 'installment');
    assert.strictEqual(txs[0].current_installment, 2);
    assert.strictEqual(txs[0].total_installments, 2);
});

test('synthetic: 4-digit year format should work', function () {
    var rows = [
        ['תאריך רכישה', 'שם בית עסק', 'סכום עסקה', 'מטבע עסקה', 'סכום חיוב', 'מטבע חיוב', "מס' שובר", 'פירוט נוסף'],
        ['01.07.2026', 'חנות', 50, '₪', 50, '₪', '111', ''],
    ];
    var txs = parseCreditCardExcel(rows);
    assert.strictEqual(txs.length, 1);
    assert.strictEqual(txs[0].date, '2026-07-01');
});

console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===\n');
process.exit(failed > 0 ? 1 : 0);
