(function () {
    'use strict';

    const API = hbmData.apiUrl;
    const NONCE = hbmData.nonce;
    const CATEGORIES = hbmData.categories;

    function apiRequest(endpoint, method, data) {
        const opts = {
            method: method || 'GET',
            headers: { 'X-WP-Nonce': NONCE, 'Content-Type': 'application/json' },
        };
        if (data && method !== 'GET') opts.body = JSON.stringify(data);

        let url = API + endpoint;
        if (method === 'GET' && data) {
            url += '?' + new URLSearchParams(data).toString();
        }

        return fetch(url, opts).then(function (r) { return r.json(); });
    }

    function formatCurrency(amount) {
        return '₪' + Number(amount).toLocaleString('he-IL');
    }

    function init() {
        var app = document.getElementById('hbm-admin-app');
        if (!app) return;

        var page = app.getAttribute('data-page');
        switch (page) {
            case 'dashboard': renderAdminDashboard(app); break;
            case 'income': renderAdminIncome(app); break;
            case 'expenses': renderAdminExpenses(app); break;
            case 'allocations': renderAdminAllocations(app); break;
            case 'settings': renderAdminSettings(app); break;
        }
    }

    function renderAdminDashboard(container) {
        var month = new Date().toISOString().slice(0, 7);
        apiRequest('dashboard', 'GET', { month: month }).then(function (data) {
            container.innerHTML = '<div class="hbm-admin-header"><h1>דאשבורד - ' + month + '</h1></div>' +
                '<div class="hbm-admin-stats">' +
                '<div class="hbm-stat-box"><h3>הכנסות</h3><div class="amount">' + formatCurrency(data.total_income) + '</div></div>' +
                '<div class="hbm-stat-box" style="background:linear-gradient(135deg,#ff5252,#ff8a80)"><h3>הוצאות</h3><div class="amount">' + formatCurrency(data.total_expenses) + '</div></div>' +
                '<div class="hbm-stat-box" style="background:linear-gradient(135deg,#00c853,#69f0ae)"><h3>נשאר</h3><div class="amount">' + formatCurrency(data.remaining) + '</div></div>' +
                '</div>';
        });
    }

    function renderAdminIncome(container) {
        container.innerHTML = '<div class="hbm-admin-header"><h1>ניהול הכנסות</h1></div>' +
            '<div class="hbm-admin-card"><p>השתמש בעמוד הראשי של האתר לניהול הכנסות והוצאות.</p></div>';
    }

    function renderAdminExpenses(container) {
        container.innerHTML = '<div class="hbm-admin-header"><h1>ניהול הוצאות</h1></div>' +
            '<div class="hbm-admin-card"><p>השתמש בעמוד הראשי של האתר לניהול הכנסות והוצאות.</p></div>';
    }

    function renderAdminAllocations(container) {
        container.innerHTML = '<div class="hbm-admin-header"><h1>הקצאת תקציב</h1></div>' +
            '<div class="hbm-admin-card"><p>השתמש בעמוד הראשי של האתר לניהול הקצאות תקציב.</p></div>';
    }

    function renderAdminSettings(container) {
        container.innerHTML = '<div class="hbm-admin-header"><h1>הגדרות</h1></div>' +
            '<div class="hbm-admin-card">' +
            '<h3>קטגוריות פעילות</h3>' +
            '<ul style="columns:2;list-style:none;padding:0;">' +
            Object.values(CATEGORIES).map(function (c) { return '<li style="padding:4px 0;">' + c + '</li>'; }).join('') +
            '</ul></div>';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
