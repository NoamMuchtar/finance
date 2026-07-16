<?php
if (!defined('ABSPATH')) exit;

class HBM_Template {
    public function __construct() {
        add_filter('template_include', [$this, 'override_template']);
    }

    public function override_template($template) {
        global $post;
        if ($post && has_shortcode($post->post_content, 'home_budget')) {
            return HBM_PLUGIN_DIR . 'templates/full-page.php';
        }
        return $template;
    }
}
