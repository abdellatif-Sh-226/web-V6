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
            // Use UPSERT instead of DELETE + INSERT
            $stmt = $pdo->prepare('INSERT INTO categories (id, name, color, owner_id, shared_budget_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name=VALUES(name), color=VALUES(color), owner_id=VALUES(owner_id), shared_budget_id=VALUES(shared_budget_id), updated_at=VALUES(updated_at)');
            foreach ($data as $item) {
                $stmt->execute([
                    $item['id'], $item['name'], $item['color'], $item['ownerId'] ?? null, $item['groupId'] ?? null,
                    $item['createdAt'] ?? date('Y-m-d H:i:s'), $item['updatedAt'] ?? date('Y-m-d H:i:s')
                ]);
            }
            break;
        case 'transactions':
            // Use UPSERT instead of DELETE + INSERT to preserve other users' data
            $stmt = $pdo->prepare('INSERT INTO transactions (id, user_id, type, description, amount, date, category_id, notes, destination_type, destination_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE type=VALUES(type), description=VALUES(description), amount=VALUES(amount), date=VALUES(date), category_id=VALUES(category_id), notes=VALUES(notes), destination_type=VALUES(destination_type), destination_id=VALUES(destination_id), updated_at=VALUES(updated_at)');
            foreach ($data as $item) {
                $destType = 'wallet';
                $destId = null;
                
                // Parse destination from the 'dest' field (e.g., 'group-id123', 'budget-id456', 'wallet')
                if (!empty($item['dest']) && $item['dest'] !== 'wallet') {
                    $parts = explode('-', $item['dest'], 2);
                    if (count($parts) === 2 && !empty($parts[0]) && !empty($parts[1])) {
                        $destType = $parts[0];  // 'group', 'budget', etc.
                        $destId = $parts[1];    // the ID
                    } else {
                        // Malformed dest field, use default
                        error_log('Warning: Malformed dest field in transaction: ' . $item['dest']);
                    }
                }
                
                $stmt->execute([
                    $item['id'], $item['userId'], $item['type'], $item['desc'], $item['amount'], $item['date'], $item['catId'] ?? null,
                    $item['notes'] ?? '', $destType, $destId, $item['createdAt'] ?? date('Y-m-d H:i:s'), $item['updatedAt'] ?? date('Y-m-d H:i:s')
                ]);
            }
            break;
        case 'budgets':
            // Use UPSERT instead of DELETE + INSERT
            $stmt = $pdo->prepare('INSERT INTO budgets (id, user_id, name, period, limit_amount, category_id, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), name=VALUES(name), period=VALUES(period), limit_amount=VALUES(limit_amount), category_id=VALUES(category_id), start_date=VALUES(start_date), end_date=VALUES(end_date), updated_at=VALUES(updated_at)');
            foreach ($data as $item) {
                $stmt->execute([
                    $item['id'], $item['userId'], $item['name'], $item['period'], $item['limit'], $item['catId'] ?: null,
                    $item['start'], $item['end'], $item['createdAt'] ?? date('Y-m-d H:i:s'), $item['updatedAt'] ?? date('Y-m-d H:i:s')
                ]);
            }
            break;
        case 'sharedBudgets':
            // Use UPSERT for shared_budgets - we'll handle members separately
            $stmt = $pdo->prepare('INSERT INTO shared_budgets (id, owner_id, name, description, limit_amount, locked, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE owner_id=VALUES(owner_id), name=VALUES(name), description=VALUES(description), limit_amount=VALUES(limit_amount), locked=VALUES(locked), updated_at=VALUES(updated_at)');
            
            foreach ($data as $item) {
                $stmt->execute([
                    $item['id'], $item['ownerId'], $item['name'], $item['desc'] ?? '', $item['limit'], $item['locked'] ? 1 : 0,
                    $item['createdAt'] ?? date('Y-m-d H:i:s'), $item['updatedAt'] ?? date('Y-m-d H:i:s')
                ]);
                
                // Delete old members for this shared budget and re-add them
                $delMembersStmt = $pdo->prepare('DELETE FROM shared_budget_members WHERE shared_budget_id = ?');
                $delMembersStmt->execute([$item['id']]);
                
                // Add new members
                $memberStmt = $pdo->prepare('INSERT INTO shared_budget_members (shared_budget_id, user_id) VALUES (?, ?)');
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
