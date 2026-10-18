<?php
declare(strict_types=1);

session_start();
require_once __DIR__ . '/../config/db.php';

$error = '';
$email = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = strtolower(trim($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        $error = 'Enter your email and password.';
    } else {
        try {
            $statement = $pdo->prepare(
                'SELECT id, full_name, email, password_hash, role
                 FROM users WHERE email = ? LIMIT 1'
            );
            $statement->execute([$email]);
            $user = $statement->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                session_regenerate_id(true);

                $_SESSION['user_id'] = (int) $user['id'];
                $_SESSION['user_name'] = $user['full_name'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_role'] = $user['role'];

                header('Location: profile.php');
                exit;
            }

            // Do not reveal whether an email exists.
            $error = 'Invalid email or password.';
        } catch (PDOException $e) {
            error_log('Login error: ' . $e->getMessage());
            $error = 'Login is temporarily unavailable. Please try again.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Log In | Smart Library</title>
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
    <h1>Welcome back</h1>
    <p>Log in to your Smart Library account.</p>

    <?php if (isset($_GET['registered'])): ?>
      <p class="success">Account created! You can now log in.</p>
    <?php endif; ?>

    <?php if ($error !== ''): ?>
      <p class="error" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>

    <form method="post" action="login.php">
      <label for="email">Email address</label>
      <input id="email" name="email" type="email"
        maxlength="190" required autocomplete="email"
        value="<?= htmlspecialchars($email, ENT_QUOTES, 'UTF-8') ?>">

      <label for="password">Password</label>
      <input id="password" name="password" type="password"
        required autocomplete="current-password">

      <button class="button button-primary" type="submit">Log in</button>
    </form>

    <p>New to Smart Library? <a href="register.php">Create an account</a></p>
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
