<?php
$data = json_decode(file_get_contents('php://input'), true);
$sessionId = $data['sessionId'];
$sessionEnd = $data['sessionEnd'];

$mysqli = new mysqli('<db-server>', '<db_user>', '<db_pass>', '<db_name>');

$stmt = $mysqli->prepare("UPDATE sessions SET sessionEnd = ? WHERE sessionId = ?");
$stmt->bind_param('si', $sessionEnd, $sessionId);

$stmt->execute();

$stmt->close();
$mysqli->close();
?>