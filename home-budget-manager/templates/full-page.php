<!DOCTYPE html>
<html <?php language_attributes(); ?> dir="rtl">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ניהול תקציב הבית</title>
    <?php wp_head(); ?>
</head>
<body class="hbm-fullpage">
    <?php
    while (have_posts()) : the_post();
        the_content();
    endwhile;
    ?>
    <?php wp_footer(); ?>
</body>
</html>
