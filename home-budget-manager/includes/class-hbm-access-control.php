<?php

if (!defined('ABSPATH')) {
    exit;
}

class HBM_Access_Control {

    public function init() {
        add_action('template_redirect', [$this, 'restrict_access']);
        add_action('wp_login_failed', [$this, 'login_failed']);
        add_filter('login_redirect', [$this, 'login_redirect'], 10, 3);
        add_action('login_enqueue_scripts', [$this, 'login_styles']);
    }

    public function restrict_access() {
        if (is_user_logged_in()) {
            return;
        }

        if ($this->is_allowed_page()) {
            return;
        }

        wp_redirect(wp_login_url(home_url()));
        exit;
    }

    private function is_allowed_page() {
        if (defined('DOING_AJAX') && DOING_AJAX) {
            return true;
        }
        if (defined('DOING_CRON') && DOING_CRON) {
            return true;
        }
        if (is_admin()) {
            return true;
        }
        if (strpos($_SERVER['REQUEST_URI'], 'wp-login.php') !== false) {
            return true;
        }
        if (strpos($_SERVER['REQUEST_URI'], 'wp-json') !== false) {
            return true;
        }
        return false;
    }

    public function login_failed($username) {
        $referrer = wp_get_referer();
        if ($referrer && strpos($referrer, 'wp-login.php') !== false) {
            wp_redirect(add_query_arg('login_error', '1', wp_login_url()));
            exit;
        }
    }

    public function login_redirect($redirect_to, $requested_redirect_to, $user) {
        if (is_wp_error($user)) {
            return $redirect_to;
        }
        return home_url('/');
    }

    public function login_styles() {
        ?>
        <style>
            body.login {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .login h1 a {
                background-image: none !important;
                font-size: 28px;
                color: #fff;
                text-indent: 0;
                width: auto;
                height: auto;
                text-decoration: none;
            }
            .login h1 a::after {
                content: '💰 ניהול תקציב הבית';
                display: block;
                font-size: 24px;
                direction: rtl;
            }
            #loginform {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 16px;
                border: none;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                padding: 30px 24px;
            }
            #loginform label {
                color: #333;
                font-weight: 600;
            }
            #loginform input[type="text"],
            #loginform input[type="password"] {
                border-radius: 8px;
                border: 2px solid #e0e0e0;
                padding: 10px 14px;
                font-size: 15px;
                transition: border-color 0.3s;
            }
            #loginform input[type="text"]:focus,
            #loginform input[type="password"]:focus {
                border-color: #4facfe;
                box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
            }
            #wp-submit {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                border: none;
                border-radius: 8px;
                padding: 10px 24px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                width: 100%;
                margin-top: 10px;
            }
            #wp-submit:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
            }
            .login #nav,
            .login #backtoblog {
                text-align: center;
            }
            .login #nav a,
            .login #backtoblog a {
                color: rgba(255, 255, 255, 0.7);
            }
            .login #nav a:hover,
            .login #backtoblog a:hover {
                color: #fff;
            }
            .login .message,
            .login .notice {
                border-radius: 8px;
                border-left: 4px solid #4facfe;
            }
        </style>
        <?php
    }
}
