<?php
require __DIR__ . '/bootstrap.php';
requireAuth();
$currentUserId = getAuthUserId();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT pt.* FROM pending_transactions pt
        JOIN shared_budget_members sbm ON sbm.shared_budget_id = pt.group_id
        WHERE sbm.user_id = ? ORDER BY pt.created_at DESC");
    $stmt->execute([$currentUserId]);
    $rows = $stmt->fetchAll();
    $items = array_map('mapPendingTransactionRow', $rows);

    // Attach approvals to each pending transaction
    foreach ($items as &$item) {
        $aStmt = $pdo->prepare('SELECT * FROM pending_approvals WHERE pending_transaction_id = ?');
        $aStmt->execute([$item['id']]);
        $item['approvals'] = $aStmt->fetchAll();
    }
    jsonResponse($items);
}

if ($method === 'POST') {
    $data = getJsonBody();
    $id = $data['id'] ?? null;
    $groupId = $data['groupId'] ?? '';
    $desc = $data['desc'] ?? '';
    $amount = $data['amount'] ?? 0;
    $date = $data['date'] ?? date('Y-m-d');
    $catId = $data['catId'] ?? null;
    $notes = $data['notes'] ?? '';

    if (!$id || !$groupId || !$desc || !$amount) {
        jsonResponse(['error' => 'Missing required fields'], 400);
    }

    // Verify user is member of this group
    $memberStmt = $pdo->prepare('SELECT * FROM shared_budget_members WHERE shared_budget_id = ? AND user_id = ?');
    $memberStmt->execute([$groupId, $currentUserId]);
    if (!$memberStmt->fetch()) {
        jsonResponse(['error' => 'You are not a member of this group'], 403);
    }

    try {
        $pdo->beginTransaction();

        // Insert pending transaction
        $stmt = $pdo->prepare('INSERT INTO pending_transactions (id, group_id, user_id, type, description, amount, date, category_id, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$id, $groupId, $currentUserId, 'expense', $desc, $amount, $date, $catId, $notes, 'pending']);

        // Get all group members except creator
        $membersStmt = $pdo->prepare('SELECT user_id FROM shared_budget_members WHERE shared_budget_id = ? AND user_id != ?');
        $membersStmt->execute([$groupId, $currentUserId]);
        $members = $membersStmt->fetchAll();

        // Create approval records for each member
        $approvalStmt = $pdo->prepare('INSERT INTO pending_approvals (id, pending_transaction_id, user_id, status) VALUES (?, ?, ?, ?)');
        foreach ($members as $member) {
            $approvalId = 'ap' . uniqid() . bin2hex(random_bytes(4));
            $approvalStmt->execute([$approvalId, $id, $member['user_id'], 'pending']);
        }

        // Create notifications for all group members except creator
        $notifStmt = $pdo->prepare('INSERT INTO notifications (id, user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?, ?)');
        $creatorName = $pdo->prepare('SELECT name FROM users WHERE id = ?');
        $creatorName->execute([$currentUserId]);
        $creator = $creatorName->fetchColumn();

        foreach ($members as $member) {
            $notifId = 'nt' . uniqid() . bin2hex(random_bytes(4));
            $title = "Approbation requise";
            $message = "$creator a ajouté une dépense de " . number_format($amount, 2, ',', ' ') . " TND (« $desc ») dans le budget partagé. Merci de l'approuver ou la refuser.";
            $notifStmt->execute([$notifId, $member['user_id'], 'pending_approval', $title, $message, $id]);
        }

        // Notify the creator that their request was submitted
        $notifId = 'nt' . uniqid() . bin2hex(random_bytes(4));
        $notifStmt->execute([$notifId, $currentUserId, 'info',
            "Demande envoyée",
            "Votre dépense « $desc » de " . number_format($amount, 2, ',', ' ') . " TND est en attente d'approbation par les membres du groupe.",
            $id
        ]);

        $pdo->commit();
        jsonResponse(['success' => true, 'pendingId' => $id]);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Failed to create pending transaction', 'details' => $e->getMessage()], 500);
    }
}
?>