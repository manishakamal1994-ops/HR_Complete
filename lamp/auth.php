<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

require_once 'db.php';

session_start();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($method === 'POST') {
    $db = getDbConnection();
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'login') {
        $email = isset($data['email']) ? strtolower(trim($data['email'])) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(["error" => "Email and password are required fields."]);
            exit;
        }

        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $userRecord = $stmt->fetch();

        if (!$userRecord || !password_verify($password, $userRecord['password_hash'])) {
            http_response_code(401);
            echo json_encode(["error" => "Invalid company email or secure password."]);
            exit;
        }

        if ($userRecord['status'] === 'pending') {
            http_response_code(403);
            echo json_encode(["error" => "Your account is still pending approval by an administrator."]);
            exit;
        }

        // Setup session
        $_SESSION['user_id'] = $userRecord['id'];
        $_SESSION['user_name'] = $userRecord['name'];
        $_SESSION['user_email'] = $userRecord['email'];
        $_SESSION['user_role'] = $userRecord['role'];

        echo json_encode([
            "message" => "Login successful!",
            "user" => [
                "id" => $userRecord['id'],
                "name" => $userRecord['name'],
                "email" => $userRecord['email'],
                "role" => $userRecord['role'],
                "status" => $userRecord['status']
            ]
        ]);
        exit;
    }

    if ($action === 'register') {
        $name = isset($data['name']) ? trim($data['name']) : '';
        $email = isset($data['email']) ? strtolower(trim($data['email'])) : '';
        $password = isset($data['password']) ? $data['password'] : '';
        $role = isset($data['role']) ? $data['role'] : 'Employee';

        if (empty($name) || empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(["error" => "Complete the full name, email, and password parameters."]);
            exit;
        }

        // Validate unique email
        $check = $db->prepare("SELECT id FROM users WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "An account with this email is already registered."]);
            exit;
        }

        // Default admin check
        $isDefaultAdmin = ($email === 'manishakamal1994@gmail.com');
        $status = $isDefaultAdmin ? 'approved' : 'pending';
        $assignedRole = $isDefaultAdmin ? 'CEO' : $role;

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $insert = $db->prepare("INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)");
        $insert->execute([$name, $email, $passwordHash, $assignedRole, $status]);

        $newUserId = $db->lastInsertId();

        echo json_encode([
            "message" => $isDefaultAdmin 
                ? "Admin CEO profile registered and auto-approved instantly!" 
                : "Application file registered successfully! Awaiting board administrator authorization.",
            "user" => [
                "id" => $newUserId,
                "name" => $name,
                "email" => $email,
                "role" => $assignedRole,
                "status" => $status
            ]
        ]);
        exit;
    }
}

if ($method === 'GET' && $action === 'me') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            "logged_in" => true,
            "user" => [
                "id" => $_SESSION['user_id'],
                "name" => $_SESSION['user_name'],
                "email" => $_SESSION['user_email'],
                "role" => $_SESSION['user_role'],
                "status" => "approved"
            ]
        ]);
    } else {
        echo json_encode(["logged_in" => false]);
    }
    exit;
}

if ($method === 'GET' && $action === 'logout') {
    session_destroy();
    echo json_encode(["message" => "Logged out successfully"]);
    exit;
}

http_response_code(404);
echo json_encode(["error" => "Auth action endpoint not verified."]);
