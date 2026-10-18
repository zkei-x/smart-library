<?php
declare(strict_types=1);

if (!extension_loaded('pdo_mysql')) {
    http_response_code(500);
    exit('PHP PDO MySQL is not enabled. Enable the pdo_mysql extension in php.ini and restart XAMPP.');
}

// Local XAMPP database settings.
$host = 'localhost';
$dbname = 'smart_library';
$username = 'root';
$password = ''; // Default XAMPP setup often has no MySQL password.

$dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::ATTR_TIMEOUT            => 5,
];

try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    error_log('Smart Library database connection failed: ' . $e->getMessage());

    http_response_code(500);
    exit(
        "Database connection failed. Check that MySQL is running in XAMPP, the database 'smart_library' exists, and config/db.php matches your local setup.\n\n"
        . 'Detailed error: ' . $e->getMessage()
    );
}
