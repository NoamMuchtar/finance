(function () {
    'use strict';

    var API = hbmData.apiUrl;
    var NONCE = hbmData.nonce;
    var CATEGORIES = hbmData.categories;

    var currentMonth = hbmData.currentMonth;
    var currentExpenseFilter = 'all';

    // New global state
    var creditCards = [];
    var bankAccounts = [];
    var userType = 'salaried';

    var MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    var TYPE_LABELS = { fixed: 'קבועה', installment: 'תשלומים', loan: 'הלוואה', saving: 'חיסכון', one_time: 'חד פעמי' };
    var PAYMENT_METHOD_LABELS = { credit: 'אשראי', bank_transfer: 'העברה בנקאית', check: "צ'ק", cash: 'מזומן' };
    var COLLECTION_STATUS_LABELS = { pending: 'ממתין', invoice_sent: 'נשלחה חשבונית', paid: 'שולם', receipt_sent: 'נשלחה קבלה' };

    function init() {
        if (!document.getElementById('hbm-app')) return;
        setupNavigation();
        setupMonthSelector();
        setupTabs();
        setupModals();
        loadUserSettings();
        loadCreditCards();
        loadBankAccounts();
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

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Build credit card options for selects
    function buildCreditCardOptions(selectedId) {
        var html = '<option value="">בחר כרטיס אשראי</option>';
        creditCards.forEach(function (card) {
            var sel = selectedId && selectedId == card.id ? ' selected' : '';
            var label = (card.card_name ? card.card_name + ' - ' : '') + '**** ' + card.last_four + ' (יום חיוב: ' + card.billing_day + ')';
            html += '<option value="' + card.id + '"' + sel + '>' + label + '</option>';
        });
        return html;
    }

    // Build bank account options for selects
    function buildBankAccountOptions(selectedId) {
        var html = '<option value="">בחר חשבון בנק</option>';
        bankAccounts.forEach(function (acct) {
            var sel = selectedId && selectedId == acct.id ? ' selected' : '';
            var label = acct.bank_name + ' - ***' + acct.last_three;
            html += '<option value="' + acct.id + '"' + sel + '>' + label + '</option>';
        });
        return html;
    }

    // Navigation
    function setupNavigation() {
        var links = document.querySelectorAll('.hbm-sidebar-nav-item');
        if (!links.length) {
            // Fallback for old nav structure
            links = document.querySelectorAll('.hbm-nav-links a');
        }
        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                links.forEach(function (l) { l.classList.remove('active'); });
                link.classList.add('active');
                var page = link.getAttribute('data-page');
                showPage(page);
                // Close sidebar on mobile
                var sidebar = document.getElementById('hbm-sidebar');
                if (sidebar) sidebar.classList.remove('open');
            });
        });

        // Hamburger menu toggle
        var hamburger = document.getElementById('hbm-hamburger');
        if (hamburger) {
            hamburger.addEventListener('click', function () {
                var sidebar = document.getElementById('hbm-sidebar');
                if (sidebar) sidebar.classList.toggle('open');
            });
        }
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
            case 'reserved-payments': loadReservedPayments(); break;
            case 'collections': loadCollections(); break;
        }
    }

    function updateNavVisibility() {
        var navCollections = document.getElementById('hbm-nav-collections');
        if (navCollections) {
            navCollections.style.display = userType === 'self_employed' ? '' : 'none';
        }
    }

    // Month Selector
    function setupMonthSelector() {
        var el = document.getElementById('hbm-current-month');
        if (el) el.textContent = getMonthLabel(currentMonth);

        var prevBtn = document.getElementById('hbm-prev-month');
        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                changeMonth(-1);
            });
        }
        var nextBtn = document.getElementById('hbm-next-month');
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                changeMonth(1);
            });
        }
    }

    function changeMonth(delta) {
        var parts = currentMonth.split('-');
        var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1 + delta, 1);
        currentMonth = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        var el = document.getElementById('hbm-current-month');
        if (el) el.textContent = getMonthLabel(currentMonth);

        var activePage = document.querySelector('.hbm-sidebar-nav-item.active') || document.querySelector('.hbm-nav-links a.active');
        if (activePage) showPage(activePage.getAttribute('data-page'));
    }

    // Tabs
    function setupTabs() {
        document.querySelectorAll('#hbm-expense-tabs .hbm-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('#hbm-expense-tabs .hbm-tab').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                currentExpenseFilter = tab.getAttribute('data-type');

                // Toggle standing orders section
                var soSection = document.getElementById('hbm-standing-orders-section');
                if (soSection) {
                    soSection.style.display = currentExpenseFilter === 'standing_order' ? '' : 'none';
                }
                // Toggle savings report section
                var srSection = document.getElementById('hbm-savings-report-section');
                if (srSection) {
                    srSection.style.display = currentExpenseFilter === 'saving' ? '' : 'none';
                }

                if (currentExpenseFilter === 'standing_order') {
                    loadStandingOrders();
                    // Hide main expenses list for standing orders
                    var expList = document.getElementById('hbm-expenses-list');
                    if (expList) expList.style.display = 'none';
                } else {
                    var expList2 = document.getElementById('hbm-expenses-list');
                    if (expList2) expList2.style.display = '';
                    loadExpenses();
                    if (currentExpenseFilter === 'saving') {
                        loadSavingsReport();
                    }
                }
            });
        });
    }

    // Modal
    function setupModals() {
        var modal = document.getElementById('hbm-modal');
        if (modal) {
            var overlay = modal.querySelector('.hbm-modal-overlay');
            if (overlay) overlay.addEventListener('click', closeModal);
            var closeBtn = modal.querySelector('.hbm-modal-close');
            if (closeBtn) closeBtn.addEventListener('click', closeModal);
        }

        var addIncomeBtn = document.getElementById('hbm-add-income');
        if (addIncomeBtn) {
            addIncomeBtn.addEventListener('click', function () {
                showIncomeForm();
            });
        }
        var addExpenseBtn = document.getElementById('hbm-add-expense');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', function () {
                showExpenseForm();
            });
        }
        var saveAllocBtn = document.getElementById('hbm-save-allocations');
        if (saveAllocBtn) saveAllocBtn.addEventListener('click', saveAllocations);
        var addCatBtn = document.getElementById('hbm-add-category');
        if (addCatBtn) addCatBtn.addEventListener('click', addCategory);
    }

    function openModal(title, content) {
        document.getElementById('hbm-modal-title').textContent = title;
        document.getElementById('hbm-modal-body').innerHTML = content;
        document.getElementById('hbm-modal').style.display = 'flex';
    }

    function closeModal() {
        document.getElementById('hbm-modal').style.display = 'none';
    }

    // ===================== User Settings =====================
    function loadUserSettings() {
        apiRequest('user-settings', 'GET').then(function (data) {
            if (data && !data.error) {
                userType = data.user_type || 'salaried';
                updateNavVisibility();
                // Update radio buttons if on settings page
                var radios = document.querySelectorAll('input[name="hbm-user-type"]');
                radios.forEach(function (r) {
                    r.checked = r.value === userType;
                });
            }
        });
    }

    function saveUserType() {
        var selected = document.querySelector('input[name="hbm-user-type"]:checked');
        if (!selected) return;
        userType = selected.value;
        apiRequest('user-settings', 'POST', { user_type: userType }).then(function () {
            updateNavVisibility();
            alert('סוג המשתמש נשמר בהצלחה!');
        });
    }

    // ===================== Credit Cards =====================
    function loadCreditCards() {
        apiRequest('credit-cards', 'GET').then(function (data) {
            if (data && !data.error && Array.isArray(data)) {
                creditCards = data;
                renderCreditCardsList();
            }
        });
    }

    function renderCreditCardsList() {
        var container = document.getElementById('hbm-credit-cards-list');
        if (!container) return;
        if (creditCards.length === 0) {
            container.innerHTML = '<p class="hbm-empty-hint">לא הוגדרו כרטיסי אשראי</p>';
            return;
        }
        var html = '';
        creditCards.forEach(function (card) {
            html += '<div class="hbm-settings-item">' +
                '<span>' + (card.card_name ? escapeHtml(card.card_name) + ' - ' : '') + '**** ' + escapeHtml(card.last_four) + ' | יום חיוב: ' + card.billing_day + '</span>' +
                '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteCreditCard(' + card.id + ')">מחק</button>' +
                '</div>';
        });
        container.innerHTML = html;
    }

    function addCreditCard() {
        var last4 = document.getElementById('hbm-new-cc-last4');
        var billingDay = document.getElementById('hbm-new-cc-billing-day');
        var name = document.getElementById('hbm-new-cc-name');
        if (!last4 || !billingDay) return;
        if (!last4.value || !billingDay.value) { alert('יש למלא 4 ספרות אחרונות ויום חיוב'); return; }

        apiRequest('credit-cards', 'POST', {
            last_four: last4.value,
            billing_day: parseInt(billingDay.value),
            card_name: name ? name.value : ''
        }).then(function (data) {
            if (data && data.id) {
                last4.value = '';
                billingDay.value = '';
                if (name) name.value = '';
                loadCreditCards();
            }
        });
    }

    function deleteCreditCard(id) {
        if (!confirm('האם למחוק כרטיס אשראי זה?')) return;
        apiRequest('credit-cards/' + id, 'DELETE').then(function () {
            loadCreditCards();
        });
    }

    // ===================== Bank Accounts =====================
    function loadBankAccounts() {
        apiRequest('bank-accounts', 'GET').then(function (data) {
            if (data && !data.error && Array.isArray(data)) {
                bankAccounts = data;
                renderBankAccountsList();
                // Update cashflow bank account selector
                var cfSelect = document.getElementById('hbm-cashflow-bank-account');
                if (cfSelect) {
                    cfSelect.innerHTML = buildBankAccountOptions();
                }
            }
        });
    }

    function renderBankAccountsList() {
        var container = document.getElementById('hbm-bank-accounts-list');
        if (!container) return;
        if (bankAccounts.length === 0) {
            container.innerHTML = '<p class="hbm-empty-hint">לא הוגדרו חשבונות בנק</p>';
            return;
        }
        var html = '';
        bankAccounts.forEach(function (acct) {
            html += '<div class="hbm-settings-item">' +
                '<span>' + escapeHtml(acct.bank_name) + ' - ***' + escapeHtml(acct.last_three) +
                ' | מסגרת: ' + formatCurrency(acct.credit_limit || 0) +
                ' | יתרה: ' + formatCurrency(acct.initial_balance || 0) + '</span>' +
                '<div>' +
                '<button class="hbm-btn hbm-btn-ghost hbm-btn-sm" onclick="hbmApp.editBankAccount(' + acct.id + ')">ערוך</button> ' +
                '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteBankAccount(' + acct.id + ')">מחק</button>' +
                '</div></div>';
        });
        container.innerHTML = html;
    }

    function addBankAccount() {
        var last3 = document.getElementById('hbm-new-ba-last3');
        var bankName = document.getElementById('hbm-new-ba-bank-name');
        var creditLimit = document.getElementById('hbm-new-ba-credit-limit');
        var initialBalance = document.getElementById('hbm-new-ba-initial-balance');
        if (!last3 || !bankName) return;
        if (!last3.value || !bankName.value) { alert('יש למלא 3 ספרות אחרונות ושם בנק'); return; }

        apiRequest('bank-accounts', 'POST', {
            last_three: last3.value,
            bank_name: bankName.value,
            credit_limit: creditLimit ? parseFloat(creditLimit.value) || 0 : 0,
            initial_balance: initialBalance ? parseFloat(initialBalance.value) || 0 : 0
        }).then(function (data) {
            if (data && data.id) {
                last3.value = '';
                bankName.value = '';
                if (creditLimit) creditLimit.value = '';
                if (initialBalance) initialBalance.value = '';
                loadBankAccounts();
            }
        });
    }

    function editBankAccount(id) {
        var acct = bankAccounts.find(function (a) { return a.id == id; });
        if (!acct) return;

        var html = '<form id="hbm-edit-ba-form">' +
            '<div class="hbm-form-group"><label>3 ספרות אחרונות</label>' +
            '<input type="text" name="last_three" value="' + escapeHtml(acct.last_three) + '" maxlength="3" required></div>' +
            '<div class="hbm-form-group"><label>שם הבנק</label>' +
            '<input type="text" name="bank_name" value="' + escapeHtml(acct.bank_name) + '" required></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>מסגרת אשראי</label>' +
            '<input type="number" name="credit_limit" value="' + (acct.credit_limit || 0) + '"></div>' +
            '<div class="hbm-form-group"><label>יתרה התחלתית</label>' +
            '<input type="number" name="initial_balance" value="' + (acct.initial_balance || 0) + '"></div>' +
            '</div>' +
            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">עדכן</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal('עריכת חשבון בנק', html);

        document.getElementById('hbm-edit-ba-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            apiRequest('bank-accounts/' + id, 'PUT', {
                last_three: form.last_three.value,
                bank_name: form.bank_name.value,
                credit_limit: parseFloat(form.credit_limit.value) || 0,
                initial_balance: parseFloat(form.initial_balance.value) || 0
            }).then(function (data) {
                if (data && data.id) {
                    closeModal();
                    loadBankAccounts();
                }
            });
        });
    }

    function deleteBankAccount(id) {
        if (!confirm('האם למחוק חשבון בנק זה?')) return;
        apiRequest('bank-accounts/' + id, 'DELETE').then(function () {
            loadBankAccounts();
        });
    }

    // ===================== Dashboard =====================
    function loadDashboard() {
        apiRequest('dashboard', 'GET', { month: currentMonth }).then(function (data) {
            if (!data || data.error || data.code) return;
            var totalIncomeEl = document.getElementById('hbm-total-income');
            if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(data.total_income);
            var totalExpensesEl = document.getElementById('hbm-total-expenses');
            if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(data.total_expenses);
            var remainingEl = document.getElementById('hbm-remaining');
            if (remainingEl) remainingEl.textContent = formatCurrency(data.remaining);
            var totalSavingsEl = document.getElementById('hbm-total-savings');
            if (totalSavingsEl) totalSavingsEl.textContent = formatCurrency(data.expenses_by_type.saving || 0);

            renderExpensesByType(data.expenses_by_type);
            renderExpensesByCategory(data.expenses_by_category);
            renderBudgetStatus(data.budget_status);
        });

        // Load dashboard reserved payments
        loadDashboardReservedPayments();

        // Setup cashflow bank account change handler
        var cfSelect = document.getElementById('hbm-cashflow-bank-account');
        if (cfSelect) {
            // Remove old listener by replacing
            var newSelect = cfSelect.cloneNode(true);
            cfSelect.parentNode.replaceChild(newSelect, cfSelect);
            newSelect.innerHTML = buildBankAccountOptions();
            newSelect.addEventListener('change', function () {
                if (this.value) {
                    loadCashFlow(this.value);
                } else {
                    var table = document.getElementById('hbm-cashflow-table');
                    if (table) table.innerHTML = '<div class="hbm-empty-state"><p>בחר חשבון בנק לצפייה בתזרים מזומנים</p></div>';
                }
            });
        }
    }

    function loadDashboardReservedPayments() {
        apiRequest('reserved-payments', 'GET', { status: 'unpaid' }).then(function (data) {
            var container = document.getElementById('hbm-dashboard-reserved-payments');
            if (!container) return;
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין תשלומים שנדרש לשלם</p></div>';
                return;
            }
            // Sort by payment date, nearest first
            data.sort(function (a, b) { return new Date(a.payment_date) - new Date(b.payment_date); });

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>כותרת</th><th>למי</th><th>סכום</th><th>תאריך תשלום</th><th>סטטוס</th>' +
                '</tr></thead><tbody>';
            data.forEach(function (item) {
                html += '<tr>' +
                    '<td>' + escapeHtml(item.title) + '</td>' +
                    '<td>' + escapeHtml(item.payee || '-') + '</td>' +
                    '<td><strong>' + formatCurrency(item.amount) + '</strong></td>' +
                    '<td>' + formatDate(item.payment_date) + '</td>' +
                    '<td><span class="hbm-badge hbm-badge-' + (item.is_paid ? 'saving' : 'loan') + '">' + (item.is_paid ? 'שולם' : 'לא שולם') + '</span></td>' +
                    '</tr>';
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    function loadCashFlow(bankAccountId) {
        var container = document.getElementById('hbm-cashflow-table');
        if (!container) return;
        container.innerHTML = '<div class="hbm-empty-state"><p>טוען תזרים...</p></div>';

        apiRequest('cash-flow', 'GET', { bank_account_id: bankAccountId, months_ahead: 3 }).then(function (data) {
            if (!data || data.error || !Array.isArray(data.entries)) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין נתוני תזרים</p></div>';
                return;
            }

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>תאריך</th><th>תיאור</th><th>סוג</th><th>סכום</th><th>יתרה</th>' +
                '</tr></thead><tbody>';

            data.entries.forEach(function (entry) {
                var rowClass = entry.is_charge_date ? ' class="hbm-cashflow-charge-row"' : '';
                html += '<tr' + rowClass + '>' +
                    '<td>' + formatDate(entry.date) + '</td>' +
                    '<td>' + escapeHtml(entry.description) + '</td>' +
                    '<td>' + escapeHtml(entry.type_label || entry.type || '-') + '</td>' +
                    '<td><strong>' + formatCurrency(entry.amount) + '</strong></td>' +
                    '<td>' + formatCurrency(entry.balance) + '</td>' +
                    '</tr>';
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    function renderExpensesByType(data) {
        var container = document.getElementById('hbm-expenses-by-type');
        if (!container) return;
        var total = Object.values(data).reduce(function (s, v) { return s + v; }, 0);
        var html = '';

        Object.keys(data).forEach(function (type) {
            if (data[type] <= 0) return;
            var pct = total > 0 ? (data[type] / total * 100) : 0;
            var label = TYPE_LABELS[type] || type;
            html += '<div class="hbm-category-row">' +
                '<span class="hbm-category-label"><span class="hbm-badge hbm-badge-' + type + '">' + label + '</span></span>' +
                '<div class="hbm-category-bar"><div class="hbm-category-bar-fill" style="width:' + pct + '%"></div></div>' +
                '<span class="hbm-category-amount">' + formatCurrency(data[type]) + '</span>' +
                '</div>';
        });

        container.innerHTML = html || '<div class="hbm-empty-state"><p>אין נתונים להצגה</p></div>';
    }

    function renderExpensesByCategory(data) {
        var container = document.getElementById('hbm-expenses-by-category');
        if (!container) return;
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
        if (!container) return;
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

    // ===================== Income =====================
    function loadIncome() {
        apiRequest('income', 'GET', { month: currentMonth }).then(function (data) {
            var container = document.getElementById('hbm-income-list');
            if (!container) return;
            if (!data || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><div class="hbm-empty-state-icon">💼</div><p>אין הכנסות להצגה</p></div>';
                return;
            }

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>שם</th><th>מקור</th><th>סכום</th><th>תאריך התחלה</th><th>תאריך סיום</th><th>פעולות</th>' +
                '</tr></thead><tbody>';

            data.forEach(function (item) {
                html += '<tr>' +
                    '<td>' + escapeHtml(item.title) + '</td>' +
                    '<td>' + escapeHtml(item.source || '-') + '</td>' +
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
            '<input type="text" name="title" value="' + escapeHtml(editData ? editData.title : '') + '" required></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>סכום</label>' +
            '<input type="number" name="amount" value="' + (editData ? editData.amount : '') + '" required></div>' +
            '<div class="hbm-form-group"><label>מקור</label>' +
            '<input type="text" name="source" value="' + escapeHtml(editData ? editData.source || '' : '') + '"></div>' +
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

    // ===================== Expenses =====================
    function loadExpenses() {
        var params = { month: currentMonth };
        if (currentExpenseFilter !== 'all' && currentExpenseFilter !== 'standing_order') {
            params.type = currentExpenseFilter;
        }

        apiRequest('expenses', 'GET', params).then(function (data) {
            var container = document.getElementById('hbm-expenses-list');
            if (!container) return;
            if (!data || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><div class="hbm-empty-state-icon">📋</div><p>אין הוצאות להצגה</p></div>';
                return;
            }

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>שם</th><th>סוג</th><th>למי</th><th>קטגוריה</th><th>סכום</th><th>פרטים</th><th>פעולות</th>' +
                '</tr></thead><tbody>';

            data.forEach(function (item) {
                var details = getExpenseDetails(item);
                var typeLabel = TYPE_LABELS[item.type] || item.type;
                html += '<tr>' +
                    '<td>' + escapeHtml(item.title) + '</td>' +
                    '<td><span class="hbm-badge hbm-badge-' + item.type + '">' + typeLabel + '</span></td>' +
                    '<td>' + escapeHtml(item.payee || '-') + '</td>' +
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
                var loanDetails = 'עד ' + formatDate(expense.loan_end_date);
                if (expense.loan_payment_day) loanDetails += ' | יום פירעון: ' + expense.loan_payment_day;
                return loanDetails;
            case 'saving':
                return 'חיסכון חודשי';
            case 'fixed':
                return 'הוצאה קבועה';
            default:
                var d = expense.description || '';
                if (expense.payment_method) {
                    d += (d ? ' | ' : '') + (PAYMENT_METHOD_LABELS[expense.payment_method] || expense.payment_method);
                }
                return d;
        }
    }

    function showExpenseForm(editData) {
        var isEdit = !!editData;
        var catOptions = '<option value="">ללא קטגוריה</option>';
        Object.keys(CATEGORIES).forEach(function (key) {
            var selected = editData && editData.category === key ? 'selected' : '';
            catOptions += '<option value="' + key + '" ' + selected + '>' + CATEGORIES[key] + '</option>';
        });

        var editType = editData ? editData.type : '';
        // Map old 'regular' to 'one_time' for backwards compat
        if (editType === 'regular') editType = 'one_time';

        var html = '<form id="hbm-expense-form">' +
            '<div class="hbm-form-group"><label>סוג הוצאה</label>' +
            '<select name="type" id="hbm-expense-type">' +
            '<option value="one_time"' + (editType === 'one_time' || !editType ? ' selected' : '') + '>חד פעמי</option>' +
            '<option value="fixed"' + (editType === 'fixed' ? ' selected' : '') + '>הוצאה קבועה</option>' +
            '<option value="installment"' + (editType === 'installment' ? ' selected' : '') + '>תשלומים</option>' +
            '<option value="loan"' + (editType === 'loan' ? ' selected' : '') + '>הלוואה</option>' +
            '<option value="saving"' + (editType === 'saving' ? ' selected' : '') + '>חיסכון</option>' +
            '</select></div>' +
            '<div class="hbm-form-group"><label>שם ההוצאה</label>' +
            '<input type="text" name="title" value="' + escapeHtml(editData ? editData.title : '') + '" required></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>למי משלמים</label>' +
            '<input type="text" name="payee" value="' + escapeHtml(editData ? editData.payee || '' : '') + '"></div>' +
            '<div class="hbm-form-group" id="hbm-category-group"><label>קטגוריה</label>' +
            '<select name="category">' + catOptions + '</select></div>' +
            '</div>' +
            '<div class="hbm-form-group"><label>סכום</label>' +
            '<input type="number" step="0.01" name="amount" value="' + (editData ? editData.amount : '') + '" required></div>' +
            '<div class="hbm-form-group"><label>תיאור</label>' +
            '<input type="text" name="description" value="' + escapeHtml(editData ? editData.description || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>תאריך התחלה</label>' +
            '<input type="date" name="start_date" value="' + (editData ? editData.start_date : currentMonth + '-01') + '" required></div>' +

            // Payment method for one_time
            '<div id="hbm-payment-method-field" class="hbm-type-fields">' +
            '<div class="hbm-form-group"><label>אמצעי תשלום</label>' +
            '<select name="payment_method" id="hbm-payment-method">' +
            '<option value="credit"' + (editData && editData.payment_method === 'credit' ? ' selected' : '') + '>אשראי</option>' +
            '<option value="bank_transfer"' + (editData && editData.payment_method === 'bank_transfer' ? ' selected' : '') + '>העברה בנקאית</option>' +
            '<option value="check"' + (editData && editData.payment_method === 'check' ? ' selected' : '') + ">צ'ק</option>" +
            '<option value="cash"' + (editData && editData.payment_method === 'cash' ? ' selected' : '') + '>מזומן</option>' +
            '</select></div></div>' +

            // Credit card selector
            '<div id="hbm-credit-card-field" class="hbm-type-fields">' +
            '<div class="hbm-form-group"><label>כרטיס אשראי</label>' +
            '<select name="credit_card_id" id="hbm-expense-credit-card">' +
            buildCreditCardOptions(editData ? editData.credit_card_id : null) +
            '</select></div></div>' +

            // Bank account selector
            '<div id="hbm-bank-account-field" class="hbm-type-fields">' +
            '<div class="hbm-form-group"><label>חשבון בנק</label>' +
            '<select name="bank_account_id" id="hbm-expense-bank-account">' +
            buildBankAccountOptions(editData ? editData.bank_account_id : null) +
            '</select></div></div>' +

            // Installment fields
            '<div id="hbm-installment-fields" class="hbm-type-fields">' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>מספר תשלומים</label>' +
            '<input type="number" name="total_installments" value="' + (editData ? editData.total_installments || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>סכום לתשלום</label>' +
            '<input type="number" step="0.01" name="installment_amount" value="' + (editData ? editData.installment_amount || '' : '') + '"></div>' +
            '</div></div>' +

            // Loan fields
            '<div id="hbm-loan-fields" class="hbm-type-fields">' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>החזר חודשי</label>' +
            '<input type="number" step="0.01" name="monthly_return" value="' + (editData ? editData.monthly_return || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>תאריך סיום הלוואה</label>' +
            '<input type="date" name="loan_end_date" value="' + (editData ? editData.loan_end_date || '' : '') + '"></div>' +
            '</div>' +
            '<div class="hbm-form-group"><label>יום פירעון חודשי (1-31)</label>' +
            '<input type="number" name="loan_payment_day" min="1" max="31" value="' + (editData ? editData.loan_payment_day || '' : '') + '"></div>' +
            '</div>' +

            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">' + (isEdit ? 'עדכן' : 'הוסף') + '</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal(isEdit ? 'עריכת הוצאה' : 'הוספת הוצאה', html);

        var typeSelect = document.getElementById('hbm-expense-type');
        var paymentMethodSelect = document.getElementById('hbm-payment-method');

        function updateExpenseFormFields() {
            var type = typeSelect.value;
            var paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : '';

            // Toggle type-specific fields
            var installmentFields = document.getElementById('hbm-installment-fields');
            var loanFields = document.getElementById('hbm-loan-fields');
            var paymentMethodField = document.getElementById('hbm-payment-method-field');
            var creditCardField = document.getElementById('hbm-credit-card-field');
            var bankAccountField = document.getElementById('hbm-bank-account-field');
            var categoryGroup = document.getElementById('hbm-category-group');

            if (installmentFields) installmentFields.classList.toggle('active', type === 'installment');
            if (loanFields) loanFields.classList.toggle('active', type === 'loan');

            // Payment method for one_time
            if (paymentMethodField) paymentMethodField.classList.toggle('active', type === 'one_time');

            // Credit card: show when payment_method=credit OR type=installment
            var showCreditCard = (type === 'one_time' && paymentMethod === 'credit') || type === 'installment';
            if (creditCardField) creditCardField.classList.toggle('active', showCreditCard);

            // Bank account: show when payment_method=bank_transfer/check, or type=loan/saving
            var showBankAccount = (type === 'one_time' && (paymentMethod === 'bank_transfer' || paymentMethod === 'check')) ||
                type === 'loan' || type === 'saving';
            if (bankAccountField) bankAccountField.classList.toggle('active', showBankAccount);

            // For loans, category is optional
            if (categoryGroup) {
                var catLabel = categoryGroup.querySelector('label');
                if (catLabel) {
                    catLabel.textContent = type === 'loan' ? 'קטגוריה (אופציונלי)' : 'קטגוריה';
                }
            }
        }

        updateExpenseFormFields();
        typeSelect.addEventListener('change', updateExpenseFormFields);
        if (paymentMethodSelect) paymentMethodSelect.addEventListener('change', updateExpenseFormFields);

        document.getElementById('hbm-expense-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            var type = form.type.value;
            var payload = {
                type: type,
                title: form.title.value,
                payee: form.payee.value,
                category: form.category.value,
                amount: parseFloat(form.amount.value),
                description: form.description.value,
                start_date: form.start_date.value,
            };

            if (type === 'one_time') {
                payload.payment_method = form.payment_method.value;
                if (payload.payment_method === 'credit' && form.credit_card_id.value) {
                    payload.credit_card_id = form.credit_card_id.value;
                }
                if ((payload.payment_method === 'bank_transfer' || payload.payment_method === 'check') && form.bank_account_id.value) {
                    payload.bank_account_id = form.bank_account_id.value;
                }
            } else if (type === 'installment') {
                payload.total_installments = parseInt(form.total_installments.value);
                payload.installment_amount = parseFloat(form.installment_amount.value) || null;
                if (form.credit_card_id.value) {
                    payload.credit_card_id = form.credit_card_id.value;
                }
            } else if (type === 'loan') {
                payload.monthly_return = parseFloat(form.monthly_return.value);
                payload.loan_end_date = form.loan_end_date.value;
                payload.loan_payment_day = form.loan_payment_day.value ? parseInt(form.loan_payment_day.value) : null;
                if (form.bank_account_id.value) {
                    payload.bank_account_id = form.bank_account_id.value;
                }
            } else if (type === 'saving') {
                if (form.bank_account_id.value) {
                    payload.bank_account_id = form.bank_account_id.value;
                }
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

    // ===================== Standing Orders =====================
    function loadStandingOrders() {
        apiRequest('standing-orders', 'GET').then(function (data) {
            var container = document.getElementById('hbm-standing-orders-list');
            if (!container) return;
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><div class="hbm-empty-state-icon">📋</div><p>אין הוראות קבע</p></div>';
                return;
            }

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>כותרת</th><th>למי</th><th>סכום</th><th>קטגוריה</th><th>סוג</th><th>יום בחודש</th><th>תאריך התחלה</th><th>תאריך סיום</th><th>פעולות</th>' +
                '</tr></thead><tbody>';

            data.forEach(function (item) {
                var typeLabel = item.so_type === 'bank' ? 'בנק' : 'אשראי';
                html += '<tr>' +
                    '<td>' + escapeHtml(item.title) + '</td>' +
                    '<td>' + escapeHtml(item.payee || '-') + '</td>' +
                    '<td><strong>' + formatCurrency(item.amount) + '</strong></td>' +
                    '<td>' + getCategoryLabel(item.category) + '</td>' +
                    '<td>' + typeLabel + '</td>' +
                    '<td>' + (item.day_of_month || '-') + '</td>' +
                    '<td>' + formatDate(item.start_date) + '</td>' +
                    '<td>' + formatDate(item.end_date) + '</td>' +
                    '<td><button class="hbm-btn hbm-btn-ghost hbm-btn-sm" onclick="hbmApp.editStandingOrder(' + item.id + ')">✏️</button> ' +
                    '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteStandingOrder(' + item.id + ')">🗑️</button></td>' +
                    '</tr>';
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    function showStandingOrderForm(editData) {
        var isEdit = !!editData;
        var catOptions = '<option value="">בחר קטגוריה</option>';
        Object.keys(CATEGORIES).forEach(function (key) {
            var selected = editData && editData.category === key ? 'selected' : '';
            catOptions += '<option value="' + key + '" ' + selected + '>' + CATEGORIES[key] + '</option>';
        });

        var soType = editData ? editData.so_type || 'bank' : 'bank';

        var html = '<form id="hbm-standing-order-form">' +
            '<div class="hbm-form-group"><label>כותרת</label>' +
            '<input type="text" name="title" value="' + escapeHtml(editData ? editData.title : '') + '" required></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>למי</label>' +
            '<input type="text" name="payee" value="' + escapeHtml(editData ? editData.payee || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>סכום</label>' +
            '<input type="number" step="0.01" name="amount" value="' + (editData ? editData.amount : '') + '" required></div>' +
            '</div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>קטגוריה</label>' +
            '<select name="category">' + catOptions + '</select></div>' +
            '<div class="hbm-form-group"><label>סוג</label>' +
            '<select name="so_type" id="hbm-so-type">' +
            '<option value="bank"' + (soType === 'bank' ? ' selected' : '') + '>בנק</option>' +
            '<option value="credit"' + (soType === 'credit' ? ' selected' : '') + '>אשראי</option>' +
            '</select></div>' +
            '</div>' +
            '<div id="hbm-so-credit-card-field" class="hbm-type-fields">' +
            '<div class="hbm-form-group"><label>כרטיס אשראי</label>' +
            '<select name="credit_card_id">' + buildCreditCardOptions(editData ? editData.credit_card_id : null) + '</select></div></div>' +
            '<div id="hbm-so-bank-account-field" class="hbm-type-fields">' +
            '<div class="hbm-form-group"><label>חשבון בנק</label>' +
            '<select name="bank_account_id">' + buildBankAccountOptions(editData ? editData.bank_account_id : null) + '</select></div></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>יום בחודש (1-31)</label>' +
            '<input type="number" name="day_of_month" min="1" max="31" value="' + (editData ? editData.day_of_month || '' : '') + '" required></div>' +
            '<div class="hbm-form-group"><label>תאריך התחלה</label>' +
            '<input type="date" name="start_date" value="' + (editData ? editData.start_date : currentMonth + '-01') + '" required></div>' +
            '</div>' +
            '<div class="hbm-form-group"><label>תאריך סיום (אופציונלי)</label>' +
            '<input type="date" name="end_date" value="' + (editData ? editData.end_date || '' : '') + '"></div>' +
            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">' + (isEdit ? 'עדכן' : 'הוסף') + '</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal(isEdit ? 'עריכת הוראת קבע' : 'הוספת הוראת קבע', html);

        var soTypeSelect = document.getElementById('hbm-so-type');
        function updateSOFields() {
            var t = soTypeSelect.value;
            var ccField = document.getElementById('hbm-so-credit-card-field');
            var baField = document.getElementById('hbm-so-bank-account-field');
            if (ccField) ccField.classList.toggle('active', t === 'credit');
            if (baField) baField.classList.toggle('active', t === 'bank');
        }
        updateSOFields();
        soTypeSelect.addEventListener('change', updateSOFields);

        document.getElementById('hbm-standing-order-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            var payload = {
                title: form.title.value,
                payee: form.payee.value,
                amount: parseFloat(form.amount.value),
                category: form.category.value,
                so_type: form.so_type.value,
                day_of_month: parseInt(form.day_of_month.value),
                start_date: form.start_date.value,
            };
            if (form.end_date.value) payload.end_date = form.end_date.value;
            if (form.so_type.value === 'credit' && form.credit_card_id.value) {
                payload.credit_card_id = form.credit_card_id.value;
            }
            if (form.so_type.value === 'bank' && form.bank_account_id.value) {
                payload.bank_account_id = form.bank_account_id.value;
            }

            var method = isEdit ? 'PUT' : 'POST';
            var endpoint = isEdit ? 'standing-orders/' + editData.id : 'standing-orders';
            apiRequest(endpoint, method, payload).then(function (response) {
                if (response && response.id) {
                    closeModal();
                    loadStandingOrders();
                }
            });
        });
    }

    function deleteStandingOrder(id) {
        if (!confirm('האם למחוק הוראת קבע זו?')) return;
        apiRequest('standing-orders/' + id, 'DELETE').then(function () {
            loadStandingOrders();
        });
    }

    // ===================== Reserved Payments =====================
    function loadReservedPayments() {
        apiRequest('reserved-payments', 'GET').then(function (data) {
            var container = document.getElementById('hbm-reserved-payments-list');
            if (!container) return;
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><div class="hbm-empty-state-icon">📋</div><p>אין תשלומים שמורים</p></div>';
                return;
            }
            // Sort by payment date, nearest first
            data.sort(function (a, b) { return new Date(a.payment_date) - new Date(b.payment_date); });

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>כותרת</th><th>למי</th><th>סכום</th><th>תאריך תשלום</th><th>פרטים</th><th>חשבון בנק</th><th>סטטוס</th><th>פעולות</th>' +
                '</tr></thead><tbody>';

            data.forEach(function (item) {
                var bankLabel = '-';
                if (item.bank_account_id) {
                    var ba = bankAccounts.find(function (a) { return a.id == item.bank_account_id; });
                    if (ba) bankLabel = ba.bank_name + ' ***' + ba.last_three;
                }
                var paidBadge = item.is_paid ?
                    '<span class="hbm-badge hbm-badge-saving">שולם</span>' :
                    '<span class="hbm-badge hbm-badge-loan">לא שולם</span>';
                html += '<tr>' +
                    '<td>' + escapeHtml(item.title) + '</td>' +
                    '<td>' + escapeHtml(item.payee || '-') + '</td>' +
                    '<td><strong>' + formatCurrency(item.amount) + '</strong></td>' +
                    '<td>' + formatDate(item.payment_date) + '</td>' +
                    '<td>' + escapeHtml(item.details || '-') + '</td>' +
                    '<td>' + bankLabel + '</td>' +
                    '<td>' + paidBadge + '</td>' +
                    '<td>' +
                    '<button class="hbm-btn hbm-btn-ghost hbm-btn-sm" onclick="hbmApp.toggleReservedPaymentPaid(' + item.id + ', ' + (item.is_paid ? 0 : 1) + ')">' + (item.is_paid ? 'סמן כלא שולם' : 'סמן כשולם') + '</button> ' +
                    '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteReservedPayment(' + item.id + ')">🗑️</button>' +
                    '</td></tr>';
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    function showReservedPaymentForm(editData) {
        var isEdit = !!editData;
        var html = '<form id="hbm-reserved-payment-form">' +
            '<div class="hbm-form-group"><label>כותרת</label>' +
            '<input type="text" name="title" value="' + escapeHtml(editData ? editData.title : '') + '" required></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>למי</label>' +
            '<input type="text" name="payee" value="' + escapeHtml(editData ? editData.payee || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>סכום</label>' +
            '<input type="number" step="0.01" name="amount" value="' + (editData ? editData.amount : '') + '" required></div>' +
            '</div>' +
            '<div class="hbm-form-group"><label>תאריך תשלום</label>' +
            '<input type="date" name="payment_date" value="' + (editData ? editData.payment_date || '' : '') + '" required></div>' +
            '<div class="hbm-form-group"><label>פרטים</label>' +
            '<input type="text" name="details" value="' + escapeHtml(editData ? editData.details || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>חשבון בנק</label>' +
            '<select name="bank_account_id">' + buildBankAccountOptions(editData ? editData.bank_account_id : null) + '</select></div>' +
            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">' + (isEdit ? 'עדכן' : 'הוסף') + '</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal(isEdit ? 'עריכת תשלום שמור' : 'הוספת תשלום שמור', html);

        document.getElementById('hbm-reserved-payment-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            var payload = {
                title: form.title.value,
                payee: form.payee.value,
                amount: parseFloat(form.amount.value),
                payment_date: form.payment_date.value,
                details: form.details.value,
                bank_account_id: form.bank_account_id.value || null,
            };

            var method = isEdit ? 'PUT' : 'POST';
            var endpoint = isEdit ? 'reserved-payments/' + editData.id : 'reserved-payments';
            apiRequest(endpoint, method, payload).then(function (response) {
                if (response && response.id) {
                    closeModal();
                    loadReservedPayments();
                }
            });
        });
    }

    function toggleReservedPaymentPaid(id, isPaid) {
        apiRequest('reserved-payments/' + id, 'PUT', { is_paid: isPaid }).then(function () {
            loadReservedPayments();
            loadDashboard();
        });
    }

    function deleteReservedPayment(id) {
        if (!confirm('האם למחוק תשלום שמור זה?')) return;
        apiRequest('reserved-payments/' + id, 'DELETE').then(function () {
            loadReservedPayments();
            loadDashboard();
        });
    }

    // ===================== Collections =====================
    function loadCollections() {
        apiRequest('collections', 'GET').then(function (data) {
            var container = document.getElementById('hbm-collections-list');
            if (!container) return;
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><div class="hbm-empty-state-icon">💼</div><p>אין רשומות גביה</p></div>';
                renderCollectionsCashflow([]);
                return;
            }

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>שם לקוח</th><th>סכום</th><th>תאריך תשלום</th><th>סטטוס</th><th>הערות</th><th>פעולות</th>' +
                '</tr></thead><tbody>';

            data.forEach(function (item) {
                html += '<tr>' +
                    '<td>' + escapeHtml(item.client_name) + '</td>' +
                    '<td><strong>' + formatCurrency(item.amount) + '</strong></td>' +
                    '<td>' + formatDate(item.payment_date) + '</td>' +
                    '<td>' +
                    '<select class="hbm-inline-select" onchange="hbmApp.updateCollectionStatus(' + item.id + ', this.value)">' +
                    '<option value="pending"' + (item.status === 'pending' ? ' selected' : '') + '>לא טופל</option>' +
                    '<option value="invoice_sent"' + (item.status === 'invoice_sent' ? ' selected' : '') + '>נשלחה חשבונית</option>' +
                    '<option value="paid"' + (item.status === 'paid' ? ' selected' : '') + '>שולם</option>' +
                    '<option value="receipt_sent"' + (item.status === 'receipt_sent' ? ' selected' : '') + '>נשלחה חשבונית מס קבלה</option>' +
                    '</select></td>' +
                    '<td>' + escapeHtml(item.notes || '-') + '</td>' +
                    '<td>' +
                    '<button class="hbm-btn hbm-btn-ghost hbm-btn-sm" onclick="hbmApp.editCollection(' + item.id + ')">✏️</button> ' +
                    '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteCollection(' + item.id + ')">🗑️</button>' +
                    '</td></tr>';
            });

            html += '</tbody></table>';
            container.innerHTML = html;
            renderCollectionsCashflow(data);
        });
    }

    function renderCollectionsCashflow(data) {
        var container = document.getElementById('hbm-collections-cashflow');
        if (!container) return;
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="hbm-empty-state"><p>אין נתוני תזרים גביה</p></div>';
            return;
        }

        // Sort by payment date
        var sorted = data.slice().sort(function (a, b) { return new Date(a.payment_date) - new Date(b.payment_date); });
        var totalExpected = 0;
        var totalPaid = 0;

        var html = '<table class="hbm-table"><thead><tr>' +
            '<th>לקוח</th><th>סכום</th><th>תאריך</th><th>סטטוס</th>' +
            '</tr></thead><tbody>';

        sorted.forEach(function (item) {
            var statusLabel = COLLECTION_STATUS_LABELS[item.status] || item.status;
            totalExpected += parseFloat(item.amount);
            if (item.status === 'paid') totalPaid += parseFloat(item.amount);
            html += '<tr>' +
                '<td>' + escapeHtml(item.client_name) + '</td>' +
                '<td>' + formatCurrency(item.amount) + '</td>' +
                '<td>' + formatDate(item.payment_date) + '</td>' +
                '<td>' + statusLabel + '</td>' +
                '</tr>';
        });

        html += '</tbody></table>';
        html += '<div class="hbm-cashflow-summary">' +
            '<span>סה"כ צפוי: <strong>' + formatCurrency(totalExpected) + '</strong></span>' +
            '<span>סה"כ שולם: <strong>' + formatCurrency(totalPaid) + '</strong></span>' +
            '<span>ממתין: <strong>' + formatCurrency(totalExpected - totalPaid) + '</strong></span>' +
            '</div>';
        container.innerHTML = html;
    }

    function showCollectionForm(editData) {
        var isEdit = !!editData;
        var html = '<form id="hbm-collection-form">' +
            '<div class="hbm-form-group"><label>שם לקוח</label>' +
            '<input type="text" name="client_name" value="' + escapeHtml(editData ? editData.client_name : '') + '" required></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>סכום</label>' +
            '<input type="number" step="0.01" name="amount" value="' + (editData ? editData.amount : '') + '" required></div>' +
            '<div class="hbm-form-group"><label>תאריך תשלום</label>' +
            '<input type="date" name="payment_date" value="' + (editData ? editData.payment_date || '' : '') + '" required></div>' +
            '</div>' +
            '<div class="hbm-form-group"><label>סטטוס</label>' +
            '<select name="status">' +
            '<option value="pending"' + (editData && editData.status === 'pending' ? ' selected' : '') + '>לא טופל</option>' +
            '<option value="invoice_sent"' + (editData && editData.status === 'invoice_sent' ? ' selected' : '') + '>נשלחה חשבונית</option>' +
            '<option value="paid"' + (editData && editData.status === 'paid' ? ' selected' : '') + '>שולם</option>' +
            '<option value="receipt_sent"' + (editData && editData.status === 'receipt_sent' ? ' selected' : '') + '>נשלחה חשבונית מס קבלה</option>' +
            '</select></div>' +
            '<div class="hbm-form-group"><label>הערות</label>' +
            '<textarea name="notes" rows="3">' + escapeHtml(editData ? editData.notes || '' : '') + '</textarea></div>' +
            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">' + (isEdit ? 'עדכן' : 'הוסף') + '</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal(isEdit ? 'עריכת גביה' : 'הוספת גביה', html);

        document.getElementById('hbm-collection-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            var payload = {
                client_name: form.client_name.value,
                amount: parseFloat(form.amount.value),
                payment_date: form.payment_date.value,
                status: form.status.value,
                notes: form.notes.value,
            };

            var method = isEdit ? 'PUT' : 'POST';
            var endpoint = isEdit ? 'collections/' + editData.id : 'collections';
            apiRequest(endpoint, method, payload).then(function (response) {
                if (response && response.id) {
                    closeModal();
                    loadCollections();
                }
            });
        });
    }

    function updateCollectionStatus(id, status) {
        apiRequest('collections/' + id, 'PUT', { status: status }).then(function () {
            loadCollections();
        });
    }

    function deleteCollection(id) {
        if (!confirm('האם למחוק רשומת גביה זו?')) return;
        apiRequest('collections/' + id, 'DELETE').then(function () {
            loadCollections();
        });
    }

    // ===================== Savings Report =====================
    function loadSavingsReport() {
        apiRequest('savings-log', 'GET').then(function (data) {
            var container = document.getElementById('hbm-savings-report');
            if (!container) return;
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין נתוני חיסכון</p></div>';
                return;
            }

            // Group by saving title
            var grouped = {};
            data.forEach(function (entry) {
                var key = entry.expense_title || entry.expense_id || 'אחר';
                if (!grouped[key]) {
                    grouped[key] = { entries: [], total: 0 };
                }
                grouped[key].entries.push(entry);
                grouped[key].total += parseFloat(entry.amount);
            });

            var html = '';
            var grandTotal = 0;
            Object.keys(grouped).forEach(function (title) {
                var group = grouped[title];
                grandTotal += group.total;
                html += '<div class="hbm-savings-group">' +
                    '<h4>' + escapeHtml(title) + ' - סה"כ: ' + formatCurrency(group.total) + '</h4>' +
                    '<table class="hbm-table"><thead><tr>' +
                    '<th>תאריך</th><th>סכום</th>' +
                    '</tr></thead><tbody>';
                group.entries.forEach(function (entry) {
                    html += '<tr><td>' + formatDate(entry.date) + '</td>' +
                        '<td>' + formatCurrency(entry.amount) + '</td></tr>';
                });
                html += '</tbody></table></div>';
            });

            html += '<div class="hbm-savings-grand-total">סה"כ כל החיסכונות: <strong>' + formatCurrency(grandTotal) + '</strong></div>';
            container.innerHTML = html;
        });
    }

    // ===================== Allocations =====================
    function loadAllocations() {
        apiRequest('budget-allocations', 'GET').then(function (data) {
            var container = document.getElementById('hbm-allocations-form');
            if (!container) return;
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

    // ===================== Settings =====================
    function loadSettings() {
        // Load user type radio state
        var radios = document.querySelectorAll('input[name="hbm-user-type"]');
        radios.forEach(function (r) {
            r.checked = r.value === userType;
        });

        // Render categories
        var container = document.getElementById('hbm-categories-list');
        if (container) {
            var html = '';
            Object.keys(CATEGORIES).forEach(function (key) {
                html += '<div class="hbm-category-chip">' +
                    '<span>' + CATEGORIES[key] + '</span>' +
                    '<button onclick="hbmApp.deleteCategory(\'' + key + '\')" title="מחק">&times;</button>' +
                    '</div>';
            });
            container.innerHTML = html;
        }

        // Render credit cards and bank accounts (they load independently)
        renderCreditCardsList();
        renderBankAccountsList();
    }

    function addCategory() {
        var keyEl = document.getElementById('hbm-new-cat-key');
        var labelEl = document.getElementById('hbm-new-cat-label');
        if (!keyEl || !labelEl) return;
        var key = keyEl.value.trim();
        var label = labelEl.value.trim();
        if (!key || !label) { alert('יש למלא את שני השדות'); return; }

        apiRequest('categories', 'POST', { key: key, label: label }).then(function (data) {
            Object.assign(CATEGORIES, data);
            loadSettings();
            keyEl.value = '';
            labelEl.value = '';
        });
    }

    // ===================== Public API =====================
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
        // User settings
        saveUserType: saveUserType,
        // Credit cards
        addCreditCard: addCreditCard,
        deleteCreditCard: deleteCreditCard,
        // Bank accounts
        addBankAccount: addBankAccount,
        editBankAccount: editBankAccount,
        deleteBankAccount: deleteBankAccount,
        // Standing orders
        showStandingOrderForm: function (id) {
            if (id) {
                apiRequest('standing-orders', 'GET').then(function (data) {
                    var item = data.find(function (i) { return i.id == id; });
                    if (item) showStandingOrderForm(item);
                });
            } else {
                showStandingOrderForm();
            }
        },
        editStandingOrder: function (id) {
            apiRequest('standing-orders', 'GET').then(function (data) {
                var item = data.find(function (i) { return i.id == id; });
                if (item) showStandingOrderForm(item);
            });
        },
        deleteStandingOrder: deleteStandingOrder,
        // Reserved payments
        showReservedPaymentForm: function (id) {
            if (id) {
                apiRequest('reserved-payments', 'GET').then(function (data) {
                    var item = data.find(function (i) { return i.id == id; });
                    if (item) showReservedPaymentForm(item);
                });
            } else {
                showReservedPaymentForm();
            }
        },
        toggleReservedPaymentPaid: toggleReservedPaymentPaid,
        deleteReservedPayment: deleteReservedPayment,
        // Collections
        showCollectionForm: function (id) {
            if (id) {
                apiRequest('collections', 'GET').then(function (data) {
                    var item = data.find(function (i) { return i.id == id; });
                    if (item) showCollectionForm(item);
                });
            } else {
                showCollectionForm();
            }
        },
        editCollection: function (id) {
            apiRequest('collections', 'GET').then(function (data) {
                var item = data.find(function (i) { return i.id == id; });
                if (item) showCollectionForm(item);
            });
        },
        updateCollectionStatus: updateCollectionStatus,
        deleteCollection: deleteCollection,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
