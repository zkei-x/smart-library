<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth-check.php';

$userId = require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error(405, 'Method not allowed.');
}

$input = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($input)) {
    $input = $_POST;
}
$bookId = (int) ($input['book_id'] ?? 0);

if ($bookId <= 0) {
    json_error(400, 'A valid book_id is required.');
}

try {
    $pdo->beginTransaction();

    // Lock the book row first, same as borrow.php.
    $stmt = $pdo->prepare('SELECT id FROM books WHERE id = ? FOR UPDATE');
    $stmt->execute([$bookId]);
    if (!$stmt->fetch()) {
        $pdo->rollBack();
        json_error(404, 'Book not found.');
    }

    $stmt = $pdo->prepare(
        'SELECT id FROM borrowings
         WHERE user_id = ? AND book_id = ? AND status = "borrowed"
         LIMIT 1 FOR UPDATE'
    );
    $stmt->execute([$userId, $bookId]);
    $borrowing = $stmt->fetch();

    if (!$borrowing) {
        $pdo->rollBack();
        json_error(409, 'You have no active borrowing for this book.');
    }

    $stmt = $pdo->prepare(
        'UPDATE borrowings SET status = "returned", returned_at = NOW() WHERE id = ?'
    );
    $stmt->execute([$borrowing['id']]);

    // Never let available copies go above total copies.
    $stmt = $pdo->prepare(
        'UPDATE books
         SET available_copies = LEAST(available_copies + 1, total_copies),
             available = 1
         WHERE id = ?'
    );
    $stmt->execute([$bookId]);

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Book returned. Thank you!']);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Return error: ' . $e->getMessage());
    json_error(500, 'Returning is unavailable right now.');
}