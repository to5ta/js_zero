<?php
$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['userId'];
$sessionStart = $data['sessionStart'];

$mysqli = new mysqli('<db-server>', '<db_user>', '<db_pass>', '<db_name>');

$stmt = $mysqli->prepare("INSERT INTO sessions (userId, sessionStart) VALUES (?, ?)");
$stmt->bind_param('ss', $userId, $sessionStart); 

$stmt->execute();
$sessionId = $stmt->insert_id;

header('Content-Type: application/json');
echo json_encode(['sessionId' => $sessionId]);

$stmt->close();
$mysqli->close();
?>