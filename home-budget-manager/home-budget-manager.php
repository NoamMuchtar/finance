<?php
/**
 * Plugin Name: Home Budget Manager
 * Description: מערכת לניהול הכנסות והוצאות הבית
 * Version: 1.0.0
 * Author: Webify
 * Text Domain: home-budget-manager
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

define('HBM_VERSION', '1.5.0');
define('HBM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HBM_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once HBM_PLUGIN_DIR . 'includes/class-hbm-database.php';
require_once HBM_PLUGIN_DIR . 'includes/class-hbm-categories.php';
require_once HBM_PLUGIN_DIR . 'includes/class-hbm-access-control.php';
require_once HBM_PLUGIN_DIR . 'includes/class-hbm-api.php';
require_once HBM_PLUGIN_DIR . 'includes/class-hbm-dashboard.php';
require_once HBM_PLUGIN_DIR . 'includes/class-hbm-admin.php';
require_once HBM_PLUGIN_DIR . 'includes/class-hbm-template.php';

register_activation_hook(__FILE__, function () {
    HBM_Database::create_tables();
    if (!wp_next_scheduled('hbm_check_reserved_payments')) {
        wp_schedule_event(time(), 'daily', 'hbm_check_reserved_payments');
    }
});

register_deactivation_hook(__FILE__, function () {
    $timestamp = wp_next_scheduled('hbm_check_reserved_payments');
    if ($timestamp) {
        wp_unschedule_event($timestamp, 'hbm_check_reserved_payments');
    }
});

add_action('hbm_check_reserved_payments', ['HBM_API', 'check_reserved_payments_email']);

add_action('plugins_loaded', function () {
    $installed_version = get_option('hbm_db_version', '0');
    if (version_compare($installed_version, HBM_VERSION, '<')) {
        HBM_Database::create_tables();
        update_option('hbm_db_version', HBM_VERSION);
    }
});

class Home_Budget_Manager {
    private static $instance = null;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('init', [$this, 'init']);
        add_action('rest_api_init', ['HBM_API', 'register_routes']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_public_assets']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_shortcode('home_budget', [$this, 'render_app']);

        $access_control = new HBM_Access_Control();
        $access_control->init();

        new HBM_Template();
    }

    public function init() {
        load_plugin_textdomain('home-budget-manager', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    public function enqueue_public_assets() {
        wp_enqueue_style('hbm-public', HBM_PLUGIN_URL . 'public/css/style.css', [], HBM_VERSION);
        wp_enqueue_script('xlsx-mini', HBM_PLUGIN_URL . 'public/js/xlsx.mini.min.js', [], '0.20.0', true);
        wp_enqueue_script('hbm-public', HBM_PLUGIN_URL . 'public/js/app.js', ['xlsx-mini'], HBM_VERSION, true);
        wp_localize_script('hbm-public', 'hbmData', [
            'apiUrl' => rest_url('hbm/v1/'),
            'nonce' => wp_create_nonce('wp_rest'),
            'categories' => HBM_Categories::get_all(),
            'currentMonth' => date('Y-m'),
        ]);
    }

    public function enqueue_admin_assets($hook) {
        if (strpos($hook, 'home-budget') === false) {
            return;
        }
        wp_enqueue_style('hbm-admin', HBM_PLUGIN_URL . 'admin/css/admin.css', [], HBM_VERSION);
        wp_enqueue_script('hbm-admin', HBM_PLUGIN_URL . 'admin/js/admin.js', [], HBM_VERSION, true);
        wp_localize_script('hbm-admin', 'hbmData', [
            'apiUrl' => rest_url('hbm/v1/'),
            'nonce' => wp_create_nonce('wp_rest'),
            'categories' => HBM_Categories::get_all(),
        ]);
    }

    public function render_app() {
        ob_start();
        include HBM_PLUGIN_DIR . 'templates/app.php';
        return ob_get_clean();
    }
}

Home_Budget_Manager::get_instance();
