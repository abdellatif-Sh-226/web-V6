<?php
require __DIR__ . '/bootstrap.php';
requireAuth();
$currentUserId = getAuthUserId();

function fetchAll(PDO $pdo, string $sql) {
    return $pdo->query($sql)->fetchAll();
}

$users = array_map('mapUserRow', fetchAll($pdo, 'SELECT * FROM users'));
$categories = array_map('mapCategoryRow', fetchAll($pdo, 'SELECT * FROM categories'));
$transactions = array_map('mapTransactionRow', fetchAll($pdo, 'SELECT * FROM transactions'));
$budgets = array_map('mapBudgetRow', fetchAll($pdo, 'SELECT * FROM budgets'));

$sharedBudgetsRaw = fetchAll($pdo, 'SELECT * FROM shared_budgets');
$sharedBudgets = array_map(function ($row) use ($pdo) {
    return mapSharedBudgetRow($row, $pdo);
}, $sharedBudgetsRaw);

// Pending transactions visible to current user (via group membership)
$pendingStmt = $pdo->prepare("SELECT pt.* FROM pending_transactions pt
    JOIN shared_budget_members sbm ON sbm.shared_budget_id = pt.group_id
    WHERE sbm.user_id = ? ORDER BY pt.created_at DESC");
$pendingStmt->execute([$currentUserId]);
$pendingRows = $pendingStmt->fetchAll();
$pendingTransactions = array_map('mapPendingTransactionRow', $pendingRows);

// Attach approvals
foreach ($pendingTransactions as &$item) {
    $aStmt = $pdo->prepare('SELECT * FROM pending_approvals WHERE pending_transaction_id = ?');
    $aStmt->execute([$item['id']]);
    $item['approvals'] = $aStmt->fetchAll();
}

// Notifications for current user
$notifStmt = $pdo->prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
$notifStmt->execute([$currentUserId]);
$notifications = array_map('mapNotificationRow', $notifStmt->fetchAll());

$unreadStmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
$unreadStmt->execute([$currentUserId]);
$unreadCount = (int) $unreadStmt->fetchColumn();

$currentUser = null;
foreach ($users as $user) {
    if ($user['id'] === $currentUserId) {
        $currentUser = $user;
        break;
    }
}

jsonResponse([
    'currentUser' => $currentUser,
    'users' => $users,
    'categories' => $categories,
    'transactions' => $transactions,
    'budgets' => $budgets,
    'sharedBudgets' => $sharedBudgets,
    'pendingTransactions' => $pendingTransactions,
    'notifications' => $notifications,
    'unreadCount' => $unreadCount,
]);
