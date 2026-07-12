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
            <div class="hbm-tabs">
                <button class="hbm-tab active" data-type="all">הכל</button>
                <button class="hbm-tab" data-type="fixed">הוצאות קבועות</button>
                <button class="hbm-tab" data-type="installment">תשלומים</button>
                <button class="hbm-tab" data-type="loan">הלוואות</button>
                <button class="hbm-tab" data-type="saving">חיסכון</button>
                <button class="hbm-tab" data-type="regular">שוטף</button>
            </div>
            <div id="hbm-expenses-list" class="hbm-table-container"></div>
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
