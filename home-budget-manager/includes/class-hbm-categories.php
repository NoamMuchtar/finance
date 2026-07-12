<?php

if (!defined('ABSPATH')) {
    exit;
}

class HBM_Categories {

    public static function get_defaults() {
        return [
            'groceries' => 'קניות מזון לבית',
            'household' => 'קניות לבית',
            'fuel' => 'דלק',
            'insurance' => 'ביטוחים',
            'restaurants' => 'מסעדות',
            'vacation' => 'נופש',
            'education' => 'חינוך',
            'health' => 'בריאות',
            'clothing' => 'ביגוד והנעלה',
            'transportation' => 'תחבורה',
            'utilities' => 'חשבונות (חשמל, מים, גז)',
            'internet_phone' => 'אינטרנט וסלולר',
            'arnona' => 'ארנונה',
            'vaad_bait' => 'ועד בית',
            'subscriptions' => 'מנויים',
            'entertainment' => 'בידור',
            'kids' => 'ילדים',
            'pets' => 'חיות מחמד',
            'gifts' => 'מתנות',
            'charity' => 'תרומות וצדקה',
            'savings' => 'חיסכון',
            'investments' => 'השקעות',
            'loan_payment' => 'החזר הלוואה',
            'mortgage' => 'משכנתא',
            'rent' => 'שכר דירה',
            'maintenance' => 'תחזוקה ותיקונים',
            'personal_care' => 'טיפוח אישי',
            'sports' => 'ספורט',
            'electronics' => 'אלקטרוניקה',
            'other' => 'אחר',
        ];
    }

    public static function get_all() {
        $categories = get_option('hbm_categories', []);
        if (empty($categories)) {
            $categories = self::get_defaults();
            update_option('hbm_categories', $categories);
        }
        return $categories;
    }

    public static function add($key, $label) {
        $categories = self::get_all();
        $categories[sanitize_key($key)] = sanitize_text_field($label);
        update_option('hbm_categories', $categories);
        return $categories;
    }

    public static function remove($key) {
        $categories = self::get_all();
        unset($categories[$key]);
        update_option('hbm_categories', $categories);
        return $categories;
    }
}
