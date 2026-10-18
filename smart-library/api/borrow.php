<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth-check.php';

$userId = require_login();
$method = $_SERVER['REQUEST_METHOD'];

// GET: list this user's borrowings
if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT br.id, b.id AS book_id, b.title, b.author,
                br.borrowed_at, br.due_date, br.returned_at, br.status
         FROM borrowings br
         JOIN books b ON b.id = br.book_id
         WHERE br.user_id = ?
         ORDER BY br.borrowed_at DESC'
    );
    $stmt->execute([$userId]);
    echo json_encode(['success' => true, 'borrowings' => $stmt->fetchAll()]);
    exit;
}

if ($method !== 'POST') {
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

    // Lock the book row so nobody else can change its stock meanwhile.
    $stmt = $pdo->prepare('SELECT available_copies FROM books WHERE id = ? FOR UPDATE');
    $stmt->execute([$bookId]);
    $book = $stmt->fetch();

    if (!$book) {
        $pdo->rollBack();
        json_error(404, 'Book not found.');
    }

    if ((int) $book['available_copies'] <= 0) {
        $pdo->rollBack();
        json_error(409, 'No copies are available right now.');
    }

    // Block duplicate active borrowing of the same book.
    $stmt = $pdo->prepare(
        'SELECT id FROM borrowings
         WHERE user_id = ? AND book_id = ? AND status = "borrowed" LIMIT 1'
    );
    $stmt->execute([$userId, $bookId]);
    if ($stmt->fetch()) {
        $pdo->rollBack();
        json_error(409, 'You already borrowed this book.');
    }

    $stmt = $pdo->prepare(
        'INSERT INTO borrowings (user_id, book_id, due_date)
         VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 14 DAY))'
    );
    $stmt->execute([$userId, $bookId]);

    $stmt = $pdo->prepare(
                'UPDATE books
         SET available = IF(available_copies - 1 > 0, 1, 0),
             available_copies = available_copies - 1
         WHERE id = ?'
    );
    $stmt->execute([$bookId]);

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Book borrowed. Due in 14 days.']);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Borrow error: ' . $e->getMessage());
    json_error(500, 'Borrowing is unavailable right now.');
}