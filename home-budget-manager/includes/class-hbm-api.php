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
            ['methods' => 'POST', 'callback' => [__CLASS__, 'save_allocations'], 'permission_callback' => [__CLASS__, 'check_auth']],
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

        // User Settings
        register_rest_route($namespace, '/user-settings', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_user_settings'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'save_user_settings'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        // Cash Flow
        register_rest_route($namespace, '/cash-flow', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_cash_flow'], 'permission_callback' => [__CLASS__, 'check_auth']],
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
        $month = sanitize_text_field($request->get_param('month') ?? date('Y-m'));

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_income
             WHERE user_id = %d
             AND start_date <= LAST_DAY(%s)
             AND (end_date IS NULL OR end_date >= %s)
             ORDER BY created_at DESC",
            $user_id,
            $month . '-01',
            $month . '-01'
        ));

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

        $result = $wpdb->insert("{$wpdb->prefix}hbm_income", $data);

        if ($result === false) {
            return new WP_Error('db_error', 'שגיאה בשמירת הנתונים: ' . $wpdb->last_error, ['status' => 500]);
        }

        $data['id'] = $wpdb->insert_id;

        return rest_ensure_response($data);
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

        $wpdb->update("{$wpdb->prefix}hbm_income", $data, ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
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

        $results = $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}hbm_expenses $where ORDER BY created_at DESC"
        );

        foreach ($results as &$expense) {
            if ($expense->type === 'installment' && $expense->remaining_installments !== null) {
                $months_passed = self::months_between($expense->start_date, $month_start);
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

        return rest_ensure_response(['success' => true]);
    }

    public static function delete_expense($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id = intval($request->get_param('id'));

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
            "SELECT * FROM {$wpdb->prefix}hbm_budget_allocations WHERE user_id = %d AND is_active = 1",
            $user_id
        ));

        return rest_ensure_response($results);
    }

    public static function save_allocations($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }
        $allocations = $params['allocations'] ?? null;

        if (!is_array($allocations)) {
            return new WP_Error('invalid_data', 'נתונים לא תקינים', ['status' => 400]);
        }

        foreach ($allocations as $allocation) {
            $category = sanitize_text_field($allocation['category']);
            $amount = floatval($allocation['amount']);

            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}hbm_budget_allocations WHERE user_id = %d AND category = %s",
                $user_id,
                $category
            ));

            if ($existing) {
                $wpdb->update(
                    "{$wpdb->prefix}hbm_budget_allocations",
                    ['amount' => $amount, 'is_active' => 1],
                    ['id' => $existing]
                );
            } else {
                $wpdb->insert("{$wpdb->prefix}hbm_budget_allocations", [
                    'user_id' => $user_id,
                    'category' => $category,
                    'amount' => $amount,
                    'is_active' => 1,
                ]);
            }
        }

        return rest_ensure_response(['success' => true]);
    }

    // =========================================================================
    // Dashboard
    // =========================================================================

    public static function get_dashboard($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $month = sanitize_text_field($request->get_param('month') ?? date('Y-m'));
        $month_start = $month . '-01';
        $month_end = date('Y-m-t', strtotime($month_start));

        $income = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_income
             WHERE user_id = %d AND start_date <= %s AND (end_date IS NULL OR end_date >= %s)",
            $user_id, $month_end, $month_start
        ));

        $total_income = 0;
        foreach ($income as $item) {
            $total_income += floatval($item->amount);
        }

        $expenses = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_expenses
             WHERE user_id = %d AND start_date <= %s AND (end_date IS NULL OR end_date >= %s)",
            $user_id, $month_end, $month_start
        ));

        $total_expenses = 0;
        $expenses_by_category = [];
        $expenses_by_type = ['fixed' => 0, 'installment' => 0, 'loan' => 0, 'saving' => 0, 'one_time' => 0];

        foreach ($expenses as $expense) {
            $monthly_amount = self::get_monthly_amount($expense, $month_start);
            if ($monthly_amount <= 0) continue;

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
        foreach ($allocations as $alloc) {
            $spent = $expenses_by_category[$alloc->category] ?? 0;
            $budget_status[] = [
                'category' => $alloc->category,
                'allocated' => floatval($alloc->amount),
                'spent' => $spent,
                'remaining' => floatval($alloc->amount) - $spent,
            ];
        }

        $remaining = $total_income - $total_expenses;

        return rest_ensure_response([
            'month' => $month,
            'total_income' => $total_income,
            'total_expenses' => $total_expenses,
            'remaining' => $remaining,
            'income_items' => $income,
            'expenses_by_category' => $expenses_by_category,
            'expenses_by_type' => $expenses_by_type,
            'budget_status' => $budget_status,
            'standing_orders_total' => $standing_orders_total,
            'reserved_payments' => $reserved_payments,
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

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_credit_cards WHERE user_id = %d ORDER BY created_at DESC",
            $user_id
        ));

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

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_bank_accounts WHERE user_id = %d ORDER BY created_at DESC",
            $user_id
        ));

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
        ];

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
        }

        if (empty($data)) {
            return new WP_Error('missing_data', 'אין נתונים לעדכון', ['status' => 400]);
        }

        $wpdb->update("{$wpdb->prefix}hbm_bank_accounts", $data, ['id' => $id, 'user_id' => $user_id]);

        return rest_ensure_response(['success' => true]);
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
        $today = date('Y-m-d');
        $end_date = date('Y-m-d', strtotime("+{$months_ahead} months"));

        $entries = [];

        // 1. Past transactions affecting this bank account
        // Bank transfer expenses
        $past_expenses = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_expenses
             WHERE user_id = %d AND bank_account_id = %d AND start_date <= %s",
            $user_id, $bank_account_id, $today
        ));

        foreach ($past_expenses as $exp) {
            if ($exp->type === 'one_time') {
                $entries[] = [
                    'date' => $exp->start_date,
                    'description' => $exp->title,
                    'type' => 'expense_' . $exp->type,
                    'amount' => -floatval($exp->amount),
                    'is_charge' => true,
                ];
            } elseif ($exp->type === 'fixed' || $exp->type === 'saving') {
                // Monthly recurring - generate entries for each past month
                $start = new DateTime($exp->start_date);
                $end_dt = $exp->end_date ? new DateTime(min($exp->end_date, $today)) : new DateTime($today);
                $current = clone $start;
                while ($current <= $end_dt) {
                    $entries[] = [
                        'date' => $current->format('Y-m-d'),
                        'description' => $exp->title,
                        'type' => 'expense_' . $exp->type,
                        'amount' => -floatval($exp->amount),
                        'is_charge' => true,
                    ];
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
                    $entries[] = [
                        'date' => $payment_date,
                        'description' => $exp->title,
                        'type' => 'loan_payment',
                        'amount' => -$monthly,
                        'is_charge' => true,
                    ];
                    $current->modify('+1 month');
                }
            } elseif ($exp->type === 'installment') {
                $start = new DateTime($exp->start_date);
                $inst_amount = floatval($exp->installment_amount ?: ($exp->amount / $exp->total_installments));
                for ($i = 0; $i < $exp->total_installments; $i++) {
                    $pay_dt = clone $start;
                    $pay_dt->modify("+{$i} months");
                    if ($pay_dt->format('Y-m-d') > $today) break;
                    $entries[] = [
                        'date' => $pay_dt->format('Y-m-d'),
                        'description' => $exp->title . " (תשלום " . ($i + 1) . "/" . $exp->total_installments . ")",
                        'type' => 'installment_payment',
                        'amount' => -$inst_amount,
                        'is_charge' => true,
                    ];
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
                if ($order_date <= $today) {
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

        // Past reserved payments for this bank account
        $past_reserved = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_reserved_payments
             WHERE user_id = %d AND bank_account_id = %d AND is_paid = 1 AND payment_date <= %s",
            $user_id, $bank_account_id, $today
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
        $future_loans = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_expenses
             WHERE user_id = %d AND bank_account_id = %d AND type = 'loan'
             AND (loan_end_date IS NULL OR loan_end_date >= %s)",
            $user_id, $bank_account_id, $tomorrow
        ));

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
        $future_installments = $wpdb->get_results($wpdb->prepare(
            "SELECT e.*, cc.billing_day FROM {$wpdb->prefix}hbm_expenses e
             LEFT JOIN {$wpdb->prefix}hbm_credit_cards cc ON e.credit_card_id = cc.id
             WHERE e.user_id = %d AND e.bank_account_id = %d AND e.type = 'installment'
             AND (e.end_date IS NULL OR e.end_date >= %s)",
            $user_id, $bank_account_id, $tomorrow
        ));

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
        $future_savings = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}hbm_expenses
             WHERE user_id = %d AND bank_account_id = %d AND type = 'saving'
             AND (end_date IS NULL OR end_date >= %s)",
            $user_id, $bank_account_id, $tomorrow
        ));

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
        $start_date = new DateTime($start);
        $end_date = new DateTime($end);
        $interval = $start_date->diff($end_date);
        return ($interval->y * 12) + $interval->m;
    }
}
