<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/auth-check.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error(405, 'Method not allowed.');
}

try {
    $stmt = $pdo->query(
        'SELECT br.id, u.full_name, u.email, b.title,
                br.borrowed_at, br.due_date, br.returned_at, br.status,
                (br.status = "borrowed" AND br.due_date < CURDATE()) AS overdue
         FROM borrowings br
         JOIN users u ON u.id = br.user_id
         JOIN books b ON b.id = br.book_id
         ORDER BY br.borrowed_at DESC
         LIMIT 200'
    );
    echo json_encode(['success' => true, 'transactions' => $stmt->fetchAll()]);
} catch (PDOException $e) {
    error_log('Admin transactions error: ' . $e->getMessage());
    json_error(500, 'Transactions are unavailable right now.');
}