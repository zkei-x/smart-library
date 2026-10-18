<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/auth-check.php';

require_admin();
$method = $_SERVER['REQUEST_METHOD'];

$input = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($input)) {
    $input = $_POST;
}

function clean_book(array $in): array {
    $title = trim((string) ($in['title'] ?? ''));
    $author = trim((string) ($in['author'] ?? ''));
    $genre = trim((string) ($in['genre'] ?? ''));
    $description = trim((string) ($in['description'] ?? ''));
    $total = filter_var($in['total_copies'] ?? null, FILTER_VALIDATE_INT);

    if ($title === '' || strlen($title) > 200) json_error(400, 'Title must be 1-200 characters.');
    if ($author === '' || strlen($author) > 150) json_error(400, 'Author must be 1-150 characters.');
    if ($genre === '' || strlen($genre) > 100) json_error(400, 'Genre must be 1-100 characters.');
    if ($total === false || $total < 0 || $total > 1000) json_error(400, 'Total copies must be 0-1000.');

    return [$title, $author, $genre, $description, $total];
}

try {
    if ($method === 'GET') {
        $stmt = $pdo->query(
            'SELECT id, title, author, genre, description,
                    available, total_copies, available_copies
             FROM books ORDER BY title ASC'
        );
        echo json_encode(['success' => true, 'books' => $stmt->fetchAll()]);
        exit;
    }

    if ($method === 'POST') {
        [$title, $author, $genre, $description, $total] = clean_book($input);
        $stmt = $pdo->prepare(
            'INSERT INTO books (title, author, genre, description, available, total_copies, available_copies)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$title, $author, $genre, $description, $total > 0 ? 1 : 0, $total, $total]);
        echo json_encode(['success' => true, 'id' => (int) $pdo->lastInsertId()]);
        exit;
    }

    if ($method === 'PUT') {
        $id = (int) ($input['id'] ?? 0);
        if ($id <= 0) json_error(400, 'A valid id is required.');
        [$title, $author, $genre, $description, $total] = clean_book($input);

        $pdo->beginTransaction();
        $stmt = $pdo->prepare('SELECT total_copies, available_copies FROM books WHERE id = ? FOR UPDATE');
        $stmt->execute([$id]);
        $old = $stmt->fetch();
        if (!$old) {
            $pdo->rollBack();
            json_error(404, 'Book not found.');
        }

        // Copies currently out on loan must stay accounted for.
        $onLoan = (int) $old['total_copies'] - (int) $old['available_copies'];
        $newAvailable = $total - $onLoan;
        if ($newAvailable < 0) {
            $pdo->rollBack();
            json_error(409, "Cannot set total below $onLoan: that many copies are borrowed.");
        }

        $stmt = $pdo->prepare(
            'UPDATE books SET title = ?, author = ?, genre = ?, description = ?,
                    total_copies = ?, available_copies = ?, available = ?
             WHERE id = ?'
        );
        $stmt->execute([$title, $author, $genre, $description, $total, $newAvailable, $newAvailable > 0 ? 1 : 0, $id]);
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Book updated.']);
        exit;
    }

    if ($method === 'DELETE') {
        $id = (int) ($input['id'] ?? 0);
        if ($id <= 0) json_error(400, 'A valid id is required.');

        $stmt = $pdo->prepare('SELECT COUNT(*) AS c FROM borrowings WHERE book_id = ? AND status = "borrowed"');
        $stmt->execute([$id]);
        if ((int) $stmt->fetch()['c'] > 0) {
            json_error(409, 'Cannot delete: this book is currently borrowed.');
        }

        $stmt = $pdo->prepare('DELETE FROM books WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Book deleted.']);
        exit;
    }

    json_error(405, 'Method not allowed.');
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Admin books error: ' . $e->getMessage());
    json_error(500, 'Admin books is unavailable right now.');
}