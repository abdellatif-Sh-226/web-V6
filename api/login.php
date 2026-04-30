<?php
require __DIR__ . '/bootstrap.php';
$data = getJsonBody();
$email = trim($data['email'] ?? '');
$pwd = $data['password'] ?? '';
if (!$email || !$pwd) {
    jsonResponse(['error' => 'Email et mot de passe requis'], 400);
}
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();
if (!$user || $user['password'] !== $pwd || $user['active'] == 0) {
    jsonResponse(['error' => 'Email ou mot de passe incorrect'], 401);
}
$_SESSION['user_id'] = $user['id'];
jsonResponse(['user' => mapUserRow($user)]);
