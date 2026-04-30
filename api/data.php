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
]);
