<?php
require __DIR__ . '/bootstrap.php';
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? '';

if (!$id) {
    jsonResponse(['error' => 'Transaction ID is required'], 400);
}

try {
    $pdo->beginTransaction();

    // Get the transaction to verify ownership
    $stmt = $pdo->prepare('SELECT user_id FROM transactions WHERE id = ?');
    $stmt->execute([$id]);
    $transaction = $stmt->fetch();

    if (!$transaction) {
        jsonResponse(['error' => 'Transaction not found'], 404);
    }

    $currentUserId = getAuthUserId();

    // Check if user can delete this transaction (own transaction or admin)
    if ($transaction['user_id'] !== $currentUserId) {
        $userStmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
        $userStmt->execute([$currentUserId]);
        $user = $userStmt->fetch();

        if (!$user || $user['role'] !== 'admin') {
            jsonResponse(['error' => 'Unauthorized to delete this transaction'], 403);
        }
    }

    // Delete the transaction
    $deleteStmt = $pdo->prepare('DELETE FROM transactions WHERE id = ?');
    $deleteStmt->execute([$id]);

    $pdo->commit();
    jsonResponse(['success' => true]);

} catch (Exception $e) {
    $pdo->rollBack();
    jsonResponse(['error' => 'Failed to delete transaction', 'details' => $e->getMessage()], 500);
}
?>