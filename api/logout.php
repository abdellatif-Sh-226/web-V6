<?php
require __DIR__ . '/bootstrap.php';
if (session_status() === PHP_SESSION_ACTIVE) {
    $_SESSION = [];
    session_destroy();
}
jsonResponse(['success' => true]);
