<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function json_error(int $code, string $message): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

function require_login(): int {
    if (!isset($_SESSION['user_id'])) {
        json_error(401, 'Please log in first.');
    }
    return (int) $_SESSION['user_id'];
}

function require_admin(): int {
    $id = require_login();
    if (($_SESSION['user_role'] ?? '') !== 'admin') {
        json_error(403, 'Admin access only.');
    }
    return $id;
}