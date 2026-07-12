<?php

if (!defined('ABSPATH')) {
    exit;
}

class HBM_Database {

    public static function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $tables = [];

        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hbm_income (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            title varchar(255) NOT NULL,
            amount decimal(12,2) NOT NULL,
            source varchar(255) DEFAULT '',
            is_recurring tinyint(1) DEFAULT 1,
            start_date date NOT NULL,
            end_date date DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hbm_expenses (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            type enum('fixed','installment','loan','saving','regular') NOT NULL DEFAULT 'regular',
            title varchar(255) NOT NULL,
            payee varchar(255) DEFAULT '',
            description varchar(500) DEFAULT '',
            category varchar(100) NOT NULL,
            amount decimal(12,2) NOT NULL,
            total_installments int DEFAULT NULL,
            remaining_installments int DEFAULT NULL,
            installment_amount decimal(12,2) DEFAULT NULL,
            loan_end_date date DEFAULT NULL,
            monthly_return decimal(12,2) DEFAULT NULL,
            is_recurring tinyint(1) DEFAULT 0,
            start_date date NOT NULL,
            end_date date DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY type (type),
            KEY category (category),
            KEY start_date (start_date)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hbm_budget_allocations (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            category varchar(100) NOT NULL,
            amount decimal(12,2) NOT NULL,
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_category (user_id, category)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hbm_settings (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            setting_key varchar(100) NOT NULL,
            setting_value text NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY user_setting (user_id, setting_key)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        foreach ($tables as $sql) {
            dbDelta($sql);
        }

        self::seed_categories();
    }

    private static function seed_categories() {
        $categories = HBM_Categories::get_defaults();
        update_option('hbm_categories', $categories);
    }
}
