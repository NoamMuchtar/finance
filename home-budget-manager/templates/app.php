<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<div id="hbm-app" class="hbm-container">
    <nav class="hbm-nav">
        <div class="hbm-nav-brand">💰 ניהול תקציב הבית</div>
        <ul class="hbm-nav-links">
            <li><a href="#" data-page="dashboard" class="active">דאשבורד</a></li>
            <li><a href="#" data-page="income">הכנסות</a></li>
            <li><a href="#" data-page="expenses">הוצאות</a></li>
            <li><a href="#" data-page="reserved-payments">שמירת מסגרת</a></li>
            <li id="hbm-nav-collections" style="display:none;"><a href="#" data-page="collections">ניהול גביה</a></li>
            <li><a href="#" data-page="allocations">הקצאת תקציב</a></li>
            <li><a href="#" data-page="settings">הגדרות</a></li>
        </ul>
        <div class="hbm-month-selector">
            <button class="hbm-btn hbm-btn-sm" id="hbm-prev-month">&#8594;</button>
            <span id="hbm-current-month"></span>
            <button class="hbm-btn hbm-btn-sm" id="hbm-next-month">&#8592;</button>
        </div>
    </nav>

    <main class="hbm-main">
        <!-- Dashboard -->
        <section id="hbm-page-dashboard" class="hbm-page active">
            <div class="hbm-dashboard-cards">
                <div class="hbm-card hbm-card-income">
                    <div class="hbm-card-icon">📈</div>
                    <div class="hbm-card-content">
                        <h3>סה"כ הכנסות</h3>
                        <p class="hbm-amount" id="hbm-total-income">₪0</p>
                    </div>
                </div>
                <div class="hbm-card hbm-card-expenses">
                    <div class="hbm-card-icon">📉</div>
                    <div class="hbm-card-content">
                        <h3>סה"כ הוצאות</h3>
                        <p class="hbm-amount" id="hbm-total-expenses">₪0</p>
                    </div>
                </div>
                <div class="hbm-card hbm-card-remaining">
                    <div class="hbm-card-icon">💵</div>
                    <div class="hbm-card-content">
                        <h3>נשאר לבזבז</h3>
                        <p class="hbm-amount" id="hbm-remaining">₪0</p>
                    </div>
                </div>
                <div class="hbm-card hbm-card-savings">
                    <div class="hbm-card-icon">🏦</div>
                    <div class="hbm-card-content">
                        <h3>חיסכון</h3>
                        <p class="hbm-amount" id="hbm-total-savings">₪0</p>
                    </div>
                </div>
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

            <!-- Cash Flow Section -->
            <div class="hbm-panel">
                <h3>תזרים מזומנים</h3>
                <div class="hbm-form-group" style="margin-bottom:12px;">
                    <select id="hbm-cashflow-bank-account" class="hbm-select-inline">
                        <option value="">בחר חשבון בנק</option>
                    </select>
                </div>
                <div id="hbm-cashflow-table" class="hbm-table-container"></div>
            </div>

            <!-- Reserved Payments Due Section -->
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
                <button class="hbm-btn hbm-btn-primary" id="hbm-add-expense">+ הוסף הוצאה</button>
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
            <!-- Standing Orders Section (shown when standing_order tab active) -->
            <div id="hbm-standing-orders-section" style="display:none;">
                <div class="hbm-page-header" style="margin-top:16px;">
                    <h3>הוראות קבע</h3>
                    <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.showStandingOrderForm()">+ הוסף הוראת קבע</button>
                </div>
                <div id="hbm-standing-orders-list" class="hbm-table-container"></div>
            </div>
            <!-- Savings Report (shown when saving tab active) -->
            <div id="hbm-savings-report-section" style="display:none;">
                <div class="hbm-panel" style="margin-top:16px;">
                    <h3>דוח חיסכון - הפקדות לפי חיסכון</h3>
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

        <!-- Collections (self-employed only) -->
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
                <h2>הקצאת תקציב חודשי</h2>
                <button class="hbm-btn hbm-btn-primary" id="hbm-save-allocations">שמור שינויים</button>
            </div>
            <div id="hbm-allocations-form" class="hbm-allocations-grid"></div>
        </section>

        <!-- Settings -->
        <section id="hbm-page-settings" class="hbm-page">
            <div class="hbm-page-header">
                <h2>הגדרות</h2>
            </div>

            <!-- User Type -->
            <div class="hbm-panel">
                <h3>סוג משתמש</h3>
                <div class="hbm-radio-group">
                    <label class="hbm-radio-label">
                        <input type="radio" name="hbm-user-type" value="salaried" checked> שכיר
                    </label>
                    <label class="hbm-radio-label">
                        <input type="radio" name="hbm-user-type" value="self_employed"> עצמאי
                    </label>
                </div>
                <button class="hbm-btn hbm-btn-primary hbm-btn-sm" onclick="hbmApp.saveUserType()" style="margin-top:10px;">שמור</button>
            </div>

            <!-- Credit Cards -->
            <div class="hbm-panel">
                <h3>כרטיסי אשראי</h3>
                <div id="hbm-credit-cards-list" class="hbm-settings-list"></div>
                <div class="hbm-add-category-form" style="margin-top:12px;">
                    <input type="text" id="hbm-new-cc-last4" placeholder="4 ספרות אחרונות" maxlength="4" style="width:140px;">
                    <input type="number" id="hbm-new-cc-billing-day" placeholder="יום חיוב (1-31)" min="1" max="31" style="width:140px;">
                    <input type="text" id="hbm-new-cc-name" placeholder="שם הכרטיס (אופציונלי)" style="width:180px;">
                    <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.addCreditCard()">הוסף כרטיס</button>
                </div>
            </div>

            <!-- Bank Accounts -->
            <div class="hbm-panel">
                <h3>חשבונות בנק</h3>
                <div id="hbm-bank-accounts-list" class="hbm-settings-list"></div>
                <div class="hbm-add-category-form" style="margin-top:12px;" id="hbm-bank-account-form">
                    <input type="text" id="hbm-new-ba-last3" placeholder="3 ספרות אחרונות" maxlength="3" style="width:130px;">
                    <input type="text" id="hbm-new-ba-bank-name" placeholder="שם הבנק" style="width:150px;">
                    <input type="number" id="hbm-new-ba-credit-limit" placeholder="מסגרת אשראי" style="width:140px;">
                    <input type="number" id="hbm-new-ba-initial-balance" placeholder="יתרה התחלתית" style="width:140px;">
                    <button class="hbm-btn hbm-btn-primary" onclick="hbmApp.addBankAccount()">הוסף חשבון</button>
                </div>
            </div>

            <!-- Categories -->
            <div class="hbm-panel">
                <h3>ניהול קטגוריות</h3>
                <div id="hbm-categories-list" class="hbm-categories-grid"></div>
                <div class="hbm-add-category-form">
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
