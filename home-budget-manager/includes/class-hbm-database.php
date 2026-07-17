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
            is_business tinyint(1) DEFAULT 0,
            bank_account_id bigint(20) unsigned DEFAULT NULL,
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
            charged_amount decimal(12,2) DEFAULT NULL,
            total_installments int DEFAULT NULL,
            current_installment int DEFAULT NULL,
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
            is_business tinyint(1) DEFAULT 0,
            allocation_id bigint(20) unsigned DEFAULT NULL,
            saving_account_id bigint(20) unsigned DEFAULT NULL,
            voucher_number varchar(50) DEFAULT NULL,
            cc_billing_month varchar(7) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY type (type),
            KEY category (category),
            KEY start_date (start_date),
            KEY voucher_number (voucher_number)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hbm_budget_allocations (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            label varchar(255) NOT NULL,
            amount decimal(12,2) NOT NULL,
            used_amount decimal(12,2) DEFAULT 0.00,
            deduction_date date DEFAULT NULL,
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id)
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
            bank_account_id bigint(20) unsigned DEFAULT NULL,
            is_business tinyint(1) DEFAULT 0,
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
            balance_date date DEFAULT NULL,
            is_business tinyint(1) DEFAULT 0,
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

        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}hbm_savings_accounts (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            name varchar(255) NOT NULL,
            target_amount decimal(12,2) DEFAULT NULL,
            notes varchar(500) DEFAULT '',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
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
        self::maybe_alter_other_tables();
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

        // Add is_business if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'is_business'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN is_business tinyint(1) DEFAULT 0 AFTER loan_payment_day");
        }

        // Add allocation_id if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'allocation_id'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN allocation_id bigint(20) unsigned DEFAULT NULL AFTER is_business");
        }

        // Update type enum: replace 'regular' with 'one_time'
        $wpdb->query("ALTER TABLE {$table} MODIFY COLUMN type enum('fixed','installment','loan','saving','one_time') NOT NULL DEFAULT 'one_time'");

        // Migrate existing 'regular' rows (if any leftover from before enum change)
        $wpdb->query("UPDATE {$table} SET type = 'one_time' WHERE type = 'regular' OR type = ''");
    }

    /**
     * Alter other existing tables to add new columns for upgrades from older versions.
     */
    private static function maybe_alter_other_tables() {
        global $wpdb;

        // Add is_business and bank_account_id to credit_cards if not exists
        $table = "{$wpdb->prefix}hbm_credit_cards";
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'is_business'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN is_business tinyint(1) DEFAULT 0 AFTER billing_day");
        }
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'bank_account_id'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN bank_account_id bigint(20) unsigned DEFAULT NULL AFTER billing_day");
        }

        // Add balance_date and is_business to bank_accounts if not exists
        $table = "{$wpdb->prefix}hbm_bank_accounts";
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'balance_date'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN balance_date date DEFAULT NULL AFTER initial_balance");
            $wpdb->query("UPDATE {$table} SET balance_date = CURDATE() WHERE balance_date IS NULL");
        }
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'is_business'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN is_business tinyint(1) DEFAULT 0 AFTER balance_date");
        }

        // Add is_business to income if not exists
        $table = "{$wpdb->prefix}hbm_income";
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'is_business'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN is_business tinyint(1) DEFAULT 0 AFTER end_date");
        }

        // Add bank_account_id to income if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'bank_account_id'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN bank_account_id bigint(20) unsigned DEFAULT NULL AFTER is_business");
        }

        // Add saving_account_id to expenses if not exists
        $table = "{$wpdb->prefix}hbm_expenses";
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'saving_account_id'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN saving_account_id bigint(20) unsigned DEFAULT NULL AFTER allocation_id");
        }

        // Add charged_amount to expenses if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'charged_amount'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN charged_amount decimal(12,2) DEFAULT NULL AFTER amount");
        }

        // Add current_installment to expenses if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'current_installment'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN current_installment int DEFAULT NULL AFTER total_installments");
        }

        // Add voucher_number to expenses if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'voucher_number'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN voucher_number varchar(50) DEFAULT NULL AFTER saving_account_id");
        }

        // Add cc_billing_month to expenses if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'cc_billing_month'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN cc_billing_month varchar(7) DEFAULT NULL AFTER voucher_number");
        }

        // Alter budget_allocations: add label if not exists
        $table = "{$wpdb->prefix}hbm_budget_allocations";
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'label'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN label varchar(255) NOT NULL AFTER user_id");
        }

        // Add used_amount if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'used_amount'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN used_amount decimal(12,2) DEFAULT 0.00 AFTER amount");
        }

        // Add deduction_date if not exists
        $col = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'deduction_date'");
        if (empty($col)) {
            $wpdb->query("ALTER TABLE {$table} ADD COLUMN deduction_date date DEFAULT NULL AFTER used_amount");
        }
    }

    private static function seed_categories() {
        $categories = HBM_Categories::get_defaults();
        update_option('hbm_categories', $categories);
    }
}
