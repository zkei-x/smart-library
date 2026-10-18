<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth-check.php';

$userId = require_login();
$method = $_SERVER['REQUEST_METHOD'];

$input = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($input)) {
    $input = $_POST;
}
$bookId = (int) ($input['book_id'] ?? 0);

try {
    if ($method === 'GET') {
        $stmt = $pdo->prepare(
            'SELECT b.id, b.title, b.author, b.genre, b.available_copies, rl.added_at
             FROM reading_lists rl
             JOIN books b ON b.id = rl.book_id
             WHERE rl.user_id = ?
             ORDER BY rl.added_at DESC'
        );
        $stmt->execute([$userId]);
        echo json_encode(['success' => true, 'books' => $stmt->fetchAll()]);
        exit;
    }

    if ($method === 'POST' || $method === 'DELETE') {
        if ($bookId <= 0) {
            json_error(400, 'A valid book_id is required.');
        }
    }

    if ($method === 'POST') {
        $check = $pdo->prepare('SELECT id FROM books WHERE id = ?');
        $check->execute([$bookId]);
        if (!$check->fetch()) {
            json_error(404, 'Book not found.');
        }

        $stmt = $pdo->prepare(
            'INSERT IGNORE INTO reading_lists (user_id, book_id) VALUES (?, ?)'
        );
        $stmt->execute([$userId, $bookId]);
        echo json_encode(['success' => true, 'message' => 'Saved to your reading list.']);
        exit;
    }

    if ($method === 'DELETE') {
        $stmt = $pdo->prepare(
            'DELETE FROM reading_lists WHERE user_id = ? AND book_id = ?'
        );
        $stmt->execute([$userId, $bookId]);
        echo json_encode(['success' => true, 'message' => 'Removed from your reading list.']);
        exit;
    }

    json_error(405, 'Method not allowed.');
} catch (PDOException $e) {
    error_log('Reading list error: ' . $e->getMessage());
    json_error(500, 'Reading list is unavailable right now.');
}