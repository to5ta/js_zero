-- Playtime telemetry table behind src/code/session_start.php and session_end.php.
-- The table itself lives on the webhost, not in this repo; this file records
-- what the endpoints expect of it.

-- Migration: run this BEFORE deploying the token change. Until the column
-- exists, session_start.php fails on the unknown column and no session is
-- recorded at all.
--
-- The column is nullable on purpose. Rows written before this migration keep
-- NULL, and `WHERE token = ?` never matches NULL, so nobody can close an old
-- session by sending an empty token.
ALTER TABLE sessions ADD COLUMN token CHAR(32) NULL;

-- Shape the endpoints assume, for a fresh install:
--
-- CREATE TABLE sessions (
--     sessionId    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--     userId       CHAR(36)     NOT NULL,
--     sessionStart DATETIME     NOT NULL,
--     sessionEnd   DATETIME     NULL,
--     token        CHAR(32)     NULL
-- );
