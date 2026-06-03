<?php
require __DIR__ . '/bootstrap.php';
requireAuth();
$currentUserId = getAuthUserId();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $includeRead = isset($_GET['all']) && $_GET['all'] === '1';
    $sql = $includeRead
        ? 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
        : 'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$currentUserId]);
    $rows = $stmt->fetchAll();

    $unreadStmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
    $unreadStmt->execute([$currentUserId]);
    $unreadCount = (int) $unreadStmt->fetchColumn();

    jsonResponse([
        'notifications' => array_map('mapNotificationRow', $rows),
        'unreadCount' => $unreadCount
    ]);
}

if ($method === 'POST') {
    $data = getJsonBody();
    $id = $data['id'] ?? '';

    if ($id === 'all') {
        $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?');
        $stmt->execute([$currentUserId]);
    } elseif ($id) {
        $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $currentUserId]);
    } else {
        jsonResponse(['error' => 'Missing notification id'], 400);
    }

    jsonResponse(['success' => true]);
}
?>