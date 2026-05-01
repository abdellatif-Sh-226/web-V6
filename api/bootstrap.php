<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

$dbHost = '127.0.0.1';
$dbName = 'budgetcollab';
$dbUser = 'root';
$dbPass = '';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
    exit;
}

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function getJsonBody() {
    $body = file_get_contents('php://input');
    return json_decode($body, true) ?: [];
}

function getAuthUserId() {
    return $_SESSION['user_id'] ?? null;
}

function requireAuth() {
    if (!getAuthUserId()) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
}

function mapUserRow(array $row) {
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'pwd' => $row['password'],
        'role' => $row['role'],
        'active' => (bool) $row['active'],
        'deleteRequest' => (bool) $row['delete_request'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function mapCategoryRow(array $row) {
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'color' => $row['color'],
        'ownerId' => $row['owner_id'] ?? null,
        'groupId' => $row['shared_budget_id'] ?? null,
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function mapBudgetRow(array $row) {
    return [
        'id' => $row['id'],
        'userId' => $row['user_id'],
        'name' => $row['name'],
        'period' => $row['period'],
        'limit' => (float) $row['limit_amount'],
        'catId' => $row['category_id'] ?? '',
        'start' => $row['start_date'],
        'end' => $row['end_date'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function mapTransactionRow(array $row) {
    $dest = 'wallet'; // Default destination
    if (!empty($row['destination_type'])) {
        $dest = $row['destination_type'];
        if (!empty($row['destination_id'])) {
            $dest .= '-' . $row['destination_id'];
        }
    } elseif (!empty($row['destination_id'])) {
        // Fallback: if we have an ID but no type, try to infer the type from ID format
        // If the ID looks like it's from shared_budgets, default to 'group'
        $dest = 'group-' . $row['destination_id'];
    }
    return [
        'id' => $row['id'],
        'userId' => $row['user_id'],
        'type' => $row['type'],
        'desc' => $row['description'],
        'amount' => (float) $row['amount'],
        'date' => $row['date'],
        'catId' => $row['category_id'] ?? null,
        'notes' => $row['notes'],
        'dest' => $dest,
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function mapSharedBudgetRow(array $row, PDO $pdo) {
    $stmt = $pdo->prepare('SELECT user_id FROM shared_budget_members WHERE shared_budget_id = ?');
    $stmt->execute([$row['id']]);
    $members = array_column($stmt->fetchAll(), 'user_id');
    return [
        'id' => $row['id'],
        'ownerId' => $row['owner_id'],
        'name' => $row['name'],
        'desc' => $row['description'],
        'limit' => (float) $row['limit_amount'],
        'locked' => (bool) $row['locked'],
        'members' => $members,
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}
