<?php
declare(strict_types=1);

session_start();
require_once __DIR__ . '/../config/db.php';

$error = '';
$fullName = '';
$email = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = trim($_POST['full_name'] ?? '');
    $email = strtolower(trim($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';

    if ($fullName === '' || strlen($fullName) > 150) {
        $error = 'Enter a name between 1 and 150 characters.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Enter a valid email address.';
    } elseif (strlen($email) > 190) {
        $error = 'Your email address is too long.';
    } elseif (strlen($password) < 8) {
        $error = 'Your password must be at least 8 characters.';
    } elseif ($password !== $confirmPassword) {
        $error = 'The passwords do not match.';
    } else {
        try {
            $check = $pdo->prepare(
                'SELECT id FROM users WHERE email = ? LIMIT 1'
            );
            $check->execute([$email]);

            if ($check->fetch()) {
                $error = 'An account with that email already exists.';
            } else {
                $hash = password_hash($password, PASSWORD_DEFAULT);

                // Public registration must never allow users to choose admin.
                $insert = $pdo->prepare(
                    'INSERT INTO users (full_name, email, password_hash, role)
                     VALUES (?, ?, ?, ?)'
                );

                $insert->execute([$fullName, $email, $hash, 'user']);

                header('Location: login.php?registered=1');
                exit;
            }
        } catch (PDOException $e) {
            error_log('Registration error: ' . $e->getMessage());
            $error = 'Registration failed. Please try again.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Create Account | Smart Library</title>
  <link rel="stylesheet" href="../css/style.css">
  <style>
    body { display: flex; flex-direction: column; min-height: 100vh; margin: 0; }
    .auth-card { width: calc(100% - 32px); max-width: 460px; margin: 60px auto; padding: 32px;
      background: #fff; border: 1px solid var(--line); border-radius: var(--radius);
      box-shadow: var(--shadow); }
    .auth-card h1 { margin-bottom: 8px; font-family: Georgia, "Times New Roman", serif;
      font-size: 30px; font-weight: 500; }
    .auth-card > p { color: var(--muted); font-size: 14px; }
    .auth-card label { display: block; margin-top: 16px; font-weight: 700; font-size: 13px; }
    .auth-card input { box-sizing: border-box; width: 100%; padding: 12px; margin-top: 7px;
      border: 1px solid var(--line); border-radius: 10px; background: #fff; color: var(--navy); }
    .auth-card button { margin-top: 22px; width: 100%; }
    .auth-card a { color: var(--green); font-weight: 700; }
    .error { color: #b42318; }
    .success { color: #276749; }
    .footer { margin-top: auto; }
  </style>
</head>
<body>
  <header class="navbar">
    <a href="../index.html#home" class="brand">
      <span class="brand-icon">▤</span>
      <span>Smart<span class="brand-accent">Library</span></span>
    </a>

    <nav aria-label="Main navigation">
      <a href="../index.html#home">Home</a>
      <a href="../index.html#discover">Discover</a>
      <a href="../index.html#catalog">Book Catalog</a>
    </nav>

    <a class="nav-button" href="../index.html#discover">Find My Books ↗</a>
  </header>

  <main class="auth-card">
    <h1>Create your account</h1>
    <p>Join Smart Library and discover your next great read.</p>

    <?php if ($error !== ''): ?>
      <p class="error" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>

    <form method="post" action="register.php">
      <label for="full_name">Full name</label>
      <input id="full_name" name="full_name" type="text"
        maxlength="150" required autocomplete="name"
        value="<?= htmlspecialchars($fullName, ENT_QUOTES, 'UTF-8') ?>">

      <label for="email">Email address</label>
      <input id="email" name="email" type="email"
        maxlength="190" required autocomplete="email"
        value="<?= htmlspecialchars($email, ENT_QUOTES, 'UTF-8') ?>">

      <label for="password">Password (at least 8 characters)</label>
      <input id="password" name="password" type="password"
        minlength="8" required autocomplete="new-password">

      <label for="confirm_password">Confirm password</label>
      <input id="confirm_password" name="confirm_password"
        type="password" minlength="8" required autocomplete="new-password">

      <button class="button button-primary" type="submit">
        Create account
      </button>
    </form>

    <p>Already registered? <a href="login.php">Log in</a></p>
    <p><a href="../index.html">← Return to Smart Library</a></p>
  </main>

  <footer class="footer">
    <a href="../index.html#home" class="brand">
      <span class="brand-icon">▤</span>
      <span>Smart<span class="brand-accent">Library</span></span>
    </a>

    <p>Read with purpose. Discover with curiosity.</p>
    <span>Smart Library · Local Demo</span>
  </footer>
</body>
</html>
