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
            type enum('fixed','installment','loan','saving','one_time') NOT NULL DEFAULT 'one_time',
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
            credit_card_id bigint(20) unsigned DEFAULT NULL,
            bank_account_id bigint(20) unsigned DEFAULT NULL,
            payment_method enum('credit','bank_transfer','check','cash') DEFAULT NULL,
            loan_payment_day int DEFAULT NULL,
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

        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hbm_credit_cards (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            last_four varchar(4) NOT NULL,
            card_name varchar(255) NOT NULL,
            billing_day int NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hbm_bank_accounts (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            last_three varchar(3) NOT NULL,
            bank_name varchar(255) NOT NULL,
            credit_limit decimal(12,2) DEFAULT 0.00,
            initial_balance decimal(12,2) DEFAULT 0.00,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hbm_standing_orders (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            title varchar(255) NOT NULL,
            payee varchar(255) DEFAULT '',
            amount decimal(12,2) NOT NULL,
            category varchar(100) DEFAULT '',
            type enum('bank','credit') NOT NULL DEFAULT 'bank',
            credit_card_id bigint(20) unsigned DEFAULT NULL,
            bank_account_id bigint(20) unsigned DEFAULT NULL,
            day_of_month int NOT NULL,
            start_date date NOT NULL,
            end_date date DEFAULT NULL,
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hbm_reserved_payments (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            title varchar(255) NOT NULL,
            payee varchar(255) DEFAULT '',
            amount decimal(12,2) NOT NULL,
            payment_date date NOT NULL,
            details text DEFAULT NULL,
            bank_account_id bigint(20) unsigned DEFAULT NULL,
            is_paid tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY payment_date (payment_date)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hbm_collections (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            client_name varchar(255) NOT NULL,
            amount decimal(12,2) NOT NULL,
            payment_date date NOT NULL,
            status enum('pending','invoice_sent','paid','receipt_sent') DEFAULT 'pending',
            notes text DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hbm_savings_log (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            expense_id bigint(20) unsigned NOT NULL,
            amount decimal(12,2) NOT NULL,
            deposit_date date NOT NULL,
            notes varchar(500) DEFAULT '',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY expense_id (expense_id)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        foreach ($tables as $sql) {
            dbDelta($sql);
        }

        self::seed_categories();
        self::maybe_alter_expenses_table();
    }

    /**
     * Alter existing hbm_expenses table to add new columns and update enum
     * for upgrades from older versions.
     */
    private static function maybe_alter_expenses_table() {
        global $wpdb;
        $table = "{$wpdb->prefix}hbm_expenses";

        // Add credit_card_id if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'credit_card_id'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN credit_card_id bigint(20) unsigned DEFAULT NULL AFTER end_date");
        }

        // Add bank_account_id if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'bank_account_id'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN bank_account_id bigint(20) unsigned DEFAULT NULL AFTER credit_card_id");
        }

        // Add payment_method if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'payment_method'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN payment_method enum('credit','bank_transfer','check','cash') DEFAULT NULL AFTER bank_account_id");
        }

        // Add loan_payment_day if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'loan_payment_day'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN loan_payment_day int DEFAULT NULL AFTER payment_method");
        }

        // Update type enum: replace 'regular' with 'one_time'
        $wpdb->query("ALTER TABLE {$table} MODIFY COLUMN type enum('fixed','installment','loan','saving','one_time') NOT NULL DEFAULT 'one_time'");

        // Migrate existing 'regular' rows (if any leftover from before enum change)
        $wpdb->query("UPDATE {$table} SET type = 'one_time' WHERE type = 'regular' OR type = ''");
    }

    private static function seed_categories() {
        $categories = HBM_Categories::get_defaults();
        update_option('hbm_categories', $categories);
    }
}
