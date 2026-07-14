(function () {
    'use strict';

    const API = hbmData.apiUrl;
    const NONCE = hbmData.nonce;
    const CATEGORIES = hbmData.categories;

    let currentMonth = hbmData.currentMonth;
    let currentExpenseFilter = 'all';

    const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const TYPE_LABELS = { fixed: 'קבועה', installment: 'תשלומים', loan: 'הלוואה', saving: 'חיסכון', regular: 'שוטף' };

    function init() {
        if (!document.getElementById('hbm-app')) return;
        setupNavigation();
        setupMonthSelector();
        setupTabs();
        setupModals();
        loadDashboard();
    }

    function apiRequest(endpoint, method, data) {
        method = method || 'GET';
        var useMethod = method;
        var opts = {
            headers: { 'X-WP-Nonce': NONCE },
            credentials: 'same-origin',
        };

        var url = API + endpoint;

        if (method === 'GET' && data) {
            var params = new URLSearchParams();
            Object.keys(data).forEach(function (key) {
                if (data[key] !== null && data[key] !== undefined) {
                    params.append(key, data[key]);
                }
            });
            var separator = url.indexOf('?') !== -1 ? '&' : '?';
            url += separator + params.toString();
        } else if (method !== 'GET' && data) {
            opts.headers['Content-Type'] = 'application/json';
            var bodyData = Object.assign({}, data);
            if (method === 'PUT' || method === 'DELETE') {
                useMethod = 'POST';
                url += (url.indexOf('?') !== -1 ? '&' : '?') + '_method=' + method;
            }
            opts.body = JSON.stringify(bodyData);
        } else if (method === 'PUT' || method === 'DELETE') {
            useMethod = 'POST';
            url += (url.indexOf('?') !== -1 ? '&' : '?') + '_method=' + method;
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify({});
        }

        opts.method = useMethod;

        return fetch(url, opts).then(function (r) {
            if (!r.ok && r.status === 404) {
                console.error('HBM: API endpoint not found:', url);
                return { error: true, code: 'not_found', message: 'API endpoint not found' };
            }
            return r.json();
        }).then(function (json) {
            if (json && json.code && json.message && json.code !== 'not_found') {
                console.error('HBM API Error:', json.code, json.message);
            }
            return json;
        }).catch(function (err) {
            console.error('HBM fetch error:', err);
            return { error: true, message: err.message };
        });
    }

    function formatCurrency(amount) {
        return '₪' + Number(amount).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        var d = new Date(dateStr);
        return d.toLocaleDateString('he-IL');
    }

    function getMonthLabel(monthStr) {
        var parts = monthStr.split('-');
        return MONTHS_HE[parseInt(parts[1]) - 1] + ' ' + parts[0];
    }

    function getCategoryLabel(key) {
        return CATEGORIES[key] || key;
    }

    // Navigation
    function setupNavigation() {
        var links = document.querySelectorAll('.hbm-nav-links a');
        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                links.forEach(function (l) { l.classList.remove('active'); });
                link.classList.add('active');
                var page = link.getAttribute('data-page');
                showPage(page);
            });
        });
    }

    function showPage(page) {
        document.querySelectorAll('.hbm-page').forEach(function (p) { p.classList.remove('active'); });
        var el = document.getElementById('hbm-page-' + page);
        if (el) el.classList.add('active');

        switch (page) {
            case 'dashboard': loadDashboard(); break;
            case 'income': loadIncome(); break;
            case 'expenses': loadExpenses(); break;
            case 'allocations': loadAllocations(); break;
            case 'settings': loadSettings(); break;
        }
    }

    // Month Selector
    function setupMonthSelector() {
        document.getElementById('hbm-current-month').textContent = getMonthLabel(currentMonth);

        document.getElementById('hbm-prev-month').addEventListener('click', function () {
            changeMonth(-1);
        });
        document.getElementById('hbm-next-month').addEventListener('click', function () {
            changeMonth(1);
        });
    }

    function changeMonth(delta) {
        var parts = currentMonth.split('-');
        var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1 + delta, 1);
        currentMonth = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        document.getElementById('hbm-current-month').textContent = getMonthLabel(currentMonth);

        var activePage = document.querySelector('.hbm-nav-links a.active');
        if (activePage) showPage(activePage.getAttribute('data-page'));
    }

    // Tabs
    function setupTabs() {
        document.querySelectorAll('.hbm-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.hbm-tab').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                currentExpenseFilter = tab.getAttribute('data-type');
                loadExpenses();
            });
        });
    }

    // Modal
    function setupModals() {
        var modal = document.getElementById('hbm-modal');
        modal.querySelector('.hbm-modal-overlay').addEventListener('click', closeModal);
        modal.querySelector('.hbm-modal-close').addEventListener('click', closeModal);

        document.getElementById('hbm-add-income').addEventListener('click', function () {
            showIncomeForm();
        });
        document.getElementById('hbm-add-expense').addEventListener('click', function () {
            showExpenseForm();
        });
        document.getElementById('hbm-save-allocations').addEventListener('click', saveAllocations);
        document.getElementById('hbm-add-category').addEventListener('click', addCategory);
    }

    function openModal(title, content) {
        document.getElementById('hbm-modal-title').textContent = title;
        document.getElementById('hbm-modal-body').innerHTML = content;
        document.getElementById('hbm-modal').style.display = 'flex';
    }

    function closeModal() {
        document.getElementById('hbm-modal').style.display = 'none';
    }

    // Dashboard
    function loadDashboard() {
        apiRequest('dashboard', 'GET', { month: currentMonth }).then(function (data) {
            if (!data || data.error || data.code) return;
            document.getElementById('hbm-total-income').textContent = formatCurrency(data.total_income);
            document.getElementById('hbm-total-expenses').textContent = formatCurrency(data.total_expenses);
            document.getElementById('hbm-remaining').textContent = formatCurrency(data.remaining);
            document.getElementById('hbm-total-savings').textContent = formatCurrency(data.expenses_by_type.saving || 0);

            renderExpensesByType(data.expenses_by_type);
            renderExpensesByCategory(data.expenses_by_category);
            renderBudgetStatus(data.budget_status);
        });
    }

    function renderExpensesByType(data) {
        var container = document.getElementById('hbm-expenses-by-type');
        var total = Object.values(data).reduce(function (s, v) { return s + v; }, 0);
        var html = '';

        Object.keys(data).forEach(function (type) {
            if (data[type] <= 0) return;
            var pct = total > 0 ? (data[type] / total * 100) : 0;
            html += '<div class="hbm-category-row">' +
                '<span class="hbm-category-label"><span class="hbm-badge hbm-badge-' + type + '">' + TYPE_LABELS[type] + '</span></span>' +
                '<div class="hbm-category-bar"><div class="hbm-category-bar-fill" style="width:' + pct + '%"></div></div>' +
                '<span class="hbm-category-amount">' + formatCurrency(data[type]) + '</span>' +
                '</div>';
        });

        container.innerHTML = html || '<div class="hbm-empty-state"><p>אין נתונים להצגה</p></div>';
    }

    function renderExpensesByCategory(data) {
        var container = document.getElementById('hbm-expenses-by-category');
        var total = Object.values(data).reduce(function (s, v) { return s + v; }, 0);
        var sorted = Object.entries(data).sort(function (a, b) { return b[1] - a[1]; });
        var html = '';

        sorted.forEach(function (entry) {
            var pct = total > 0 ? (entry[1] / total * 100) : 0;
            html += '<div class="hbm-category-row">' +
                '<span class="hbm-category-label">' + getCategoryLabel(entry[0]) + '</span>' +
                '<div class="hbm-category-bar"><div class="hbm-category-bar-fill" style="width:' + pct + '%"></div></div>' +
                '<span class="hbm-category-amount">' + formatCurrency(entry[1]) + '</span>' +
                '</div>';
        });

        container.innerHTML = html || '<div class="hbm-empty-state"><p>אין נתונים להצגה</p></div>';
    }

    function renderBudgetStatus(data) {
        var container = document.getElementById('hbm-budget-status');
        var html = '';

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="hbm-empty-state"><p>לא הוגדרו הקצאות תקציב</p></div>';
            return;
        }

        data.forEach(function (item) {
            var pct = item.allocated > 0 ? Math.min((item.spent / item.allocated) * 100, 100) : 0;
            var fillClass = pct >= 100 ? 'over-budget' : pct >= 80 ? 'warning' : '';

            html += '<div class="hbm-budget-bar-item">' +
                '<div class="hbm-budget-bar-header">' +
                '<span class="hbm-budget-bar-label">' + getCategoryLabel(item.category) + '</span>' +
                '<span class="hbm-budget-bar-values">' + formatCurrency(item.spent) + ' / ' + formatCurrency(item.allocated) +
                ' (נותר: ' + formatCurrency(item.remaining) + ')</span>' +
                '</div>' +
                '<div class="hbm-budget-bar-track">' +
                '<div class="hbm-budget-bar-fill ' + fillClass + '" style="width:' + pct + '%"></div>' +
                '</div></div>';
        });

        container.innerHTML = html;
    }

    // Income
    function loadIncome() {
        apiRequest('income', 'GET', { month: currentMonth }).then(function (data) {
            var container = document.getElementById('hbm-income-list');
            if (!data || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><div class="hbm-empty-state-icon">💼</div><p>אין הכנסות להצגה</p></div>';
                return;
            }

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>שם</th><th>מקור</th><th>סכום</th><th>תאריך התחלה</th><th>תאריך סיום</th><th>פעולות</th>' +
                '</tr></thead><tbody>';

            data.forEach(function (item) {
                html += '<tr>' +
                    '<td>' + item.title + '</td>' +
                    '<td>' + (item.source || '-') + '</td>' +
                    '<td><strong>' + formatCurrency(item.amount) + '</strong></td>' +
                    '<td>' + formatDate(item.start_date) + '</td>' +
                    '<td>' + formatDate(item.end_date) + '</td>' +
                    '<td><button class="hbm-btn hbm-btn-ghost hbm-btn-sm" onclick="hbmApp.editIncome(' + item.id + ')">✏️</button> ' +
                    '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteIncome(' + item.id + ')">🗑️</button></td>' +
                    '</tr>';
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    function showIncomeForm(editData) {
        var isEdit = !!editData;
        var html = '<form id="hbm-income-form">' +
            '<div class="hbm-form-group"><label>שם ההכנסה</label>' +
            '<input type="text" name="title" value="' + (editData ? editData.title : '') + '" required></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>סכום</label>' +
            '<input type="number" name="amount" value="' + (editData ? editData.amount : '') + '" required></div>' +
            '<div class="hbm-form-group"><label>מקור</label>' +
            '<input type="text" name="source" value="' + (editData ? editData.source || '' : '') + '"></div>' +
            '</div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>תאריך התחלה</label>' +
            '<input type="date" name="start_date" value="' + (editData ? editData.start_date : currentMonth + '-01') + '" required></div>' +
            '<div class="hbm-form-group"><label>תאריך סיום (אופציונלי)</label>' +
            '<input type="date" name="end_date" value="' + (editData ? editData.end_date || '' : '') + '"></div>' +
            '</div>' +
            '<div class="hbm-form-group"><label><input type="checkbox" name="is_recurring" ' + (editData && editData.is_recurring == 1 ? 'checked' : !editData ? 'checked' : '') + '> הכנסה חוזרת (חודשית)</label></div>' +
            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">' + (isEdit ? 'עדכן' : 'הוסף') + '</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal(isEdit ? 'עריכת הכנסה' : 'הוספת הכנסה', html);

        document.getElementById('hbm-income-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            var payload = {
                title: form.title.value,
                amount: parseFloat(form.amount.value),
                source: form.source.value,
                start_date: form.start_date.value,
                is_recurring: form.is_recurring.checked ? 1 : 0,
            };
            if (form.end_date.value) {
                payload.end_date = form.end_date.value;
            }

            var method = isEdit ? 'PUT' : 'POST';
            var endpoint = isEdit ? 'income/' + editData.id : 'income';
            apiRequest(endpoint, method, payload).then(function (response) {
                if (response && response.id) {
                    closeModal();
                    loadIncome();
                    loadDashboard();
                }
            }).catch(function () {});
        });
    }

    // Expenses
    function loadExpenses() {
        var params = { month: currentMonth };
        if (currentExpenseFilter !== 'all') params.type = currentExpenseFilter;

        apiRequest('expenses', 'GET', params).then(function (data) {
            var container = document.getElementById('hbm-expenses-list');
            if (!data || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><div class="hbm-empty-state-icon">📋</div><p>אין הוצאות להצגה</p></div>';
                return;
            }

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>שם</th><th>סוג</th><th>למי</th><th>קטגוריה</th><th>סכום</th><th>פרטים</th><th>פעולות</th>' +
                '</tr></thead><tbody>';

            data.forEach(function (item) {
                var details = getExpenseDetails(item);
                html += '<tr>' +
                    '<td>' + item.title + '</td>' +
                    '<td><span class="hbm-badge hbm-badge-' + item.type + '">' + TYPE_LABELS[item.type] + '</span></td>' +
                    '<td>' + (item.payee || '-') + '</td>' +
                    '<td>' + getCategoryLabel(item.category) + '</td>' +
                    '<td><strong>' + formatCurrency(getDisplayAmount(item)) + '</strong></td>' +
                    '<td>' + details + '</td>' +
                    '<td><button class="hbm-btn hbm-btn-ghost hbm-btn-sm" onclick="hbmApp.editExpense(' + item.id + ')">✏️</button> ' +
                    '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteExpense(' + item.id + ')">🗑️</button></td>' +
                    '</tr>';
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    function getDisplayAmount(expense) {
        switch (expense.type) {
            case 'installment': return expense.installment_amount || (expense.amount / expense.total_installments);
            case 'loan': return expense.monthly_return;
            default: return expense.amount;
        }
    }

    function getExpenseDetails(expense) {
        switch (expense.type) {
            case 'installment':
                return 'תשלום ' + (expense.total_installments - (expense.current_remaining || expense.remaining_installments) + 1) +
                    ' מתוך ' + expense.total_installments;
            case 'loan':
                return 'עד ' + formatDate(expense.loan_end_date);
            case 'saving':
                return 'חיסכון חודשי';
            case 'fixed':
                return 'הוצאה קבועה';
            default:
                return expense.description || '';
        }
    }

    function showExpenseForm(editData) {
        var isEdit = !!editData;
        var catOptions = '';
        Object.keys(CATEGORIES).forEach(function (key) {
            var selected = editData && editData.category === key ? 'selected' : '';
            catOptions += '<option value="' + key + '" ' + selected + '>' + CATEGORIES[key] + '</option>';
        });

        var html = '<form id="hbm-expense-form">' +
            '<div class="hbm-form-group"><label>סוג הוצאה</label>' +
            '<select name="type" id="hbm-expense-type">' +
            '<option value="regular"' + (editData && editData.type === 'regular' ? ' selected' : '') + '>תשלום שוטף</option>' +
            '<option value="fixed"' + (editData && editData.type === 'fixed' ? ' selected' : '') + '>הוצאה קבועה</option>' +
            '<option value="installment"' + (editData && editData.type === 'installment' ? ' selected' : '') + '>תשלומים</option>' +
            '<option value="loan"' + (editData && editData.type === 'loan' ? ' selected' : '') + '>הלוואה</option>' +
            '<option value="saving"' + (editData && editData.type === 'saving' ? ' selected' : '') + '>חיסכון</option>' +
            '</select></div>' +
            '<div class="hbm-form-group"><label>שם ההוצאה</label>' +
            '<input type="text" name="title" value="' + (editData ? editData.title : '') + '" required></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>למי משלמים</label>' +
            '<input type="text" name="payee" value="' + (editData ? editData.payee || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>קטגוריה</label>' +
            '<select name="category">' + catOptions + '</select></div>' +
            '</div>' +
            '<div class="hbm-form-group"><label>סכום</label>' +
            '<input type="number" step="0.01" name="amount" value="' + (editData ? editData.amount : '') + '" required></div>' +
            '<div class="hbm-form-group"><label>תיאור</label>' +
            '<input type="text" name="description" value="' + (editData ? editData.description || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>תאריך התחלה</label>' +
            '<input type="date" name="start_date" value="' + (editData ? editData.start_date : currentMonth + '-01') + '" required></div>' +

            '<div id="hbm-installment-fields" class="hbm-type-fields">' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>מספר תשלומים</label>' +
            '<input type="number" name="total_installments" value="' + (editData ? editData.total_installments || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>סכום לתשלום</label>' +
            '<input type="number" step="0.01" name="installment_amount" value="' + (editData ? editData.installment_amount || '' : '') + '"></div>' +
            '</div></div>' +

            '<div id="hbm-loan-fields" class="hbm-type-fields">' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>החזר חודשי</label>' +
            '<input type="number" step="0.01" name="monthly_return" value="' + (editData ? editData.monthly_return || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>תאריך סיום הלוואה</label>' +
            '<input type="date" name="loan_end_date" value="' + (editData ? editData.loan_end_date || '' : '') + '"></div>' +
            '</div></div>' +

            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">' + (isEdit ? 'עדכן' : 'הוסף') + '</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal(isEdit ? 'עריכת הוצאה' : 'הוספת הוצאה', html);

        var typeSelect = document.getElementById('hbm-expense-type');
        toggleTypeFields(typeSelect.value);
        typeSelect.addEventListener('change', function () {
            toggleTypeFields(this.value);
        });

        document.getElementById('hbm-expense-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            var payload = {
                type: form.type.value,
                title: form.title.value,
                payee: form.payee.value,
                category: form.category.value,
                amount: parseFloat(form.amount.value),
                description: form.description.value,
                start_date: form.start_date.value,
            };

            if (form.type.value === 'installment') {
                payload.total_installments = parseInt(form.total_installments.value);
                payload.installment_amount = parseFloat(form.installment_amount.value) || null;
            } else if (form.type.value === 'loan') {
                payload.monthly_return = parseFloat(form.monthly_return.value);
                payload.loan_end_date = form.loan_end_date.value;
            }

            var method = isEdit ? 'PUT' : 'POST';
            var endpoint = isEdit ? 'expenses/' + editData.id : 'expenses';
            apiRequest(endpoint, method, payload).then(function (response) {
                if (response && response.id) {
                    closeModal();
                    loadExpenses();
                    loadDashboard();
                }
            }).catch(function () {});
        });
    }

    function toggleTypeFields(type) {
        document.getElementById('hbm-installment-fields').classList.toggle('active', type === 'installment');
        document.getElementById('hbm-loan-fields').classList.toggle('active', type === 'loan');
    }

    // Allocations
    function loadAllocations() {
        apiRequest('budget-allocations', 'GET').then(function (data) {
            var container = document.getElementById('hbm-allocations-form');
            var allocMap = {};
            if (data) {
                data.forEach(function (a) { allocMap[a.category] = a.amount; });
            }

            var html = '';
            Object.keys(CATEGORIES).forEach(function (key) {
                var amount = allocMap[key] || '';
                html += '<div class="hbm-allocation-item">' +
                    '<label>' + CATEGORIES[key] + '</label>' +
                    '<input type="number" step="1" data-category="' + key + '" value="' + amount + '" placeholder="₪0">' +
                    '</div>';
            });

            container.innerHTML = html;
        });
    }

    function saveAllocations() {
        var inputs = document.querySelectorAll('#hbm-allocations-form input');
        var allocations = [];
        inputs.forEach(function (input) {
            var val = parseFloat(input.value);
            if (val > 0) {
                allocations.push({ category: input.getAttribute('data-category'), amount: val });
            }
        });

        apiRequest('budget-allocations', 'POST', { allocations: allocations }).then(function () {
            alert('הקצאות התקציב נשמרו בהצלחה!');
            loadDashboard();
        });
    }

    // Settings
    function loadSettings() {
        var container = document.getElementById('hbm-categories-list');
        var html = '';
        Object.keys(CATEGORIES).forEach(function (key) {
            html += '<div class="hbm-category-chip">' +
                '<span>' + CATEGORIES[key] + '</span>' +
                '<button onclick="hbmApp.deleteCategory(\'' + key + '\')" title="מחק">&times;</button>' +
                '</div>';
        });
        container.innerHTML = html;
    }

    function addCategory() {
        var key = document.getElementById('hbm-new-cat-key').value.trim();
        var label = document.getElementById('hbm-new-cat-label').value.trim();
        if (!key || !label) { alert('יש למלא את שני השדות'); return; }

        apiRequest('categories', 'POST', { key: key, label: label }).then(function (data) {
            Object.assign(CATEGORIES, data);
            loadSettings();
            document.getElementById('hbm-new-cat-key').value = '';
            document.getElementById('hbm-new-cat-label').value = '';
        });
    }

    // Public API
    window.hbmApp = {
        closeModal: closeModal,
        editIncome: function (id) {
            apiRequest('income', 'GET', { month: currentMonth }).then(function (data) {
                var item = data.find(function (i) { return i.id == id; });
                if (item) showIncomeForm(item);
            });
        },
        deleteIncome: function (id) {
            if (!confirm('האם למחוק הכנסה זו?')) return;
            apiRequest('income/' + id, 'DELETE').then(function () { loadIncome(); loadDashboard(); });
        },
        editExpense: function (id) {
            apiRequest('expenses', 'GET', { month: currentMonth }).then(function (data) {
                var item = data.find(function (i) { return i.id == id; });
                if (item) showExpenseForm(item);
            });
        },
        deleteExpense: function (id) {
            if (!confirm('האם למחוק הוצאה זו?')) return;
            apiRequest('expenses/' + id, 'DELETE').then(function () { loadExpenses(); loadDashboard(); });
        },
        deleteCategory: function (key) {
            if (!confirm('האם למחוק קטגוריה זו?')) return;
            apiRequest('categories/' + key, 'DELETE').then(function (data) {
                Object.keys(CATEGORIES).forEach(function (k) { delete CATEGORIES[k]; });
                Object.assign(CATEGORIES, data);
                loadSettings();
            });
        },
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
