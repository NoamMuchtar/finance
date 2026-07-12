<?php

if (!defined('ABSPATH')) {
    exit;
}

class HBM_API {

    public static function register_routes() {
        $namespace = 'hbm/v1';

        register_rest_route($namespace, '/income', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_income'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_income'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/income/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [__CLASS__, 'update_income'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'DELETE', 'callback' => [__CLASS__, 'delete_income'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/expenses', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_expenses'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'create_expense'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/expenses/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [__CLASS__, 'update_expense'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'DELETE', 'callback' => [__CLASS__, 'delete_expense'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/budget-allocations', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_allocations'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'save_allocations'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/dashboard', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_dashboard'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/categories', [
            ['methods' => 'GET', 'callback' => [__CLASS__, 'get_categories'], 'permission_callback' => [__CLASS__, 'check_auth']],
            ['methods' => 'POST', 'callback' => [__CLASS__, 'add_category'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);

        register_rest_route($namespace, '/categories/(?P<key>[a-z_]+)', [
            ['methods' => 'DELETE', 'callback' => [__CLASS__, 'delete_category'], 'permission_callback' => [__CLASS__, 'check_auth']],
        ]);
    }

    public static function check_auth() {
        return is_user_logged_in();
    }

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

        $data = [
            'title' => sanitize_text_field($request->get_param('title')),
            'amount' => floatval($request->get_param('amount')),
            'source' => sanitize_text_field($request->get_param('source') ?? ''),
            'is_recurring' => intval($request->get_param('is_recurring') ?? 1),
            'start_date' => sanitize_text_field($request->get_param('start_date')),
            'end_date' => $request->get_param('end_date') ? sanitize_text_field($request->get_param('end_date')) : null,
        ];

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

        $type = sanitize_text_field($params['type'] ?? 'regular');
        $title = sanitize_text_field($params['title'] ?? '');
        $payee = sanitize_text_field($params['payee'] ?? '');
        $description = sanitize_text_field($params['description'] ?? '');
        $category = sanitize_text_field($params['category'] ?? '');
        $amount = floatval($params['amount'] ?? 0);
        $start_date = sanitize_text_field($params['start_date'] ?? date('Y-m-d'));

        if (empty($title) || empty($category) || $amount <= 0) {
            return new WP_Error('missing_data', 'חסרים נתונים חובה (שם, קטגוריה, סכום)', ['status' => 400]);
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
                $data['end_date'] = date('Y-m-d', strtotime($start_date . " +{$total} months"));
                break;

            case 'loan':
                $data['monthly_return'] = floatval($params['monthly_return'] ?? 0);
                $loan_end = sanitize_text_field($params['loan_end_date'] ?? '');
                if ($loan_end) {
                    $data['loan_end_date'] = $loan_end;
                    $data['end_date'] = $loan_end;
                }
                break;

            case 'saving':
                $data['is_recurring'] = 1;
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

        $data = [
            'title' => sanitize_text_field($request->get_param('title')),
            'payee' => sanitize_text_field($request->get_param('payee') ?? ''),
            'description' => sanitize_text_field($request->get_param('description') ?? ''),
            'category' => sanitize_text_field($request->get_param('category')),
            'amount' => floatval($request->get_param('amount')),
        ];

        $type = sanitize_text_field($request->get_param('type'));
        if ($type === 'installment') {
            $data['total_installments'] = intval($request->get_param('total_installments'));
            $data['installment_amount'] = floatval($request->get_param('installment_amount'));
        } elseif ($type === 'loan') {
            $data['monthly_return'] = floatval($request->get_param('monthly_return'));
            $data['loan_end_date'] = sanitize_text_field($request->get_param('loan_end_date'));
            $data['end_date'] = $data['loan_end_date'];
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
        $allocations = $request->get_param('allocations');

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
        $expenses_by_type = ['fixed' => 0, 'installment' => 0, 'loan' => 0, 'saving' => 0, 'regular' => 0];

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
        ]);
    }

    public static function get_categories() {
        return rest_ensure_response(HBM_Categories::get_all());
    }

    public static function add_category($request) {
        $key = sanitize_key($request->get_param('key'));
        $label = sanitize_text_field($request->get_param('label'));

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

    private static function get_monthly_amount($expense, $month_start) {
        switch ($expense->type) {
            case 'fixed':
            case 'saving':
            case 'regular':
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
