<?php
require __DIR__ . '/bootstrap.php';
requireAuth();
$entity = $_GET['entity'] ?? '';
$data = getJsonBody();
if (!$entity || !is_array($data)) {
    jsonResponse(['error' => 'Entity and payload are required'], 400);
}

try {
    $pdo->beginTransaction();
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    switch ($entity) {
        case 'users':
            $pdo->exec('DELETE FROM users');
            $stmt = $pdo->prepare('INSERT INTO users (id, name, email, password, role, active, delete_request, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            foreach ($data as $item) {
                $stmt->execute([
                    $item['id'], $item['name'], $item['email'], $item['pwd'], $item['role'], $item['active'] ? 1 : 0,
                    $item['deleteRequest'] ? 1 : 0, $item['createdAt'] ?? date('Y-m-d H:i:s'), $item['updatedAt'] ?? date('Y-m-d H:i:s')
                ]);
            }
            break;
        case 'categories':
            $pdo->exec('DELETE FROM categories');
            $stmt = $pdo->prepare('INSERT INTO categories (id, name, color, owner_id, shared_budget_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
            foreach ($data as $item) {
                $stmt->execute([
                    $item['id'], $item['name'], $item['color'], $item['ownerId'] ?? null, $item['groupId'] ?? null,
                    $item['createdAt'] ?? date('Y-m-d H:i:s'), $item['updatedAt'] ?? date('Y-m-d H:i:s')
                ]);
            }
            break;
        case 'transactions':
            $pdo->exec('DELETE FROM transactions');
            $stmt = $pdo->prepare('INSERT INTO transactions (id, user_id, type, description, amount, date, category_id, notes, destination_type, destination_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            foreach ($data as $item) {
                $destType = 'wallet';
                $destId = null;
                if (!empty($item['dest']) && $item['dest'] !== 'wallet') {
                    [$type, $id] = explode('-', $item['dest'], 2);
                    $destType = $type;
                    $destId = $id;
                }
                $stmt->execute([
                    $item['id'], $item['userId'], $item['type'], $item['desc'], $item['amount'], $item['date'], $item['catId'] ?? null,
                    $item['notes'] ?? '', $destType, $destId, $item['createdAt'] ?? date('Y-m-d H:i:s'), $item['updatedAt'] ?? date('Y-m-d H:i:s')
                ]);
            }
            break;
        case 'budgets':
            $pdo->exec('DELETE FROM budgets');
            $stmt = $pdo->prepare('INSERT INTO budgets (id, user_id, name, period, limit_amount, category_id, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            foreach ($data as $item) {
                $stmt->execute([
                    $item['id'], $item['userId'], $item['name'], $item['period'], $item['limit'], $item['catId'] ?: null,
                    $item['start'], $item['end'], $item['createdAt'] ?? date('Y-m-d H:i:s'), $item['updatedAt'] ?? date('Y-m-d H:i:s')
                ]);
            }
            break;
        case 'sharedBudgets':
            $pdo->exec('DELETE FROM shared_budget_members');
            $pdo->exec('DELETE FROM shared_budgets');
            $stmt = $pdo->prepare('INSERT INTO shared_budgets (id, owner_id, name, description, limit_amount, locked, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $memberStmt = $pdo->prepare('INSERT INTO shared_budget_members (shared_budget_id, user_id) VALUES (?, ?)');
            foreach ($data as $item) {
                $stmt->execute([
                    $item['id'], $item['ownerId'], $item['name'], $item['desc'] ?? '', $item['limit'], $item['locked'] ? 1 : 0,
                    $item['createdAt'] ?? date('Y-m-d H:i:s'), $item['updatedAt'] ?? date('Y-m-d H:i:s')
                ]);
                foreach ($item['members'] ?? [] as $memberId) {
                    $memberStmt->execute([$item['id'], $memberId]);
                }
            }
            break;
        default:
            jsonResponse(['error' => 'Unknown entity'], 400);
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
    $pdo->commit();
    jsonResponse(['success' => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    jsonResponse(['error' => 'Unable to save data', 'details' => $e->getMessage()], 500);
}
