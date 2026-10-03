<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data) || !isset($data['userId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'malformed request']);
    exit;
}

$userId = substr((string) $data['userId'], 0, 36);

// Capability token for this row. session_end.php only accepts an update that
// presents it, so a client can end the session it started and no other.
$token = bin2hex(random_bytes(16));

$mysqli = new mysqli('<db-server>', '<db-user>', '<db-pass>', '<db-name>');

// NOW() rather than a timestamp from the request: the client clock is whatever
// the player's device says, and the endpoint is reachable by anyone.
$stmt = $mysqli->prepare("INSERT INTO sessions (userId, sessionStart, token) VALUES (?, NOW(), ?)");
$stmt->bind_param('ss', $userId, $token);

$stmt->execute();
$sessionId = $stmt->insert_id;

echo json_encode(['sessionId' => $sessionId, 'token' => $token]);

$stmt->close();
$mysqli->close();
