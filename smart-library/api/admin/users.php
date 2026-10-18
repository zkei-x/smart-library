<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/auth-check.php';

$adminId = require_admin();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $stmt = $pdo->query(
            'SELECT u.id, u.full_name, u.email, u.role, u.created_at,
                    (SELECT COUNT(*) FROM borrowings b
                     WHERE b.user_id = u.id AND b.status = "borrowed") AS active_borrows
             FROM users u ORDER BY u.created_at DESC'
        );
        echo json_encode(['success' => true, 'users' => $stmt->fetchAll()]);
        exit;
    }

    if ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($input['id'] ?? 0);
        $role = (string) ($input['role'] ?? '');

        if ($id <= 0 || !in_array($role, ['user', 'admin'], true)) {
            json_error(400, 'A valid id and role (user or admin) are required.');
        }
        if ($id === $adminId) {
            json_error(409, 'You cannot change your own role.');
        }

        $stmt = $pdo->prepare('UPDATE users SET role = ? WHERE id = ?');
        $stmt->execute([$role, $id]);
        echo json_encode(['success' => true, 'message' => 'Role updated.']);
        exit;
    }

    json_error(405, 'Method not allowed.');
} catch (PDOException $e) {
    error_log('Admin users error: ' . $e->getMessage());
    json_error(500, 'Admin users is unavailable right now.');
}