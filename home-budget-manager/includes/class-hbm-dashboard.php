<?php

if (!defined('ABSPATH')) {
    exit;
}

class HBM_Dashboard {

    public static function get_summary($user_id, $month) {
        global $wpdb;
        $month_start = $month . '-01';
        $month_end = date('Y-m-t', strtotime($month_start));

        $total_income = $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(amount), 0) FROM {$wpdb->prefix}hbm_income
             WHERE user_id = %d AND start_date <= %s AND (end_date IS NULL OR end_date >= %s)",
            $user_id, $month_end, $month_start
        ));

        return [
            'total_income' => floatval($total_income),
            'month' => $month,
        ];
    }
}
