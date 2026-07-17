<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<div id="hbm-app" class="hbm-container">
    <button class="hbm-hamburger" id="hbm-hamburger">
        <span></span><span></span><span></span>
    </button>

    <aside class="hbm-sidebar" id="hbm-sidebar">
        <div class="hbm-sidebar-brand">
            <div class="hbm-sidebar-brand-icon">💰</div>
            <div class="hbm-sidebar-brand-text">ניהול תקציב<small>Home Budget Manager</small></div>
        </div>

        <ul class="hbm-sidebar-nav">
            <li><a href="#" data-page="dashboard" class="hbm-sidebar-nav-item active"><span class="nav-icon">📊</span><span class="nav-label">דאשבורד פרטי</span></a></li>
            <li><a href="#" data-page="income" class="hbm-sidebar-nav-item"><span class="nav-icon">💼</span><span class="nav-label">הכנסות</span></a></li>
            <li><a href="#" data-page="expenses" class="hbm-sidebar-nav-item"><span class="nav-icon">💳</span><span class="nav-label">הוצאות</span></a></li>
            <li><div class="hbm-sidebar-nav-divider"></div></li>
            <li><a href="#" data-page="reserved-payments" class="hbm-sidebar-nav-item"><span class="nav-icon">📌</span><span class="nav-label">שמירת מסגרת</span></a></li>
            <li><a href="#" data-page="allocations" class="hbm-sidebar-nav-item"><span class="nav-icon">📐</span><span class="nav-label">הקצאת תקציב</span></a></li>
            <li><a href="#" data-page="expense-categories" class="hbm-sidebar-nav-item"><span class="nav-icon">📊</span><span class="nav-label">פירוט הוצאות</span></a></li>
            <li><a href="#" data-page="savings-details" class="hbm-sidebar-nav-item"><span class="nav-icon">🏦</span><span class="nav-label">פירוט חסכונות</span></a></li>
            <li><div class="hbm-sidebar-nav-divider" id="hbm-nav-cc-charges-divider" style="display:none;"></div></li>
            <li id="hbm-nav-cc-charges-header" style="display:none;"><span class="hbm-sidebar-nav-header">פירוט חיובי אשראי</span></li>
            <ul id="hbm-nav-cc-charges-cards" class="hbm-sidebar-nav-sub"></ul>
            <li><div class="hbm-sidebar-nav-divider" id="hbm-nav-cashflow-divider" style="display:none;"></div></li>
            <li id="hbm-nav-cashflow-header" style="display:none;"><span class="hbm-sidebar-nav-header">תזרים מזומנים</span></li>
            <ul id="hbm-nav-cashflow-accounts" class="hbm-sidebar-nav-sub"></ul>
            <li><div class="hbm-sidebar-nav-divider" id="hbm-nav-business-divider" style="display:none;"></div></li>
            <li id="hbm-nav-biz-dashboard" style="display:none;"><a href="#" data-page="biz-dashboard" class="hbm-sidebar-nav-item"><span class="nav-icon">📈</span><span class="nav-label">דאשבורד עסקי</span></a></li>
            <li id="hbm-nav-collections" style="display:none;"><a href="#" data-page="collections" class="hbm-sidebar-nav-item"><span class="nav-icon">📋</span><span class="nav-label">ניהול גביה</span></a></li>
            <li id="hbm-nav-business" style="display:none;"><a href="#" data-page="business" class="hbm-sidebar-nav-item"><span class="nav-icon">🏢</span><span class="nav-label">ניהול עסק</span></a></li>
            <li><div class="hbm-sidebar-nav-divider" id="hbm-nav-biz-cc-charges-divider" style="display:none;"></div></li>
            <li id="hbm-nav-biz-cc-charges-header" style="display:none;"><span class="hbm-sidebar-nav-header">פירוט חיובי אשראי - עסקי</span></li>
            <ul id="hbm-nav-biz-cc-charges-cards" class="hbm-sidebar-nav-sub"></ul>
            <li><div class="hbm-sidebar-nav-divider" id="hbm-nav-biz-cashflow-divider" style="display:none;"></div></li>
            <li id="hbm-nav-biz-cashflow-header" style="display:none;"><span class="hbm-sidebar-nav-header">תזרים מזומנים - עסקי</span></li>
            <ul id="hbm-nav-biz-cashflow-accounts" class="hbm-sidebar-nav-sub"></ul>
            <li><div class="hbm-sidebar-nav-divider"></div></li>
            <li><a href="#" data-page="settings" class="hbm-sidebar-nav-item"><span class="nav-icon">⚙️</span><span class="nav-label">הגדרות</span></a></li>
        </ul>

        <div class="hbm-sidebar-month">
            <label>תקופה נבחרת</label>
            <div class="hbm-month-selector">
                <button class="hbm-btn-sm" id="hbm-prev-month">&#8594;</button>
                <span id="hbm-current-month" style="flex:1;text-align:center;font-size:14px;font-weight:600;"></span>
                <button class="hbm-btn-sm" id="hbm-next-month">&#8592;</button>
            </div>
            <div id="hbm-month-date-range" style="text-align:center;font-size:11px;color:#888;margin-top:4px;"></div>
        </div>
    </aside>

    <main class="hbm-content">
        <!-- Dashboard -->
        <section id="hbm-page-dashboard" class="hbm-page active">
            <div class="hbm-page-header"><h2>דאשבורד</h2></div>


            <div id="hbm-overdraft-warning" class="hbm-alert hbm-alert-danger" style="display:none;">
                <div class="hbm-alert-icon">⚠️</div>
                <div class="hbm-alert-content">
                    <strong>התראת חריגה ממסגרת עו"ש</strong>
                    <div id="hbm-overdraft-details"></div>
                </div>
            </div>

            <div class="hbm-dashboard-cards">
                <div class="hbm-card hbm-card-income">
                    <div class="hbm-card-content">
                        <h3>סה"כ הכנסות</h3>
                        <p class="hbm-amount" id="hbm-total-income">₪0</p>
                    </div>
                </div>
                <div class="hbm-card hbm-card-expenses">
                    <div class="hbm-card-content">
                        <h3>סה"כ הוצאות</h3>
                        <p class="hbm-amount" id="hbm-total-expenses">₪0</p>
                    </div>
                </div>
                <div class="hbm-card hbm-card-allocated">
                    <div class="hbm-card-content">
                        <h3>יתרת הקצאות</h3>
                        <p class="hbm-amount" id="hbm-total-allocated">₪0</p>
                    </div>
                </div>
                <div class="hbm-card hbm-card-remaining">
                    <div class="hbm-card-content">
                        <h3>נשאר לבזבז</h3>
                        <p class="hbm-amount" id="hbm-remaining">₪0</p>
                    </div>
                </div>
                <div class="hbm-card hbm-card-savings">
                    <div class="hbm-card-content">
                        <h3>חיסכון</h3>
                        <p class="hbm-amount" id="hbm-total-savings">₪0</p>
                    </div>
                </div>
            </div>

            <div class="hbm-panel" style="margin-top:20px;">
                <h3>יתרות עו"ש צפויות</h3>
                <div id="hbm-dashboard-bank-balances" class="hbm-table-container"></div>
            </div>

            <div class="hbm-panel" style="margin-top:20px;">
                <h3>פירוט הכנסות</h3>
                <div id="hbm-income-details" class="hbm-table-container"></div>
            </div>

            <div class="hbm-panel" style="margin-top:20px;">
                <h3>פירוט הוצאות</h3>
                <div id="hbm-expense-details" class="hbm-table-container"></div>
            </div>

            <div class="hbm-panel" style="margin-top:20px;">
                <h3>10 עסקאות אשראי אחרונות</h3>
                <div id="hbm-recent-cc-transactions" class="hbm-table-container"></div>
            </div>

            <div class="hbm-dashboard-grid">
                <div class="hbm-panel">
                    <h3>הוצאות לפי סוג</h3>
                    <div id="hbm-expenses-by-type" class="hbm-chart-container"></div>
                </div>
                <div class="hbm-panel">
                    <h3>הוצאות לפי קטגוריה</h3>
                    <div id="hbm-expenses-by-category" class="hbm-chart-container"></div>
                </div>
            </div>

            <div class="hbm-panel">
                <h3>מצב הקצאות תקציב</h3>
                <div id="hbm-budget-status" class="hbm-budget-bars"></div>
            </div>

            <div class="hbm-panel">
                <h3>תשלומים שנדרש לשלם</h3>
                <div id="hbm-dashboard-reserved-payments" class="hbm-table-container"></div>
            </div>
        </section>

        <!-- Income -->
        <section id="hbm-page-income" class="hbm-page">
            <div class="hbm-page-header">
                <h2>הכנסות</h2>
                <button class="hbm-btn hbm-btn-primary" id="hbm-add-income">+ הוסף הכנסה</button>
            </div>
            <div id="hbm-income-list" class="hbm-table-container"></div>
        </section>

        <!-- Expenses -->
        <section id="hbm-page-expenses" class="hbm-page">
            <div class="hbm-page-header">
                <h2>הוצאות</h2>
                <div style="display:flex;gap:8px;">
                    <button class="hbm-btn hbm-btn-primary" id="hbm-add-expense">+ הוסף הוצאה</button>
                    <button class="hbm-btn" onclick="hbmApp.showImportExpenses()">ייבוא CSV</button>
                </div>
            </div>
            <div class="hbm-tabs" id="hbm-expense-tabs">
                <button class="hbm-tab active" data-type="all">הכל</button>
                <button class="hbm-tab" data-type="fixed">הוצאות קבועות</button>
                <button class="hbm-tab" data-type="installment">תשלומים</button>
                <button class="hbm-tab" data-type="loan">הלוואות</button>
                <button class="hbm-tab" data-type="saving">חיסכון</button>
                <button class="hbm-tab" data-type="one_time">חד פעמי</button>
                <button class="hbm-tab" data-type="standing_order">הוראות קבע</button>
            </div>
            <div id="hbm-expenses-list" class="hbm-table-container"></div>
            <div id="hbm-standing-orders-section" style="display:none;">
                <div class="hbm-page-header" style="margin-top:16px;">
                    <h3>הוראות קבע</h3>
                    <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.showStandingOrderForm()">+ הוסף הוראת קבע</button>
                </div>
                <div id="hbm-standing-orders-list" class="hbm-table-container"></div>
            </div>
            <div id="hbm-savings-report-section" style="display:none;">
                <div class="hbm-panel" style="margin-top:16px;">
                    <h3>דוח חיסכון - הפקדות</h3>
                    <div id="hbm-savings-report" class="hbm-table-container"></div>
                </div>
            </div>
        </section>

        <!-- Reserved Payments -->
        <section id="hbm-page-reserved-payments" class="hbm-page">
            <div class="hbm-page-header">
                <h2>שמירת מסגרת</h2>
                <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.showReservedPaymentForm()">+ הוסף תשלום</button>
            </div>
            <div id="hbm-reserved-payments-list" class="hbm-table-container"></div>
        </section>

        <!-- Collections -->
        <section id="hbm-page-collections" class="hbm-page">
            <div class="hbm-page-header">
                <h2>ניהול גביה</h2>
                <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.showCollectionForm()">+ הוסף גביה</button>
            </div>
            <div id="hbm-collections-list" class="hbm-table-container"></div>
            <div class="hbm-panel" style="margin-top:20px;">
                <h3>תזרים גביה</h3>
                <div id="hbm-collections-cashflow" class="hbm-table-container"></div>
            </div>
        </section>

        <!-- Budget Allocations -->
        <section id="hbm-page-allocations" class="hbm-page">
            <div class="hbm-page-header">
                <h2>הקצאת תקציב</h2>
                <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.showAllocationForm()">+ הוסף הקצאה</button>
            </div>
            <div id="hbm-allocations-list" class="hbm-table-container"></div>
        </section>

        <!-- Business Management -->
        <section id="hbm-page-business" class="hbm-page">
            <div class="hbm-page-header"><h2>ניהול עסק</h2></div>

            <div class="hbm-dashboard-cards">
                <div class="hbm-card hbm-card-income">
                    <div class="hbm-card-content">
                        <h3>הכנסות עסק</h3>
                        <p class="hbm-amount" id="hbm-biz-page-income">₪0</p>
                    </div>
                </div>
                <div class="hbm-card hbm-card-expenses">
                    <div class="hbm-card-content">
                        <h3>הוצאות עסק</h3>
                        <p class="hbm-amount" id="hbm-biz-page-expenses">₪0</p>
                    </div>
                </div>
                <div class="hbm-card hbm-card-remaining">
                    <div class="hbm-card-content">
                        <h3>משכורת זמינה למשיכה</h3>
                        <p class="hbm-amount" id="hbm-biz-page-salary">₪0</p>
                    </div>
                </div>
            </div>

            <div class="hbm-panel" style="margin-top:20px;">
                <div class="hbm-panel-header">
                    <h3>הכנסות עסקיות</h3>
                    <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.showBusinessIncomeForm()">+ הוסף הכנסה עסקית</button>
                </div>
                <div id="hbm-biz-manual-income-list" class="hbm-table-container"></div>
                <h4 style="margin-top:16px;">הכנסות מגביה</h4>
                <div id="hbm-biz-income-list" class="hbm-table-container"></div>
            </div>

            <div class="hbm-panel" style="margin-top:20px;">
                <div class="hbm-panel-header">
                    <h3>הוצאות עסקיות</h3>
                    <div>
                        <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.showSalaryForm()">💰 העברת משכורת</button>
                        <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.showBusinessExpenseForm()">+ הוסף הוצאה עסקית</button>
                    </div>
                </div>
                <div id="hbm-biz-expenses-list" class="hbm-table-container"></div>
            </div>

        </section>

        <!-- Business Dashboard -->
        <section id="hbm-page-biz-dashboard" class="hbm-page">
            <div class="hbm-page-header"><h2>דאשבורד עסקי</h2></div>

            <div class="hbm-dashboard-cards">
                <div class="hbm-card hbm-card-income">
                    <div class="hbm-card-content">
                        <h3>הכנסות (גביה)</h3>
                        <p class="hbm-amount" id="hbm-biz-dash-income">₪0</p>
                    </div>
                </div>
                <div class="hbm-card hbm-card-expenses">
                    <div class="hbm-card-content">
                        <h3>הוצאות עסק</h3>
                        <p class="hbm-amount" id="hbm-biz-dash-expenses">₪0</p>
                    </div>
                </div>
                <div class="hbm-card hbm-card-remaining">
                    <div class="hbm-card-content">
                        <h3>משכורת זמינה</h3>
                        <p class="hbm-amount" id="hbm-biz-dash-salary">₪0</p>
                    </div>
                </div>
            </div>

            <div class="hbm-panel" style="margin-top:20px;">
                <h3>גביות ששולמו</h3>
                <div id="hbm-biz-dash-collections" class="hbm-table-container"></div>
            </div>

            <div class="hbm-panel" style="margin-top:20px;">
                <h3>פירוט הוצאות</h3>
                <div id="hbm-biz-expense-details" class="hbm-table-container"></div>
            </div>

            <div class="hbm-panel" style="margin-top:20px;">
                <h3>10 עסקאות אשראי אחרונות</h3>
                <div id="hbm-biz-recent-cc-transactions" class="hbm-table-container"></div>
            </div>

            <div class="hbm-panel" style="margin-top:20px;">
                <h3>יתרות עו"ש עסקי צפויות</h3>
                <div id="hbm-biz-dash-bank-balances" class="hbm-table-container"></div>
            </div>

        </section>

        <!-- Cash Flow per Bank Account -->
        <section id="hbm-page-cashflow" class="hbm-page">
            <div class="hbm-page-header">
                <h2 id="hbm-cashflow-page-title">תזרים מזומנים</h2>
            </div>
            <div id="hbm-cashflow-summary"></div>
            <div id="hbm-cashflow-table" class="hbm-table-container"></div>
        </section>

        <!-- Credit Card Charges -->
        <section id="hbm-page-cc-charges" class="hbm-page">
            <div class="hbm-page-header">
                <h2 id="hbm-cc-charges-page-title">פירוט חיובי אשראי</h2>
            </div>
            <div id="hbm-cc-charges-summary" style="margin-bottom:12px;font-weight:600;"></div>
            <div id="hbm-cc-charges-table" class="hbm-table-container"></div>
        </section>

        <!-- Expense Categories Breakdown -->
        <section id="hbm-page-expense-categories" class="hbm-page">
            <div class="hbm-page-header"><h2>פירוט הוצאות לפי קטגוריות</h2></div>
            <div class="hbm-expcat-layout">
                <div class="hbm-panel">
                    <h3>חלוקה לפי קטגוריות</h3>
                    <div id="hbm-expcat-chart" class="hbm-pie-chart-container"></div>
                    <div id="hbm-expcat-legend" class="hbm-pie-legend"></div>
                </div>
                <div class="hbm-panel" id="hbm-expcat-details-panel" style="display:none;">
                    <h3 id="hbm-expcat-details-title">הוצאות</h3>
                    <div id="hbm-expcat-details-table" class="hbm-table-container"></div>
                </div>
            </div>
        </section>

        <!-- Savings Details -->
        <section id="hbm-page-savings-details" class="hbm-page">
            <div class="hbm-page-header"><h2>פירוט חסכונות</h2></div>
            <div id="hbm-savings-details-content"></div>
        </section>

        <!-- Settings -->
        <section id="hbm-page-settings" class="hbm-page">
            <div class="hbm-page-header"><h2>הגדרות</h2></div>

            <div class="hbm-panel hbm-settings-section">
                <h3>סוג משתמש</h3>
                <div class="hbm-user-type-selector">
                    <label class="hbm-user-type-option">
                        <input type="radio" name="hbm-user-type" value="salaried" checked>
                        <div class="hbm-user-type-card">
                            <span class="hbm-user-type-icon">👔</span>
                            <span class="hbm-user-type-label">שכיר</span>
                        </div>
                    </label>
                    <label class="hbm-user-type-option">
                        <input type="radio" name="hbm-user-type" value="self_employed">
                        <div class="hbm-user-type-card">
                            <span class="hbm-user-type-icon">🏢</span>
                            <span class="hbm-user-type-label">עצמאי</span>
                        </div>
                    </label>
                </div>
                <div style="margin-top:12px;">
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                        <input type="checkbox" id="hbm-is-business-user">
                        <span>משתמש עסקי (הצג מסכים עסקיים)</span>
                    </label>
                </div>
                <button class="hbm-btn hbm-btn-primary hbm-btn-sm" onclick="hbmApp.saveUserType()" style="margin-top:12px;">שמור הגדרות</button>
            </div>

            <div class="hbm-panel hbm-settings-section">
                <h3>כרטיסי אשראי - אישי</h3>
                <div id="hbm-credit-cards-list" class="hbm-settings-items"></div>
                <div class="hbm-settings-add-form">
                    <input type="text" id="hbm-new-cc-name" placeholder="שם הכרטיס">
                    <input type="text" id="hbm-new-cc-last4" placeholder="4 ספרות אחרונות" maxlength="4">
                    <input type="number" id="hbm-new-cc-billing-day" placeholder="יום חיוב" min="1" max="31">
                    <select id="hbm-new-cc-bank-account" class="hbm-select-sm"><option value="">חשבון בנק לחיוב</option></select>
                    <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.addCreditCard()">הוסף כרטיס</button>
                </div>
            </div>

            <div class="hbm-panel hbm-settings-section">
                <h3>חשבונות בנק - אישי</h3>
                <div id="hbm-bank-accounts-list" class="hbm-settings-items"></div>
                <div class="hbm-settings-add-form">
                    <input type="text" id="hbm-new-ba-bank-name" placeholder="שם הבנק">
                    <input type="text" id="hbm-new-ba-last3" placeholder="3 ספרות אחרונות" maxlength="3">
                    <input type="number" id="hbm-new-ba-credit-limit" placeholder="מסגרת אשראי" step="1">
                    <input type="number" id="hbm-new-ba-initial-balance" placeholder="יתרת עו״ש" step="0.01">
                    <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.addBankAccount()">הוסף חשבון</button>
                </div>
            </div>

            <div id="hbm-business-settings" style="display:none;">
                <div class="hbm-panel hbm-settings-section">
                    <h3>כרטיסי אשראי - עסקי</h3>
                    <div id="hbm-biz-credit-cards-list" class="hbm-settings-items"></div>
                    <div class="hbm-settings-add-form">
                        <input type="text" id="hbm-new-biz-cc-name" placeholder="שם הכרטיס">
                        <input type="text" id="hbm-new-biz-cc-last4" placeholder="4 ספרות אחרונות" maxlength="4">
                        <input type="number" id="hbm-new-biz-cc-billing-day" placeholder="יום חיוב" min="1" max="31">
                        <select id="hbm-new-biz-cc-bank-account" class="hbm-select-sm"><option value="">חשבון בנק לחיוב</option></select>
                        <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.addBusinessCreditCard()">הוסף כרטיס עסקי</button>
                    </div>
                </div>

                <div class="hbm-panel hbm-settings-section">
                    <h3>חשבונות בנק - עסקי</h3>
                    <div id="hbm-biz-bank-accounts-list" class="hbm-settings-items"></div>
                    <div class="hbm-settings-add-form">
                        <input type="text" id="hbm-new-biz-ba-bank-name" placeholder="שם הבנק">
                        <input type="text" id="hbm-new-biz-ba-last3" placeholder="3 ספרות אחרונות" maxlength="3">
                        <input type="number" id="hbm-new-biz-ba-credit-limit" placeholder="מסגרת אשראי" step="1">
                        <input type="number" id="hbm-new-biz-ba-initial-balance" placeholder="יתרת עו״ש" step="0.01">
                        <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.addBusinessBankAccount()">הוסף חשבון עסקי</button>
                    </div>
                </div>
            </div>

            <div class="hbm-panel hbm-settings-section">
                <h3>חשבונות חיסכון</h3>
                <div id="hbm-savings-accounts-list" class="hbm-settings-items"></div>
                <div class="hbm-settings-add-form">
                    <input type="text" id="hbm-new-sa-name" placeholder="שם החיסכון">
                    <input type="number" id="hbm-new-sa-target" placeholder="סכום יעד (אופציונלי)" step="0.01">
                    <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.addSavingsAccount()">הוסף חיסכון</button>
                </div>
            </div>

            <div class="hbm-panel hbm-settings-section">
                <h3>ניהול קטגוריות</h3>
                <div id="hbm-categories-list" class="hbm-categories-grid"></div>
                <div class="hbm-settings-add-form" style="margin-top:12px;">
                    <input type="text" id="hbm-new-cat-key" placeholder="מזהה (באנגלית)">
                    <input type="text" id="hbm-new-cat-label" placeholder="שם הקטגוריה">
                    <button class="hbm-btn hbm-btn-primary" id="hbm-add-category">הוסף קטגוריה</button>
                </div>
            </div>
        </section>
    </main>

    <!-- Modal -->
    <div id="hbm-modal" class="hbm-modal" style="display:none;">
        <div class="hbm-modal-overlay"></div>
        <div class="hbm-modal-content">
            <div class="hbm-modal-header">
                <h3 id="hbm-modal-title"></h3>
                <button class="hbm-modal-close">&times;</button>
            </div>
            <div id="hbm-modal-body" class="hbm-modal-body"></div>
        </div>
    </div>
</div>
