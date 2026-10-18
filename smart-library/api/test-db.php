<?php
declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/../config/db.php';

try {
    $databaseResult = $pdo->query('SELECT DATABASE() AS database_name')->fetch();
    $databaseName = $databaseResult['database_name'] ?? 'unknown';

    $tableCheck = $pdo->query(
        'SELECT COUNT(*) AS table_count
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND table_name = "books"'
    )->fetch();

    if ((int) ($tableCheck['table_count'] ?? 0) === 0) {
        echo "Database connection successful!\n";
        echo "Database: {$databaseName}\n";
        echo "The books table does not exist yet. Create the table before testing data queries.\n";
        exit;
    }

    $statement = $pdo->query('SELECT COUNT(*) AS book_count FROM books');
    $result = $statement->fetch();

    echo "Smart Library database connection successful!\n";
    echo "Database: {$databaseName}\n";
    echo "Books in database: " . (int) $result['book_count'] . "\n";
} catch (PDOException $e) {
    error_log('Smart Library test query failed: ' . $e->getMessage());
    http_response_code(500);
    echo "Database connection failed while testing the Smart Library database.\n";
    echo $e->getMessage() . "\n";
}
