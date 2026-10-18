<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth-check.php';

$userId = require_login();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $stmt = $pdo->prepare(
            'SELECT favorite_genres FROM user_preferences WHERE user_id = ?'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        $genres = ($row && $row['favorite_genres'] !== null && $row['favorite_genres'] !== '')
            ? explode(',', $row['favorite_genres'])
            : [];

        echo json_encode(['success' => true, 'favorite_genres' => $genres]);
        exit;
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input') ?: '', true);
        if (!is_array($input)) {
            $input = $_POST;
        }

        $genres = $input['favorite_genres'] ?? [];
        if (!is_array($genres) || count($genres) > 20) {
            json_error(400, 'favorite_genres must be a list of up to 20 genres.');
        }

        $clean = [];
        foreach ($genres as $g) {
            $g = trim((string) $g);
            if ($g === '' || strlen($g) > 50 || str_contains($g, ',')) {
                json_error(400, 'Each genre must be 1-50 characters with no commas.');
            }
            $clean[] = $g;
        }

        $joined = implode(',', array_unique($clean));
        if (strlen($joined) > 255) {
            json_error(400, 'Too many genres saved.');
        }

        $stmt = $pdo->prepare(
            'INSERT INTO user_preferences (user_id, favorite_genres)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE favorite_genres = VALUES(favorite_genres)'
        );
        $stmt->execute([$userId, $joined]);

        echo json_encode(['success' => true, 'message' => 'Preferences saved.']);
        exit;
    }

    json_error(405, 'Method not allowed.');
} catch (PDOException $e) {
    error_log('Preferences error: ' . $e->getMessage());
    json_error(500, 'Preferences are unavailable right now.');
}