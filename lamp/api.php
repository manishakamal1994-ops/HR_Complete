<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

require_once 'db.php';

session_start();
header('Content-Type: application/json');

// Check active session keys
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Corporate session authorization is required."]);
    exit;
}

$currentUserEmail = strtolower($_SESSION['user_email']);
$currentUserName = $_SESSION['user_name'];
$currentUserRole = $_SESSION['user_role'];
$isPrivileged = ($currentUserRole === 'CEO' || $currentUserRole === 'HR' || $currentUserRole === 'Director');

$db = getDbConnection();
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';
$method = $_SERVER['REQUEST_METHOD'];

switch ($endpoint) {
    
    // --- USERS & DIRECTORY ---
    case 'users':
        if (!$isPrivileged) {
            http_response_code(403);
            echo json_encode(["error" => "Elevated privilege authorized credentials required."]);
            exit;
        }

        if ($method === 'GET') {
            $stmt = $db->query("SELECT id, name, email, role, status, created_at FROM users");
            echo json_encode($stmt->fetchAll());
        } elseif ($method === 'POST') {
            // Admin updates a user's role or status
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = isset($_GET['id']) ? intval($_GET['id']) : 0;
            
            if (isset($data['action']) && $data['action'] === 'approve') {
                $stmt = $db->prepare("UPDATE users SET status = 'approved' WHERE id = ?");
                $stmt->execute([$userId]);
                echo json_encode(["message" => "User approved successfully."]);
            } elseif (isset($data['role'])) {
                $stmt = $db->prepare("UPDATE users SET role = ? WHERE id = ?");
                $stmt->execute([$data['role'], $userId]);
                echo json_encode(["message" => "User role modernized."]);
            }
        } elseif ($method === 'DELETE') {
            $userId = isset($_GET['id']) ? intval($_GET['id']) : 0;
            // Prevent self delete
            if ($userId == $_SESSION['user_id']) {
                http_response_code(400);
                echo json_encode(["error" => "Removing your own active session keys is blocked."]);
                exit;
            }
            $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            echo json_encode(["message" => "User record purged from directory."]);
        }
        break;

    // --- RECRUITING & CANDIDATES ---
    case 'prospects':
        if ($method === 'GET') {
            if ($isPrivileged) {
                $stmt = $db->query("SELECT * FROM prospects ORDER BY id DESC");
                echo json_encode($stmt->fetchAll());
            } else {
                $stmt = $db->prepare("SELECT * FROM prospects WHERE email = ? ORDER BY id DESC");
                $stmt->execute([$currentUserEmail]);
                echo json_encode($stmt->fetchAll());
            }
        } elseif ($method === 'POST') {
            // Candidate applies or Admin updates candidate
            $data = json_decode(file_get_contents('php://input'), true);
            $prospectId = isset($_GET['id']) ? intval($_GET['id']) : 0;

            if ($prospectId > 0 && $isPrivileged) {
                // Admin updates recruitment stage
                $stmt = $db->prepare("UPDATE prospects SET stage = ? WHERE id = ?");
                $stmt->execute([$data['stage'], $prospectId]);
                echo json_encode(["message" => "Candidate pipeline stage revised."]);
            } else {
                // New Prospect Submit
                $name = isset($data['name']) ? trim($data['name']) : '';
                $email = isset($data['email']) ? strtolower(trim($data['email'])) : '';
                $phone = isset($data['phone']) ? trim($data['phone']) : '';
                $roleApplied = isset($data['roleApplied']) ? trim($data['roleApplied']) : '';
                $cvSummary = isset($data['cvSummary']) ? trim($data['cvSummary']) : '';

                if (empty($name) || empty($email) || empty($roleApplied)) {
                    http_response_code(400);
                    echo json_encode(["error" => "Name, Email, and Position are required fields."]);
                    exit;
                }

                $stmt = $db->prepare("INSERT INTO prospects (name, email, phone, role_applied, cv_summary) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$name, $email, $phone, $roleApplied, $cvSummary]);
                echo json_encode(["message" => "Applying prospect file queued securely."]);
            }
        } elseif ($method === 'DELETE' && $isPrivileged) {
            $prospectId = isset($_GET['id']) ? intval($_GET['id']) : 0;
            $stmt = $db->prepare("DELETE FROM prospects WHERE id = ?");
            $stmt->execute([$prospectId]);
            echo json_encode(["message" => "Candidate record flushed."]);
        }
        break;

    // --- RECRUIT INTERNAL CHAT ---
    case 'chats':
        $prospectId = isset($_GET['prospectId']) ? intval($_GET['prospectId']) : 0;

        if ($method === 'GET') {
            $stmt = $db->prepare("SELECT * FROM chats WHERE prospect_id = ? ORDER BY id ASC");
            $stmt->execute([$prospectId]);
            echo json_encode($stmt->fetchAll());
        } elseif ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $message = isset($data['message']) ? trim($data['message']) : '';

            if (empty($message)) {
                http_response_code(400);
                echo json_encode(["error" => "Reply block must have content."]);
                exit;
            }

            $stmt = $db->prepare("INSERT INTO chats (prospect_id, sender_name, sender_email, sender_role, message) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$prospectId, $currentUserName, $currentUserEmail, $currentUserRole, $message]);
            echo json_encode(["message" => "Dialogue appended."]);
        }
        break;

    // --- GRIEVANCES TICKETING ---
    case 'grievances':
        if ($method === 'GET') {
            if ($isPrivileged) {
                // Admins see all
                $stmt = $db->query("SELECT * FROM grievances ORDER BY id DESC");
                $list = $stmt->fetchAll();
            } else {
                // Standard users see only theirs
                $stmt = $db->prepare("SELECT * FROM grievances WHERE submitted_by_email = ? ORDER BY id DESC");
                $stmt->execute([$currentUserEmail]);
                $list = $stmt->fetchAll();
            }

            // Bind replies sub query
            foreach ($list as &$grievance) {
                $subStmt = $db->prepare("SELECT * FROM grievance_replies WHERE grievance_id = ? ORDER BY id ASC");
                $subStmt->execute([$grievance['id']]);
                $grievance['replies'] = $subStmt->fetchAll();
            }
            echo json_encode($list);
        } elseif ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $grievanceId = isset($_GET['id']) ? intval($_GET['id']) : 0;

            if ($grievanceId > 0 && $isPrivileged) {
                // Admin modifies status, category, severity
                $status = isset($data['status']) ? $data['status'] : null;
                $level = isset($data['level']) ? $data['level'] : null;
                $category = isset($data['category']) ? $data['category'] : null;

                if ($status) {
                    $stmt = $db->prepare("UPDATE grievances SET status = ? WHERE id = ?");
                    $stmt->execute([$status, $grievanceId]);
                }
                if ($level) {
                    $stmt = $db->prepare("UPDATE grievances SET level = ? WHERE id = ?");
                    $stmt->execute([$level, $grievanceId]);
                }
                if ($category) {
                    $stmt = $db->prepare("UPDATE grievances SET category = ? WHERE id = ?");
                    $stmt->execute([$category, $grievanceId]);
                }

                echo json_encode(["message" => "Grievance status modified."]);
            } else {
                // Raise new grievance ticket
                $title = isset($data['title']) ? trim($data['title']) : '';
                $description = isset($data['description']) ? trim($data['description']) : '';
                $category = isset($data['category']) ? trim($data['category']) : 'Work Environment';
                $level = isset($data['level']) ? trim($data['level']) : 'Medium';
                
                if (empty($title) || empty($description)) {
                    http_response_code(400);
                    echo json_encode(["error" => "Complete title and details descriptions."]);
                    exit;
                }

                $ticketNo = "GRV-" . rand(1000, 9999);
                $stmt = $db->prepare("INSERT INTO grievances (ticket_no, title, description, category, level, submitted_by_email, submitted_by_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$ticketNo, $title, $description, $category, $level, $currentUserEmail, $currentUserName]);
                
                echo json_encode([
                    "message" => "Incident ticket recorded successfully.",
                    "ticketNo" => $ticketNo
                ]);
            }
        }
        break;

    case 'grievance_replies':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $grievanceId = isset($_GET['grievanceId']) ? intval($_GET['grievanceId']) : 0;
            $message = isset($data['message']) ? trim($data['message']) : '';

            if (empty($message) || $grievanceId <= 0) {
                http_response_code(400);
                echo json_encode(["error" => "Reply statement cannot be empty."]);
                exit;
            }

            // Security guard check
            if (!$isPrivileged) {
                $check = $db->prepare("SELECT id FROM grievances WHERE id = ? AND submitted_by_email = ?");
                $check->execute([$grievanceId, $currentUserEmail]);
                if (!$check->fetch()) {
                    http_response_code(403);
                    echo json_encode(["error" => "Unauthorized access to incident file."]);
                    exit;
                }
            }

            $stmt = $db->prepare("INSERT INTO grievance_replies (grievance_id, sender_name, sender_email, sender_role, message) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$grievanceId, $currentUserName, $currentUserEmail, $currentUserRole, $message]);
            echo json_encode(["message" => "Comment submitted."]);
        }
        break;

    // --- SCHEDULER & ALERTS ---
    case 'schedules':
        if ($method === 'GET') {
            // Retrieve events
            $stmt = $db->query("SELECT * FROM schedules ORDER BY event_date ASC");
            echo json_encode($stmt->fetchAll());
        } elseif ($method === 'POST' && $isPrivileged) {
            $data = json_decode(file_get_contents('php://input'), true);
            $title = isset($data['title']) ? trim($data['title']) : '';
            $description = isset($data['description']) ? trim($data['description']) : '';
            $date = isset($data['date']) ? $data['date'] : '';
            $time = isset($data['time']) ? $data['time'] : '';
            $type = isset($data['type']) ? $data['type'] : 'Gathering';
            $targetAudience = isset($data['targetAudience']) ? $data['targetAudience'] : 'All';
            $specificPersonnel = isset($data['specificPersonnel']) ? $data['specificPersonnel'] : ''; // comma separated string

            if (empty($title) || empty($description) || empty($date)) {
                http_response_code(400);
                echo json_encode(["error" => "Missing scheduling calendar inputs."]);
                exit;
            }

            // Insert Event
            $stmt = $db->prepare("INSERT INTO schedules (title, description, event_date, event_time, type, target_audience, created_by_email, created_by_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $description, $date, $time, $type, $targetAudience, $currentUserEmail, $currentUserName]);
            $scheduleId = $db->lastInsertId();

            // Populate Alerts target loop
            $recipients = [];
            if ($targetAudience === 'All') {
                $userQuery = $db->query("SELECT email FROM users WHERE status = 'approved'");
                while ($u = $userQuery->fetch()) {
                    $recipients[] = $u['email'];
                }
            } else {
                $recipients = array_filter(array_map('trim', explode(',', $specificPersonnel)));
            }

            foreach ($recipients as $recipientEmail) {
                $alertText = "The HR department has scheduled a " . $type . ": " . $title . " on " . $date . " at " . $time . ". Please review.";
                $alertStmt = $db->prepare("INSERT INTO schedule_alerts (schedule_id, title, text, date_notified, for_user_email) VALUES (?, ?, ?, ?, ?)");
                $alertStmt->execute([$scheduleId, $title, $alertText, $date, strtolower($recipientEmail)]);
            }

            echo json_encode(["message" => "Calendar schedule item broadcasted."]);
        }
        break;

    case 'alerts':
        if ($method === 'GET') {
            $stmt = $db->prepare("SELECT * FROM schedule_alerts WHERE for_user_email = ? ORDER BY id DESC");
            $stmt->execute([$currentUserEmail]);
            echo json_encode($stmt->fetchAll());
        } elseif ($method === 'POST') {
            // Acknowledge Alert
            $alertId = isset($_GET['id']) ? intval($_GET['id']) : 0;
            $stmt = $db->prepare("UPDATE schedule_alerts SET status = 'acknowledged' WHERE id = ? AND for_user_email = ?");
            $stmt->execute([$alertId, $currentUserEmail]);
            echo json_encode(["message" => "Alert acknowledged."]);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(["error" => "Endpoint resource descriptor not identified."]);
        break;
}
