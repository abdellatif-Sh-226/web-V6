<?php
require __DIR__ . '/bootstrap.php';
$data = getJsonBody();
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$pwd = $data['password'] ?? '';

if (!$name || !$email || !$pwd) {
    jsonResponse(['error' => 'Tous les champs sont requis.'], 400);
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonResponse(['error' => 'Cet email est d\u00e9j\u00e0 utilis\u00e9.'], 409);
}

$id = bin2hex(random_bytes(16));
$stmt = $pdo->prepare('INSERT INTO users (id, name, email, password, role, active) VALUES (?, ?, ?, ?, ?, 1)');
$stmt->execute([$id, $name, $email, $pwd, 'user']);

$_SESSION['user_id'] = $id;

$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$user = $stmt->fetch();

jsonResponse(['user' => mapUserRow($user)]);
