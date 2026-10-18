<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../config/db.php';

try {
    $statement = $pdo->query(
        'SELECT id, title, author, genre, description,
                available, total_copies, available_copies,
                interests, symbol, color
         FROM books
         ORDER BY id ASC'
    );

    $books = $statement->fetchAll();

    foreach ($books as &$book) {
        $book['id'] = (int) $book['id'];
        $book['available'] = (bool) $book['available'];
        $book['total_copies'] = (int) $book['total_copies'];
        $book['available_copies'] = (int) $book['available_copies'];

        $book['interests'] = ($book['interests'] !== null && $book['interests'] !== '')
            ? array_map('trim', explode(',', $book['interests']))
            : [$book['genre']];
        $book['symbol'] = $book['symbol'] ?: '▤';
        $book['color'] = $book['color'] ?: '#477b70';
    }
    unset($book);

    echo json_encode(
        ['success' => true, 'books' => $books],
        JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
    );
} catch (Throwable $e) {
    error_log('Smart Library books API error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to load books right now.'
    ]);
}