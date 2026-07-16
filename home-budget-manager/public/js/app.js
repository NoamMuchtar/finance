(function () {
    'use strict';

    var API = hbmData.apiUrl;
    var NONCE = hbmData.nonce;
    var CATEGORIES = hbmData.categories;

    var currentMonth = hbmData.currentMonth;
    var currentExpenseFilter = 'all';

    var creditCards = [];
    var bankAccounts = [];
    var bizCreditCards = [];
    var bizBankAccounts = [];
    var allocations = [];
    var userType = 'salaried';
    var activeCashFlowBankId = null;
    var activeCashFlowIsBiz = false;
    var activeCcChargesCardId = null;
    var activeCcChargesIsBiz = false;

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
        loadAllocationsData();
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

        if (method === 'GET') {
            opts.cache = 'no-store';
        }

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

    function formatDateISO(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
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
            case 'business': loadBusinessPage(); break;
            case 'biz-dashboard': loadBizDashboard(); break;
            case 'cashflow': loadCashFlowPage(); break;
            case 'cc-charges': loadCcChargesPage(); break;
        }
    }

    function updateNavVisibility() {
        var isSelfEmployed = userType === 'self_employed';
        var navCollections = document.getElementById('hbm-nav-collections');
        if (navCollections) navCollections.style.display = isSelfEmployed ? '' : 'none';
        var navBusiness = document.getElementById('hbm-nav-business');
        if (navBusiness) navBusiness.style.display = isSelfEmployed ? '' : 'none';
        var navBizDashboard = document.getElementById('hbm-nav-biz-dashboard');
        if (navBizDashboard) navBizDashboard.style.display = isSelfEmployed ? '' : 'none';
        var navBizDivider = document.getElementById('hbm-nav-business-divider');
        if (navBizDivider) navBizDivider.style.display = isSelfEmployed ? '' : 'none';
        var bizSettings = document.getElementById('hbm-business-settings');
        if (bizSettings) bizSettings.style.display = isSelfEmployed ? '' : 'none';
        buildBizCashFlowNavItems();
        buildBizCcChargesNavItems();
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
                var radios = document.querySelectorAll('input[name="hbm-user-type"]');
                radios.forEach(function (r) {
                    r.checked = r.value === userType;
                });
                if (userType === 'self_employed') {
                    loadBusinessCreditCards();
                    loadBusinessBankAccounts();
                }
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
        apiRequest('credit-cards', 'GET', { is_business: 0 }).then(function (data) {
            if (data && !data.error && Array.isArray(data)) {
                creditCards = data;
                renderCreditCardsList();
                buildCcChargesNavItems();
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
            var bankLabel = '';
            if (card.bank_account_id) {
                var ba = bankAccounts.find(function (a) { return a.id == card.bank_account_id; });
                if (ba) bankLabel = ' | חשבון: ' + escapeHtml(ba.bank_name) + ' ***' + escapeHtml(ba.last_three);
            }
            html += '<div class="hbm-settings-item">' +
                '<span>' + (card.card_name ? escapeHtml(card.card_name) + ' - ' : '') + '**** ' + escapeHtml(card.last_four) + ' | יום חיוב: ' + card.billing_day + bankLabel + '</span>' +
                '<div class="hbm-settings-item-actions">' +
                '<button class="hbm-btn hbm-btn-sm" onclick="hbmApp.editCreditCard(' + card.id + ')">ערוך</button>' +
                '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteCreditCard(' + card.id + ')">מחק</button>' +
                '</div></div>';
        });
        container.innerHTML = html;
        var bankSelect = document.getElementById('hbm-new-cc-bank-account');
        if (bankSelect) bankSelect.innerHTML = '<option value="">חשבון בנק לחיוב</option>' + buildBankAccountOptions();
    }

    function addCreditCard() {
        var last4 = document.getElementById('hbm-new-cc-last4');
        var billingDay = document.getElementById('hbm-new-cc-billing-day');
        var name = document.getElementById('hbm-new-cc-name');
        var bankAccountSelect = document.getElementById('hbm-new-cc-bank-account');
        if (!last4 || !billingDay || !name) return;
        if (!last4.value || !billingDay.value || !name.value) { alert('יש למלא שם כרטיס, 4 ספרות אחרונות ויום חיוב'); return; }

        var payload = {
            last_four: last4.value,
            billing_day: parseInt(billingDay.value),
            card_name: name.value
        };
        if (bankAccountSelect && bankAccountSelect.value) {
            payload.bank_account_id = parseInt(bankAccountSelect.value);
        }

        apiRequest('credit-cards', 'POST', payload).then(function (data) {
            if (data && data.id) {
                last4.value = '';
                billingDay.value = '';
                name.value = '';
                if (bankAccountSelect) bankAccountSelect.value = '';
                loadCreditCards();
            } else {
                alert('שגיאה בשמירת כרטיס אשראי: ' + (data && data.message ? data.message : 'שגיאה לא ידועה'));
            }
        });
    }

    function deleteCreditCard(id) {
        if (!confirm('האם למחוק כרטיס אשראי זה?')) return;
        apiRequest('credit-cards/' + id, 'DELETE').then(function () {
            loadCreditCards();
        });
    }

    function editCreditCard(id) {
        var card = creditCards.find(function (c) { return c.id == id; });
        if (!card) return;

        var html = '<form id="hbm-edit-cc-form">' +
            '<div class="hbm-form-group"><label>שם כרטיס</label>' +
            '<input type="text" name="card_name" value="' + escapeHtml(card.card_name || '') + '" required></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>4 ספרות אחרונות</label>' +
            '<input type="text" name="last_four" value="' + escapeHtml(card.last_four) + '" maxlength="4" required></div>' +
            '<div class="hbm-form-group"><label>יום חיוב</label>' +
            '<input type="number" name="billing_day" min="1" max="31" value="' + (card.billing_day || 1) + '" required></div>' +
            '</div>' +
            '<div class="hbm-form-group"><label>חשבון בנק לחיוב</label>' +
            '<select name="bank_account_id">' + buildBankAccountOptions(card.bank_account_id) + '</select></div>' +
            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">עדכן</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal('עריכת כרטיס אשראי', html);

        document.getElementById('hbm-edit-cc-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            apiRequest('credit-cards/' + id, 'PUT', {
                card_name: form.card_name.value,
                last_four: form.last_four.value,
                billing_day: parseInt(form.billing_day.value),
                bank_account_id: form.bank_account_id.value ? parseInt(form.bank_account_id.value) : null
            }).then(function (data) {
                if (data && data.id) {
                    closeModal();
                    loadCreditCards();
                }
            });
        });
    }

    // ===================== Bank Accounts =====================
    function loadBankAccounts() {
        apiRequest('bank-accounts', 'GET', { is_business: 0 }).then(function (data) {
            if (data && !data.error && Array.isArray(data)) {
                bankAccounts = data;
                renderBankAccountsList();
                buildCashFlowNavItems();
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
            } else {
                alert('שגיאה בשמירת חשבון בנק: ' + (data && data.message ? data.message : 'שגיאה לא ידועה'));
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
    function getDashboardDateDefaults() {
        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth();
        var startDate = new Date(year, month - 1, 20);
        var endDate = new Date(year, month, 20);
        return {
            start_date: startDate.getFullYear() + '-' + String(startDate.getMonth() + 1).padStart(2, '0') + '-' + String(startDate.getDate()).padStart(2, '0'),
            end_date: endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0') + '-' + String(endDate.getDate()).padStart(2, '0')
        };
    }

    function setupDashboardDateControls() {
        var startEl = document.getElementById('hbm-dashboard-start-date');
        var endEl = document.getElementById('hbm-dashboard-end-date');
        if (!startEl || !endEl) return;

        var defaults = getDashboardDateDefaults();
        if (!startEl.value) startEl.value = defaults.start_date;
        if (!endEl.value) endEl.value = defaults.end_date;

        var applyBtn = document.getElementById('hbm-dashboard-date-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', function () {
                loadDashboardData();
            });
        }

        var nextBtn = document.getElementById('hbm-dashboard-date-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                var curEnd = new Date(endEl.value);
                var nextStart = new Date(curEnd);
                var nextEnd = new Date(curEnd.getFullYear(), curEnd.getMonth() + 1, 20);
                startEl.value = formatDateISO(nextStart);
                endEl.value = formatDateISO(nextEnd);
                loadDashboardData();
            });
        }

        var resetBtn = document.getElementById('hbm-dashboard-date-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                var defs = getDashboardDateDefaults();
                startEl.value = defs.start_date;
                endEl.value = defs.end_date;
                loadDashboardData();
            });
        }
    }

    function getDashboardDateParams() {
        var startEl = document.getElementById('hbm-dashboard-start-date');
        var endEl = document.getElementById('hbm-dashboard-end-date');
        if (startEl && startEl.value && endEl && endEl.value) {
            return { start_date: startEl.value, end_date: endEl.value };
        }
        return { month: currentMonth };
    }

    function loadDashboardData() {
        var params = getDashboardDateParams();
        apiRequest('dashboard', 'GET', params).then(function (data) {
            if (!data || data.error || data.code) return;
            var totalIncomeEl = document.getElementById('hbm-total-income');
            if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(data.total_income);
            var totalExpensesEl = document.getElementById('hbm-total-expenses');
            if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(data.total_expenses);
            var remainingEl = document.getElementById('hbm-remaining');
            if (remainingEl) remainingEl.textContent = formatCurrency(data.remaining);
            var totalAllocatedEl = document.getElementById('hbm-total-allocated');
            if (totalAllocatedEl) totalAllocatedEl.textContent = formatCurrency(data.total_allocated || 0);
            var totalSavingsEl = document.getElementById('hbm-total-savings');
            if (totalSavingsEl) totalSavingsEl.textContent = formatCurrency(data.expenses_by_type.saving || 0);

            renderExpensesByType(data.expenses_by_type);
            renderExpensesByCategory(data.expenses_by_category);
            renderBudgetStatus(data.budget_status);
            renderExpenseDetails(data.expense_details, 'hbm-expense-details');
            renderRecentCcTransactions(data.recent_cc_transactions, 'hbm-recent-cc-transactions');
        });
        loadDashboardBankBalances();
    }

    function loadDashboard() {
        setupDashboardDateControls();

        apiRequest('dashboard', 'GET', getDashboardDateParams()).then(function (data) {
            if (!data || data.error || data.code) return;
            var totalIncomeEl = document.getElementById('hbm-total-income');
            if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(data.total_income);
            var totalExpensesEl = document.getElementById('hbm-total-expenses');
            if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(data.total_expenses);
            var remainingEl = document.getElementById('hbm-remaining');
            if (remainingEl) remainingEl.textContent = formatCurrency(data.remaining);
            var totalAllocatedEl = document.getElementById('hbm-total-allocated');
            if (totalAllocatedEl) totalAllocatedEl.textContent = formatCurrency(data.total_allocated || 0);
            var totalSavingsEl = document.getElementById('hbm-total-savings');
            if (totalSavingsEl) totalSavingsEl.textContent = formatCurrency(data.expenses_by_type.saving || 0);

            renderExpensesByType(data.expenses_by_type);
            renderExpensesByCategory(data.expenses_by_category);
            renderBudgetStatus(data.budget_status);
            renderExpenseDetails(data.expense_details, 'hbm-expense-details');
            renderRecentCcTransactions(data.recent_cc_transactions, 'hbm-recent-cc-transactions');
        });

        loadOverdraftWarning();
        loadDashboardBankBalances();
        loadDashboardReservedPayments();
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

    function renderExpenseDetails(details, containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        if (!details || details.length === 0) {
            container.innerHTML = '<div class="hbm-empty-state"><p>אין הוצאות בתקופה זו</p></div>';
            return;
        }
        var html = '<table class="hbm-table hbm-table-striped"><thead><tr>' +
            '<th>תיאור</th><th>סוג</th><th>קטגוריה</th><th>יום הורדה</th><th>סכום</th>' +
            '</tr></thead><tbody>';
        details.forEach(function (item) {
            var typeLabel, rowClass = '';
            if (item.type === 'credit_card') {
                typeLabel = '<span class="hbm-badge hbm-badge-info">כרטיס אשראי</span>';
                rowClass = ' class="hbm-row-cc"';
            } else if (item.type === 'standing_order') {
                typeLabel = '<span class="hbm-badge hbm-badge-fixed">הוראת קבע</span>';
            } else {
                var badgeClass = item.type === 'loan' ? 'hbm-badge-loan' :
                    item.type === 'saving' ? 'hbm-badge-saving' :
                    item.type === 'fixed' ? 'hbm-badge-fixed' : 'hbm-badge-default';
                typeLabel = '<span class="hbm-badge ' + badgeClass + '">' + (TYPE_LABELS[item.type] || item.type || '-') + '</span>';
            }
            var catLabel = CATEGORIES[item.category] || item.category || '-';
            var deductionDay = item.deduction_day ? item.deduction_day + ' לחודש' : '-';
            html += '<tr' + rowClass + '>' +
                '<td><strong>' + escapeHtml(item.title) + '</strong></td>' +
                '<td>' + typeLabel + '</td>' +
                '<td>' + catLabel + '</td>' +
                '<td>' + deductionDay + '</td>' +
                '<td class="hbm-amount-cell">' + formatCurrency(item.amount) + '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    function renderRecentCcTransactions(transactions, containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        if (!transactions || transactions.length === 0) {
            container.innerHTML = '<div class="hbm-empty-state"><p>אין עסקאות אשראי</p></div>';
            return;
        }
        var html = '<table class="hbm-table hbm-table-striped"><thead><tr>' +
            '<th>תיאור</th><th>משתמש</th><th>כרטיס</th><th>קטגוריה</th><th>סכום</th><th>תאריך</th>' +
            '</tr></thead><tbody>';
        transactions.forEach(function (item) {
            var catLabel = CATEGORIES[item.category] || item.category || '-';
            var installLabel = item.total_installments ? ' <span class="hbm-badge hbm-badge-info-sm">' + item.total_installments + ' תשלומים</span>' : '';
            html += '<tr>' +
                '<td><strong>' + escapeHtml(item.title) + '</strong>' + installLabel + '</td>' +
                '<td>' + escapeHtml(item.user_name || '-') + '</td>' +
                '<td>' + escapeHtml(item.card_name) + '</td>' +
                '<td>' + catLabel + '</td>' +
                '<td class="hbm-amount-cell">' + formatCurrency(item.amount) + '</td>' +
                '<td>' + formatDate(item.start_date) + '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    // ===================== Cash Flow Nav & Page =====================
    function buildCashFlowNavItems() {
        var container = document.getElementById('hbm-nav-cashflow-accounts');
        var header = document.getElementById('hbm-nav-cashflow-header');
        var divider = document.getElementById('hbm-nav-cashflow-divider');
        if (!container) return;

        container.innerHTML = '';
        var hasAccounts = bankAccounts.length > 0;
        if (header) header.style.display = hasAccounts ? '' : 'none';
        if (divider) divider.style.display = hasAccounts ? '' : 'none';

        bankAccounts.forEach(function (acct) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#';
            a.className = 'hbm-sidebar-nav-item';
            a.setAttribute('data-page', 'cashflow');
            a.setAttribute('data-bank-id', acct.id);
            a.setAttribute('data-bank-biz', '0');
            a.innerHTML = '<span class="nav-icon">🏦</span><span class="nav-label">' + escapeHtml(acct.bank_name) + ' ***' + escapeHtml(acct.last_three) + '</span>';
            a.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelectorAll('.hbm-sidebar-nav-item').forEach(function (l) { l.classList.remove('active'); });
                a.classList.add('active');
                activeCashFlowBankId = acct.id;
                activeCashFlowIsBiz = false;
                showPage('cashflow');
                var sidebar = document.getElementById('hbm-sidebar');
                if (sidebar) sidebar.classList.remove('open');
            });
            li.appendChild(a);
            container.appendChild(li);
        });
    }

    function buildBizCashFlowNavItems() {
        var container = document.getElementById('hbm-nav-biz-cashflow-accounts');
        var header = document.getElementById('hbm-nav-biz-cashflow-header');
        var divider = document.getElementById('hbm-nav-biz-cashflow-divider');
        if (!container) return;

        container.innerHTML = '';
        var isSelfEmployed = userType === 'self_employed';
        var hasAccounts = isSelfEmployed && bizBankAccounts.length > 0;
        if (header) header.style.display = hasAccounts ? '' : 'none';
        if (divider) divider.style.display = hasAccounts ? '' : 'none';

        if (!isSelfEmployed) return;

        bizBankAccounts.forEach(function (acct) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#';
            a.className = 'hbm-sidebar-nav-item';
            a.setAttribute('data-page', 'cashflow');
            a.setAttribute('data-bank-id', acct.id);
            a.setAttribute('data-bank-biz', '1');
            a.innerHTML = '<span class="nav-icon">🏦</span><span class="nav-label">' + escapeHtml(acct.bank_name) + ' ***' + escapeHtml(acct.last_three) + '</span>';
            a.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelectorAll('.hbm-sidebar-nav-item').forEach(function (l) { l.classList.remove('active'); });
                a.classList.add('active');
                activeCashFlowBankId = acct.id;
                activeCashFlowIsBiz = true;
                showPage('cashflow');
                var sidebar = document.getElementById('hbm-sidebar');
                if (sidebar) sidebar.classList.remove('open');
            });
            li.appendChild(a);
            container.appendChild(li);
        });
    }

    function loadCashFlowPage() {
        if (!activeCashFlowBankId) return;

        var allAccounts = activeCashFlowIsBiz ? bizBankAccounts : bankAccounts;
        var acct = allAccounts.find(function (a) { return a.id == activeCashFlowBankId; });
        var titleEl = document.getElementById('hbm-cashflow-page-title');
        if (titleEl && acct) {
            titleEl.textContent = 'תזרים מזומנים - ' + acct.bank_name + ' ***' + acct.last_three + (activeCashFlowIsBiz ? ' (עסקי)' : '');
        }

        var startDateEl = document.getElementById('hbm-cashflow-start-date');
        var endDateEl = document.getElementById('hbm-cashflow-end-date');
        if (startDateEl && !startDateEl.value) {
            var now = new Date();
            startDateEl.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        }
        if (endDateEl && !endDateEl.value) {
            var threeMonthsAhead = new Date();
            threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);
            endDateEl.value = threeMonthsAhead.getFullYear() + '-' + String(threeMonthsAhead.getMonth() + 1).padStart(2, '0') + '-' + String(threeMonthsAhead.getDate()).padStart(2, '0');
        }

        var applyBtn = document.getElementById('hbm-cashflow-apply');
        if (applyBtn) {
            var newBtn = applyBtn.cloneNode(true);
            applyBtn.parentNode.replaceChild(newBtn, applyBtn);
            newBtn.addEventListener('click', function () { loadCashFlowData(); });
        }

        loadCashFlowData();
    }

    function loadCashFlowData() {
        var container = document.getElementById('hbm-cashflow-table');
        if (!container || !activeCashFlowBankId) return;
        container.innerHTML = '<div class="hbm-empty-state"><p>טוען תזרים...</p></div>';

        var params = { bank_account_id: activeCashFlowBankId };
        var startEl = document.getElementById('hbm-cashflow-start-date');
        var endEl = document.getElementById('hbm-cashflow-end-date');
        if (startEl && startEl.value) params.start_date = startEl.value;
        if (endEl && endEl.value) params.end_date = endEl.value;
        if (!params.start_date && !params.end_date) params.months_ahead = 3;

        apiRequest('cash-flow', 'GET', params).then(function (data) {
            if (!data || data.error || !Array.isArray(data.entries)) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין נתוני תזרים</p></div>';
                return;
            }

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>תאריך</th><th>תיאור</th><th>סוג</th><th>סכום</th><th>יתרה</th>' +
                '</tr></thead><tbody>';

            data.entries.forEach(function (entry) {
                var rowClass = entry.is_charge ? ' class="hbm-cashflow-charge-row"' : '';
                html += '<tr' + rowClass + '>' +
                    '<td>' + formatDate(entry.date) + '</td>' +
                    '<td>' + escapeHtml(entry.description) + '</td>' +
                    '<td>' + escapeHtml(entry.type_label || entry.type || '-') + '</td>' +
                    '<td><strong>' + formatCurrency(entry.amount) + '</strong></td>' +
                    '<td>' + formatCurrency(entry.running_balance) + '</td>' +
                    '</tr>';
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    // ===================== Credit Card Charges Nav & Page =====================
    function buildCcChargesNavItems() {
        var container = document.getElementById('hbm-nav-cc-charges-cards');
        var header = document.getElementById('hbm-nav-cc-charges-header');
        var divider = document.getElementById('hbm-nav-cc-charges-divider');
        if (!container) return;

        container.innerHTML = '';
        var hasCards = creditCards.length > 0;
        if (header) header.style.display = hasCards ? '' : 'none';
        if (divider) divider.style.display = hasCards ? '' : 'none';

        creditCards.forEach(function (card) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#';
            a.className = 'hbm-sidebar-nav-item';
            a.setAttribute('data-page', 'cc-charges');
            a.setAttribute('data-card-id', card.id);
            a.innerHTML = '<span class="nav-icon">💳</span><span class="nav-label">' + escapeHtml(card.card_name) + ' ***' + escapeHtml(card.last_four) + '</span>';
            a.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelectorAll('.hbm-sidebar-nav-item').forEach(function (l) { l.classList.remove('active'); });
                a.classList.add('active');
                activeCcChargesCardId = card.id;
                activeCcChargesIsBiz = false;
                showPage('cc-charges');
                var sidebar = document.getElementById('hbm-sidebar');
                if (sidebar) sidebar.classList.remove('open');
            });
            li.appendChild(a);
            container.appendChild(li);
        });
    }

    function buildBizCcChargesNavItems() {
        var container = document.getElementById('hbm-nav-biz-cc-charges-cards');
        var header = document.getElementById('hbm-nav-biz-cc-charges-header');
        var divider = document.getElementById('hbm-nav-biz-cc-charges-divider');
        if (!container) return;

        container.innerHTML = '';
        var isSelfEmployed = userType === 'self_employed';
        var hasCards = isSelfEmployed && bizCreditCards.length > 0;
        if (header) header.style.display = hasCards ? '' : 'none';
        if (divider) divider.style.display = hasCards ? '' : 'none';

        if (!isSelfEmployed) return;

        bizCreditCards.forEach(function (card) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#';
            a.className = 'hbm-sidebar-nav-item';
            a.setAttribute('data-page', 'cc-charges');
            a.setAttribute('data-card-id', card.id);
            a.innerHTML = '<span class="nav-icon">💳</span><span class="nav-label">' + escapeHtml(card.card_name) + ' ***' + escapeHtml(card.last_four) + '</span>';
            a.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelectorAll('.hbm-sidebar-nav-item').forEach(function (l) { l.classList.remove('active'); });
                a.classList.add('active');
                activeCcChargesCardId = card.id;
                activeCcChargesIsBiz = true;
                showPage('cc-charges');
                var sidebar = document.getElementById('hbm-sidebar');
                if (sidebar) sidebar.classList.remove('open');
            });
            li.appendChild(a);
            container.appendChild(li);
        });
    }

    function loadCcChargesPage() {
        if (!activeCcChargesCardId) return;

        var allCards = activeCcChargesIsBiz ? bizCreditCards : creditCards;
        var card = allCards.find(function (c) { return c.id == activeCcChargesCardId; });
        var titleEl = document.getElementById('hbm-cc-charges-page-title');
        if (titleEl && card) {
            titleEl.textContent = 'פירוט חיובי אשראי - ' + card.card_name + ' ***' + card.last_four + (activeCcChargesIsBiz ? ' (עסקי)' : '');
        }

        var monthEl = document.getElementById('hbm-cc-charges-month');
        if (monthEl && !monthEl.value) {
            var now = new Date();
            var billingDay = card ? parseInt(card.billing_day) : 1;
            var chargeDate = now.getDate() > billingDay
                ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
                : new Date(now.getFullYear(), now.getMonth(), 1);
            var cy = chargeDate.getFullYear();
            var cm = ('0' + (chargeDate.getMonth() + 1)).slice(-2);
            monthEl.value = cy + '-' + cm;
        }

        var applyBtn = document.getElementById('hbm-cc-charges-apply');
        if (applyBtn) {
            var newBtn = applyBtn.cloneNode(true);
            applyBtn.parentNode.replaceChild(newBtn, applyBtn);
            newBtn.addEventListener('click', function () { loadCcChargesData(); });
        }

        loadCcChargesData();
    }

    function loadCcChargesData() {
        var container = document.getElementById('hbm-cc-charges-table');
        var summaryEl = document.getElementById('hbm-cc-charges-summary');
        if (!container || !activeCcChargesCardId) return;
        container.innerHTML = '<div class="hbm-empty-state"><p>טוען חיובים...</p></div>';

        var monthEl = document.getElementById('hbm-cc-charges-month');
        var month = (monthEl && monthEl.value) ? monthEl.value : currentMonth;

        apiRequest('credit-card-charges', 'GET', { credit_card_id: activeCcChargesCardId, month: month }).then(function (data) {
            if (!data || data.error || !Array.isArray(data.charges)) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין חיובים בתקופה זו</p></div>';
                if (summaryEl) summaryEl.textContent = '';
                return;
            }

            if (summaryEl) {
                summaryEl.textContent = 'סה"כ חיוב: ' + formatCurrency(data.total);
            }

            if (data.charges.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין חיובים בתקופה זו</p></div>';
                return;
            }

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>תיאור</th><th>קטגוריה</th><th>סוג</th><th>סכום חיוב</th><th>תשלומים</th>' +
                '</tr></thead><tbody>';

            data.charges.forEach(function (charge) {
                var typeLabel = TYPE_LABELS[charge.type] || charge.type;
                var catLabel = CATEGORIES[charge.category] || charge.category || '-';
                var installmentInfo = '-';
                if (charge.total_installments && charge.total_installments > 1) {
                    installmentInfo = charge.current_installment + '/' + charge.total_installments;
                }
                html += '<tr>' +
                    '<td>' + escapeHtml(charge.title) + '</td>' +
                    '<td>' + escapeHtml(catLabel) + '</td>' +
                    '<td>' + escapeHtml(typeLabel) + '</td>' +
                    '<td><strong>' + formatCurrency(charge.amount) + '</strong></td>' +
                    '<td>' + installmentInfo + '</td>' +
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
            var label = item.label || getCategoryLabel(item.category || '');

            html += '<div class="hbm-budget-bar-item">' +
                '<div class="hbm-budget-bar-header">' +
                '<span class="hbm-budget-bar-label">' + escapeHtml(label) + '</span>' +
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
        apiRequest('income', 'GET', { is_business: 0 }).then(function (data) {
            console.log('HBM loadIncome response:', data);
            var container = document.getElementById('hbm-income-list');
            if (!container) return;
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><div class="hbm-empty-state-icon">💼</div><p>אין הכנסות להצגה</p></div>';
                return;
            }

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>שם</th><th>מקור</th><th>סכום</th><th>חשבון בנק</th><th>תאריך התחלה</th><th>תאריך סיום</th><th>סטטוס</th><th>פעולות</th>' +
                '</tr></thead><tbody>';

            var today = new Date().toISOString().slice(0, 10);
            data.forEach(function (item) {
                var status = '';
                var statusClass = '';
                if (item.start_date > today) {
                    status = 'עתידי';
                    statusClass = 'hbm-badge-installment';
                } else if (item.end_date && item.end_date < today) {
                    status = 'הסתיים';
                    statusClass = 'hbm-badge-loan';
                } else {
                    status = 'פעיל';
                    statusClass = 'hbm-badge-saving';
                }
                var bankLabel = '-';
                if (item.bank_account_id) {
                    var ba = bankAccounts.find(function (a) { return a.id == item.bank_account_id; });
                    if (ba) bankLabel = ba.bank_name + ' ***' + ba.last_three;
                }
                html += '<tr>' +
                    '<td>' + escapeHtml(item.title) + '</td>' +
                    '<td>' + escapeHtml(item.source || '-') + '</td>' +
                    '<td><strong>' + formatCurrency(item.amount) + '</strong></td>' +
                    '<td>' + bankLabel + '</td>' +
                    '<td>' + formatDate(item.start_date) + '</td>' +
                    '<td>' + formatDate(item.end_date) + '</td>' +
                    '<td><span class="hbm-badge ' + statusClass + '">' + status + '</span></td>' +
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
            '<div class="hbm-form-group"><label>חשבון בנק (לתזרים מזומנים)</label>' +
            '<select name="bank_account_id">' + buildBankAccountOptions(editData ? editData.bank_account_id : null) + '</select></div>' +
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
            if (form.bank_account_id.value) {
                payload.bank_account_id = parseInt(form.bank_account_id.value);
            }

            var method = isEdit ? 'PUT' : 'POST';
            var endpoint = isEdit ? 'income/' + editData.id : 'income';
            apiRequest(endpoint, method, payload).then(function (response) {
                console.log('HBM income save response:', response);
                if (response && !response.code && (response.id || response.success)) {
                    closeModal();
                    loadIncome();
                    loadDashboard();
                } else {
                    var msg = 'שגיאה בשמירת הכנסה';
                    if (response && response.message) msg += ': ' + response.message;
                    if (response && response.code) msg += ' (' + response.code + ')';
                    alert(msg);
                }
            });
        });
    }

    // ===================== Expenses =====================
    function loadExpenses() {
        var params = { month: currentMonth, is_business: 0 };
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

            // Allocation selector
            '<div id="hbm-allocation-field" class="hbm-form-group">' +
            '<label>הקצאת תקציב (אופציונלי)</label>' +
            '<select name="allocation_id" id="hbm-expense-allocation">' +
            buildAllocationOptions(editData ? editData.allocation_id : null) +
            '</select></div>' +

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

            if (form.allocation_id && form.allocation_id.value) {
                payload.allocation_id = parseInt(form.allocation_id.value);
            }

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
                if (response && (response.id || response.success)) {
                    closeModal();
                    loadExpenses();
                    loadDashboard();
                } else {
                    alert('שגיאה בשמירת הוצאה: ' + (response && response.message ? response.message : 'שגיאה לא ידועה'));
                }
            });
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
                var typeLabel = item.type === 'bank' ? 'בנק' : 'אשראי';
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

        var soType = editData ? editData.type || 'bank' : 'bank';

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
            '<select name="type" id="hbm-so-type">' +
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
                type: form.type.value,
                day_of_month: parseInt(form.day_of_month.value),
                start_date: form.start_date.value,
            };
            if (form.end_date.value) payload.end_date = form.end_date.value;
            if (form.type.value === 'credit' && form.credit_card_id.value) {
                payload.credit_card_id = form.credit_card_id.value;
            }
            if (form.type.value === 'bank' && form.bank_account_id.value) {
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
    function loadAllocationsData() {
        apiRequest('budget-allocations', 'GET').then(function (data) {
            if (data && Array.isArray(data)) allocations = data;
        });
    }

    function buildAllocationOptions(selectedId) {
        var html = '<option value="">ללא הקצאה</option>';
        allocations.forEach(function (a) {
            if (!a.is_active) return;
            var sel = selectedId && selectedId == a.id ? ' selected' : '';
            var remaining = parseFloat(a.amount) - parseFloat(a.used_amount || 0);
            html += '<option value="' + a.id + '"' + sel + '>' + escapeHtml(a.label) + ' (נותר: ' + formatCurrency(remaining) + ')</option>';
        });
        return html;
    }

    function loadAllocations() {
        apiRequest('budget-allocations', 'GET').then(function (data) {
            var container = document.getElementById('hbm-allocations-list');
            if (!container) return;
            if (!data || !Array.isArray(data) || data.length === 0) {
                allocations = [];
                container.innerHTML = '<div class="hbm-empty-state"><div class="hbm-empty-state-icon">📊</div><p>אין הקצאות תקציב</p></div>';
                return;
            }
            allocations = data;

            var html = '';
            data.forEach(function (a) {
                var used = parseFloat(a.used_amount || 0);
                var total = parseFloat(a.amount);
                var remaining = total - used;
                var pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
                var barClass = pct >= 100 ? 'over-budget' : pct >= 80 ? 'warning' : '';

                html += '<div class="hbm-allocation-card">' +
                    '<div class="hbm-allocation-info">' +
                    '<div class="hbm-allocation-header">' +
                    '<strong>' + escapeHtml(a.label) + '</strong>' +
                    '<div>' +
                    '<button class="hbm-btn hbm-btn-ghost hbm-btn-sm" onclick="hbmApp.editAllocation(' + a.id + ')">✏️</button> ' +
                    '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteAllocation(' + a.id + ')">🗑️</button>' +
                    '</div></div>' +
                    '<div class="hbm-allocation-details">' +
                    '<span>הוקצה: ' + formatCurrency(total) + '</span>' +
                    '<span>נוצל: ' + formatCurrency(used) + '</span>' +
                    '<span>נותר: ' + formatCurrency(remaining) + '</span>' +
                    (a.deduction_date ? '<span>תאריך הורדה: ' + formatDate(a.deduction_date) + '</span>' : '') +
                    '</div>' +
                    '<div class="hbm-allocation-bar"><div class="hbm-allocation-bar-fill ' + barClass + '" style="width:' + pct + '%"></div></div>' +
                    '</div></div>';
            });

            container.innerHTML = html;
        });
    }

    function showAllocationForm(editData) {
        var isEdit = !!editData;
        var html = '<form id="hbm-allocation-form">' +
            '<div class="hbm-form-group"><label>תיאור ההקצאה</label>' +
            '<input type="text" name="label" value="' + escapeHtml(editData ? editData.label : '') + '" required placeholder="למשל: חופשה, ריהוט, חינוך"></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>סכום</label>' +
            '<input type="number" step="0.01" name="amount" value="' + (editData ? editData.amount : '') + '" required></div>' +
            '<div class="hbm-form-group"><label>תאריך הורדה בפועל (אופציונלי)</label>' +
            '<input type="date" name="deduction_date" value="' + (editData ? editData.deduction_date || '' : '') + '"></div>' +
            '</div>' +
            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">' + (isEdit ? 'עדכן' : 'הוסף') + '</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal(isEdit ? 'עריכת הקצאה' : 'הוספת הקצאה', html);

        document.getElementById('hbm-allocation-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            var payload = {
                label: form.label.value,
                amount: parseFloat(form.amount.value),
            };
            if (form.deduction_date.value) payload.deduction_date = form.deduction_date.value;

            var method = isEdit ? 'PUT' : 'POST';
            var endpoint = isEdit ? 'budget-allocations/' + editData.id : 'budget-allocations';
            apiRequest(endpoint, method, payload).then(function (response) {
                if (response && response.id) {
                    closeModal();
                    loadAllocations();
                    loadDashboard();
                }
            });
        });
    }

    function deleteAllocation(id) {
        if (!confirm('האם למחוק הקצאה זו?')) return;
        apiRequest('budget-allocations/' + id, 'DELETE').then(function () {
            loadAllocations();
            loadDashboard();
        });
    }

    // ===================== Overdraft Warning =====================
    function loadOverdraftWarning() {
        var warningEl = document.getElementById('hbm-overdraft-warning');
        var detailsEl = document.getElementById('hbm-overdraft-details');
        if (!warningEl || !detailsEl) return;

        apiRequest('overdraft-check', 'GET').then(function (data) {
            if (!data || data.error || !Array.isArray(data) || data.length === 0) {
                warningEl.style.display = 'none';
                return;
            }
            warningEl.style.display = '';
            var html = '';
            data.forEach(function (w) {
                var bizLabel = w.is_business ? ' (עסקי)' : '';
                html += '<p>חשבון <strong>' + escapeHtml(w.bank_name) + ' ***' + escapeHtml(w.last_three) + bizLabel +
                    '</strong> — צפי לחריגה בתאריך ' + formatDate(w.overdraft_date) +
                    ' | יתרה צפויה: ' + formatCurrency(w.projected_balance) +
                    ' | מסגרת: ' + formatCurrency(w.credit_limit) + '</p>';
            });
            detailsEl.innerHTML = html;
        });
    }

    // ===================== Dashboard Bank Balances =====================
    function loadDashboardBankBalances() {
        var container = document.getElementById('hbm-dashboard-bank-balances');
        if (!container) return;

        var endEl = document.getElementById('hbm-dashboard-end-date');
        var targetDate = endEl && endEl.value ? endEl.value : getDashboardDateDefaults().end_date;

        apiRequest('bank-balances', 'GET', { target_date: targetDate, is_business: 0 }).then(function (data) {
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין חשבונות בנק להצגה</p></div>';
                return;
            }
            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>חשבון</th><th>יתרה נוכחית</th><th>יתרה צפויה ב-' + formatDate(targetDate) + '</th><th>מסגרת</th>' +
                '</tr></thead><tbody>';
            data.forEach(function (b) {
                var balClass = b.projected_balance < -b.credit_limit ? ' style="color:#ef4444;font-weight:bold;"' : '';
                html += '<tr>' +
                    '<td>' + escapeHtml(b.bank_name) + ' ***' + escapeHtml(b.last_three) + '</td>' +
                    '<td>' + formatCurrency(b.initial_balance) + '</td>' +
                    '<td' + balClass + '>' + formatCurrency(b.projected_balance) + '</td>' +
                    '<td>' + formatCurrency(b.credit_limit) + '</td>' +
                    '</tr>';
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    // ===================== Business Dashboard Page =====================
    function loadBizDashboard() {
        setupBizDashDateControls();
        loadBizDashData();
        loadBizDashBankBalances();
    }

    function setupBizDashDateControls() {
        var startEl = document.getElementById('hbm-biz-dash-start-date');
        var endEl = document.getElementById('hbm-biz-dash-end-date');
        if (!startEl || !endEl) return;

        var defaults = getDashboardDateDefaults();
        if (!startEl.value) startEl.value = defaults.start_date;
        if (!endEl.value) endEl.value = defaults.end_date;

        var applyBtn = document.getElementById('hbm-biz-dash-date-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', function () {
                loadBizDashData();
                loadBizDashBankBalances();
            });
        }
        var nextBtn = document.getElementById('hbm-biz-dash-date-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                var curEnd = new Date(endEl.value);
                var nextStart = new Date(curEnd);
                var nextEnd = new Date(curEnd.getFullYear(), curEnd.getMonth() + 1, 20);
                startEl.value = formatDateISO(nextStart);
                endEl.value = formatDateISO(nextEnd);
                loadBizDashData();
                loadBizDashBankBalances();
            });
        }

        var resetBtn = document.getElementById('hbm-biz-dash-date-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                var defs = getDashboardDateDefaults();
                startEl.value = defs.start_date;
                endEl.value = defs.end_date;
                loadBizDashData();
                loadBizDashBankBalances();
            });
        }
    }

    function loadBizDashData() {
        apiRequest('business-dashboard', 'GET', { month: currentMonth }).then(function (data) {
            if (!data || data.error) return;
            var el;
            el = document.getElementById('hbm-biz-dash-income');
            if (el) el.textContent = formatCurrency(data.total_income);
            el = document.getElementById('hbm-biz-dash-expenses');
            if (el) el.textContent = formatCurrency(data.total_expenses);
            el = document.getElementById('hbm-biz-dash-salary');
            if (el) el.textContent = formatCurrency(data.available_salary);

            var collContainer = document.getElementById('hbm-biz-dash-collections');
            if (collContainer) {
                if (!data.collection_items || data.collection_items.length === 0) {
                    collContainer.innerHTML = '<div class="hbm-empty-state"><p>אין גביות ששולמו בתקופה זו</p></div>';
                } else {
                    var html = '<table class="hbm-table"><thead><tr>' +
                        '<th>לקוח</th><th>סכום</th><th>תאריך תשלום</th><th>סטטוס</th>' +
                        '</tr></thead><tbody>';
                    data.collection_items.forEach(function (item) {
                        var statusLabel = COLLECTION_STATUS_LABELS[item.status] || item.status;
                        html += '<tr>' +
                            '<td>' + escapeHtml(item.client_name) + '</td>' +
                            '<td><strong>' + formatCurrency(item.amount) + '</strong></td>' +
                            '<td>' + formatDate(item.payment_date) + '</td>' +
                            '<td>' + statusLabel + '</td>' +
                            '</tr>';
                    });
                    html += '</tbody></table>';
                    collContainer.innerHTML = html;
                }
            }

            renderExpenseDetails(data.expense_details, 'hbm-biz-expense-details');
            renderRecentCcTransactions(data.recent_cc_transactions, 'hbm-biz-recent-cc-transactions');
        });
    }

    function loadBizDashBankBalances() {
        var container = document.getElementById('hbm-biz-dash-bank-balances');
        if (!container) return;

        var endEl = document.getElementById('hbm-biz-dash-end-date');
        var targetDate = endEl && endEl.value ? endEl.value : getDashboardDateDefaults().end_date;

        apiRequest('bank-balances', 'GET', { target_date: targetDate, is_business: 1 }).then(function (data) {
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין חשבונות בנק עסקיים להצגה</p></div>';
                return;
            }
            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>חשבון</th><th>יתרה נוכחית</th><th>יתרה צפויה ב-' + formatDate(targetDate) + '</th><th>מסגרת</th>' +
                '</tr></thead><tbody>';
            data.forEach(function (b) {
                var balClass = b.projected_balance < -b.credit_limit ? ' style="color:#ef4444;font-weight:bold;"' : '';
                html += '<tr>' +
                    '<td>' + escapeHtml(b.bank_name) + ' ***' + escapeHtml(b.last_three) + '</td>' +
                    '<td>' + formatCurrency(b.initial_balance) + '</td>' +
                    '<td' + balClass + '>' + formatCurrency(b.projected_balance) + '</td>' +
                    '<td>' + formatCurrency(b.credit_limit) + '</td>' +
                    '</tr>';
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    // ===================== Salary Transfer =====================
    function showSalaryForm() {
        var html = '<form id="hbm-salary-form">' +
            '<div class="hbm-form-group"><label>כותרת</label>' +
            '<input type="text" name="title" value="משכורת" required></div>' +
            '<div class="hbm-form-group"><label>סכום</label>' +
            '<input type="number" step="0.01" name="amount" required></div>' +
            '<div class="hbm-form-group"><label>תאריך העברה</label>' +
            '<input type="date" name="transfer_date" value="' + new Date().toISOString().slice(0, 10) + '" required></div>' +
            '<div class="hbm-form-group"><label>חשבון בנק פרטי (יעד)</label>' +
            '<select name="bank_account_id" required>' + buildBankAccountOptions() + '</select></div>' +
            '<div class="hbm-form-group"><label>חשבון בנק עסקי (מקור)</label>' +
            '<select name="biz_bank_account_id">' + buildBizBankAccountOptions() + '</select></div>' +
            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">העבר משכורת</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal('העברת משכורת', html);

        document.getElementById('hbm-salary-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            var payload = {
                title: form.title.value,
                amount: parseFloat(form.amount.value),
                transfer_date: form.transfer_date.value,
                bank_account_id: parseInt(form.bank_account_id.value),
                biz_bank_account_id: form.biz_bank_account_id.value ? parseInt(form.biz_bank_account_id.value) : 0,
            };
            apiRequest('salary-transfer', 'POST', payload).then(function (response) {
                if (response && response.success) {
                    closeModal();
                    alert('המשכורת הועברה בהצלחה!');
                    loadBusinessPage();
                } else {
                    alert('שגיאה בהעברת משכורת: ' + (response && response.message ? response.message : 'שגיאה לא ידועה'));
                }
            });
        });
    }

    // ===================== Business =====================
    function loadBusinessPage() {
        loadBusinessDashboardPage();
        loadBusinessManualIncome();
        loadBusinessIncome();
        loadBusinessExpenses();
    }

    function loadBusinessDashboardPage() {
        apiRequest('business-dashboard', 'GET', { month: currentMonth }).then(function (data) {
            if (!data || data.error) return;
            var el;
            el = document.getElementById('hbm-biz-page-income');
            if (el) el.textContent = formatCurrency(data.total_income);
            el = document.getElementById('hbm-biz-page-expenses');
            if (el) el.textContent = formatCurrency(data.total_expenses);
            el = document.getElementById('hbm-biz-page-salary');
            if (el) el.textContent = formatCurrency(data.available_salary);
        });
    }

    function loadBusinessManualIncome() {
        apiRequest('income', 'GET', { is_business: 1 }).then(function (data) {
            var container = document.getElementById('hbm-biz-manual-income-list');
            if (!container) return;
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין הכנסות עסקיות ידניות</p></div>';
                return;
            }
            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>שם</th><th>מקור</th><th>סכום</th><th>תאריך התחלה</th><th>תאריך סיום</th><th>סטטוס</th><th>פעולות</th>' +
                '</tr></thead><tbody>';
            var today = new Date().toISOString().slice(0, 10);
            data.forEach(function (item) {
                var status = '';
                var statusClass = '';
                if (item.start_date > today) {
                    status = 'עתידי';
                    statusClass = 'hbm-badge-installment';
                } else if (item.end_date && item.end_date < today) {
                    status = 'הסתיים';
                    statusClass = 'hbm-badge-loan';
                } else {
                    status = 'פעיל';
                    statusClass = 'hbm-badge-saving';
                }
                html += '<tr>' +
                    '<td>' + escapeHtml(item.title) + '</td>' +
                    '<td>' + escapeHtml(item.source || '-') + '</td>' +
                    '<td><strong>' + formatCurrency(item.amount) + '</strong></td>' +
                    '<td>' + formatDate(item.start_date) + '</td>' +
                    '<td>' + formatDate(item.end_date) + '</td>' +
                    '<td><span class="hbm-badge ' + statusClass + '">' + status + '</span></td>' +
                    '<td><button class="hbm-btn hbm-btn-ghost hbm-btn-sm" onclick="hbmApp.editBusinessIncome(' + item.id + ')">✏️</button> ' +
                    '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteBusinessIncome(' + item.id + ')">🗑️</button></td>' +
                    '</tr>';
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    function loadBusinessIncome() {
        apiRequest('collections', 'GET').then(function (data) {
            var container = document.getElementById('hbm-biz-income-list');
            if (!container) return;
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין רשומות גביה</p></div>';
                return;
            }
            var paidData = data.filter(function (item) { return item.status === 'paid' || item.status === 'receipt_sent'; });
            if (paidData.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין גביות ששולמו</p></div>';
                return;
            }
            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>לקוח</th><th>סכום</th><th>תאריך תשלום</th><th>סטטוס</th>' +
                '</tr></thead><tbody>';
            paidData.forEach(function (item) {
                var statusLabel = COLLECTION_STATUS_LABELS[item.status] || item.status;
                html += '<tr>' +
                    '<td>' + escapeHtml(item.client_name) + '</td>' +
                    '<td><strong>' + formatCurrency(item.amount) + '</strong></td>' +
                    '<td>' + formatDate(item.payment_date) + '</td>' +
                    '<td>' + statusLabel + '</td>' +
                    '</tr>';
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    function loadBusinessExpenses() {
        apiRequest('expenses', 'GET', { month: currentMonth, is_business: 1 }).then(function (data) {
            var container = document.getElementById('hbm-biz-expenses-list');
            if (!container) return;
            if (!data || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין הוצאות עסקיות</p></div>';
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
                    '<td><button class="hbm-btn hbm-btn-ghost hbm-btn-sm" onclick="hbmApp.editBusinessExpense(' + item.id + ')">✏️</button> ' +
                    '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteExpense(' + item.id + ')">🗑️</button></td>' +
                    '</tr>';
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    function showBusinessIncomeForm(editData) {
        var isEdit = !!editData;
        var html = '<form id="hbm-biz-income-form">' +
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
            '<div class="hbm-form-group"><label>חשבון בנק עסקי (לתזרים מזומנים)</label>' +
            '<select name="bank_account_id">' + buildBizBankAccountOptions(editData ? editData.bank_account_id : null) + '</select></div>' +
            '<div class="hbm-form-group"><label><input type="checkbox" name="is_recurring" ' + (editData && editData.is_recurring == 1 ? 'checked' : !editData ? 'checked' : '') + '> הכנסה חוזרת (חודשית)</label></div>' +
            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">' + (isEdit ? 'עדכן' : 'הוסף') + '</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal(isEdit ? 'עריכת הכנסה עסקית' : 'הוספת הכנסה עסקית', html);

        document.getElementById('hbm-biz-income-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            var payload = {
                title: form.title.value,
                amount: parseFloat(form.amount.value),
                source: form.source.value,
                start_date: form.start_date.value,
                is_recurring: form.is_recurring.checked ? 1 : 0,
                is_business: 1,
            };
            if (form.end_date.value) payload.end_date = form.end_date.value;
            if (form.bank_account_id.value) payload.bank_account_id = parseInt(form.bank_account_id.value);

            var method = isEdit ? 'PUT' : 'POST';
            var endpoint = isEdit ? 'income/' + editData.id : 'income';
            apiRequest(endpoint, method, payload).then(function (response) {
                if (response && (response.id || response.success)) {
                    closeModal();
                    loadBusinessManualIncome();
                    loadBusinessDashboardPage();
                }
            });
        });
    }

    function showBusinessExpenseForm(editData) {
        var isEdit = !!editData;
        var catOptions = '<option value="">ללא קטגוריה</option>';
        Object.keys(CATEGORIES).forEach(function (key) {
            var selected = editData && editData.category === key ? 'selected' : '';
            catOptions += '<option value="' + key + '" ' + selected + '>' + CATEGORIES[key] + '</option>';
        });

        var editType = editData ? editData.type : '';
        if (editType === 'regular') editType = 'one_time';

        var html = '<form id="hbm-biz-expense-form">' +
            '<div class="hbm-form-group"><label>סוג הוצאה</label>' +
            '<select name="type" id="hbm-biz-expense-type">' +
            '<option value="one_time"' + (editType === 'one_time' || !editType ? ' selected' : '') + '>חד פעמי</option>' +
            '<option value="fixed"' + (editType === 'fixed' ? ' selected' : '') + '>הוצאה קבועה</option>' +
            '<option value="installment"' + (editType === 'installment' ? ' selected' : '') + '>תשלומים</option>' +
            '</select></div>' +
            '<div class="hbm-form-group"><label>שם ההוצאה</label>' +
            '<input type="text" name="title" value="' + escapeHtml(editData ? editData.title : '') + '" required></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>למי משלמים</label>' +
            '<input type="text" name="payee" value="' + escapeHtml(editData ? editData.payee || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>קטגוריה</label>' +
            '<select name="category">' + catOptions + '</select></div>' +
            '</div>' +
            '<div class="hbm-form-group"><label>סכום</label>' +
            '<input type="number" step="0.01" name="amount" value="' + (editData ? editData.amount : '') + '" required></div>' +
            '<div class="hbm-form-group"><label>תיאור</label>' +
            '<input type="text" name="description" value="' + escapeHtml(editData ? editData.description || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>תאריך התחלה</label>' +
            '<input type="date" name="start_date" value="' + (editData ? editData.start_date : currentMonth + '-01') + '" required></div>' +

            '<div id="hbm-biz-credit-card-field" class="hbm-type-fields">' +
            '<div class="hbm-form-group"><label>כרטיס אשראי עסקי</label>' +
            '<select name="credit_card_id" id="hbm-biz-expense-cc">' +
            buildBizCreditCardOptions(editData ? editData.credit_card_id : null) +
            '</select></div></div>' +

            '<div id="hbm-biz-installment-fields" class="hbm-type-fields">' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>מספר תשלומים</label>' +
            '<input type="number" name="total_installments" value="' + (editData ? editData.total_installments || '' : '') + '"></div>' +
            '<div class="hbm-form-group"><label>סכום לתשלום</label>' +
            '<input type="number" step="0.01" name="installment_amount" value="' + (editData ? editData.installment_amount || '' : '') + '"></div>' +
            '</div></div>' +

            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">' + (isEdit ? 'עדכן' : 'הוסף') + '</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal(isEdit ? 'עריכת הוצאה עסקית' : 'הוספת הוצאה עסקית', html);

        var bizTypeSelect = document.getElementById('hbm-biz-expense-type');
        function updateBizExpFields() {
            var t = bizTypeSelect.value;
            var ccField = document.getElementById('hbm-biz-credit-card-field');
            var instFields = document.getElementById('hbm-biz-installment-fields');
            if (ccField) ccField.classList.toggle('active', t === 'installment' || t === 'one_time');
            if (instFields) instFields.classList.toggle('active', t === 'installment');
        }
        updateBizExpFields();
        bizTypeSelect.addEventListener('change', updateBizExpFields);

        document.getElementById('hbm-biz-expense-form').addEventListener('submit', function (e) {
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
                is_business: 1,
            };
            if (form.credit_card_id && form.credit_card_id.value) {
                payload.credit_card_id = form.credit_card_id.value;
            }
            if (type === 'installment') {
                payload.total_installments = parseInt(form.total_installments.value);
                payload.installment_amount = parseFloat(form.installment_amount.value) || null;
            }

            var method = isEdit ? 'PUT' : 'POST';
            var endpoint = isEdit ? 'expenses/' + editData.id : 'expenses';
            apiRequest(endpoint, method, payload).then(function (response) {
                if (response && response.id) {
                    closeModal();
                    loadBusinessExpenses();
                    loadBusinessDashboardPage();
                    loadBusinessDashboard();
                }
            });
        });
    }

    function buildBizCreditCardOptions(selectedId) {
        var html = '<option value="">בחר כרטיס אשראי עסקי</option>';
        bizCreditCards.forEach(function (card) {
            var sel = selectedId && selectedId == card.id ? ' selected' : '';
            var label = (card.card_name ? card.card_name + ' - ' : '') + '**** ' + card.last_four + ' (יום חיוב: ' + card.billing_day + ')';
            html += '<option value="' + card.id + '"' + sel + '>' + label + '</option>';
        });
        return html;
    }

    function buildBizBankAccountOptions(selectedId) {
        var html = '<option value="">בחר חשבון בנק עסקי</option>';
        bizBankAccounts.forEach(function (acct) {
            var sel = selectedId && selectedId == acct.id ? ' selected' : '';
            var label = acct.bank_name + ' - ***' + acct.last_three;
            html += '<option value="' + acct.id + '"' + sel + '>' + label + '</option>';
        });
        return html;
    }

    // Business Credit Cards
    function loadBusinessCreditCards() {
        apiRequest('credit-cards', 'GET', { is_business: 1 }).then(function (data) {
            if (data && !data.error && Array.isArray(data)) {
                bizCreditCards = data;
                renderBusinessCreditCardsList();
                buildBizCcChargesNavItems();
            }
        });
    }

    function renderBusinessCreditCardsList() {
        var container = document.getElementById('hbm-biz-credit-cards-list');
        if (!container) return;
        if (bizCreditCards.length === 0) {
            container.innerHTML = '<p class="hbm-empty-hint">לא הוגדרו כרטיסי אשראי עסקיים</p>';
            return;
        }
        var html = '';
        bizCreditCards.forEach(function (card) {
            var bankLabel = '';
            if (card.bank_account_id) {
                var ba = bizBankAccounts.find(function (a) { return a.id == card.bank_account_id; });
                if (ba) bankLabel = ' | חשבון: ' + escapeHtml(ba.bank_name) + ' ***' + escapeHtml(ba.last_three);
            }
            html += '<div class="hbm-settings-item">' +
                '<span>' + (card.card_name ? escapeHtml(card.card_name) + ' - ' : '') + '**** ' + escapeHtml(card.last_four) + ' | יום חיוב: ' + card.billing_day + bankLabel + '</span>' +
                '<div class="hbm-settings-item-actions">' +
                '<button class="hbm-btn hbm-btn-sm" onclick="hbmApp.editBusinessCreditCard(' + card.id + ')">ערוך</button>' +
                '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteBusinessCreditCard(' + card.id + ')">מחק</button>' +
                '</div></div>';
        });
        container.innerHTML = html;
        var bankSelect = document.getElementById('hbm-new-biz-cc-bank-account');
        if (bankSelect) bankSelect.innerHTML = '<option value="">חשבון בנק לחיוב</option>' + buildBizBankAccountOptions();
    }

    function addBusinessCreditCard() {
        var last4 = document.getElementById('hbm-new-biz-cc-last4');
        var billingDay = document.getElementById('hbm-new-biz-cc-billing-day');
        var name = document.getElementById('hbm-new-biz-cc-name');
        var bankAccountSelect = document.getElementById('hbm-new-biz-cc-bank-account');
        if (!last4 || !billingDay || !name) return;
        if (!last4.value || !billingDay.value || !name.value) { alert('יש למלא שם כרטיס, 4 ספרות אחרונות ויום חיוב'); return; }

        var payload = {
            last_four: last4.value,
            billing_day: parseInt(billingDay.value),
            card_name: name.value,
            is_business: 1
        };
        if (bankAccountSelect && bankAccountSelect.value) {
            payload.bank_account_id = parseInt(bankAccountSelect.value);
        }

        apiRequest('credit-cards', 'POST', payload).then(function (data) {
            if (data && data.id) {
                last4.value = '';
                billingDay.value = '';
                name.value = '';
                if (bankAccountSelect) bankAccountSelect.value = '';
                loadBusinessCreditCards();
            } else {
                alert('שגיאה בשמירת כרטיס אשראי עסקי: ' + (data && data.message ? data.message : 'שגיאה לא ידועה'));
            }
        });
    }

    function deleteBusinessCreditCard(id) {
        if (!confirm('האם למחוק כרטיס אשראי עסקי זה?')) return;
        apiRequest('credit-cards/' + id, 'DELETE').then(function () {
            loadBusinessCreditCards();
        });
    }

    function editBusinessCreditCard(id) {
        var card = bizCreditCards.find(function (c) { return c.id == id; });
        if (!card) return;

        var html = '<form id="hbm-edit-cc-form">' +
            '<div class="hbm-form-group"><label>שם כרטיס</label>' +
            '<input type="text" name="card_name" value="' + escapeHtml(card.card_name || '') + '" required></div>' +
            '<div class="hbm-form-row">' +
            '<div class="hbm-form-group"><label>4 ספרות אחרונות</label>' +
            '<input type="text" name="last_four" value="' + escapeHtml(card.last_four) + '" maxlength="4" required></div>' +
            '<div class="hbm-form-group"><label>יום חיוב</label>' +
            '<input type="number" name="billing_day" min="1" max="31" value="' + (card.billing_day || 1) + '" required></div>' +
            '</div>' +
            '<div class="hbm-form-group"><label>חשבון בנק לחיוב</label>' +
            '<select name="bank_account_id">' + buildBizBankAccountOptions(card.bank_account_id) + '</select></div>' +
            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">עדכן</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal('עריכת כרטיס אשראי עסקי', html);

        document.getElementById('hbm-edit-cc-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            apiRequest('credit-cards/' + id, 'PUT', {
                card_name: form.card_name.value,
                last_four: form.last_four.value,
                billing_day: parseInt(form.billing_day.value),
                bank_account_id: form.bank_account_id.value ? parseInt(form.bank_account_id.value) : null
            }).then(function (data) {
                if (data && data.id) {
                    closeModal();
                    loadBusinessCreditCards();
                }
            });
        });
    }

    // Business Bank Accounts
    function loadBusinessBankAccounts() {
        apiRequest('bank-accounts', 'GET', { is_business: 1 }).then(function (data) {
            if (data && !data.error && Array.isArray(data)) {
                bizBankAccounts = data;
                renderBusinessBankAccountsList();
                buildBizCashFlowNavItems();
            }
        });
    }

    function renderBusinessBankAccountsList() {
        var container = document.getElementById('hbm-biz-bank-accounts-list');
        if (!container) return;
        if (bizBankAccounts.length === 0) {
            container.innerHTML = '<p class="hbm-empty-hint">לא הוגדרו חשבונות בנק עסקיים</p>';
            return;
        }
        var html = '';
        bizBankAccounts.forEach(function (acct) {
            html += '<div class="hbm-settings-item">' +
                '<span>' + escapeHtml(acct.bank_name) + ' - ***' + escapeHtml(acct.last_three) +
                ' | מסגרת: ' + formatCurrency(acct.credit_limit || 0) +
                ' | יתרה: ' + formatCurrency(acct.initial_balance || 0) + '</span>' +
                '<div>' +
                '<button class="hbm-btn hbm-btn-ghost hbm-btn-sm" onclick="hbmApp.editBusinessBankAccount(' + acct.id + ')">ערוך</button> ' +
                '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteBusinessBankAccount(' + acct.id + ')">מחק</button>' +
                '</div></div>';
        });
        container.innerHTML = html;
    }

    function addBusinessBankAccount() {
        var last3 = document.getElementById('hbm-new-biz-ba-last3');
        var bankName = document.getElementById('hbm-new-biz-ba-bank-name');
        var creditLimit = document.getElementById('hbm-new-biz-ba-credit-limit');
        var initialBalance = document.getElementById('hbm-new-biz-ba-initial-balance');
        if (!last3 || !bankName) return;
        if (!last3.value || !bankName.value) { alert('יש למלא 3 ספרות אחרונות ושם בנק'); return; }

        apiRequest('bank-accounts', 'POST', {
            last_three: last3.value,
            bank_name: bankName.value,
            credit_limit: creditLimit ? parseFloat(creditLimit.value) || 0 : 0,
            initial_balance: initialBalance ? parseFloat(initialBalance.value) || 0 : 0,
            is_business: 1
        }).then(function (data) {
            if (data && data.id) {
                last3.value = '';
                bankName.value = '';
                if (creditLimit) creditLimit.value = '';
                if (initialBalance) initialBalance.value = '';
                loadBusinessBankAccounts();
            } else {
                alert('שגיאה בשמירת חשבון בנק עסקי: ' + (data && data.message ? data.message : 'שגיאה לא ידועה'));
            }
        });
    }

    function editBusinessBankAccount(id) {
        var acct = bizBankAccounts.find(function (a) { return a.id == id; });
        if (!acct) return;

        var html = '<form id="hbm-edit-biz-ba-form">' +
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

        openModal('עריכת חשבון בנק עסקי', html);

        document.getElementById('hbm-edit-biz-ba-form').addEventListener('submit', function (e) {
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
                    loadBusinessBankAccounts();
                }
            });
        });
    }

    function deleteBusinessBankAccount(id) {
        if (!confirm('האם למחוק חשבון בנק עסקי זה?')) return;
        apiRequest('bank-accounts/' + id, 'DELETE').then(function () {
            loadBusinessBankAccounts();
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

        renderCreditCardsList();
        renderBankAccountsList();

        if (userType === 'self_employed') {
            loadBusinessCreditCards();
            loadBusinessBankAccounts();
        }
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
            apiRequest('income', 'GET', { is_business: 0 }).then(function (data) {
                var item = data.find(function (i) { return i.id == id; });
                if (item) showIncomeForm(item);
            });
        },
        deleteIncome: function (id) {
            if (!confirm('האם למחוק הכנסה זו?')) return;
            apiRequest('income/' + id, 'DELETE').then(function () { loadIncome(); loadDashboard(); });
        },
        editExpense: function (id) {
            apiRequest('expenses', 'GET', { month: currentMonth, is_business: 0 }).then(function (data) {
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
        editCreditCard: editCreditCard,
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
        // Allocations
        showAllocationForm: function (id) {
            if (id) {
                var a = allocations.find(function (x) { return x.id == id; });
                if (a) showAllocationForm(a);
            } else {
                showAllocationForm();
            }
        },
        editAllocation: function (id) {
            var a = allocations.find(function (x) { return x.id == id; });
            if (a) showAllocationForm(a);
        },
        deleteAllocation: deleteAllocation,
        // Business
        showSalaryForm: showSalaryForm,
        showBusinessIncomeForm: function (id) {
            if (id) {
                apiRequest('income', 'GET', { is_business: 1 }).then(function (data) {
                    var item = data.find(function (i) { return i.id == id; });
                    if (item) showBusinessIncomeForm(item);
                });
            } else {
                showBusinessIncomeForm();
            }
        },
        editBusinessIncome: function (id) {
            apiRequest('income', 'GET', { is_business: 1 }).then(function (data) {
                var item = data.find(function (i) { return i.id == id; });
                if (item) showBusinessIncomeForm(item);
            });
        },
        deleteBusinessIncome: function (id) {
            if (!confirm('האם למחוק הכנסה עסקית זו?')) return;
            apiRequest('income/' + id, 'DELETE').then(function () { loadBusinessManualIncome(); loadBusinessDashboardPage(); });
        },
        showBusinessExpenseForm: function (id) {
            if (id) {
                apiRequest('expenses', 'GET', { month: currentMonth, is_business: 1 }).then(function (data) {
                    var item = data.find(function (i) { return i.id == id; });
                    if (item) showBusinessExpenseForm(item);
                });
            } else {
                showBusinessExpenseForm();
            }
        },
        editBusinessExpense: function (id) {
            apiRequest('expenses', 'GET', { month: currentMonth, is_business: 1 }).then(function (data) {
                var item = data.find(function (i) { return i.id == id; });
                if (item) showBusinessExpenseForm(item);
            });
        },
        addBusinessCreditCard: addBusinessCreditCard,
        editBusinessCreditCard: editBusinessCreditCard,
        deleteBusinessCreditCard: deleteBusinessCreditCard,
        addBusinessBankAccount: addBusinessBankAccount,
        editBusinessBankAccount: editBusinessBankAccount,
        deleteBusinessBankAccount: deleteBusinessBankAccount,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
