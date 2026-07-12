<?php

if (!defined('ABSPATH')) {
    exit;
}

class HBM_Admin {

    public function __construct() {
        add_action('admin_menu', [$this, 'add_menu_pages']);
    }

    public function add_menu_pages() {
        add_menu_page(
            'ניהול תקציב',
            'ניהול תקציב',
            'read',
            'home-budget',
            [$this, 'render_dashboard'],
            'dashicons-chart-area',
            3
        );

        add_submenu_page(
            'home-budget',
            'דאשבורד',
            'דאשבורד',
            'read',
            'home-budget',
            [$this, 'render_dashboard']
        );

        add_submenu_page(
            'home-budget',
            'הכנסות',
            'הכנסות',
            'read',
            'home-budget-income',
            [$this, 'render_income']
        );

        add_submenu_page(
            'home-budget',
            'הוצאות',
            'הוצאות',
            'read',
            'home-budget-expenses',
            [$this, 'render_expenses']
        );

        add_submenu_page(
            'home-budget',
            'הקצאת תקציב',
            'הקצאת תקציב',
            'read',
            'home-budget-allocations',
            [$this, 'render_allocations']
        );

        add_submenu_page(
            'home-budget',
            'הגדרות',
            'הגדרות',
            'manage_options',
            'home-budget-settings',
            [$this, 'render_settings']
        );
    }

    public function render_dashboard() {
        echo '<div id="hbm-admin-app" data-page="dashboard"></div>';
    }

    public function render_income() {
        echo '<div id="hbm-admin-app" data-page="income"></div>';
    }

    public function render_expenses() {
        echo '<div id="hbm-admin-app" data-page="expenses"></div>';
    }

    public function render_allocations() {
        echo '<div id="hbm-admin-app" data-page="allocations"></div>';
    }

    public function render_settings() {
        echo '<div id="hbm-admin-app" data-page="settings"></div>';
    }
}

new HBM_Admin();
