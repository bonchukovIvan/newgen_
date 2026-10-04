<?php
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

function respond(int $status, string $message): never {
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    $safe = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Contact</title><body style="font-family:system-ui;padding:10%;max-width:650px"><h1>' . $safe . '</h1><a href="/">Back to website</a></body></html>';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, 'Method not allowed.');
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 16000) respond(413, 'Message too large.');
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $originHost = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
    $host = explode(':', $_SERVER['HTTP_HOST'] ?? '')[0];
    if (!$originHost || strcasecmp($originHost, $host) !== 0) respond(403, 'Origin not allowed.');
}
if (!empty($_POST['website'])) respond(200, 'Thank you for getting in touch.');

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));
if (strlen($name) < 2 || strlen($name) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254 || strlen($phone) > 50 || strlen($message) < 10 || strlen($message) > 5000) {
    respond(400, 'Please provide a name, valid email and a message of 10–5000 characters.');
}

$dataDir = dirname(__DIR__) . '/data';
if (!is_dir($dataDir) && !mkdir($dataDir, 0700, true) && !is_dir($dataDir)) respond(500, 'Unable to save the message.');
$limitFile = fopen($dataDir . '/limits.json', 'c+');
if (!$limitFile || !flock($limitFile, LOCK_EX)) respond(500, 'Unable to save the message.');
$limits = json_decode(stream_get_contents($limitFile) ?: '{}', true);
if (!is_array($limits)) $limits = [];
$now = time();
$key = hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
$entry = $limits[$key] ?? ['count' => 0, 'expires' => 0];
if (($entry['expires'] ?? 0) > $now && ($entry['count'] ?? 0) >= 5) {
    flock($limitFile, LOCK_UN);
    fclose($limitFile);
    respond(429, 'Too many messages. Please try again later.');
}
$limits[$key] = ($entry['expires'] ?? 0) > $now ? ['count' => $entry['count'] + 1, 'expires' => $entry['expires']] : ['count' => 1, 'expires' => $now + 600];
foreach ($limits as $ip => $value) if (($value['expires'] ?? 0) <= $now) unset($limits[$ip]);
rewind($limitFile);
ftruncate($limitFile, 0);
fwrite($limitFile, json_encode($limits, JSON_THROW_ON_ERROR));
fflush($limitFile);
flock($limitFile, LOCK_UN);
fclose($limitFile);

$record = ['name' => $name, 'email' => $email, 'phone' => $phone, 'message' => $message, 'createdAt' => gmdate('c')];
$contacts = fopen($dataDir . '/contacts.jsonl', 'ab');
if (!$contacts || !flock($contacts, LOCK_EX)) respond(500, 'Unable to save the message.');
$written = fwrite($contacts, json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n");
fflush($contacts);
flock($contacts, LOCK_UN);
fclose($contacts);
if ($written === false) respond(500, 'Unable to save the message.');
respond(200, 'Thank you for getting in touch.');
