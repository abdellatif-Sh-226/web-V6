<?php
require __DIR__ . '/bootstrap.php';
requireAuth();
$currentUserId = getAuthUserId();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = getJsonBody();
$pendingId = $data['id'] ?? '';
$action = $data['action'] ?? '';

if (!$pendingId || !in_array($action, ['approve', 'reject'])) {
    jsonResponse(['error' => 'Missing id or invalid action'], 400);
}

// Get the pending transaction
$ptStmt = $pdo->prepare('SELECT * FROM pending_transactions WHERE id = ?');
$ptStmt->execute([$pendingId]);
$pending = $ptStmt->fetch();

if (!$pending) {
    jsonResponse(['error' => 'Pending transaction not found'], 404);
}

// Verify user has a pending approval for this
$approvalStmt = $pdo->prepare('SELECT * FROM pending_approvals WHERE pending_transaction_id = ? AND user_id = ?');
$approvalStmt->execute([$pendingId, $currentUserId]);
$approval = $approvalStmt->fetch();

if (!$approval) {
    jsonResponse(['error' => 'No pending approval found for this user'], 403);
}

if ($approval['status'] !== 'pending') {
    jsonResponse(['error' => 'You have already responded to this request'], 400);
}

try {
    $pdo->beginTransaction();

    // Update approval status
    $updateStmt = $pdo->prepare('UPDATE pending_approvals SET status = ?, responded_at = NOW() WHERE id = ?');
    $updateStmt->execute([$action, $approval['id']]);

    if ($action === 'reject') {
        // Update pending transaction status
        $pdo->prepare('UPDATE pending_transactions SET status = ? WHERE id = ?')->execute(['rejected', $pendingId]);

        // Get rejector name
        $rejectorName = $pdo->prepare('SELECT name FROM users WHERE id = ?');
        $rejectorName->execute([$currentUserId]);
        $rejector = $rejectorName->fetchColumn();

        // Get all group members
        $membersStmt = $pdo->prepare('SELECT user_id FROM shared_budget_members WHERE shared_budget_id = ?');
        $membersStmt->execute([$pending['group_id']]);
        $allMembers = $membersStmt->fetchAll();

        // Notify ALL group members about the rejection
        $notifStmt = $pdo->prepare('INSERT INTO notifications (id, user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($allMembers as $member) {
            $notifId = 'nt' . uniqid() . bin2hex(random_bytes(4));
            $title = "Dépense refusée";
            if ($member['user_id'] === $pending['user_id']) {
                $message = "$rejector a refusé votre dépense « {$pending['description']} » de " . number_format($pending['amount'], 2, ',', ' ') . " TND.";
            } else {
                $message = "$rejector a refusé la dépense « {$pending['description']} » de " . number_format($pending['amount'], 2, ',', ' ') . " TND.";
            }
            $notifStmt->execute([$notifId, $member['user_id'], 'rejected', $title, $message, $pendingId]);
        }
    } else {
        // Check if all members have approved
        $pendingApprovals = $pdo->prepare('SELECT COUNT(*) FROM pending_approvals WHERE pending_transaction_id = ? AND status = ?');
        $pendingApprovals->execute([$pendingId, 'pending']);
        $remaining = $pendingApprovals->fetchColumn();

        if ($remaining == 0) {
            // All approved! Move to real transactions
            $pdo->prepare('UPDATE pending_transactions SET status = ? WHERE id = ?')->execute(['approved', $pendingId]);

            $txId = 'tx' . uniqid() . bin2hex(random_bytes(4));
            $dest = 'group-' . $pending['group_id'];
            $txStmt = $pdo->prepare('INSERT INTO transactions (id, user_id, type, description, amount, date, category_id, notes, destination_type, destination_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $txStmt->execute([$txId, $pending['user_id'], $pending['type'], $pending['description'], $pending['amount'], $pending['date'], $pending['category_id'], $pending['notes'], 'group', $pending['group_id']]);

            // Notify all group members
            $membersStmt = $pdo->prepare('SELECT sbm.user_id, u.name FROM users u JOIN shared_budget_members sbm ON sbm.user_id = u.id WHERE sbm.shared_budget_id = ?');
            $membersStmt->execute([$pending['group_id']]);
            $members = $membersStmt->fetchAll();

            $notifStmt = $pdo->prepare('INSERT INTO notifications (id, user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?, ?)');
            foreach ($members as $member) {
                $notifId = 'nt' . uniqid() . bin2hex(random_bytes(4));
                $notifStmt->execute([$notifId, $member['user_id'], 'approved',
                    "Dépense approuvée",
                    "La dépense « {$pending['description']} » de " . number_format($pending['amount'], 2, ',', ' ') . " TND a été approuvée par tous les membres.",
                    $txId
                ]);
            }
        }
    }

    $pdo->commit();
    jsonResponse(['success' => true, 'status' => $action === 'approve' ? ($remaining == 0 ? 'approved' : 'pending') : 'rejected']);
} catch (Exception $e) {
    $pdo->rollBack();
    jsonResponse(['error' => 'Failed to process approval', 'details' => $e->getMessage()], 500);
}
?>