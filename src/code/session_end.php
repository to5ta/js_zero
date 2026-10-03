<?php
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data) || !isset($data['sessionId'], $data['token'])) {
    http_response_code(400);
    exit;
}

$sessionId = (int) $data['sessionId'];
$token = substr((string) $data['token'], 0, 32);

$mysqli = new mysqli('<db-server>', '<db-user>', '<db-pass>', '<db-name>');

// The token scopes the update to the session this client started. Without it
// any caller could rewrite any row by counting sessionId up from 1. Rows
// predating the token column hold NULL and never match.
// NOW() for the same reason as in session_start.php.
$stmt = $mysqli->prepare("UPDATE sessions SET sessionEnd = NOW() WHERE sessionId = ? AND token = ?");
$stmt->bind_param('is', $sessionId, $token);

$stmt->execute();

// Always the same answer, so the endpoint cannot be used to probe which
// sessionId/token pairs exist.
http_response_code(204);

$stmt->close();
$mysqli->close();
