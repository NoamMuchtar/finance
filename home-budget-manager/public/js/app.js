(function () {
    'use strict';

    var API = hbmData.apiUrl;
    var NONCE = hbmData.nonce;
    var CATEGORIES = hbmData.categories;

    var currentMonth = (function() {
        var now = new Date();
        if (now.getDate() > 20) {
            var next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2, '0');
        }
        return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    })();
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
    var savingsAccounts = [];
    var currentUser = { id: 0, display_name: '', is_business_user: false };

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
        loadCurrentUser();
        loadUserSettings();
        loadCreditCards();
        loadBankAccounts();
        loadAllocationsData();
        loadSavingsAccounts();
        loadDashboard();
    }

    function loadCurrentUser() {
        apiRequest('current-user', 'GET').then(function (data) {
            if (data && !data.error) {
                currentUser = data;
                updateNavVisibility();
                var bizCheckbox = document.getElementById('hbm-is-business-user');
                if (bizCheckbox) bizCheckbox.checked = currentUser.is_business_user;
            }
        });
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
            case 'expense-categories': loadExpenseCategoriesPage(); break;
            case 'savings-details': loadSavingsDetailsPage(); break;
        }
    }

    function updateNavVisibility() {
        var isSelfEmployed = userType === 'self_employed' || currentUser.is_business_user;
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

    function getMonthDateRange(month) {
        var parts = month.split('-');
        var y = parseInt(parts[0]);
        var m = parseInt(parts[1]);
        var startDate = new Date(y, m - 2, 21);
        var endDate = new Date(y, m - 1, 20);
        return {
            start_date: startDate.getFullYear() + '-' + String(startDate.getMonth() + 1).padStart(2, '0') + '-' + String(startDate.getDate()).padStart(2, '0'),
            end_date: endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0') + '-' + String(endDate.getDate()).padStart(2, '0')
        };
    }

    // Month Selector
    function setupMonthSelector() {
        updateMonthDisplay();

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

    function updateMonthDisplay() {
        var el = document.getElementById('hbm-current-month');
        if (el) el.textContent = getMonthLabel(currentMonth);
        var rangeEl = document.getElementById('hbm-month-date-range');
        if (rangeEl) {
            var range = getMonthDateRange(currentMonth);
            rangeEl.textContent = formatDate(range.start_date) + ' - ' + formatDate(range.end_date);
        }
    }

    function changeMonth(delta) {
        var parts = currentMonth.split('-');
        var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1 + delta, 1);
        currentMonth = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        updateMonthDisplay();

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
                if (userType === 'self_employed' || currentUser.is_business_user) {
                    loadBusinessCreditCards();
                    loadBusinessBankAccounts();
                }
            }
        });
        var bizCheckbox = document.getElementById('hbm-is-business-user');
        if (bizCheckbox) {
            bizCheckbox.checked = currentUser.is_business_user;
        }
    }

    function saveUserType() {
        var selected = document.querySelector('input[name="hbm-user-type"]:checked');
        if (!selected) return;
        userType = selected.value;
        var bizCheckbox = document.getElementById('hbm-is-business-user');
        var isBiz = bizCheckbox ? (bizCheckbox.checked ? 1 : 0) : 0;
        apiRequest('user-settings', 'POST', { user_type: userType, is_business_user: isBiz }).then(function () {
            currentUser.is_business_user = !!isBiz;
            updateNavVisibility();
            if (currentUser.is_business_user) {
                loadBusinessCreditCards();
                loadBusinessBankAccounts();
            }
            alert('ההגדרות נשמרו בהצלחה!');
        });
    }

    // ===================== Credit Cards =====================
    function loadCreditCards() {
        apiRequest('credit-cards', 'GET', { is_business: 0, scope: 'all' }).then(function (data) {
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
            var ownerLabel = card.reported_by ? ' | ' + escapeHtml(card.reported_by) : '';
            var isOwn = card.user_id == currentUser.id;
            html += '<div class="hbm-settings-item">' +
                '<span>' + (card.card_name ? escapeHtml(card.card_name) + ' - ' : '') + '**** ' + escapeHtml(card.last_four) + ' | יום חיוב: ' + card.billing_day + bankLabel + ownerLabel + '</span>' +
                (isOwn ? '<div class="hbm-settings-item-actions">' +
                '<button class="hbm-btn hbm-btn-sm" onclick="hbmApp.editCreditCard(' + card.id + ')">ערוך</button>' +
                '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteCreditCard(' + card.id + ')">מחק</button>' +
                '</div>' : '') + '</div>';
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
        apiRequest('bank-accounts', 'GET', { is_business: 0, scope: 'all' }).then(function (data) {
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
            var ownerLabel = acct.reported_by ? ' | ' + escapeHtml(acct.reported_by) : '';
            var isOwn = acct.user_id == currentUser.id;
            html += '<div class="hbm-settings-item">' +
                '<span>' + escapeHtml(acct.bank_name) + ' - ***' + escapeHtml(acct.last_three) +
                ' | מסגרת: ' + formatCurrency(acct.credit_limit || 0) +
                ' | יתרה: ' + formatCurrency(acct.initial_balance || 0) + ownerLabel + '</span>' +
                (isOwn ? '<div>' +
                '<button class="hbm-btn hbm-btn-ghost hbm-btn-sm" onclick="hbmApp.editBankAccount(' + acct.id + ')">ערוך</button> ' +
                '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteBankAccount(' + acct.id + ')">מחק</button>' +
                '</div>' : '') + '</div>';
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

    function loadDashboardData() {
        var params = getMonthDateRange(currentMonth);
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
            if (totalSavingsEl) totalSavingsEl.textContent = formatCurrency(data.total_savings_cumulative || data.expenses_by_type.saving || 0);

            renderExpensesByType(data.expenses_by_type);
            renderExpensesByCategory(data.expenses_by_category);
            renderBudgetStatus(data.budget_status);
            renderExpenseDetails(data.expense_details, 'hbm-expense-details');
            renderRecentCcTransactions(data.recent_cc_transactions, 'hbm-recent-cc-transactions');
            renderIncomeDetails(data.income_items, 'hbm-income-details');
        });
        loadDashboardBankBalances();
    }

    function loadDashboard() {
        apiRequest('dashboard', 'GET', getMonthDateRange(currentMonth)).then(function (data) {
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
            if (totalSavingsEl) totalSavingsEl.textContent = formatCurrency(data.total_savings_cumulative || data.expenses_by_type.saving || 0);

            renderExpensesByType(data.expenses_by_type);
            renderExpensesByCategory(data.expenses_by_category);
            renderBudgetStatus(data.budget_status);
            renderExpenseDetails(data.expense_details, 'hbm-expense-details');
            renderRecentCcTransactions(data.recent_cc_transactions, 'hbm-recent-cc-transactions');
            renderIncomeDetails(data.income_items, 'hbm-income-details');
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

    function renderIncomeDetails(items, containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        if (!items || items.length === 0) {
            container.innerHTML = '<div class="hbm-empty-state"><p>אין הכנסות בתקופה זו</p></div>';
            return;
        }
        var html = '<table class="hbm-table hbm-table-striped"><thead><tr>' +
            '<th>תיאור</th><th>מקור</th><th>סוג</th><th>תאריך התחלה</th><th>סכום</th><th>דווח ע"י</th>' +
            '</tr></thead><tbody>';
        items.forEach(function (item) {
            var typeLabel = item.is_recurring == 1
                ? '<span class="hbm-badge hbm-badge-success">קבועה</span>'
                : '<span class="hbm-badge hbm-badge-default">חד פעמי</span>';
            html += '<tr>' +
                '<td><strong>' + escapeHtml(item.title) + '</strong></td>' +
                '<td>' + escapeHtml(item.source || '-') + '</td>' +
                '<td>' + typeLabel + '</td>' +
                '<td>' + formatDate(item.start_date) + '</td>' +
                '<td class="hbm-amount-cell hbm-text-success">' + formatCurrency(item.amount) + '</td>' +
                '<td>' + escapeHtml(item.reported_by || '-') + '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    function renderExpenseDetails(details, containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        if (!details || details.length === 0) {
            container.innerHTML = '<div class="hbm-empty-state"><p>אין הוצאות בתקופה זו</p></div>';
            return;
        }
        var html = '<table class="hbm-table hbm-table-striped"><thead><tr>' +
            '<th>תיאור</th><th>סוג</th><th>קטגוריה</th><th>תאריך הורדה</th><th>סכום</th><th>דווח ע"י</th>' +
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
            var deductionDate = item.deduction_date ? formatDate(item.deduction_date) : '-';
            html += '<tr' + rowClass + '>' +
                '<td><strong>' + escapeHtml(item.title) + '</strong></td>' +
                '<td>' + typeLabel + '</td>' +
                '<td>' + catLabel + '</td>' +
                '<td>' + deductionDate + '</td>' +
                '<td class="hbm-amount-cell">' + formatCurrency(item.amount) + '</td>' +
                '<td>' + escapeHtml(item.reported_by || '-') + '</td>' +
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

        loadCashFlowData();
    }

    function loadCashFlowData() {
        var container = document.getElementById('hbm-cashflow-table');
        if (!container || !activeCashFlowBankId) return;
        container.innerHTML = '<div class="hbm-empty-state"><p>טוען תזרים...</p></div>';

        var range = getMonthDateRange(currentMonth);
        var params = { bank_account_id: activeCashFlowBankId, start_date: range.start_date, end_date: range.end_date };

        apiRequest('cash-flow', 'GET', params).then(function (data) {
            if (!data || data.error || !Array.isArray(data.entries)) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין נתוני תזרים</p></div>';
                return;
            }

            var summaryEl = document.getElementById('hbm-cashflow-summary');
            if (summaryEl) {
                summaryEl.innerHTML = '<div class="hbm-cashflow-summary-cards">' +
                    '<div class="hbm-cashflow-summary-item"><span>יתרה התחלתית</span><strong>' + formatCurrency(data.initial_balance) + '</strong></div>' +
                    '<div class="hbm-cashflow-summary-item"><span>יתרה צפויה</span><strong class="' + (data.current_balance < 0 ? 'hbm-text-danger' : 'hbm-text-success') + '">' + formatCurrency(data.current_balance) + '</strong></div>' +
                    '</div>';
            }

            var html = '<table class="hbm-table hbm-table-striped hbm-table-cashflow"><thead><tr>' +
                '<th>תאריך</th><th>תיאור</th><th>סוג</th><th>הכנסה</th><th>הוצאה</th><th>יתרה</th>' +
                '</tr></thead><tbody>';

            html += '<tr class="hbm-cashflow-opening-row">' +
                '<td colspan="5"><strong>יתרה פתיחה</strong></td>' +
                '<td class="hbm-amount-cell">' + formatCurrency(data.initial_balance) + '</td>' +
                '</tr>';

            var CF_TYPE_LABELS = {
                income: 'הכנסה',
                expense_one_time: 'חד פעמי',
                expense_fixed: 'הוצאה קבועה',
                expense_saving: 'חיסכון',
                installment_payment: 'תשלומים',
                loan_payment: 'הלוואה',
                standing_order: 'הוראת קבע',
                reserved_payment: 'תשלום שמור',
                saving: 'חיסכון',
                credit_card_charge: 'אשראי'
            };

            data.entries.forEach(function (entry) {
                var isIncome = entry.amount > 0;
                var balanceClass = entry.running_balance < 0 ? ' hbm-text-danger' : '';
                var rowClass = isIncome ? 'hbm-cashflow-income-row' : 'hbm-cashflow-charge-row';
                var typeLabel = entry.type_label || CF_TYPE_LABELS[entry.type] || entry.type || '-';
                html += '<tr class="' + rowClass + '">' +
                    '<td>' + formatDate(entry.date) + '</td>' +
                    '<td>' + escapeHtml(entry.description) + '</td>' +
                    '<td><span class="hbm-badge ' + (isIncome ? 'hbm-badge-success' : 'hbm-badge-loan') + '">' + typeLabel + '</span></td>' +
                    '<td class="hbm-amount-cell hbm-text-success">' + (isIncome ? formatCurrency(entry.amount) : '') + '</td>' +
                    '<td class="hbm-amount-cell hbm-text-danger">' + (!isIncome ? formatCurrency(Math.abs(entry.amount)) : '') + '</td>' +
                    '<td class="hbm-amount-cell' + balanceClass + '"><strong>' + formatCurrency(entry.running_balance) + '</strong></td>' +
                    '</tr>';
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        });
    }

    // ===================== Savings Accounts =====================
    function loadSavingsAccounts() {
        apiRequest('savings-accounts', 'GET').then(function (data) {
            if (data && !data.error && Array.isArray(data)) {
                savingsAccounts = data;
                renderSavingsAccountsList();
            }
        });
    }

    function renderSavingsAccountsList() {
        var container = document.getElementById('hbm-savings-accounts-list');
        if (!container) return;
        if (savingsAccounts.length === 0) {
            container.innerHTML = '<p class="hbm-empty-hint">לא הוגדרו חשבונות חיסכון</p>';
            return;
        }
        var html = '';
        savingsAccounts.forEach(function (sa) {
            var targetLabel = sa.target_amount ? ' | יעד: ' + formatCurrency(sa.target_amount) : '';
            html += '<div class="hbm-settings-item">' +
                '<span>' + escapeHtml(sa.name) + targetLabel + '</span>' +
                '<div class="hbm-settings-item-actions">' +
                '<button class="hbm-btn hbm-btn-sm" onclick="hbmApp.editSavingsAccount(' + sa.id + ')">ערוך</button>' +
                '<button class="hbm-btn hbm-btn-danger hbm-btn-sm" onclick="hbmApp.deleteSavingsAccount(' + sa.id + ')">מחק</button>' +
                '</div></div>';
        });
        container.innerHTML = html;
    }

    function addSavingsAccount() {
        var nameEl = document.getElementById('hbm-new-sa-name');
        var targetEl = document.getElementById('hbm-new-sa-target');
        if (!nameEl || !nameEl.value) { alert('יש למלא שם חיסכון'); return; }

        var payload = { name: nameEl.value };
        if (targetEl && targetEl.value) payload.target_amount = parseFloat(targetEl.value);

        apiRequest('savings-accounts', 'POST', payload).then(function (data) {
            if (data && data.id) {
                nameEl.value = '';
                if (targetEl) targetEl.value = '';
                loadSavingsAccounts();
            } else {
                alert('שגיאה: ' + (data && data.message ? data.message : 'שגיאה לא ידועה'));
            }
        });
    }

    function editSavingsAccount(id) {
        var sa = savingsAccounts.find(function (s) { return s.id == id; });
        if (!sa) return;

        var html = '<form id="hbm-edit-sa-form">' +
            '<div class="hbm-form-group"><label>שם החיסכון</label>' +
            '<input type="text" name="name" value="' + escapeHtml(sa.name) + '" required></div>' +
            '<div class="hbm-form-group"><label>סכום יעד (אופציונלי)</label>' +
            '<input type="number" step="0.01" name="target_amount" value="' + (sa.target_amount || '') + '"></div>' +
            '<div class="hbm-form-actions">' +
            '<button type="submit" class="hbm-btn hbm-btn-primary">עדכן</button>' +
            '<button type="button" class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div></form>';

        openModal('עריכת חשבון חיסכון', html);

        document.getElementById('hbm-edit-sa-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = e.target;
            apiRequest('savings-accounts/' + id, 'PUT', {
                name: form.name.value,
                target_amount: form.target_amount.value ? parseFloat(form.target_amount.value) : null
            }).then(function (data) {
                if (data && data.id) {
                    closeModal();
                    loadSavingsAccounts();
                }
            });
        });
    }

    function deleteSavingsAccount(id) {
        if (!confirm('האם למחוק חשבון חיסכון זה?')) return;
        apiRequest('savings-accounts/' + id, 'DELETE').then(function () {
            loadSavingsAccounts();
        });
    }

    function buildSavingsAccountOptions(selectedId) {
        var html = '<option value="">בחר חשבון חיסכון</option>';
        savingsAccounts.forEach(function (sa) {
            var sel = selectedId && selectedId == sa.id ? ' selected' : '';
            html += '<option value="' + sa.id + '"' + sel + '>' + escapeHtml(sa.name) + '</option>';
        });
        return html;
    }

    // ===================== Savings Details Page =====================
    function loadSavingsDetailsPage() {
        var container = document.getElementById('hbm-savings-details-content');
        if (!container) return;
        container.innerHTML = '<div class="hbm-empty-state"><p>טוען...</p></div>';

        apiRequest('savings-summary', 'GET').then(function (data) {
            if (!data || data.error || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><p>אין חשבונות חיסכון. ניתן להוסיף בהגדרות.</p></div>';
                return;
            }

            var grandTotal = 0;
            var html = '<div class="hbm-savings-details-grid">';

            data.forEach(function (acct) {
                grandTotal += acct.total_saved;
                var progressHtml = '';
                if (acct.target_amount && acct.target_amount > 0) {
                    var pct = Math.min(100, (acct.total_saved / acct.target_amount) * 100);
                    var barClass = pct >= 100 ? ' hbm-progress-complete' : '';
                    progressHtml = '<div class="hbm-savings-progress">' +
                        '<div class="hbm-savings-progress-bar">' +
                        '<div class="hbm-savings-progress-fill' + barClass + '" style="width:' + pct.toFixed(1) + '%"></div>' +
                        '</div>' +
                        '<span class="hbm-savings-progress-label">' + pct.toFixed(0) + '% מתוך ' + formatCurrency(acct.target_amount) + '</span>' +
                        '</div>';
                }

                html += '<div class="hbm-panel hbm-savings-detail-card">' +
                    '<div class="hbm-savings-detail-header">' +
                    '<h3>' + escapeHtml(acct.name) + '</h3>' +
                    '<span class="hbm-savings-detail-total">' + formatCurrency(acct.total_saved) + '</span>' +
                    '</div>' +
                    progressHtml;

                if (acct.items && acct.items.length > 0) {
                    html += '<table class="hbm-table hbm-table-striped"><thead><tr>' +
                        '<th>תיאור</th><th>סכום חודשי</th><th>תאריך התחלה</th>' +
                        '</tr></thead><tbody>';
                    acct.items.forEach(function (item) {
                        html += '<tr>' +
                            '<td>' + escapeHtml(item.title) + '</td>' +
                            '<td class="hbm-amount-cell">' + formatCurrency(item.amount) + '</td>' +
                            '<td>' + formatDate(item.start_date) + '</td>' +
                            '</tr>';
                    });
                    html += '</tbody></table>';
                } else {
                    html += '<p class="hbm-empty-hint">אין הפקדות</p>';
                }

                html += '</div>';
            });

            html += '</div>';
            html += '<div class="hbm-savings-grand-total">סה"כ כל החיסכונות: <strong>' + formatCurrency(grandTotal) + '</strong></div>';
            container.innerHTML = html;
        });
    }

    // ===================== Expense Categories Page =====================
    var PIE_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#06b6d4','#e11d48','#a855f7','#22c55e','#eab308','#0ea5e9'];

    function loadExpenseCategoriesPage() {
        loadExpenseCategoriesData();
    }

    function loadExpenseCategoriesData() {
        var chartEl = document.getElementById('hbm-expcat-chart');
        var legendEl = document.getElementById('hbm-expcat-legend');
        var detailsPanel = document.getElementById('hbm-expcat-details-panel');
        if (!chartEl) return;

        chartEl.innerHTML = '<div class="hbm-empty-state"><p>טוען...</p></div>';
        legendEl.innerHTML = '';
        if (detailsPanel) detailsPanel.style.display = 'none';

        apiRequest('dashboard', 'GET', getMonthDateRange(currentMonth)).then(function (data) {
            if (!data || data.error || !data.expense_details) {
                chartEl.innerHTML = '<div class="hbm-empty-state"><p>אין נתונים</p></div>';
                return;
            }

            var catTotals = {};
            var catItems = {};
            data.expense_details.forEach(function (item) {
                var cat = item.category || 'other';
                if (!catTotals[cat]) { catTotals[cat] = 0; catItems[cat] = []; }
                catTotals[cat] += parseFloat(item.amount) || 0;
                catItems[cat].push(item);
            });

            var sorted = Object.keys(catTotals).sort(function (a, b) { return catTotals[b] - catTotals[a]; });
            var total = sorted.reduce(function (s, k) { return s + catTotals[k]; }, 0);

            if (total === 0) {
                chartEl.innerHTML = '<div class="hbm-empty-state"><p>אין הוצאות בתקופה זו</p></div>';
                return;
            }

            renderPieChart(chartEl, sorted, catTotals, total);
            renderPieLegend(legendEl, sorted, catTotals, total, catItems);
        });
    }

    function renderPieChart(container, categories, totals, total) {
        var size = 260, cx = size / 2, cy = size / 2, r = 110;
        var svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" class="hbm-pie-svg">';
        var startAngle = -90;

        categories.forEach(function (cat, i) {
            var pct = totals[cat] / total;
            var angle = pct * 360;
            if (angle < 0.5) return;
            var endAngle = startAngle + angle;
            var x1 = cx + r * Math.cos(startAngle * Math.PI / 180);
            var y1 = cy + r * Math.sin(startAngle * Math.PI / 180);
            var x2 = cx + r * Math.cos(endAngle * Math.PI / 180);
            var y2 = cy + r * Math.sin(endAngle * Math.PI / 180);
            var largeArc = angle > 180 ? 1 : 0;
            var color = PIE_COLORS[i % PIE_COLORS.length];

            if (pct > 0.999) {
                svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + color + '" data-cat="' + cat + '" class="hbm-pie-slice" style="cursor:pointer"/>';
            } else {
                svg += '<path d="M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z" fill="' + color + '" data-cat="' + cat + '" class="hbm-pie-slice" style="cursor:pointer"/>';
            }
            startAngle = endAngle;
        });

        svg += '</svg>';
        container.innerHTML = svg;

        container.querySelectorAll('.hbm-pie-slice').forEach(function (el) {
            el.addEventListener('click', function () {
                var cat = el.getAttribute('data-cat');
                showCategoryDetails(cat);
            });
        });
    }

    function renderPieLegend(container, categories, totals, total, catItems) {
        var html = '';
        categories.forEach(function (cat, i) {
            var pct = ((totals[cat] / total) * 100).toFixed(1);
            var color = PIE_COLORS[i % PIE_COLORS.length];
            var label = CATEGORIES[cat] || cat;
            html += '<div class="hbm-pie-legend-item" data-cat="' + cat + '" style="cursor:pointer">' +
                '<span class="hbm-pie-legend-color" style="background:' + color + '"></span>' +
                '<span class="hbm-pie-legend-label">' + escapeHtml(label) + '</span>' +
                '<span class="hbm-pie-legend-value">' + formatCurrency(totals[cat]) + ' (' + pct + '%)</span>' +
                '</div>';
        });
        container.innerHTML = html;

        container.querySelectorAll('.hbm-pie-legend-item').forEach(function (el) {
            el.addEventListener('click', function () {
                showCategoryDetails(el.getAttribute('data-cat'));
            });
        });

        window._hbmExpCatItems = catItems;
    }

    function showCategoryDetails(cat) {
        var panel = document.getElementById('hbm-expcat-details-panel');
        var title = document.getElementById('hbm-expcat-details-title');
        var tableEl = document.getElementById('hbm-expcat-details-table');
        if (!panel || !tableEl) return;

        var items = (window._hbmExpCatItems && window._hbmExpCatItems[cat]) || [];
        var label = CATEGORIES[cat] || cat;
        if (title) title.textContent = 'הוצאות - ' + label;

        if (items.length === 0) {
            tableEl.innerHTML = '<div class="hbm-empty-state"><p>אין הוצאות</p></div>';
            panel.style.display = '';
            return;
        }

        var html = '<table class="hbm-table hbm-table-striped"><thead><tr>' +
            '<th>תיאור</th><th>סוג</th><th>תאריך הורדה</th><th>סכום</th>' +
            '</tr></thead><tbody>';
        items.forEach(function (item) {
            var typeLabel = item.type === 'credit_card' ? '<span class="hbm-badge hbm-badge-info">כרטיס אשראי</span>' :
                item.type === 'standing_order' ? '<span class="hbm-badge hbm-badge-fixed">הוראת קבע</span>' :
                '<span class="hbm-badge hbm-badge-default">' + (TYPE_LABELS[item.type] || item.type || '-') + '</span>';
            html += '<tr>' +
                '<td><strong>' + escapeHtml(item.title) + '</strong></td>' +
                '<td>' + typeLabel + '</td>' +
                '<td>' + (item.deduction_date ? formatDate(item.deduction_date) : '-') + '</td>' +
                '<td class="hbm-amount-cell">' + formatCurrency(item.amount) + '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
        tableEl.innerHTML = html;
        panel.style.display = '';
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

        loadCcChargesData();
    }

    function loadCcChargesData() {
        var container = document.getElementById('hbm-cc-charges-table');
        var summaryEl = document.getElementById('hbm-cc-charges-summary');
        if (!container || !activeCcChargesCardId) return;
        container.innerHTML = '<div class="hbm-empty-state"><p>טוען חיובים...</p></div>';

        apiRequest('credit-card-charges', 'GET', { credit_card_id: activeCcChargesCardId, month: currentMonth }).then(function (data) {
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
        var range = getMonthDateRange(currentMonth);
        apiRequest('income', 'GET', { is_business: 0, start_date: range.start_date, end_date: range.end_date }).then(function (data) {
            console.log('HBM loadIncome response:', data);
            var container = document.getElementById('hbm-income-list');
            if (!container) return;
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="hbm-empty-state"><div class="hbm-empty-state-icon">💼</div><p>אין הכנסות להצגה</p></div>';
                return;
            }

            var html = '<table class="hbm-table"><thead><tr>' +
                '<th>שם</th><th>מקור</th><th>סכום</th><th>חשבון בנק</th><th>תאריך התחלה</th><th>תאריך סיום</th><th>סטטוס</th><th>דווח ע"י</th><th>פעולות</th>' +
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
                    '<td>' + escapeHtml(item.reported_by || '-') + '</td>' +
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
        var range = getMonthDateRange(currentMonth);
        var params = { start_date: range.start_date, end_date: range.end_date, is_business: 0 };
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
                '<th>שם</th><th>סוג</th><th>למי</th><th>קטגוריה</th><th>סכום</th><th>פרטים</th><th>דווח ע"י</th><th>פעולות</th>' +
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
                    '<td>' + escapeHtml(item.reported_by || '-') + '</td>' +
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

            // Savings account selector
            '<div id="hbm-saving-account-field" class="hbm-type-fields">' +
            '<div class="hbm-form-group"><label>חשבון חיסכון</label>' +
            '<select name="saving_account_id" id="hbm-expense-saving-account">' +
            buildSavingsAccountOptions(editData ? editData.saving_account_id : null) +
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
            var savingAccountField = document.getElementById('hbm-saving-account-field');
            var categoryGroup = document.getElementById('hbm-category-group');

            if (installmentFields) installmentFields.classList.toggle('active', type === 'installment');
            if (loanFields) loanFields.classList.toggle('active', type === 'loan');

            // Payment method for one_time and fixed
            if (paymentMethodField) paymentMethodField.classList.toggle('active', type === 'one_time' || type === 'fixed');

            // Credit card: show when payment_method=credit OR type=installment
            var showCreditCard = ((type === 'one_time' || type === 'fixed') && paymentMethod === 'credit') || type === 'installment';
            if (creditCardField) creditCardField.classList.toggle('active', showCreditCard);

            // Bank account: show when payment_method=bank_transfer/check, or type=loan/saving
            var showBankAccount = ((type === 'one_time' || type === 'fixed') && (paymentMethod === 'bank_transfer' || paymentMethod === 'check')) ||
                type === 'loan' || type === 'saving';
            if (bankAccountField) bankAccountField.classList.toggle('active', showBankAccount);
            if (savingAccountField) savingAccountField.classList.toggle('active', type === 'saving');

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

            if (type === 'one_time' || type === 'fixed') {
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
                if (form.saving_account_id && form.saving_account_id.value) {
                    payload.saving_account_id = parseInt(form.saving_account_id.value);
                }
            }

            function submitExpense(finalPayload) {
                var method = isEdit ? 'PUT' : 'POST';
                var endpoint = isEdit ? 'expenses/' + editData.id : 'expenses';
                apiRequest(endpoint, method, finalPayload).then(function (response) {
                    if (response && (response.id || response.success)) {
                        closeModal();
                        loadExpenses();
                        loadDashboard();
                    } else {
                        alert('שגיאה בשמירת הוצאה: ' + (response && response.message ? response.message : 'שגיאה לא ידועה'));
                    }
                });
            }

            var ccId = parseInt(payload.credit_card_id);
            if (ccId && payload.start_date && !isEdit && type !== 'installment') {
                var bufferResult = checkCcBufferZone(payload.start_date, ccId);
                if (bufferResult) {
                    showBillingCyclePrompt(payload.title, payload.start_date, bufferResult.currentMonth, bufferResult.nextMonth, function (chosenMonth) {
                        payload.cc_billing_month = chosenMonth;
                        submitExpense(payload);
                    });
                    return;
                }
            }
            submitExpense(payload);
        });
    }

    function checkCcBufferZone(dateStr, creditCardId) {
        var card = creditCards.find(function (c) { return c.id == creditCardId; });
        if (!card) return null;
        var billingDay = parseInt(card.billing_day);
        if (!billingDay) return null;
        var dt = new Date(dateStr);
        var expDay = dt.getDate();
        var cutoffDay = billingDay - 2;
        if (expDay > cutoffDay && expDay <= billingDay) {
            var currentMonth = dateStr.substring(0, 7);
            var nextDt = new Date(dt.getFullYear(), dt.getMonth() + 1, 1);
            var nextMonth = nextDt.getFullYear() + '-' + String(nextDt.getMonth() + 1).padStart(2, '0');
            return { currentMonth: currentMonth, nextMonth: nextMonth };
        }
        return null;
    }

    function showBillingCyclePrompt(title, date, currentMonth, nextMonth, callback) {
        var hebrewMonths = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
        function formatMonth(m) {
            var parts = m.split('-');
            return hebrewMonths[parseInt(parts[1]) - 1] + ' ' + parts[0];
        }
        var html = '<div style="direction:rtl;text-align:right;padding:8px;">' +
            '<p style="margin-bottom:12px;">העסקה <strong>' + escapeHtml(title) + '</strong> בתאריך <strong>' + date + '</strong> נמצאת בטווח ימי העיבוד של חברת האשראי.</p>' +
            '<p style="margin-bottom:16px;">לאיזה מחזור חיוב להכניס?</p>' +
            '<div style="display:flex;gap:12px;justify-content:center;">' +
            '<button class="hbm-btn hbm-btn-primary" id="hbm-billing-current">' + formatMonth(currentMonth) + ' (נוכחי)</button>' +
            '<button class="hbm-btn hbm-btn-secondary" id="hbm-billing-next">' + formatMonth(nextMonth) + ' (הבא)</button>' +
            '</div></div>';
        openModal('בחירת מחזור חיוב', html);
        document.getElementById('hbm-billing-current').addEventListener('click', function () {
            closeModal();
            callback(currentMonth);
        });
        document.getElementById('hbm-billing-next').addEventListener('click', function () {
            closeModal();
            callback(nextMonth);
        });
    }

    function showCsvBillingCyclePrompt(bufferRows, callback) {
        var hebrewMonths = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
        function formatMonth(m) {
            var parts = m.split('-');
            return hebrewMonths[parseInt(parts[1]) - 1] + ' ' + parts[0];
        }
        var html = '<div style="direction:rtl;text-align:right;padding:8px;">' +
            '<p style="margin-bottom:12px;">נמצאו <strong>' + bufferRows.length + '</strong> עסקאות בטווח ימי העיבוד של חברת האשראי.</p>' +
            '<p style="margin-bottom:12px;">בחר לאיזה מחזור חיוב להכניס כל עסקה:</p>' +
            '<div style="max-height:300px;overflow-y:auto;margin-bottom:16px;">' +
            '<table class="hbm-table" style="font-size:13px;"><thead><tr><th>עסקה</th><th>תאריך</th><th>סכום</th><th>מחזור חיוב</th></tr></thead><tbody>';
        bufferRows.forEach(function (item, i) {
            html += '<tr><td>' + escapeHtml(item.row.title) + '</td><td>' + item.row.start_date + '</td><td>' + (item.row.amount || '') + '</td>' +
                '<td><select id="hbm-buffer-cycle-' + i + '" style="width:100%;">' +
                '<option value="' + item.nextMonth + '">' + formatMonth(item.nextMonth) + ' (הבא)</option>' +
                '<option value="' + item.currentMonth + '">' + formatMonth(item.currentMonth) + ' (נוכחי)</option>' +
                '</select></td></tr>';
        });
        html += '</tbody></table></div>' +
            '<div class="hbm-form-actions">' +
            '<button class="hbm-btn hbm-btn-primary" id="hbm-buffer-confirm">אישור</button>' +
            '<button class="hbm-btn hbm-btn-ghost" id="hbm-buffer-cancel">ביטול</button>' +
            '</div></div>';
        openModal('בחירת מחזור חיוב - עסקאות בטווח עיבוד', html);
        document.getElementById('hbm-buffer-confirm').addEventListener('click', function () {
            bufferRows.forEach(function (item, i) {
                var select = document.getElementById('hbm-buffer-cycle-' + i);
                item.row.cc_billing_month = select.value;
            });
            closeModal();
            callback();
        });
        document.getElementById('hbm-buffer-cancel').addEventListener('click', function () {
            closeModal();
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
                '<th>כותרת</th><th>למי</th><th>סכום</th><th>קטגוריה</th><th>סוג</th><th>יום בחודש</th><th>תאריך התחלה</th><th>תאריך סיום</th><th>דווח ע"י</th><th>פעולות</th>' +
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
                    '<td>' + escapeHtml(item.reported_by || '-') + '</td>' +
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
                '<th>כותרת</th><th>למי</th><th>סכום</th><th>תאריך תשלום</th><th>פרטים</th><th>חשבון בנק</th><th>סטטוס</th><th>דווח ע"י</th><th>פעולות</th>' +
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
                    '<td>' + escapeHtml(item.reported_by || '-') + '</td>' +
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
                    (a.reported_by ? '<span>דווח ע"י: ' + escapeHtml(a.reported_by) + '</span>' : '') +
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

        var targetDate = getMonthDateRange(currentMonth).end_date;

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
        loadBizDashData();
        loadBizDashBankBalances();
    }

    function loadBizDashData() {
        apiRequest('business-dashboard', 'GET', getMonthDateRange(currentMonth)).then(function (data) {
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

        var targetDate = getMonthDateRange(currentMonth).end_date;

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
        apiRequest('business-dashboard', 'GET', getMonthDateRange(currentMonth)).then(function (data) {
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
        var range = getMonthDateRange(currentMonth);
        apiRequest('expenses', 'GET', { start_date: range.start_date, end_date: range.end_date, is_business: 1 }).then(function (data) {
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
        renderSavingsAccountsList();

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
    // ===================== CSV Import =====================
    function showImportExpenses() {
        var catList = Object.keys(CATEGORIES).map(function (k) {
            return k + ' = ' + CATEGORIES[k];
        }).join('\n');

        var ccList = creditCards.map(function (c) {
            return 'ID: ' + c.id + ' - ' + (c.card_name || '') + ' **** ' + c.last_four;
        }).join('\n');

        var baList = bankAccounts.map(function (a) {
            return 'ID: ' + a.id + ' - ' + a.bank_name + ' ***' + a.last_three;
        }).join('\n');

        var html = '<div class="hbm-import-container" style="direction:rtl;text-align:right;">' +
            '<div style="margin-bottom:16px;">' +
            '<button class="hbm-btn hbm-btn-sm" onclick="hbmApp.downloadSampleCsv()">הורד קובץ לדוגמא</button>' +
            '</div>' +
            '<div class="hbm-import-instructions" style="background:#f8f9fa;padding:12px;border-radius:8px;margin-bottom:16px;font-size:13px;max-height:300px;overflow-y:auto;">' +
            '<h4 style="margin:0 0 8px;">הנחיות למילוי הקובץ</h4>' +
            '<p><strong>עמודות חובה:</strong> title (שם), amount (סכום), type (סוג), category (קטגוריה), start_date (תאריך)</p>' +
            '<p><strong>עמודות אופציונליות:</strong> payee (למי), description (תיאור), credit_card_id, bank_account_id, payment_method, total_installments, current_installment, installment_amount, charged_amount, voucher_number, monthly_return, loan_end_date, loan_payment_day</p>' +
            '<hr style="margin:8px 0;">' +
            '<p><strong>סוגי הוצאה (type):</strong></p>' +
            '<ul style="margin:4px 0;padding-right:20px;">' +
            '<li><code>one_time</code> - חד פעמי</li>' +
            '<li><code>fixed</code> - הוצאה קבועה (חודשית חוזרת)</li>' +
            '<li><code>installment</code> - תשלומים (חובה: total_installments)</li>' +
            '<li><code>loan</code> - הלוואה (חובה: monthly_return, loan_end_date)</li>' +
            '<li><code>saving</code> - חיסכון</li>' +
            '</ul>' +
            '<p><strong>אמצעי תשלום (payment_method):</strong> credit, bank_transfer, check, cash</p>' +
            '<p><strong>תאריך:</strong> פורמט YYYY-MM-DD (לדוגמא: 2026-07-15)</p>' +
            '<hr style="margin:8px 0;">' +
            '<p><strong>קטגוריות זמינות:</strong></p>' +
            '<pre style="font-size:11px;max-height:120px;overflow-y:auto;background:#fff;padding:8px;border-radius:4px;">' + escapeHtml(catList) + '</pre>' +
            '<hr style="margin:8px 0;">' +
            '<p><strong>כרטיסי אשראי (credit_card_id):</strong></p>' +
            '<pre style="font-size:11px;background:#fff;padding:8px;border-radius:4px;">' + (ccList ? escapeHtml(ccList) : 'לא הוגדרו כרטיסים') + '</pre>' +
            '<p><strong>חשבונות בנק (bank_account_id):</strong></p>' +
            '<pre style="font-size:11px;background:#fff;padding:8px;border-radius:4px;">' + (baList ? escapeHtml(baList) : 'לא הוגדרו חשבונות') + '</pre>' +
            '</div>' +
            '<div style="margin-bottom:12px;">' +
            '<label style="display:block;margin-bottom:4px;font-weight:bold;">בחר קובץ CSV:</label>' +
            '<input type="file" id="hbm-import-file" accept=".csv" style="width:100%;">' +
            '</div>' +
            '<div id="hbm-import-preview" style="display:none;margin-bottom:12px;"></div>' +
            '<div id="hbm-import-result" style="display:none;margin-bottom:12px;"></div>' +
            '<div class="hbm-form-actions">' +
            '<button class="hbm-btn hbm-btn-primary" id="hbm-import-submit" disabled>ייבא הוצאות</button>' +
            '<button class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div>' +
            '</div>';

        openModal('ייבוא הוצאות מקובץ CSV', html);

        var fileInput = document.getElementById('hbm-import-file');
        var submitBtn = document.getElementById('hbm-import-submit');
        var parsedRows = [];

        fileInput.addEventListener('change', function () {
            var file = fileInput.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (e) {
                parsedRows = parseCsv(e.target.result);
                var preview = document.getElementById('hbm-import-preview');
                if (parsedRows.length === 0) {
                    preview.innerHTML = '<p style="color:red;">לא נמצאו שורות תקינות בקובץ</p>';
                    preview.style.display = 'block';
                    submitBtn.disabled = true;
                    return;
                }
                preview.innerHTML = '<p style="color:green;">נמצאו ' + parsedRows.length + ' שורות לייבוא</p>' +
                    '<div style="max-height:150px;overflow:auto;font-size:12px;"><table class="hbm-table"><thead><tr><th>#</th><th>שם</th><th>סכום</th><th>סוג</th><th>קטגוריה</th></tr></thead><tbody>' +
                    parsedRows.slice(0, 10).map(function (r, i) {
                        return '<tr><td>' + (i + 1) + '</td><td>' + escapeHtml(r.title) + '</td><td>' + r.amount + '</td><td>' + r.type + '</td><td>' + (r.category || '-') + '</td></tr>';
                    }).join('') +
                    (parsedRows.length > 10 ? '<tr><td colspan="5">... ועוד ' + (parsedRows.length - 10) + ' שורות</td></tr>' : '') +
                    '</tbody></table></div>';
                preview.style.display = 'block';
                submitBtn.disabled = false;
            };
            reader.readAsText(file);
        });

        submitBtn.addEventListener('click', function () {
            if (parsedRows.length === 0) return;

            var bufferRows = [];
            parsedRows.forEach(function (row, idx) {
                if (row.credit_card_id && row.start_date && !row.cc_billing_month && row.type !== 'installment') {
                    var result = checkCcBufferZone(row.start_date, row.credit_card_id);
                    if (result) {
                        bufferRows.push({ index: idx, row: row, currentMonth: result.currentMonth, nextMonth: result.nextMonth });
                    }
                }
            });

            if (bufferRows.length > 0) {
                showCsvBillingCyclePrompt(bufferRows, function () {
                    doImport();
                });
            } else {
                doImport();
            }

            function doImport() {
                submitBtn.disabled = true;
                submitBtn.textContent = 'מייבא...';
                apiRequest('import-expenses', 'POST', { rows: parsedRows, is_business: 0 }).then(function (result) {
                    var resultDiv = document.getElementById('hbm-import-result');
                    if (result && !result.error) {
                        var msg = '<p style="color:green;font-weight:bold;">יובאו בהצלחה: ' + result.imported + ' מתוך ' + result.total + '</p>';
                        if (result.errors && result.errors.length > 0) {
                            msg += '<div style="color:red;font-size:12px;max-height:100px;overflow:auto;"><ul>' +
                                result.errors.map(function (e) { return '<li>' + escapeHtml(e) + '</li>'; }).join('') +
                                '</ul></div>';
                        }
                        resultDiv.innerHTML = msg;
                        resultDiv.style.display = 'block';
                        if (result.imported > 0) {
                            loadExpenses();
                            loadDashboard();
                        }
                    } else {
                        resultDiv.innerHTML = '<p style="color:red;">שגיאה בייבוא</p>';
                        resultDiv.style.display = 'block';
                    }
                    submitBtn.textContent = 'ייבא הוצאות';
                    submitBtn.disabled = false;
                });
            }
        });
    }

    function parseCsv(text) {
        var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
        if (lines.length < 2) return [];

        var headerLine = lines[0];
        // Handle BOM
        if (headerLine.charCodeAt(0) === 0xFEFF) headerLine = headerLine.slice(1);
        var headers = headerLine.split(',').map(function (h) { return h.trim().replace(/^"|"$/g, ''); });

        var rows = [];
        for (var i = 1; i < lines.length; i++) {
            var values = parseCsvLine(lines[i]);
            if (values.length === 0) continue;
            var row = {};
            headers.forEach(function (h, idx) {
                row[h] = values[idx] !== undefined ? values[idx].trim() : '';
            });
            if (row.title && row.amount) {
                row.amount = parseFloat(row.amount) || 0;
                if (!row.type) row.type = 'one_time';
                rows.push(row);
            }
        }
        return rows;
    }

    function parseCsvLine(line) {
        var result = [];
        var current = '';
        var inQuotes = false;
        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (inQuotes) {
                if (ch === '"' && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else if (ch === '"') {
                    inQuotes = false;
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    result.push(current);
                    current = '';
                } else {
                    current += ch;
                }
            }
        }
        result.push(current);
        return result;
    }

    function downloadSampleCsv() {
        var bom = '﻿';
        var header = 'title,amount,type,category,start_date,payee,description,credit_card_id,bank_account_id,payment_method,total_installments,installment_amount,monthly_return,loan_end_date,loan_payment_day';
        var rows = [
            'סופר שופרסל,450,one_time,groceries,2026-07-15,שופרסל,קניות שבועיות,,,cash,,,,,',
            'ביטוח רכב,320,fixed,insurance,2026-07-01,הראל,ביטוח חודשי,,,' + (bankAccounts.length > 0 ? bankAccounts[0].id : '') + ',bank_transfer,,,,,',
            'מקרר חדש,5400,installment,household,2026-07-10,מחסני חשמל,,' + (creditCards.length > 0 ? creditCards[0].id : '') + ',,credit,12,450,,,,',
            'הלוואה לרכב,80000,loan,loan_payment,2026-01-01,בנק הפועלים,,,' + (bankAccounts.length > 0 ? bankAccounts[0].id : '') + ',,,,1200,2030-01-01,5',
            'ביטוח בריאות,180,fixed,insurance,2026-07-01,כללית,ביטוח חודשי,' + (creditCards.length > 0 ? creditCards[0].id : '') + ',,credit,,,,,',
            'חיסכון חודשי,1000,saving,savings,2026-07-01,,,,,' + (bankAccounts.length > 0 ? bankAccounts[0].id : '') + ',bank_transfer,,,,,',
        ];
        var csv = bom + header + '\n' + rows.join('\n') + '\n';
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'expenses_sample.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    }

    function showImportCreditCardExcel() {
        var ccList = creditCards.map(function (c) {
            return '<option value="' + c.id + '">' + (c.card_name || '') + ' **** ' + c.last_four + '</option>';
        }).join('');

        var html = '<div class="hbm-import-container" style="direction:rtl;text-align:right;">' +
            '<div style="margin-bottom:16px;">' +
            '<h4 style="margin:0 0 8px;">ייבוא עסקאות מקובץ Excel של חברת האשראי</h4>' +
            '<p style="font-size:13px;color:#666;">העלה את קובץ ה-Excel שהורדת מאתר חברת האשראי. המערכת תזהה אוטומטית את מבנה הקובץ.</p>' +
            '</div>' +
            '<div style="margin-bottom:12px;">' +
            '<label style="display:block;margin-bottom:4px;font-weight:bold;">כרטיס אשראי:</label>' +
            '<select id="hbm-cc-excel-card" class="hbm-input" style="width:100%;">' +
            '<option value="">בחר כרטיס...</option>' + ccList + '</select>' +
            '</div>' +
            '<div style="margin-bottom:12px;">' +
            '<label style="display:block;margin-bottom:4px;font-weight:bold;">בחר קובץ Excel (.xlsx):</label>' +
            '<input type="file" id="hbm-cc-excel-file" accept=".xlsx,.xls" style="width:100%;">' +
            '</div>' +
            '<div style="margin-bottom:8px;">' +
            '<label style="font-size:13px;"><input type="checkbox" id="hbm-cc-skip-duplicates" checked> דלג על עסקאות כפולות (לפי מספר שובר)</label>' +
            '</div>' +
            '<div id="hbm-cc-excel-preview" style="display:none;margin-bottom:12px;"></div>' +
            '<div id="hbm-cc-excel-result" style="display:none;margin-bottom:12px;"></div>' +
            '<div class="hbm-form-actions">' +
            '<button class="hbm-btn hbm-btn-primary" id="hbm-cc-excel-submit" disabled>ייבא עסקאות</button>' +
            '<button class="hbm-btn hbm-btn-ghost" onclick="hbmApp.closeModal()">ביטול</button>' +
            '</div>' +
            '</div>';

        openModal('ייבוא עסקאות אשראי מ-Excel', html);

        var fileInput = document.getElementById('hbm-cc-excel-file');
        var submitBtn = document.getElementById('hbm-cc-excel-submit');
        var parsedTransactions = [];

        fileInput.addEventListener('change', function () {
            var file = fileInput.files[0];
            var cardId = document.getElementById('hbm-cc-excel-card').value;
            if (!file) return;
            if (!cardId) {
                document.getElementById('hbm-cc-excel-preview').innerHTML = '<p style="color:red;">יש לבחור כרטיס אשראי קודם</p>';
                document.getElementById('hbm-cc-excel-preview').style.display = 'block';
                return;
            }

            var reader = new FileReader();
            reader.onload = function (e) {
                try {
                    var data = new Uint8Array(e.target.result);
                    var workbook = XLSX.read(data, { type: 'array' });
                    var sheet = workbook.Sheets[workbook.SheetNames[0]];
                    var rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                    parsedTransactions = parseCreditCardExcel(rows);

                    var preview = document.getElementById('hbm-cc-excel-preview');
                    if (parsedTransactions.length === 0) {
                        preview.innerHTML = '<p style="color:red;">לא נמצאו עסקאות בקובץ. ודא שזהו קובץ Excel מחברת האשראי.</p>';
                        preview.style.display = 'block';
                        submitBtn.disabled = true;
                        return;
                    }

                    var totalCharged = parsedTransactions.reduce(function (sum, t) { return sum + (t.charged_amount || t.original_amount); }, 0);
                    var installmentCount = parsedTransactions.filter(function (t) { return t.type === 'installment'; }).length;
                    var fixedCount = parsedTransactions.filter(function (t) { return t.type === 'fixed'; }).length;

                    preview.innerHTML = '<p style="color:green;font-weight:bold;">נמצאו ' + parsedTransactions.length + ' עסקאות | סה"כ חיוב: ₪' + totalCharged.toFixed(2) + '</p>' +
                        '<p style="font-size:12px;color:#666;">רגילות: ' + (parsedTransactions.length - installmentCount - fixedCount) + ' | תשלומים: ' + installmentCount + ' | הוראות קבע: ' + fixedCount + '</p>' +
                        '<div style="max-height:250px;overflow:auto;font-size:12px;margin-top:8px;">' +
                        '<table class="hbm-table"><thead><tr><th>תאריך</th><th>בית עסק</th><th>סכום מקורי</th><th>סכום חיוב</th><th>סוג</th><th>קטגוריה</th></tr></thead><tbody>' +
                        parsedTransactions.map(function (t, i) {
                            var typeLabel = t.type === 'installment' ? 'תשלום ' + t.current_installment + '/' + t.total_installments :
                                t.type === 'fixed' ? 'הו"ק' : 'רגיל';
                            return '<tr><td>' + t.date + '</td><td>' + escapeHtml(t.payee) + '</td><td>₪' + t.original_amount.toFixed(2) + '</td><td>₪' + (t.charged_amount || t.original_amount).toFixed(2) + '</td><td>' + typeLabel + '</td>' +
                                '<td><input type="text" value="' + escapeHtml(t.category || '') + '" data-idx="' + i + '" class="hbm-cc-cat-input hbm-input" style="width:80px;font-size:11px;padding:2px 4px;" placeholder="קטגוריה"></td></tr>';
                        }).join('') +
                        '</tbody></table></div>';
                    preview.style.display = 'block';
                    submitBtn.disabled = false;
                } catch (err) {
                    document.getElementById('hbm-cc-excel-preview').innerHTML = '<p style="color:red;">שגיאה בקריאת הקובץ: ' + escapeHtml(err.message) + '</p>';
                    document.getElementById('hbm-cc-excel-preview').style.display = 'block';
                }
            };
            reader.readAsArrayBuffer(file);
        });

        submitBtn.addEventListener('click', function () {
            var cardId = document.getElementById('hbm-cc-excel-card').value;
            if (!cardId || parsedTransactions.length === 0) return;

            var catInputs = document.querySelectorAll('.hbm-cc-cat-input');
            catInputs.forEach(function (inp) {
                var idx = parseInt(inp.getAttribute('data-idx'));
                if (parsedTransactions[idx]) {
                    parsedTransactions[idx].category = inp.value.trim();
                }
            });

            var skipDuplicates = document.getElementById('hbm-cc-skip-duplicates').checked;

            submitBtn.disabled = true;
            submitBtn.textContent = 'מייבא...';

            apiRequest('import-cc-excel', 'POST', {
                credit_card_id: cardId,
                transactions: parsedTransactions,
                skip_duplicates: skipDuplicates
            }).then(function (result) {
                var resultDiv = document.getElementById('hbm-cc-excel-result');
                if (result && !result.error) {
                    var msg = '<p style="color:green;font-weight:bold;">יובאו בהצלחה: ' + result.imported + ' מתוך ' + result.total + '</p>';
                    if (result.skipped > 0) {
                        msg += '<p style="color:orange;">דולגו (כפולות): ' + result.skipped + '</p>';
                    }
                    if (result.errors && result.errors.length > 0) {
                        msg += '<div style="color:red;font-size:12px;max-height:100px;overflow:auto;"><ul>' +
                            result.errors.map(function (e) { return '<li>' + escapeHtml(e) + '</li>'; }).join('') +
                            '</ul></div>';
                    }
                    resultDiv.innerHTML = msg;
                    resultDiv.style.display = 'block';
                    if (result.imported > 0) {
                        loadExpenses();
                        loadDashboard();
                    }
                } else {
                    resultDiv.innerHTML = '<p style="color:red;">שגיאה בייבוא: ' + escapeHtml((result && result.message) || 'שגיאה לא ידועה') + '</p>';
                    resultDiv.style.display = 'block';
                }
                submitBtn.textContent = 'ייבא עסקאות';
                submitBtn.disabled = false;
            });
        });
    }

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
            var range = getMonthDateRange(currentMonth);
            apiRequest('expenses', 'GET', { start_date: range.start_date, end_date: range.end_date, is_business: 0 }).then(function (data) {
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
                apiRequest('expenses', 'GET', (function(){ var r = getMonthDateRange(currentMonth); return { start_date: r.start_date, end_date: r.end_date, is_business: 1 }; })()).then(function (data) {
                    var item = data.find(function (i) { return i.id == id; });
                    if (item) showBusinessExpenseForm(item);
                });
            } else {
                showBusinessExpenseForm();
            }
        },
        editBusinessExpense: function (id) {
            apiRequest('expenses', 'GET', (function(){ var r = getMonthDateRange(currentMonth); return { start_date: r.start_date, end_date: r.end_date, is_business: 1 }; })()).then(function (data) {
                var item = data.find(function (i) { return i.id == id; });
                if (item) showBusinessExpenseForm(item);
            });
        },
        addSavingsAccount: addSavingsAccount,
        editSavingsAccount: editSavingsAccount,
        deleteSavingsAccount: deleteSavingsAccount,
        addBusinessCreditCard: addBusinessCreditCard,
        editBusinessCreditCard: editBusinessCreditCard,
        deleteBusinessCreditCard: deleteBusinessCreditCard,
        addBusinessBankAccount: addBusinessBankAccount,
        editBusinessBankAccount: editBusinessBankAccount,
        deleteBusinessBankAccount: deleteBusinessBankAccount,
        // Import
        showImportExpenses: showImportExpenses,
        downloadSampleCsv: downloadSampleCsv,
        showImportCreditCardExcel: showImportCreditCardExcel,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
