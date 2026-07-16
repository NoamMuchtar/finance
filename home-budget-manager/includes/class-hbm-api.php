<?php

if (!defined('ABSPATH')) {
    exit;
}

class HBM_API {

    public static function register_routes() {
        $namespace = 'hbm/v1';

        // Income
        register_rest_route($namespace, '/income', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_income'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_income'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/income/(?P<id>\d+)', [
            ['methods' => WP_REST_Server::EDITABLE, 'callback' => [__CLASS__, 'update_income'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => WP_REST_Server::DELETABLE, 'callback' => [__CLASS__, 'delete_income'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Expenses
        register_rest_route($namespace, '/expenses', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_expenses'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_expense'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/expenses/(?P<id>\d+)', [
            ['methods' => WP_REST_Server::EDITABLE, 'callback' => [__CLASS__, 'update_expense'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => WP_REST_Server::DELETABLE, 'callback' => [__CLASS__, 'delete_expense'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Budget Allocations
        register_rest_route($namespace, '/budget-allocations', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_allocations'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_allocation'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);
        register_rest_route($namespace, '/budget-allocations/(?P<id>\d+)', [
            ['methods' => WP_REST_Server::EDITABLE, 'callback' => [__CLASS__, 'update_allocation'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => WP_REST_Server::DELETABLE, 'callback' => [__CLASS__, 'delete_allocation'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Dashboard
        register_rest_route($namespace, '/dashboard', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_dashboard'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Categories
        register_rest_route($namespace, '/categories', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_categories'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'add_category'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/categories/(?P<key>[a-z_]+)', [
            ['methods' => WP_REST_Server::DELETABLE, 'callback' => [__CLASS__, 'delete_category'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Credit Cards
        register_rest_route($namespace, '/credit-cards', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_credit_cards'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_credit_card'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/credit-cards/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [__CLASS__, 'update_credit_card'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => WP_REST_Server::DELETABLE, 'callback' => [__CLASS__, 'delete_credit_card'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Bank Accounts
        register_rest_route($namespace, '/bank-accounts', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_bank_accounts'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_bank_account'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/bank-accounts/(?P<id>\d+)', [
            ['methods' => WP_REST_Server::EDITABLE, 'callback' => [__CLASS__, 'update_bank_account'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => WP_REST_Server::DELETABLE, 'callback' => [__CLASS__, 'delete_bank_account'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Standing Orders
        register_rest_route($namespace, '/standing-orders', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_standing_orders'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_standing_order'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/standing-orders/(?P<id>\d+)', [
            ['methods' => WP_REST_Server::EDITABLE, 'callback' => [__CLASS__, 'update_standing_order'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => WP_REST_Server::DELETABLE, 'callback' => [__CLASS__, 'delete_standing_order'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Reserved Payments
        register_rest_route($namespace, '/reserved-payments', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_reserved_payments'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_reserved_payment'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/reserved-payments/(?P<id>\d+)', [
            ['methods' => WP_REST_Server::EDITABLE, 'callback' => [__CLASS__, 'update_reserved_payment'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => WP_REST_Server::DELETABLE, 'callback' => [__CLASS__, 'delete_reserved_payment'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Collections
        register_rest_route($namespace, '/collections', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_collections'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_collection'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/collections/(?P<id>\d+)', [
            ['methods' => WP_REST_Server::EDITABLE, 'callback' => [__CLASS__, 'update_collection'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => WP_REST_Server::DELETABLE, 'callback' => [__CLASS__, 'delete_collection'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Savings Log
        register_rest_route($namespace, '/savings-log', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_savings_log'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_savings_log'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Savings Accounts
        register_rest_route($namespace, '/savings-accounts', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_savings_accounts'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_savings_account'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/savings-accounts/(?P<id>\d+)', [
            ['methods' => WP_REST_Server::EDITABLE, 'callback' => [__CLASS__, 'update_savings_account'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => WP_REST_Server::DELETABLE, 'callback' => [__CLASS__, 'delete_savings_account'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Savings Summary
        register_rest_route($namespace, '/savings-summary', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_savings_summary'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // User Settings
        register_rest_route($namespace, '/user-settings', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_user_settings'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'save_user_settings'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Cash Flow
        register_rest_route($namespace, '/cash-flow', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_cash_flow'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Business Dashboard
        register_rest_route($namespace, '/business-dashboard', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_business_dashboard'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Overdraft Check
        register_rest_route($namespace, '/overdraft-check', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'check_overdraft'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Credit Card Charges
        register_rest_route($namespace, '/credit-card-charges', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_credit_card_charges'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Salary Transfer (business expense + personal income)
        register_rest_route($namespace, '/salary-transfer', [
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_salary_transfer'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Bank Balances Projection
        register_rest_route($namespace, '/bank-balances', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_bank_balances'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);
    }

    public static function check_auth() {
        return is_user_logged_in();
    }

    // =========================================================================
    // Income
    // =========================================================================

    public static function get_income($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $query = "SELECT * FROM {$wpdb->prefix}hbm_income WHERE user_id = %d";
        $query_args = [$user_id];

        $month = sanitize_text_field($request->get_param('month') ?? '');
        if ($month) {
            $month_start = $month . '-01';
            $month_end = date('Y-m-t', strtotime($month_start));
            $query .= " AND start_date <= %s AND (end_date IS NULL OR end_date >= %s)";
            $query_args[] = $month_end;
            $query_args[] = $month_start;
        }

        $is_business = $request->get_param('is_business');
        if ($is_business !== null && $is_business !== '') {
            $query .= " AND is_business = %d";
            $query_args[] = intval($is_business);
        }

        $query .= " ORDER BY start_date DESC, created_at DESC";

        $results = $wpdb->get_results($wpdb->prepare($query, $query_args));

        if ($results === null) {
            return new WP_Error('db_error', 'שגיאת מסד נתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        return rest_ensure_response($results);
    }

    public static function create_income($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [
            'user_id' => $user_id,
            'title' => sanitize_text_field($params['title'] ?? ''),
            'amount' => floatval($params['amount'] ?? 0),
            'source' => sanitize_text_field($params['source'] ?? ''),
            'is_recurring' => intval($params['is_recurring'] ?? 1),
            'start_date' => sanitize_text_field($params['start_date'] ?? date('Y-m-d')),
        ];

        if (!empty($params['end_date'])) {
            $data['end_date'] = sanitize_text_field($params['end_date']);
        }

        $is_business = intval($params['is_business'] ?? 0);
        if ($is_business) {
            $data['is_business'] = $is_business;
        }

        if (isset($params['bank_account_id']) && $params['bank_account_id'] !== '' && $params['bank_account_id'] !== null) {
            $data['bank_account_id'] = intval($params['bank_account_id']);
        }

        $result = $wpdb->insert("{$wpdb->prefix}hbm_income", $data);

        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בשמירת הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $inserted = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_income WHERE id = %d",
            $wpdb->insert_id
        ));

        return rest_ensure_response($inserted);
    }

    public static function update_income($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [
            'title' => sanitize_text_field($params['title'] ?? ''),
            'amount' => floatval($params['amount'] ?? 0),
            'source' => sanitize_text_field($params['source'] ?? ''),
            'is_recurring' => intval($params['is_recurring'] ?? 1),
            'start_date' => sanitize_text_field($params['start_date'] ?? date('Y-m-d')),
        ];

        if (!empty($params['end_date'])) {
            $data['end_date'] = sanitize_text_field($params['end_date']);
        }

        if (array_key_exists('bank_account_id', $params)) {
            $data['bank_account_id'] = ($params['bank_account_id'] !== null && $params['bank_account_id'] !== '') ? intval($params['bank_account_id']) : null;
        }

        $wpdb->update("{$wpdb->prefix}hbm_income", $data, ['id' => $id, 'user_id' => $user_id]);

        $updated = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_income WHERE id = %d AND user_id = %d",
            $id, $user_id
        ));

        return rest_ensure_response($updated);
    }

    public static function delete_income($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $wpdb->delete("{$wpdb->prefix}hbm_income", ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
    }

    // =========================================================================
    // Expenses
    // =========================================================================

    public static function get_expenses($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $month = sanitize_text_field($request->get_param('month') ?? date('Y-m'));
        $type = sanitize_text_field($request->get_param('type') ?? '');

        $month_start = $month . '-01';
        $month_end = date('Y-m-t', strtotime($month_start));

        $where = $wpdb->prepare("WHERE user_id = %d", $user_id);

        $where .= $wpdb->prepare(
            " AND start_date <= %s AND (end_date IS NULL OR end_date >= %s)",
            $month_end,
            $month_start
        );

        if ($type && $type !== 'all') {
            $where .= $wpdb->prepare(" AND type = %s", $type);
        }

        $is_business = $request->get_param('is_business');
        if ($is_business !== null && $is_business !== '') {
            $where .= $wpdb->prepare(" AND is_business = %d", intval($is_business));
        }

        $results = $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}hbm_expenses $where ORDER BY created_at DESC"
        );

        $credit_card_ids = array_unique(array_filter(array_map(function ($e) {
            return $e->credit_card_id ?? null;
        }, $results)));
        $card_billing_days = [];
        if (!empty($credit_card_ids)) {
            $placeholders = implode(',', array_fill(0, count($credit_card_ids), '%d'));
            $cards = $wpdb->get_results($wpdb->prepare(
                "SELECT id, billing_day FROM {$wpdb->prefix}hbm_credit_cards WHERE id IN ($placeholders)",
                ...$credit_card_ids
            ));
            foreach ($cards as $c) {
                $card_billing_days[$c->id] = intval($c->billing_day);
            }
        }

        $today_day = intval(date('d'));
        foreach ($results as &$expense) {
            if ($expense->type === 'installment' && $expense->remaining_installments !== null) {
                $months_passed = self::months_between($expense->start_date, $month_start);
                $billing_day = isset($card_billing_days[$expense->credit_card_id]) ? $card_billing_days[$expense->credit_card_id] : null;
                if ($billing_day && $today_day > $billing_day) {
                    $months_passed++;
                }
                $remaining = max(0, $expense->total_installments - $months_passed);
                $expense->current_remaining = $remaining;
                $expense->is_active = $remaining > 0;
            }
        }

        return rest_ensure_response($results);
    }

    public static function create_expense($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $type = sanitize_text_field($params['type'] ?? 'one_time');
        $title = sanitize_text_field($params['title'] ?? '');
        $payee = sanitize_text_field($params['payee'] ?? '');
        $description = sanitize_text_field($params['description'] ?? '');
        $category = sanitize_text_field($params['category'] ?? '');
        $amount = floatval($params['amount'] ?? 0);
        $start_date = sanitize_text_field($params['start_date'] ?? date('Y-m-d'));

        // For loan type, category is optional (defaults to loan_payment)
        if ($type === 'loan' && empty($category)) {
            $category = 'loan_payment';
        }

        if (empty($title) || $amount <= 0) {
            return new WP_Error('missing_data', 'חסרים נתונים חובה (שם, סכום)', ['status' => 400]);
        }

        // Category is required for non-loan types
        if ($type !== 'loan' && empty($category)) {
            return new WP_Error('missing_data', 'חסרים נתונים חובה (קטגוריה)', ['status' => 400]);
        }

        $data = [
            'user_id' => $user_id,
            'type' => $type,
            'title' => $title,
            'payee' => $payee,
            'description' => $description,
            'category' => $category,
            'amount' => $amount,
            'is_recurring' => 0,
            'start_date' => $start_date,
        ];

        $is_business = intval($params['is_business'] ?? 0);
        if ($is_business) {
            $data['is_business'] = $is_business;
        }

        // Handle allocation_id
        $allocation_id = null;
        if (!empty($params['allocation_id'])) {
            $allocation_id = intval($params['allocation_id']);
            $data['allocation_id'] = $allocation_id;
        }

        // Handle saving_account_id
        $data['saving_account_id'] = !empty($params['saving_account_id']) ? intval($params['saving_account_id']) : null;

        // Handle credit_card_id
        if (isset($params['credit_card_id']) && $params['credit_card_id'] !== '' && $params['credit_card_id'] !== null) {
            $data['credit_card_id'] = intval($params['credit_card_id']);
        }

        // Handle bank_account_id
        if (isset($params['bank_account_id']) && $params['bank_account_id'] !== '' && $params['bank_account_id'] !== null) {
            $data['bank_account_id'] = intval($params['bank_account_id']);
        }

        // Handle payment_method
        if (!empty($params['payment_method'])) {
            $data['payment_method'] = sanitize_text_field($params['payment_method']);
        }

        switch ($type) {
            case 'fixed':
                $data['is_recurring'] = 1;
                break;

            case 'installment':
                $total = intval($params['total_installments'] ?? 0);
                if ($total <= 0) $total = 1;
                $data['total_installments'] = $total;
                $data['remaining_installments'] = $total;
                $inst_amount = floatval($params['installment_amount'] ?? 0);
                $data['installment_amount'] = $inst_amount > 0 ? $inst_amount : ($amount / $total);

                // If credit_card_id is provided, calculate first_payment_date as next billing day
                if (!empty($data['credit_card_id'])) {
                    $card = $wpdb->get_row($wpdb->prepare(
                        "SELECT billing_day FROM {$wpdb->prefix}hbm_credit_cards WHERE id = %d AND user_id = %d",
                        $data['credit_card_id'],
                        $user_id
                    ));
                    if ($card) {
                        $billing_day = intval($card->billing_day);
                        $start_dt = new DateTime($start_date);
                        $start_day = intval($start_dt->format('d'));
                        if ($start_day >= $billing_day) {
                            // Next billing day is in the following month
                            $start_dt->modify('first day of next month');
                        }
                        $year = $start_dt->format('Y');
                        $month_num = $start_dt->format('m');
                        $days_in_month = intval(date('t', mktime(0, 0, 0, $month_num, 1, $year)));
                        $actual_day = min($billing_day, $days_in_month);
                        $first_payment = sprintf('%s-%s-%02d', $year, $month_num, $actual_day);
                        $data['start_date'] = $first_payment;
                    }
                }

                $data['end_date'] = date('Y-m-d', strtotime($data['start_date'] . " +{$total} months"));
                break;

            case 'loan':
                $data['monthly_return'] = floatval($params['monthly_return'] ?? 0);
                $loan_end = sanitize_text_field($params['loan_end_date'] ?? '');
                if ($loan_end) {
                    $data['loan_end_date'] = $loan_end;
                    $data['end_date'] = $loan_end;
                }
                if (isset($params['loan_payment_day'])) {
                    $data['loan_payment_day'] = intval($params['loan_payment_day']);
                }
                break;

            case 'saving':
                $data['is_recurring'] = 1;
                break;

            case 'one_time':
                // For one_time expenses, payment_method should be provided
                if (empty($data['payment_method'])) {
                    $data['payment_method'] = 'cash'; // default fallback
                }
                break;
        }

        $result = $wpdb->insert("{$wpdb->prefix}hbm_expenses", $data);

        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בשמירת הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $data['id'] = $wpdb->insert_id;

        // Update allocation used_amount if allocation_id is provided
        if (!empty($allocation_id)) {
            $expense_amount = floatval($data['amount']);
            $wpdb->query($wpdb->prepare(
                "UPDATE {$wpdb->prefix}hbm_budget_allocations SET used_amount = used_amount + %f WHERE id = %d AND user_id = %d",
                $expense_amount, $allocation_id, $user_id
            ));
        }

        return rest_ensure_response($data);
    }

    public static function update_expense($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [
            'title' => sanitize_text_field($params['title'] ?? ''),
            'payee' => sanitize_text_field($params['payee'] ?? ''),
            'description' => sanitize_text_field($params['description'] ?? ''),
            'category' => sanitize_text_field($params['category'] ?? ''),
            'amount' => floatval($params['amount'] ?? 0),
        ];

        if (!empty($params['start_date'])) {
            $data['start_date'] = sanitize_text_field($params['start_date']);
        }
        if (array_key_exists('end_date', $params)) {
            $data['end_date'] = $params['end_date'] ? sanitize_text_field($params['end_date']) : null;
        }

        // Handle credit_card_id
        if (array_key_exists('credit_card_id', $params)) {
            $data['credit_card_id'] = $params['credit_card_id'] !== null ? intval($params['credit_card_id']) : null;
        }

        // Handle bank_account_id
        if (array_key_exists('bank_account_id', $params)) {
            $data['bank_account_id'] = $params['bank_account_id'] !== null ? intval($params['bank_account_id']) : null;
        }

        // Handle payment_method
        if (array_key_exists('payment_method', $params)) {
            $data['payment_method'] = $params['payment_method'] !== null ? sanitize_text_field($params['payment_method']) : null;
        }

        // Handle saving_account_id
        if (array_key_exists('saving_account_id', $params)) {
            $data['saving_account_id'] = !empty($params['saving_account_id']) ? intval($params['saving_account_id']) : null;
        }

        $type = sanitize_text_field($params['type'] ?? '');
        if ($type === 'installment') {
            $data['total_installments'] = intval($params['total_installments'] ?? 0);
            $data['installment_amount'] = floatval($params['installment_amount'] ?? 0);
        } elseif ($type === 'loan') {
            $data['monthly_return'] = floatval($params['monthly_return'] ?? 0);
            $loan_end = sanitize_text_field($params['loan_end_date'] ?? '');
            if ($loan_end) {
                $data['loan_end_date'] = $loan_end;
                $data['end_date'] = $loan_end;
            }
            if (isset($params['loan_payment_day'])) {
                $data['loan_payment_day'] = intval($params['loan_payment_day']);
            }
        }

        $wpdb->update("{$wpdb->prefix}hbm_expenses", $data, ['id' => $id, 'user_id' => $user_id]);

        $updated = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_expenses WHERE id = %d AND user_id = %d",
            $id, $user_id
        ));

        return rest_ensure_response($updated);
    }

    public static function delete_expense($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        // Check if the expense has an allocation_id and subtract from used_amount
        $expense = $wpdb->get_row($wpdb->prepare(
            "SELECT amount, allocation_id FROM {$wpdb->prefix}hbm_expenses WHERE id = %d AND user_id = %d",
            $id, $user_id
        ));

        if ($expense && !empty($expense->allocation_id)) {
            $wpdb->query($wpdb->prepare(
                "UPDATE {$wpdb->prefix}hbm_budget_allocations SET used_amount = used_amount - %f WHERE id = %d AND user_id = %d",
                floatval($expense->amount), intval($expense->allocation_id), $user_id
            ));
        }

        $wpdb->delete("{$wpdb->prefix}hbm_expenses", ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
    }

    // =========================================================================
    // Budget Allocations
    // =========================================================================

    public static function get_allocations($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT id, label, amount, used_amount, deduction_date, is_active
             FROM {$wpdb->prefix}hbm_budget_allocations
             WHERE user_id = %d
             ORDER BY created_at DESC",
            $user_id
        ));

        return rest_ensure_response($results);
    }

    public static function create_allocation($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $label = sanitize_text_field($params['label'] ?? '');
        $amount = floatval($params['amount'] ?? 0);

        if (empty($label) || $amount <= 0) {
            return new WP_Error('missing_data', 'חסרים נתונים חובה (תווית, סכום)', ['status' => 400]);
        }

        $data = [
            'user_id' => $user_id,
            'label' => $label,
            'amount' => $amount,
            'is_active' => intval($params['is_active'] ?? 1),
        ];

        if (!empty($params['deduction_date'])) {
            $data['deduction_date'] = sanitize_text_field($params['deduction_date']);
        }

        $result = $wpdb->insert("{$wpdb->prefix}hbm_budget_allocations", $data);

        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בשמירת הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $data['id'] = $wpdb->insert_id;
        return rest_ensure_response($data);
    }

    public static function update_allocation($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [];

        if (isset($params['label'])) $data['label'] = sanitize_text_field($params['label']);
        if (isset($params['amount'])) $data['amount'] = floatval($params['amount']);
        if (array_key_exists('deduction_date', $params)) $data['deduction_date'] = $params['deduction_date'] ? sanitize_text_field($params['deduction_date']) : null;
        if (isset($params['is_active'])) $data['is_active'] = intval($params['is_active']);

        if (empty($data)) {
            return new WP_Error('missing_data', 'אין נתונים לעדכון', ['status' => 400]);
        }

        $wpdb->update("{$wpdb->prefix}hbm_budget_allocations", $data, ['id' => $id, 'user_id' => $user_id]);

        $updated = $wpdb->get_row($wpdb->prepare(
            "SELECT id, label, amount, used_amount, deduction_date, is_active
             FROM {$wpdb->prefix}hbm_budget_allocations
             WHERE id = %d AND user_id = %d",
            $id, $user_id
        ));

        return rest_ensure_response($updated);
    }

    public static function delete_allocation($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        // Set allocation_id = NULL on any expenses that referenced this allocation
        $wpdb->query($wpdb->prepare(
            "UPDATE {$wpdb->prefix}hbm_expenses SET allocation_id = NULL WHERE allocation_id = %d AND user_id = %d",
            $id, $user_id
        ));

        $wpdb->delete("{$wpdb->prefix}hbm_budget_allocations", ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
    }

    // =========================================================================
    // Dashboard
    // =========================================================================

    public static function get_dashboard($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $custom_start = sanitize_text_field($request->get_param('start_date') ?? '');
        $custom_end = sanitize_text_field($request->get_param('end_date') ?? '');

        if ($custom_start && $custom_end) {
            $month_start = $custom_start;
            $month_end = $custom_end;
            $month = substr($custom_end, 0, 7);
        } else {
            $month = sanitize_text_field($request->get_param('month') ?? date('Y-m'));
            $month_start = $month . '-01';
            $month_end = date('Y-m-t', strtotime($month_start));
        }

        $income = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_income
             WHERE user_id = %d AND (is_business = 0 OR is_business IS NULL)
             AND start_date <= %s AND (end_date IS NULL OR end_date >= %s)",
            $user_id, $month_end, $month_start
        ));

        $total_income = 0;
        $filtered_income = [];
        foreach ($income as $item) {
            if (!$item->is_recurring) {
                if ($item->start_date < $month_start || $item->start_date > $month_end) {
                    continue;
                }
            }
            $total_income += floatval($item->amount);
            $filtered_income[] = $item;
        }
        $income = $filtered_income;

        $expenses = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_expenses
             WHERE user_id = %d AND (is_business = 0 OR is_business IS NULL)
             AND start_date <= %s AND (end_date IS NULL OR end_date >= %s)",
            $user_id, $month_end, $month_start
        ));

        // Load credit cards map early (needed for one-time CC deduction dates)
        $user_cards = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_credit_cards WHERE user_id = %d AND (is_business = 0 OR is_business IS NULL)",
            $user_id
        ));
        $card_map = [];
        foreach ($user_cards as $c) {
            $card_map[$c->id] = $c;
        }

        $total_expenses = 0;
        $expenses_by_category = [];
        $expenses_by_type = ['fixed' => 0, 'installment' => 0, 'loan' => 0, 'saving' => 0, 'one_time' => 0];

        foreach ($expenses as $expense) {
            $monthly_amount = self::get_monthly_amount($expense, $month_start);
            if ($monthly_amount <= 0) continue;

            if ($expense->type === 'one_time') {
                if (!empty($expense->credit_card_id) && isset($card_map[$expense->credit_card_id])) {
                    $billing_day = intval($card_map[$expense->credit_card_id]->billing_day);
                    $deduction = self::get_one_time_cc_deduction_date($expense->start_date, $billing_day);
                    if ($deduction < $month_start || $deduction > $month_end) continue;
                } else {
                    if ($expense->start_date < $month_start || $expense->start_date > $month_end) continue;
                }
            }

            $total_expenses += $monthly_amount;
            $expenses_by_type[$expense->type] = ($expenses_by_type[$expense->type] ?? 0) + $monthly_amount;

            if (!isset($expenses_by_category[$expense->category])) {
                $expenses_by_category[$expense->category] = 0;
            }
            $expenses_by_category[$expense->category] += $monthly_amount;
        }

        // Standing orders monthly total
        $standing_orders = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_standing_orders
             WHERE user_id = %d AND is_active = 1
             AND start_date <= %s
             AND (end_date IS NULL OR end_date >= %s)",
            $user_id, $month_end, $month_start
        ));

        $standing_orders_total = 0;
        foreach ($standing_orders as $order) {
            $standing_orders_total += floatval($order->amount);
        }
        $total_expenses += $standing_orders_total;

        // Upcoming reserved payments (unpaid)
        $reserved_payments = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_reserved_payments
             WHERE user_id = %d AND is_paid = 0 AND payment_date >= %s
             ORDER BY payment_date ASC",
            $user_id, date('Y-m-d')
        ));

        $allocations = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_budget_allocations WHERE user_id = %d AND is_active = 1",
            $user_id
        ));

        $budget_status = [];
        $total_allocated = 0;
        $total_allocation_remaining = 0;
        foreach ($allocations as $alloc) {
            $alloc_amount = floatval($alloc->amount);
            $used = floatval($wpdb->get_var($wpdb->prepare(
                "SELECT COALESCE(SUM(amount), 0) FROM {$wpdb->prefix}hbm_expenses
                 WHERE user_id = %d AND allocation_id = %d
                 AND start_date >= %s AND start_date <= %s",
                $user_id, $alloc->id, $month_start, $month_end
            )));
            $alloc_remaining = max(0, $alloc_amount - $used);
            $total_allocated += $alloc_amount;
            $total_allocation_remaining += $alloc_remaining;
            $budget_status[] = [
                'label' => $alloc->label ?? $alloc->category ?? '',
                'allocated' => $alloc_amount,
                'spent' => $used,
                'remaining' => $alloc_remaining,
            ];
        }

        $remaining = $total_income - $total_expenses - $total_allocation_remaining;

        // Build expense details: group CC expenses by card, show others individually
        $cc_groups = [];
        $non_cc_details = [];

        foreach ($expenses as $expense) {
            $monthly_amount = self::get_monthly_amount($expense, $month_start);
            if ($monthly_amount <= 0) continue;

            if (!empty($expense->credit_card_id) && isset($card_map[$expense->credit_card_id])) {
                $cid = $expense->credit_card_id;
                $card = $card_map[$cid];
                $billing_day = intval($card->billing_day);

                if ($expense->type === 'one_time') {
                    $deduction_date = self::get_one_time_cc_deduction_date($expense->start_date, $billing_day);
                } else {
                    $deduction_date = $month . '-' . sprintf('%02d', $billing_day);
                }
                if ($deduction_date < $month_start || $deduction_date > $month_end) continue;
                if (!isset($cc_groups[$cid])) {
                    $cc_groups[$cid] = [
                        'type' => 'credit_card',
                        'title' => $card->card_name . ' ***' . $card->last_four,
                        'billing_day' => $billing_day,
                        'deduction_date' => $deduction_date,
                        'amount' => 0,
                    ];
                }
                $cc_groups[$cid]['amount'] += $monthly_amount;
            } else {
                $deduction_date = null;
                if ($expense->type === 'one_time') {
                    $deduction_date = $expense->start_date;
                } elseif ($expense->type === 'loan' && $expense->loan_payment_day) {
                    $deduction_date = $month . '-' . sprintf('%02d', intval($expense->loan_payment_day));
                } elseif ($expense->start_date) {
                    $deduction_date = $month . '-' . sprintf('%02d', intval(date('d', strtotime($expense->start_date))));
                }
                if ($deduction_date === null || $deduction_date < $month_start || $deduction_date > $month_end) continue;
                $non_cc_details[] = [
                    'type' => $expense->type,
                    'title' => $expense->title,
                    'amount' => $monthly_amount,
                    'category' => $expense->category,
                    'deduction_date' => $deduction_date,
                ];
            }
        }

        foreach ($standing_orders as $order) {
            $deduction_date = $month . '-' . sprintf('%02d', intval($order->day_of_month));
            if ($deduction_date < $month_start || $deduction_date > $month_end) continue;
            $non_cc_details[] = [
                'type' => 'standing_order',
                'title' => $order->title,
                'amount' => floatval($order->amount),
                'category' => $order->category ?? '',
                'deduction_date' => $deduction_date,
            ];
        }

        $expense_details = array_merge(array_values($cc_groups), $non_cc_details);

        // Recent 10 credit card transactions (personal)
        $recent_cc = $wpdb->get_results($wpdb->prepare(
            "SELECT e.*, c.card_name, c.last_four, u.display_name as user_name
             FROM {$wpdb->prefix}hbm_expenses e
             LEFT JOIN {$wpdb->prefix}hbm_credit_cards c ON e.credit_card_id = c.id
             LEFT JOIN {$wpdb->prefix}users u ON e.user_id = u.ID
             WHERE e.user_id = %d AND e.credit_card_id IS NOT NULL
             AND (e.is_business = 0 OR e.is_business IS NULL)
             ORDER BY e.created_at DESC LIMIT 10",
            $user_id
        ));

        $recent_cc_items = [];
        foreach ($recent_cc as $r) {
            $recent_cc_items[] = [
                'title' => $r->title,
                'amount' => floatval($r->type === 'installment' && $r->installment_amount ? $r->installment_amount : $r->amount),
                'card_name' => ($r->card_name ? $r->card_name . ' ***' . $r->last_four : ''),
                'category' => $r->category,
                'type' => $r->type,
                'start_date' => $r->start_date,
                'total_installments' => $r->total_installments ? intval($r->total_installments) : null,
                'user_name' => $r->user_name ?? '',
            ];
        }

        $total_savings_cumulative = floatval($wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(amount), 0) FROM {$wpdb->prefix}hbm_expenses
             WHERE user_id = %d AND type = 'saving' AND (is_business = 0 OR is_business IS NULL)
             AND start_date <= %s",
            $user_id, $month_end
        )));

        return rest_ensure_response([
            'month' => $month,
            'start_date' => $month_start,
            'end_date' => $month_end,
            'total_income' => $total_income,
            'total_expenses' => $total_expenses,
            'total_allocated' => $total_allocation_remaining,
            'remaining' => $remaining,
            'total_savings_cumulative' => $total_savings_cumulative,
            'income_items' => $income,
            'expenses_by_category' => $expenses_by_category,
            'expenses_by_type' => $expenses_by_type,
            'budget_status' => $budget_status,
            'standing_orders_total' => $standing_orders_total,
            'reserved_payments' => $reserved_payments,
            'expense_details' => $expense_details,
            'recent_cc_transactions' => $recent_cc_items,
        ]);
    }

    // =========================================================================
    // Categories
    // =========================================================================

    public static function get_categories() {
        return rest_ensure_response(HBM_Categories::get_all());
    }

    public static function add_category($request) {
        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }
        $key = sanitize_key($params['key'] ?? '');
        $label = sanitize_text_field($params['label'] ?? '');

        if (!$key || !$label) {
            return new WP_Error('missing_data', 'חסרים נתונים', ['status' => 400]);
        }

        $categories = HBM_Categories::add($key, $label);
        return rest_ensure_response($categories);
    }

    public static function delete_category($request) {
        $key = sanitize_key($request->get_param('key'));
        $categories = HBM_Categories::remove($key);
        return rest_ensure_response($categories);
    }

    // =========================================================================
    // Credit Cards
    // =========================================================================

    public static function get_credit_cards($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $query = "SELECT * FROM {$wpdb->prefix}hbm_credit_cards WHERE user_id = %d";
        $query_args = [$user_id];

        $is_business = $request->get_param('is_business');
        if ($is_business !== null && $is_business !== '') {
            $query .= " AND is_business = %d";
            $query_args[] = intval($is_business);
        }

        $query .= " ORDER BY created_at DESC";

        $results = $wpdb->get_results($wpdb->prepare($query, $query_args));

        return rest_ensure_response($results);
    }

    public static function create_credit_card($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [
            'user_id' => $user_id,
            'last_four' => sanitize_text_field($params['last_four'] ?? ''),
            'card_name' => sanitize_text_field($params['card_name'] ?? ''),
            'billing_day' => intval($params['billing_day'] ?? 1),
        ];

        $bank_account_id = intval($params['bank_account_id'] ?? 0);
        if ($bank_account_id) {
            $data['bank_account_id'] = $bank_account_id;
        }

        $is_business = intval($params['is_business'] ?? 0);
        if ($is_business) {
            $data['is_business'] = $is_business;
        }

        if (empty($data['last_four']) || empty($data['card_name'])) {
            return new WP_Error('missing_data', 'חסרים נתונים חובה', ['status' => 400]);
        }

        $result = $wpdb->insert("{$wpdb->prefix}hbm_credit_cards", $data);

        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בשמירת הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $data['id'] = $wpdb->insert_id;
        return rest_ensure_response($data);
    }

    public static function update_credit_card($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [];
        if (isset($params['card_name'])) $data['card_name'] = sanitize_text_field($params['card_name']);
        if (isset($params['last_four'])) $data['last_four'] = sanitize_text_field($params['last_four']);
        if (isset($params['billing_day'])) $data['billing_day'] = intval($params['billing_day']);
        if (array_key_exists('bank_account_id', $params)) {
            $data['bank_account_id'] = $params['bank_account_id'] ? intval($params['bank_account_id']) : null;
        }

        if (empty($data)) {
            return new WP_Error('missing_data', 'לא נשלחו נתונים לעדכון', ['status' => 400]);
        }

        $result = $wpdb->update(
            "{$wpdb->prefix}hbm_credit_cards",
            $data,
            ['id' => $id, 'user_id' => $user_id]
        );

        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בעדכון הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $updated = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_credit_cards WHERE id = %d AND user_id = %d",
            $id, $user_id
        ));

        return rest_ensure_response($updated);
    }

    public static function delete_credit_card($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $wpdb->delete("{$wpdb->prefix}hbm_credit_cards", ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
    }

    // =========================================================================
    // Bank Accounts
    // =========================================================================

    public static function get_bank_accounts($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $query = "SELECT * FROM {$wpdb->prefix}hbm_bank_accounts WHERE user_id = %d";
        $query_args = [$user_id];

        $is_business = $request->get_param('is_business');
        if ($is_business !== null && $is_business !== '') {
            $query .= " AND is_business = %d";
            $query_args[] = intval($is_business);
        }

        $query .= " ORDER BY created_at DESC";

        $results = $wpdb->get_results($wpdb->prepare($query, $query_args));

        return rest_ensure_response($results);
    }

    public static function create_bank_account($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [
            'user_id' => $user_id,
            'last_three' => sanitize_text_field($params['last_three'] ?? ''),
            'bank_name' => sanitize_text_field($params['bank_name'] ?? ''),
            'credit_limit' => floatval($params['credit_limit'] ?? 0),
            'initial_balance' => floatval($params['initial_balance'] ?? 0),
            'balance_date' => date('Y-m-d'),
        ];

        $is_business = intval($params['is_business'] ?? 0);
        if ($is_business) {
            $data['is_business'] = $is_business;
        }

        if (empty($data['last_three']) || empty($data['bank_name'])) {
            return new WP_Error('missing_data', 'חסרים נתונים חובה', ['status' => 400]);
        }

        $result = $wpdb->insert("{$wpdb->prefix}hbm_bank_accounts", $data);

        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בשמירת הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $data['id'] = $wpdb->insert_id;
        return rest_ensure_response($data);
    }

    public static function update_bank_account($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [];

        if (isset($params['last_three'])) {
            $data['last_three'] = sanitize_text_field($params['last_three']);
        }
        if (isset($params['bank_name'])) {
            $data['bank_name'] = sanitize_text_field($params['bank_name']);
        }
        if (isset($params['credit_limit'])) {
            $data['credit_limit'] = floatval($params['credit_limit']);
        }
        if (isset($params['initial_balance'])) {
            $data['initial_balance'] = floatval($params['initial_balance']);
            $data['balance_date'] = date('Y-m-d');
        }

        if (empty($data)) {
            return new WP_Error('missing_data', 'אין נתונים לעדכון', ['status' => 400]);
        }

        $wpdb->update("{$wpdb->prefix}hbm_bank_accounts", $data, ['id' => $id, 'user_id' => $user_id]);

        $updated = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_bank_accounts WHERE id = %d AND user_id = %d",
            $id, $user_id
        ));

        return rest_ensure_response($updated);
    }

    public static function delete_bank_account($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $wpdb->delete("{$wpdb->prefix}hbm_bank_accounts", ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
    }

    // =========================================================================
    // Standing Orders
    // =========================================================================

    public static function get_standing_orders($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $month = sanitize_text_field($request->get_param('month') ?? '');

        $query = "SELECT * FROM {$wpdb->prefix}hbm_standing_orders WHERE user_id = %d";
        $query_args = [$user_id];

        if ($month) {
            $month_start = $month . '-01';
            $month_end = date('Y-m-t', strtotime($month_start));
            $query .= " AND start_date <= %s AND (end_date IS NULL OR end_date >= %s)";
            $query_args[] = $month_end;
            $query_args[] = $month_start;
        }

        $query .= " ORDER BY day_of_month ASC";

        $results = $wpdb->get_results($wpdb->prepare($query, $query_args));

        return rest_ensure_response($results);
    }

    public static function create_standing_order($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [
            'user_id' => $user_id,
            'title' => sanitize_text_field($params['title'] ?? ''),
            'payee' => sanitize_text_field($params['payee'] ?? ''),
            'amount' => floatval($params['amount'] ?? 0),
            'category' => sanitize_text_field($params['category'] ?? ''),
            'type' => sanitize_text_field($params['type'] ?? 'bank'),
            'day_of_month' => intval($params['day_of_month'] ?? 1),
            'start_date' => sanitize_text_field($params['start_date'] ?? date('Y-m-d')),
            'is_active' => intval($params['is_active'] ?? 1),
        ];

        if (isset($params['credit_card_id']) && $params['credit_card_id'] !== null) {
            $data['credit_card_id'] = intval($params['credit_card_id']);
        }
        if (isset($params['bank_account_id']) && $params['bank_account_id'] !== null) {
            $data['bank_account_id'] = intval($params['bank_account_id']);
        }
        if (!empty($params['end_date'])) {
            $data['end_date'] = sanitize_text_field($params['end_date']);
        }

        if (empty($data['title']) || $data['amount'] <= 0) {
            return new WP_Error('missing_data', 'חסרים נתונים חובה (שם, סכום)', ['status' => 400]);
        }

        $result = $wpdb->insert("{$wpdb->prefix}hbm_standing_orders", $data);

        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בשמירת הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $data['id'] = $wpdb->insert_id;
        return rest_ensure_response($data);
    }

    public static function update_standing_order($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [];

        if (isset($params['title'])) $data['title'] = sanitize_text_field($params['title']);
        if (isset($params['payee'])) $data['payee'] = sanitize_text_field($params['payee']);
        if (isset($params['amount'])) $data['amount'] = floatval($params['amount']);
        if (isset($params['category'])) $data['category'] = sanitize_text_field($params['category']);
        if (isset($params['type'])) $data['type'] = sanitize_text_field($params['type']);
        if (isset($params['day_of_month'])) $data['day_of_month'] = intval($params['day_of_month']);
        if (isset($params['start_date'])) $data['start_date'] = sanitize_text_field($params['start_date']);
        if (array_key_exists('end_date', $params)) $data['end_date'] = $params['end_date'] ? sanitize_text_field($params['end_date']) : null;
        if (isset($params['is_active'])) $data['is_active'] = intval($params['is_active']);
        if (array_key_exists('credit_card_id', $params)) $data['credit_card_id'] = $params['credit_card_id'] !== null ? intval($params['credit_card_id']) : null;
        if (array_key_exists('bank_account_id', $params)) $data['bank_account_id'] = $params['bank_account_id'] !== null ? intval($params['bank_account_id']) : null;

        if (empty($data)) {
            return new WP_Error('missing_data', 'אין נתונים לעדכון', ['status' => 400]);
        }

        $wpdb->update("{$wpdb->prefix}hbm_standing_orders", $data, ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
    }

    public static function delete_standing_order($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $wpdb->delete("{$wpdb->prefix}hbm_standing_orders", ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
    }

    // =========================================================================
    // Reserved Payments
    // =========================================================================

    public static function get_reserved_payments($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $month = sanitize_text_field($request->get_param('month') ?? '');
        $upcoming = intval($request->get_param('upcoming') ?? 0);

        if ($upcoming) {
            // Get future unpaid reserved payments sorted by date ASC
            $results = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}hbm_reserved_payments
                 WHERE user_id = %d AND is_paid = 0 AND payment_date >= %s
                 ORDER BY payment_date ASC",
                $user_id, date('Y-m-d')
            ));
        } elseif ($month) {
            $month_start = $month . '-01';
            $month_end = date('Y-m-t', strtotime($month_start));
            $results = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}hbm_reserved_payments
                 WHERE user_id = %d AND payment_date >= %s AND payment_date <= %s
                 ORDER BY payment_date ASC",
                $user_id, $month_start, $month_end
            ));
        } else {
            $results = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}hbm_reserved_payments
                 WHERE user_id = %d ORDER BY payment_date DESC",
                $user_id
            ));
        }

        return rest_ensure_response($results);
    }

    public static function create_reserved_payment($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [
            'user_id' => $user_id,
            'title' => sanitize_text_field($params['title'] ?? ''),
            'payee' => sanitize_text_field($params['payee'] ?? ''),
            'amount' => floatval($params['amount'] ?? 0),
            'payment_date' => sanitize_text_field($params['payment_date'] ?? date('Y-m-d')),
            'details' => sanitize_textarea_field($params['details'] ?? ''),
            'is_paid' => intval($params['is_paid'] ?? 0),
        ];

        if (isset($params['bank_account_id']) && $params['bank_account_id'] !== null) {
            $data['bank_account_id'] = intval($params['bank_account_id']);
        }

        if (empty($data['title']) || $data['amount'] <= 0) {
            return new WP_Error('missing_data', 'חסרים נתונים חובה (שם, סכום)', ['status' => 400]);
        }

        $result = $wpdb->insert("{$wpdb->prefix}hbm_reserved_payments", $data);

        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בשמירת הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $data['id'] = $wpdb->insert_id;
        return rest_ensure_response($data);
    }

    public static function update_reserved_payment($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [];

        if (isset($params['title'])) $data['title'] = sanitize_text_field($params['title']);
        if (isset($params['payee'])) $data['payee'] = sanitize_text_field($params['payee']);
        if (isset($params['amount'])) $data['amount'] = floatval($params['amount']);
        if (isset($params['payment_date'])) $data['payment_date'] = sanitize_text_field($params['payment_date']);
        if (isset($params['details'])) $data['details'] = sanitize_textarea_field($params['details']);
        if (array_key_exists('bank_account_id', $params)) $data['bank_account_id'] = $params['bank_account_id'] !== null ? intval($params['bank_account_id']) : null;
        if (isset($params['is_paid'])) $data['is_paid'] = intval($params['is_paid']);

        if (empty($data)) {
            return new WP_Error('missing_data', 'אין נתונים לעדכון', ['status' => 400]);
        }

        $wpdb->update("{$wpdb->prefix}hbm_reserved_payments", $data, ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
    }

    public static function delete_reserved_payment($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $wpdb->delete("{$wpdb->prefix}hbm_reserved_payments", ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
    }

    // =========================================================================
    // Collections
    // =========================================================================

    public static function get_collections($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $status = sanitize_text_field($request->get_param('status') ?? '');

        $query = "SELECT * FROM {$wpdb->prefix}hbm_collections WHERE user_id = %d";
        $query_args = [$user_id];

        if ($status) {
            $query .= " AND status = %s";
            $query_args[] = $status;
        }

        $query .= " ORDER BY payment_date DESC";

        $results = $wpdb->get_results($wpdb->prepare($query, $query_args));

        return rest_ensure_response($results);
    }

    public static function create_collection($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [
            'user_id' => $user_id,
            'client_name' => sanitize_text_field($params['client_name'] ?? ''),
            'amount' => floatval($params['amount'] ?? 0),
            'payment_date' => sanitize_text_field($params['payment_date'] ?? date('Y-m-d')),
            'status' => sanitize_text_field($params['status'] ?? 'pending'),
            'notes' => sanitize_textarea_field($params['notes'] ?? ''),
        ];

        if (empty($data['client_name']) || $data['amount'] <= 0) {
            return new WP_Error('missing_data', 'חסרים נתונים חובה (שם לקוח, סכום)', ['status' => 400]);
        }

        $result = $wpdb->insert("{$wpdb->prefix}hbm_collections", $data);

        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בשמירת הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $data['id'] = $wpdb->insert_id;
        return rest_ensure_response($data);
    }

    public static function update_collection($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [];

        if (isset($params['client_name'])) $data['client_name'] = sanitize_text_field($params['client_name']);
        if (isset($params['amount'])) $data['amount'] = floatval($params['amount']);
        if (isset($params['payment_date'])) $data['payment_date'] = sanitize_text_field($params['payment_date']);
        if (isset($params['status'])) $data['status'] = sanitize_text_field($params['status']);
        if (isset($params['notes'])) $data['notes'] = sanitize_textarea_field($params['notes']);

        if (empty($data)) {
            return new WP_Error('missing_data', 'אין נתונים לעדכון', ['status' => 400]);
        }

        $wpdb->update("{$wpdb->prefix}hbm_collections", $data, ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
    }

    public static function delete_collection($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $wpdb->delete("{$wpdb->prefix}hbm_collections", ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
    }

    // =========================================================================
    // Savings Log
    // =========================================================================

    public static function get_savings_log($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT sl.*, e.title as expense_title
             FROM {$wpdb->prefix}hbm_savings_log sl
             LEFT JOIN {$wpdb->prefix}hbm_expenses e ON sl.expense_id = e.id
             WHERE sl.user_id = %d
             ORDER BY sl.deposit_date DESC",
            $user_id
        ));

        return rest_ensure_response($results);
    }

    public static function create_savings_log($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [
            'user_id' => $user_id,
            'expense_id' => intval($params['expense_id'] ?? 0),
            'amount' => floatval($params['amount'] ?? 0),
            'deposit_date' => sanitize_text_field($params['deposit_date'] ?? date('Y-m-d')),
            'notes' => sanitize_text_field($params['notes'] ?? ''),
        ];

        if ($data['expense_id'] <= 0 || $data['amount'] <= 0) {
            return new WP_Error('missing_data', 'חסרים נתונים חובה (חיסכון, סכום)', ['status' => 400]);
        }

        $result = $wpdb->insert("{$wpdb->prefix}hbm_savings_log", $data);

        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בשמירת הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $data['id'] = $wpdb->insert_id;
        return rest_ensure_response($data);
    }

    // =========================================================================
    // Savings Accounts
    // =========================================================================

    public static function get_savings_accounts($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        return rest_ensure_response($wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_savings_accounts WHERE user_id = %d ORDER BY name ASC",
            $user_id
        )));
    }

    public static function create_savings_account($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $params = $request->get_json_params();
        if (empty($params)) $params = $request->get_params();

        $name = sanitize_text_field($params['name'] ?? '');
        if (empty($name)) {
            return new WP_Error('missing_data', 'שם החיסכון חובה', ['status' => 400]);
        }

        $data = [
            'user_id' => $user_id,
            'name' => $name,
            'target_amount' => isset($params['target_amount']) && $params['target_amount'] !== '' ? floatval($params['target_amount']) : null,
            'notes' => sanitize_text_field($params['notes'] ?? ''),
        ];

        $result = $wpdb->insert("{$wpdb->prefix}hbm_savings_accounts", $data);
        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בשמירת הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $data['id'] = $wpdb->insert_id;
        return rest_ensure_response($data);
    }

    public static function update_savings_account($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));
        $params = $request->get_json_params();
        if (empty($params)) $params = $request->get_params();

        $data = [];
        if (isset($params['name'])) $data['name'] = sanitize_text_field($params['name']);
        if (array_key_exists('target_amount', $params)) {
            $data['target_amount'] = $params['target_amount'] !== null && $params['target_amount'] !== '' ? floatval($params['target_amount']) : null;
        }
        if (isset($params['notes'])) $data['notes'] = sanitize_text_field($params['notes']);

        if (empty($data)) {
            return new WP_Error('missing_data', 'לא נשלחו נתונים לעדכון', ['status' => 400]);
        }

        $result = $wpdb->update("{$wpdb->prefix}hbm_savings_accounts", $data, ['id' => $id, 'user_id' => $user_id]);
        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בעדכון הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $updated = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_savings_accounts WHERE id = %d AND user_id = %d",
            $id, $user_id
        ));
        return rest_ensure_response($updated);
    }

    public static function delete_savings_account($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

        $wpdb->delete("{$wpdb->prefix}hbm_savings_accounts", ['id' => $id, 'user_id' => $user_id]);
        return rest_ensure_response(['success' => true]);
    }

    public static function get_savings_summary($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $accounts = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_savings_accounts WHERE user_id = %d ORDER BY name ASC",
            $user_id
        ));

        $expenses = $wpdb->get_results($wpdb->prepare(
            "SELECT e.*, sa.name as saving_account_name
             FROM {$wpdb->prefix}hbm_expenses e
             LEFT JOIN {$wpdb->prefix}hbm_savings_accounts sa ON e.saving_account_id = sa.id
             WHERE e.user_id = %d AND e.type = 'saving' AND (e.is_business = 0 OR e.is_business IS NULL)
             ORDER BY e.start_date DESC",
            $user_id
        ));

        $account_totals = [];
        $unassigned_total = 0;
        $unassigned_items = [];

        foreach ($expenses as $exp) {
            $monthly = floatval($exp->amount);
            if (!empty($exp->saving_account_id)) {
                $aid = $exp->saving_account_id;
                if (!isset($account_totals[$aid])) {
                    $account_totals[$aid] = ['total' => 0, 'items' => []];
                }
                $account_totals[$aid]['total'] += $monthly;
                $account_totals[$aid]['items'][] = [
                    'id' => $exp->id,
                    'title' => $exp->title,
                    'amount' => $monthly,
                    'start_date' => $exp->start_date,
                    'end_date' => $exp->end_date,
                ];
            } else {
                $unassigned_total += $monthly;
                $unassigned_items[] = [
                    'id' => $exp->id,
                    'title' => $exp->title,
                    'amount' => $monthly,
                    'start_date' => $exp->start_date,
                    'end_date' => $exp->end_date,
                ];
            }
        }

        $result = [];
        foreach ($accounts as $acct) {
            $data = $account_totals[$acct->id] ?? ['total' => 0, 'items' => []];
            $result[] = [
                'id' => $acct->id,
                'name' => $acct->name,
                'target_amount' => $acct->target_amount ? floatval($acct->target_amount) : null,
                'total_saved' => $data['total'],
                'items' => $data['items'],
            ];
        }

        if ($unassigned_total > 0 || count($unassigned_items) > 0) {
            $result[] = [
                'id' => null,
                'name' => 'ללא חשבון',
                'target_amount' => null,
                'total_saved' => $unassigned_total,
                'items' => $unassigned_items,
            ];
        }

        return rest_ensure_response($result);
    }

    // =========================================================================
    // User Settings
    // =========================================================================

    public static function get_user_settings($request) {
        $user_id = get_current_user_id();
        $user_type = get_user_meta($user_id, 'hbm_user_type', true);

        return rest_ensure_response([
            'user_type' => $user_type ?: 'salaried',
        ]);
    }

    public static function save_user_settings($request) {
        $user_id = get_current_user_id();

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        if (isset($params['user_type'])) {
            $user_type = sanitize_text_field($params['user_type']);
            if (!in_array($user_type, ['salaried', 'self_employed'], true)) {
                return new WP_Error('invalid_data', 'סוג משתמש לא תקין', ['status' => 400]);
            }
            update_user_meta($user_id, 'hbm_user_type', $user_type);
        }

        return rest_ensure_response(['success' => true]);
    }

    // =========================================================================
    // Cash Flow
    // =========================================================================

    public static function get_cash_flow($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $bank_account_id = intval($request->get_param('bank_account_id') ?? 0);
        $months_ahead = intval($request->get_param('months_ahead') ?? 3);
        $is_business_param = $request->get_param('is_business');
        $filter_business = ($is_business_param !== null && $is_business_param !== '');
        $is_business_val = $filter_business ? intval($is_business_param) : null;

        if ($bank_account_id <= 0) {
            return new WP_Error('missing_data', 'חסר מזהה חשבון בנק', ['status' => 400]);
        }

        // Get the bank account
        $bank_account = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_bank_accounts WHERE id = %d AND user_id = %d",
            $bank_account_id, $user_id
        ));

        if (!$bank_account) {
            return new WP_Error('not_found', 'חשבון בנק לא נמצא', ['status' => 404]);
        }

        $initial_balance = floatval($bank_account->initial_balance);
        $balance_date = $bank_account->balance_date ?: date('Y-m-d');
        $custom_start = sanitize_text_field($request->get_param('start_date') ?? '');
        $custom_end = sanitize_text_field($request->get_param('end_date') ?? '');
        $today = $custom_start ?: date('Y-m-d');
        $end_date = $custom_end ?: date('Y-m-d', strtotime("+{$months_ahead} months"));

        $entries = [];

        // 0. Income linked to this bank account
        $income_query = "SELECT * FROM {$wpdb->prefix}hbm_income
             WHERE user_id = %d AND bank_account_id = %d";
        $income_args = [$user_id, $bank_account_id];
        $income_items = $wpdb->get_results($wpdb->prepare($income_query, $income_args));

        foreach ($income_items as $inc) {
            if ($inc->is_recurring) {
                $start = new DateTime($inc->start_date);
                $end_dt = $inc->end_date ? new DateTime(min($inc->end_date, $end_date)) : new DateTime($end_date);
                $current = clone $start;
                while ($current <= $end_dt) {
                    $entry_date = $current->format('Y-m-d');
                    if ($entry_date >= $balance_date && $entry_date <= $end_date) {
                        $entries[] = [
                            'date' => $entry_date,
                            'description' => $inc->title,
                            'type' => 'income',
                            'type_label' => 'הכנסה',
                            'amount' => floatval($inc->amount),
                            'is_charge' => false,
                        ];
                    }
                    $current->modify('+1 month');
                }
            } else {
                if ($inc->start_date >= $balance_date && $inc->start_date <= $end_date) {
                    $entries[] = [
                        'date' => $inc->start_date,
                        'description' => $inc->title,
                        'type' => 'income',
                        'type_label' => 'הכנסה',
                        'amount' => floatval($inc->amount),
                        'is_charge' => false,
                    ];
                }
            }
        }

        // 1. Past transactions affecting this bank account
        $past_exp_query = "SELECT * FROM {$wpdb->prefix}hbm_expenses
             WHERE user_id = %d AND bank_account_id = %d AND start_date <= %s";
        $past_exp_args = [$user_id, $bank_account_id, $today];
        if ($filter_business) {
            $past_exp_query .= " AND is_business = %d";
            $past_exp_args[] = $is_business_val;
        }
        $past_expenses = $wpdb->get_results($wpdb->prepare($past_exp_query, $past_exp_args));

        foreach ($past_expenses as $exp) {
            if ($exp->type === 'one_time') {
                if ($exp->start_date >= $balance_date) {
                    $entries[] = [
                        'date' => $exp->start_date,
                        'description' => $exp->title,
                        'type' => 'expense_' . $exp->type,
                        'amount' => -floatval($exp->amount),
                        'is_charge' => true,
                    ];
                }
            } elseif ($exp->type === 'fixed' || $exp->type === 'saving') {
                $start = new DateTime($exp->start_date);
                $end_dt = $exp->end_date ? new DateTime(min($exp->end_date, $today)) : new DateTime($today);
                $current = clone $start;
                while ($current <= $end_dt) {
                    $entry_date = $current->format('Y-m-d');
                    if ($entry_date >= $balance_date) {
                        $entries[] = [
                            'date' => $entry_date,
                            'description' => $exp->title,
                            'type' => 'expense_' . $exp->type,
                            'amount' => -floatval($exp->amount),
                            'is_charge' => true,
                        ];
                    }
                    $current->modify('+1 month');
                }
            } elseif ($exp->type === 'loan') {
                $start = new DateTime($exp->start_date);
                $end_dt = $exp->loan_end_date ? new DateTime(min($exp->loan_end_date, $today)) : new DateTime($today);
                $current = clone $start;
                $monthly = floatval($exp->monthly_return);
                while ($current <= $end_dt && $monthly > 0) {
                    $pay_day = $exp->loan_payment_day ? intval($exp->loan_payment_day) : intval($current->format('d'));
                    $payment_date = $current->format('Y-m') . '-' . sprintf('%02d', min($pay_day, intval(date('t', strtotime($current->format('Y-m-01'))))));
                    if ($payment_date >= $balance_date) {
                        $entries[] = [
                            'date' => $payment_date,
                            'description' => $exp->title,
                            'type' => 'loan_payment',
                            'amount' => -$monthly,
                            'is_charge' => true,
                        ];
                    }
                    $current->modify('+1 month');
                }
            } elseif ($exp->type === 'installment') {
                $start = new DateTime($exp->start_date);
                $inst_amount = floatval($exp->installment_amount ?: ($exp->amount / $exp->total_installments));
                for ($i = 0; $i < $exp->total_installments; $i++) {
                    $pay_dt = clone $start;
                    $pay_dt->modify("+{$i} months");
                    $pdate = $pay_dt->format('Y-m-d');
                    if ($pdate > $today) break;
                    if ($pdate >= $balance_date) {
                        $entries[] = [
                            'date' => $pdate,
                            'description' => $exp->title . " (תשלום " . ($i + 1) . "/" . $exp->total_installments . ")",
                            'type' => 'installment_payment',
                            'amount' => -$inst_amount,
                            'is_charge' => true,
                        ];
                    }
                }
            }
        }

        // Past standing orders affecting this bank account
        $past_standing = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_standing_orders
             WHERE user_id = %d AND bank_account_id = %d AND is_active = 1 AND start_date <= %s",
            $user_id, $bank_account_id, $today
        ));

        foreach ($past_standing as $order) {
            $start = new DateTime($order->start_date);
            $end_dt = $order->end_date ? new DateTime(min($order->end_date, $today)) : new DateTime($today);
            $current = clone $start;
            while ($current <= $end_dt) {
                $dom = intval($order->day_of_month);
                $days_in = intval(date('t', strtotime($current->format('Y-m-01'))));
                $actual_day = min($dom, $days_in);
                $order_date = $current->format('Y-m') . '-' . sprintf('%02d', $actual_day);
                if ($order_date <= $today && $order_date >= $balance_date) {
                    $entries[] = [
                        'date' => $order_date,
                        'description' => $order->title,
                        'type' => 'standing_order',
                        'amount' => -floatval($order->amount),
                        'is_charge' => true,
                    ];
                }
                $current->modify('+1 month');
            }
        }

        // Past reserved payments for this bank account (only after balance_date)
        $past_reserved = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_reserved_payments
             WHERE user_id = %d AND bank_account_id = %d AND is_paid = 1 AND payment_date <= %s AND payment_date >= %s",
            $user_id, $bank_account_id, $today, $balance_date
        ));

        foreach ($past_reserved as $rp) {
            $entries[] = [
                'date' => $rp->payment_date,
                'description' => $rp->title,
                'type' => 'reserved_payment',
                'amount' => -floatval($rp->amount),
                'is_charge' => true,
            ];
        }

        // 2. Future projections
        $tomorrow = date('Y-m-d', strtotime('+1 day'));

        // Future standing orders
        $future_standing = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_standing_orders
             WHERE user_id = %d AND bank_account_id = %d AND is_active = 1
             AND (end_date IS NULL OR end_date >= %s)",
            $user_id, $bank_account_id, $tomorrow
        ));

        foreach ($future_standing as $order) {
            $start = new DateTime(max($order->start_date, $tomorrow));
            // Start from the first of the month of our start
            $current = new DateTime($start->format('Y-m-01'));
            $end_dt = $order->end_date ? new DateTime(min($order->end_date, $end_date)) : new DateTime($end_date);
            while ($current <= $end_dt) {
                $dom = intval($order->day_of_month);
                $days_in = intval(date('t', strtotime($current->format('Y-m-01'))));
                $actual_day = min($dom, $days_in);
                $order_date = $current->format('Y-m') . '-' . sprintf('%02d', $actual_day);
                if ($order_date > $today && $order_date <= $end_date) {
                    $entries[] = [
                        'date' => $order_date,
                        'description' => $order->title . ' (הו"ק)',
                        'type' => 'standing_order',
                        'amount' => -floatval($order->amount),
                        'is_charge' => true,
                    ];
                }
                $current->modify('+1 month');
            }
        }

        // Future loan payments
        $future_loans_query = "SELECT * FROM {$wpdb->prefix}hbm_expenses
             WHERE user_id = %d AND bank_account_id = %d AND type = 'loan'
             AND (loan_end_date IS NULL OR loan_end_date >= %s)";
        $future_loans_args = [$user_id, $bank_account_id, $tomorrow];
        if ($filter_business) {
            $future_loans_query .= " AND is_business = %d";
            $future_loans_args[] = $is_business_val;
        }
        $future_loans = $wpdb->get_results($wpdb->prepare($future_loans_query, $future_loans_args));

        foreach ($future_loans as $loan) {
            $monthly = floatval($loan->monthly_return);
            if ($monthly <= 0) continue;
            $current = new DateTime(max($loan->start_date, $tomorrow));
            $current = new DateTime($current->format('Y-m-01'));
            $loan_end = $loan->loan_end_date ? new DateTime(min($loan->loan_end_date, $end_date)) : new DateTime($end_date);
            while ($current <= $loan_end) {
                $pay_day = $loan->loan_payment_day ? intval($loan->loan_payment_day) : intval((new DateTime($loan->start_date))->format('d'));
                $days_in = intval(date('t', strtotime($current->format('Y-m-01'))));
                $actual_day = min($pay_day, $days_in);
                $payment_date = $current->format('Y-m') . '-' . sprintf('%02d', $actual_day);
                if ($payment_date > $today && $payment_date <= $end_date) {
                    $entries[] = [
                        'date' => $payment_date,
                        'description' => $loan->title . ' (הלוואה)',
                        'type' => 'loan_payment',
                        'amount' => -$monthly,
                        'is_charge' => true,
                    ];
                }
                $current->modify('+1 month');
            }
        }

        // Future installment payments (via credit card billing dates)
        $future_inst_query = "SELECT e.*, cc.billing_day FROM {$wpdb->prefix}hbm_expenses e
             LEFT JOIN {$wpdb->prefix}hbm_credit_cards cc ON e.credit_card_id = cc.id
             WHERE e.user_id = %d AND e.bank_account_id = %d AND e.type = 'installment'
             AND (e.end_date IS NULL OR e.end_date >= %s)";
        $future_inst_args = [$user_id, $bank_account_id, $tomorrow];
        if ($filter_business) {
            $future_inst_query .= " AND e.is_business = %d";
            $future_inst_args[] = $is_business_val;
        }
        $future_installments = $wpdb->get_results($wpdb->prepare($future_inst_query, $future_inst_args));

        foreach ($future_installments as $inst) {
            $inst_amount = floatval($inst->installment_amount ?: ($inst->amount / $inst->total_installments));
            $start = new DateTime($inst->start_date);
            for ($i = 0; $i < $inst->total_installments; $i++) {
                $pay_dt = clone $start;
                $pay_dt->modify("+{$i} months");
                $pdate = $pay_dt->format('Y-m-d');
                if ($pdate > $today && $pdate <= $end_date) {
                    $entries[] = [
                        'date' => $pdate,
                        'description' => $inst->title . " (תשלום " . ($i + 1) . "/" . $inst->total_installments . ")",
                        'type' => 'installment_payment',
                        'amount' => -$inst_amount,
                        'is_charge' => true,
                    ];
                }
            }
        }

        // Future reserved payments (unpaid)
        $future_reserved = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_reserved_payments
             WHERE user_id = %d AND bank_account_id = %d AND is_paid = 0 AND payment_date > %s AND payment_date <= %s",
            $user_id, $bank_account_id, $today, $end_date
        ));

        foreach ($future_reserved as $rp) {
            $entries[] = [
                'date' => $rp->payment_date,
                'description' => $rp->title . ' (תשלום עתידי)',
                'type' => 'reserved_payment',
                'amount' => -floatval($rp->amount),
                'is_charge' => true,
            ];
        }

        // Future savings
        $future_sav_query = "SELECT * FROM {$wpdb->prefix}hbm_expenses
             WHERE user_id = %d AND bank_account_id = %d AND type = 'saving'
             AND (end_date IS NULL OR end_date >= %s)";
        $future_sav_args = [$user_id, $bank_account_id, $tomorrow];
        if ($filter_business) {
            $future_sav_query .= " AND is_business = %d";
            $future_sav_args[] = $is_business_val;
        }
        $future_savings = $wpdb->get_results($wpdb->prepare($future_sav_query, $future_sav_args));

        foreach ($future_savings as $saving) {
            $current = new DateTime(max($saving->start_date, $tomorrow));
            $current = new DateTime($current->format('Y-m-01'));
            $sav_end = $saving->end_date ? new DateTime(min($saving->end_date, $end_date)) : new DateTime($end_date);
            while ($current <= $sav_end) {
                $sav_date = $current->format('Y-m') . '-' . (new DateTime($saving->start_date))->format('d');
                if ($sav_date > $today && $sav_date <= $end_date) {
                    $entries[] = [
                        'date' => $sav_date,
                        'description' => $saving->title . ' (חיסכון)',
                        'type' => 'saving',
                        'amount' => -floatval($saving->amount),
                        'is_charge' => true,
                    ];
                }
                $current->modify('+1 month');
            }
        }

        // Sort all entries by date
        usort($entries, function ($a, $b) {
            return strcmp($a['date'], $b['date']);
        });

        // Calculate running balance
        $running_balance = $initial_balance;
        foreach ($entries as &$entry) {
            $running_balance += $entry['amount'];
            $entry['running_balance'] = round($running_balance, 2);
        }

        return rest_ensure_response([
            'bank_account_id' => $bank_account_id,
            'bank_name' => $bank_account->bank_name,
            'initial_balance' => $initial_balance,
            'current_balance' => $running_balance,
            'entries' => $entries,
        ]);
    }

    // =========================================================================
    // Business Dashboard
    // =========================================================================

    public static function get_business_dashboard($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $month = sanitize_text_field($request->get_param('month') ?? date('Y-m'));
        $month_start = $month . '-01';
        $month_end = date('Y-m-t', strtotime($month_start));

        // Business income from collections (paid/receipt_sent)
        $collections = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_collections
             WHERE user_id = %d AND status IN ('paid','receipt_sent')
             AND payment_date >= %s AND payment_date <= %s",
            $user_id, $month_start, $month_end
        ));

        $total_income = 0;
        $collection_items = [];
        foreach ($collections as $item) {
            $total_income += floatval($item->amount);
            $collection_items[] = [
                'client_name' => $item->client_name,
                'amount' => floatval($item->amount),
                'payment_date' => $item->payment_date,
                'status' => $item->status,
            ];
        }

        // Total business expenses for this month
        $expenses = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_expenses
             WHERE user_id = %d AND is_business = 1
             AND start_date <= %s AND (end_date IS NULL OR end_date >= %s)",
            $user_id, $month_end, $month_start
        ));

        $total_expenses = 0;
        $biz_cc_groups = [];
        $biz_non_cc_details = [];

        $biz_cards = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_credit_cards WHERE user_id = %d AND is_business = 1",
            $user_id
        ));
        $biz_card_map = [];
        foreach ($biz_cards as $c) {
            $biz_card_map[$c->id] = $c;
        }

        foreach ($expenses as $expense) {
            $monthly_amount = self::get_monthly_amount($expense, $month_start);
            if ($monthly_amount <= 0) continue;

            if ($expense->type === 'one_time') {
                if (!empty($expense->credit_card_id) && isset($biz_card_map[$expense->credit_card_id])) {
                    $billing_day = intval($biz_card_map[$expense->credit_card_id]->billing_day);
                    $deduction = self::get_one_time_cc_deduction_date($expense->start_date, $billing_day);
                    if ($deduction < $month_start || $deduction > $month_end) continue;
                } else {
                    if ($expense->start_date < $month_start || $expense->start_date > $month_end) continue;
                }
            }

            $total_expenses += $monthly_amount;

            if (!empty($expense->credit_card_id) && isset($biz_card_map[$expense->credit_card_id])) {
                $cid = $expense->credit_card_id;
                $card = $biz_card_map[$cid];
                $billing_day = intval($card->billing_day);

                if ($expense->type === 'one_time') {
                    $deduction_date = self::get_one_time_cc_deduction_date($expense->start_date, $billing_day);
                } else {
                    $deduction_date = $month . '-' . sprintf('%02d', $billing_day);
                }
                if ($deduction_date < $month_start || $deduction_date > $month_end) continue;
                if (!isset($biz_cc_groups[$cid])) {
                    $biz_cc_groups[$cid] = [
                        'type' => 'credit_card',
                        'title' => $card->card_name . ' ***' . $card->last_four,
                        'billing_day' => $billing_day,
                        'deduction_date' => $deduction_date,
                        'amount' => 0,
                    ];
                }
                $biz_cc_groups[$cid]['amount'] += $monthly_amount;
            } else {
                $deduction_date = null;
                if ($expense->type === 'one_time') {
                    $deduction_date = $expense->start_date;
                } elseif ($expense->type === 'loan' && $expense->loan_payment_day) {
                    $deduction_date = $month . '-' . sprintf('%02d', intval($expense->loan_payment_day));
                } elseif ($expense->start_date) {
                    $deduction_date = $month . '-' . sprintf('%02d', intval(date('d', strtotime($expense->start_date))));
                }
                if ($deduction_date === null || $deduction_date < $month_start || $deduction_date > $month_end) continue;
                $biz_non_cc_details[] = [
                    'type' => $expense->type,
                    'title' => $expense->title,
                    'amount' => $monthly_amount,
                    'category' => $expense->category,
                    'deduction_date' => $deduction_date,
                ];
            }
        }

        $biz_expense_details = array_merge(array_values($biz_cc_groups), $biz_non_cc_details);

        $biz_recent_cc = $wpdb->get_results($wpdb->prepare(
            "SELECT e.*, c.card_name, c.last_four, u.display_name as user_name
             FROM {$wpdb->prefix}hbm_expenses e
             LEFT JOIN {$wpdb->prefix}hbm_credit_cards c ON e.credit_card_id = c.id
             LEFT JOIN {$wpdb->prefix}users u ON e.user_id = u.ID
             WHERE e.user_id = %d AND e.credit_card_id IS NOT NULL AND e.is_business = 1
             ORDER BY e.created_at DESC LIMIT 10",
            $user_id
        ));

        $biz_recent_cc_items = [];
        foreach ($biz_recent_cc as $r) {
            $biz_recent_cc_items[] = [
                'title' => $r->title,
                'amount' => floatval($r->type === 'installment' && $r->installment_amount ? $r->installment_amount : $r->amount),
                'card_name' => ($r->card_name ? $r->card_name . ' ***' . $r->last_four : ''),
                'category' => $r->category,
                'type' => $r->type,
                'start_date' => $r->start_date,
                'total_installments' => $r->total_installments ? intval($r->total_installments) : null,
                'user_name' => $r->user_name ?? '',
            ];
        }

        $available_salary = $total_income - $total_expenses;

        return rest_ensure_response([
            'total_income' => $total_income,
            'total_expenses' => $total_expenses,
            'available_salary' => $available_salary,
            'month' => $month,
            'collection_items' => $collection_items,
            'expense_details' => $biz_expense_details,
            'recent_cc_transactions' => $biz_recent_cc_items,
        ]);
    }

    // =========================================================================
    // Credit Card Charges
    // =========================================================================
    public static function get_credit_card_charges($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $credit_card_id = intval($request->get_param('credit_card_id'));
        $month = sanitize_text_field($request->get_param('month') ?? date('Y-m'));

        if (!$credit_card_id) {
            return new WP_Error('missing_data', 'חסר מזהה כרטיס אשראי', ['status' => 400]);
        }

        $card = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_credit_cards WHERE id = %d AND user_id = %d",
            $credit_card_id, $user_id
        ));

        if (!$card) {
            return new WP_Error('not_found', 'כרטיס אשראי לא נמצא', ['status' => 404]);
        }

        $billing_day = intval($card->billing_day);
        $month_start = $month . '-01';
        $month_end = date('Y-m-t', strtotime($month_start));

        $query = $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_expenses
             WHERE user_id = %d AND credit_card_id = %d
             AND start_date <= %s AND (end_date IS NULL OR end_date >= %s)
             ORDER BY start_date ASC",
            $user_id, $credit_card_id, $month_end, $month_start
        );

        $expenses = $wpdb->get_results($query);

        $charges = [];
        foreach ($expenses as $exp) {
            if ($exp->type === 'one_time') {
                $deduction = self::get_one_time_cc_deduction_date($exp->start_date, $billing_day);
                $deduction_month = substr($deduction, 0, 7);
                if ($deduction_month !== $month) continue;
            }

            if ($exp->type === 'installment') {
                $months_passed = self::months_between($exp->start_date, $month_start);
                $current_installment = $months_passed + 1;
                if ($current_installment < 1 || $current_installment > intval($exp->total_installments)) continue;
                $inst_amount = floatval($exp->installment_amount ?: ($exp->amount / $exp->total_installments));
                $charges[] = [
                    'id' => intval($exp->id),
                    'title' => $exp->title,
                    'type' => $exp->type,
                    'amount' => $inst_amount,
                    'total_amount' => floatval($exp->amount),
                    'current_installment' => $current_installment,
                    'total_installments' => intval($exp->total_installments),
                    'start_date' => $exp->start_date,
                    'category' => $exp->category,
                ];
            } else {
                $charges[] = [
                    'id' => intval($exp->id),
                    'title' => $exp->title,
                    'type' => $exp->type,
                    'amount' => floatval($exp->amount),
                    'total_amount' => floatval($exp->amount),
                    'current_installment' => null,
                    'total_installments' => null,
                    'start_date' => $exp->start_date,
                    'category' => $exp->category,
                ];
            }
        }

        $total = 0;
        foreach ($charges as $c) { $total += $c['amount']; }

        return rest_ensure_response([
            'card' => [
                'id' => intval($card->id),
                'card_name' => $card->card_name,
                'last_four' => $card->last_four,
                'billing_day' => intval($card->billing_day),
                'is_business' => intval($card->is_business ?? 0),
            ],
            'month' => $month,
            'total' => $total,
            'charges' => $charges,
        ]);
    }

    // =========================================================================
    // Overdraft Check
    // =========================================================================

    public static function check_overdraft($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        // Get all bank accounts for the user
        $bank_accounts = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_bank_accounts WHERE user_id = %d",
            $user_id
        ));

        $warnings = [];

        $thirty_days_ahead = date('Y-m-d', strtotime('+30 days'));

        foreach ($bank_accounts as $account) {
            $cf_request = new WP_REST_Request('GET');
            $cf_request->set_param('bank_account_id', $account->id);
            $cf_request->set_param('end_date', $thirty_days_ahead);

            $cf_response = self::get_cash_flow($cf_request);
            $cf_data = $cf_response->get_data();

            if (is_wp_error($cf_data) || empty($cf_data['entries'])) {
                continue;
            }

            $credit_limit = floatval($account->credit_limit);

            foreach ($cf_data['entries'] as $entry) {
                if ($entry['date'] > $thirty_days_ahead) {
                    break;
                }
                $running_balance = floatval($entry['running_balance']);
                if ($running_balance < -$credit_limit) {
                    $warnings[] = [
                        'bank_account_id' => intval($account->id),
                        'bank_name' => $account->bank_name,
                        'last_three' => $account->last_three,
                        'is_business' => intval($account->is_business ?? 0),
                        'overdraft_date' => $entry['date'],
                        'projected_balance' => $running_balance,
                        'credit_limit' => $credit_limit,
                    ];
                    break;
                }
            }
        }

        return rest_ensure_response($warnings);
    }

    // =========================================================================
    // Email Notifications for Reserved Payments
    // =========================================================================

    public static function check_reserved_payments_email() {
        global $wpdb;
        $today = date('Y-m-d');

        $payments = $wpdb->get_results($wpdb->prepare(
            "SELECT rp.*, ba.bank_name
             FROM {$wpdb->prefix}hbm_reserved_payments rp
             LEFT JOIN {$wpdb->prefix}hbm_bank_accounts ba ON rp.bank_account_id = ba.id
             WHERE rp.payment_date = %s AND rp.is_paid = 0",
            $today
        ));

        if (empty($payments)) {
            return;
        }

        // Get all users who have reserved payments today
        $user_ids = array_unique(wp_list_pluck($payments, 'user_id'));

        foreach ($user_ids as $uid) {
            $user = get_user_by('id', $uid);
            if (!$user || empty($user->user_email)) {
                continue;
            }

            $user_payments = array_filter($payments, function ($p) use ($uid) {
                return intval($p->user_id) === intval($uid);
            });

            $subject = 'תזכורת: תשלומים עתידיים להיום - Home Budget Manager';
            $body = "שלום {$user->display_name},\n\n";
            $body .= "להלן התשלומים שמתוכננים להיום ({$today}):\n\n";

            foreach ($user_payments as $payment) {
                $body .= "- {$payment->title}";
                if ($payment->payee) {
                    $body .= " (לטובת: {$payment->payee})";
                }
                $body .= " - " . number_format(floatval($payment->amount), 2) . " ₪";
                if ($payment->bank_name) {
                    $body .= " | חשבון: {$payment->bank_name}";
                }
                if ($payment->details) {
                    $body .= "\n  פרטים: {$payment->details}";
                }
                $body .= "\n";
            }

            $body .= "\nיש לסמן את התשלומים כ\"שולם\" במערכת לאחר ביצועם.\n";
            $body .= "\nבברכה,\nHome Budget Manager";

            wp_mail($user->user_email, $subject, $body);
        }
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private static function get_monthly_amount($expense, $month_start) {
        switch ($expense->type) {
            case 'fixed':
            case 'saving':
            case 'one_time':
                return floatval($expense->amount);

            case 'installment':
                $months_passed = self::months_between($expense->start_date, $month_start);
                if ($months_passed >= $expense->total_installments) {
                    return 0;
                }
                return floatval($expense->installment_amount ?: ($expense->amount / $expense->total_installments));

            case 'loan':
                if ($expense->loan_end_date && $month_start > $expense->loan_end_date) {
                    return 0;
                }
                return floatval($expense->monthly_return);

            default:
                return floatval($expense->amount);
        }
    }

    private static function months_between($start, $end) {
        $s = explode('-', substr($start, 0, 7));
        $e = explode('-', substr($end, 0, 7));
        return (intval($e[0]) - intval($s[0])) * 12 + (intval($e[1]) - intval($s[1]));
    }

    private static function get_one_time_cc_deduction_date($expense_start_date, $billing_day) {
        $exp_day = intval(date('d', strtotime($expense_start_date)));
        $exp_year = intval(date('Y', strtotime($expense_start_date)));
        $exp_month = intval(date('m', strtotime($expense_start_date)));

        if ($exp_day <= $billing_day) {
            return sprintf('%04d-%02d-%02d', $exp_year, $exp_month, $billing_day);
        } else {
            $next = new DateTime($expense_start_date);
            $next->modify('first day of next month');
            return sprintf('%04d-%02d-%02d', intval($next->format('Y')), intval($next->format('m')), $billing_day);
        }
    }

    // =========================================================================
    // Salary Transfer (business expense + personal income)
    // =========================================================================

    public static function create_salary_transfer($request) {
        global $wpdb;
        $user_id = get_current_user_id();

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $title = sanitize_text_field($params['title'] ?? 'משכורת');
        $amount = floatval($params['amount'] ?? 0);
        $transfer_date = sanitize_text_field($params['transfer_date'] ?? date('Y-m-d'));
        $bank_account_id = intval($params['bank_account_id'] ?? 0);
        $biz_bank_account_id = intval($params['biz_bank_account_id'] ?? 0);

        if ($amount <= 0) {
            return new WP_Error('invalid_amount', 'סכום לא תקין', ['status' => 400]);
        }
        if (!$bank_account_id) {
            return new WP_Error('missing_bank', 'יש לבחור חשבון בנק פרטי', ['status' => 400]);
        }

        // Create business expense
        $biz_expense_data = [
            'user_id' => $user_id,
            'type' => 'one_time',
            'title' => $title,
            'category' => 'salary',
            'amount' => $amount,
            'start_date' => $transfer_date,
            'is_business' => 1,
        ];
        if ($biz_bank_account_id) {
            $biz_expense_data['bank_account_id'] = $biz_bank_account_id;
        }

        $result1 = $wpdb->insert("{$wpdb->prefix}hbm_expenses", $biz_expense_data);
        if ($result1 === false) {
            return new WP_Error('db_error', 'שגיאה ביצירת הוצאת עסק: ' . $wpdb->last_error, ['status' => 500]);
        }
        $biz_expense_id = $wpdb->insert_id;

        // Create personal income
        $personal_income_data = [
            'user_id' => $user_id,
            'title' => $title,
            'amount' => $amount,
            'source' => 'עסק',
            'is_recurring' => 0,
            'start_date' => $transfer_date,
        ];
        if ($bank_account_id) {
            $personal_income_data['bank_account_id'] = $bank_account_id;
        }

        $result2 = $wpdb->insert("{$wpdb->prefix}hbm_income", $personal_income_data);
        if ($result2 === false) {
            return new WP_Error('db_error', 'שגיאה ביצירת הכנסה פרטית: ' . $wpdb->last_error, ['status' => 500]);
        }
        $personal_income_id = $wpdb->insert_id;

        return rest_ensure_response([
            'success' => true,
            'biz_expense_id' => $biz_expense_id,
            'personal_income_id' => $personal_income_id,
        ]);
    }

    // =========================================================================
    // Bank Balances Projection
    // =========================================================================

    public static function get_bank_balances($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $target_date = sanitize_text_field($request->get_param('target_date') ?? date('Y-m-d'));
        $is_business = $request->get_param('is_business');

        $query = "SELECT * FROM {$wpdb->prefix}hbm_bank_accounts WHERE user_id = %d";
        $query_args = [$user_id];

        if ($is_business !== null && $is_business !== '') {
            $query .= " AND is_business = %d";
            $query_args[] = intval($is_business);
        }

        $accounts = $wpdb->get_results($wpdb->prepare($query, $query_args));
        $balances = [];

        foreach ($accounts as $account) {
            $cf_request = new WP_REST_Request('GET');
            $cf_request->set_param('bank_account_id', $account->id);
            $cf_request->set_param('start_date', date('Y-m-d'));
            $cf_request->set_param('end_date', $target_date);

            $cf_response = self::get_cash_flow($cf_request);
            $cf_data = $cf_response->get_data();

            $projected_balance = floatval($account->initial_balance);
            if (!is_wp_error($cf_data) && isset($cf_data['current_balance'])) {
                $projected_balance = floatval($cf_data['current_balance']);
            }

            $balances[] = [
                'id' => intval($account->id),
                'bank_name' => $account->bank_name,
                'last_three' => $account->last_three,
                'is_business' => intval($account->is_business ?? 0),
                'initial_balance' => floatval($account->initial_balance),
                'credit_limit' => floatval($account->credit_limit),
                'projected_balance' => $projected_balance,
                'target_date' => $target_date,
            ];
        }

        return rest_ensure_response($balances);
    }
}
