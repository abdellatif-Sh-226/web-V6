<?php
/**
 * Data Migration Script
 * This script fixes transactions that have NULL destination_type but have a destination_id
 * These are typically group/budget transactions that were saved incorrectly
 * 
 * Run this once to clean up existing bad data in the database
 */

require __DIR__ . '/bootstrap.php';

try {
    // Fix transactions with NULL destination_type but with destination_id set
    // These should be group transactions
    $sql = "UPDATE transactions 
            SET destination_type = 'group' 
            WHERE destination_type IS NULL 
            AND destination_id IS NOT NULL 
            AND destination_id != ''";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $affected = $stmt->rowCount();
    
    echo json_encode([
        'success' => true,
        'message' => "Fixed $affected transaction(s)",
        'details' => "Transactions with NULL destination_type have been updated to 'group'"
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Migration failed',
        'details' => $e->getMessage()
    ]);
}
?>
