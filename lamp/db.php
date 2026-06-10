<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Edit these database parameters to match your Apache MySQL configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'hr_department_db');
define('DB_USER', 'root');
define('DB_PASS', '');

function getDbConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        
        // Ensure Database exists
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
        $pdo->exec("USE `" . DB_NAME . "`;");
        
        // Auto-provision tables if required
        createDatabaseSchema($pdo);
        
        return $pdo;
    } catch (\PDOException $e) {
        // Return a JSON output or error gracefully
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
        exit;
    }
}

function createDatabaseSchema($pdo) {
    // 1. Users Roster
    $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `email` VARCHAR(100) NOT NULL UNIQUE,
        `password_hash` VARCHAR(255) NOT NULL,
        `role` ENUM('HR', 'Director', 'CEO', 'Employee') DEFAULT 'Employee',
        `status` ENUM('pending', 'approved') DEFAULT 'pending',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;");

    // Seed default admin CEO: manishakamal1994@gmail.com with Password: Admin123!
    $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $check->execute(['manishakamal1994@gmail.com']);
    if (!$check->fetch()) {
        $hash = password_hash('Admin123!', PASSWORD_BCRYPT);
        $insert = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)");
        $insert->execute(['Manisha Kamal', 'manishakamal1994@gmail.com', $hash, 'CEO', 'approved']);
    }

    // 2. Prospects CV Sourcing
    $pdo->exec("CREATE TABLE IF NOT EXISTS `prospects` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `email` VARCHAR(100) NOT NULL,
        `phone` VARCHAR(30) NULL,
        `role_applied` VARCHAR(100) NOT NULL,
        `cv_summary` TEXT NOT NULL,
        `stage` ENUM('Prospect', 'Contacted', 'Interviewing', 'Offered', 'Rejected') DEFAULT 'Prospect',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;");

    // 3. Candidate Chats log
    $pdo->exec("CREATE TABLE IF NOT EXISTS `chats` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `prospect_id` INT NOT NULL,
        `sender_name` VARCHAR(100) NOT NULL,
        `sender_email` VARCHAR(100) NOT NULL,
        `sender_role` VARCHAR(30) NOT NULL,
        `message` TEXT NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;");

    // 4. Grievance tickets
    $pdo->exec("CREATE TABLE IF NOT EXISTS `grievances` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `ticket_no` VARCHAR(20) NOT NULL UNIQUE,
        `title` VARCHAR(255) NOT NULL,
        `description` TEXT NOT NULL,
        `category` VARCHAR(100) NOT NULL,
        `level` ENUM('Low', 'Medium', 'High', 'Escalated') DEFAULT 'Medium',
        `status` ENUM('Open', 'Under Review', 'Escalated', 'Closed') DEFAULT 'Open',
        `submitted_by_email` VARCHAR(100) NOT NULL,
        `submitted_by_name` VARCHAR(100) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;");

    // 5. Grievances Replies Thread
    $pdo->exec("CREATE TABLE IF NOT EXISTS `grievance_replies` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `grievance_id` INT NOT NULL,
        `sender_name` VARCHAR(100) NOT NULL,
        `sender_email` VARCHAR(100) NOT NULL,
        `sender_role` VARCHAR(30) NOT NULL,
        `message` TEXT NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;");

    // 6. Schedules Block
    $pdo->exec("CREATE TABLE IF NOT EXISTS `schedules` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `title` VARCHAR(255) NOT NULL,
        `description` TEXT NOT NULL,
        `event_date` DATE NOT NULL,
        `event_time` TIME NOT NULL,
        `type` ENUM('Event', 'Meeting', 'Festival', 'Gathering') DEFAULT 'Gathering',
        `target_audience` ENUM('All', 'Specific Employees') DEFAULT 'All',
        `created_by_email` VARCHAR(100) NOT NULL,
        `created_by_name` VARCHAR(100) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;");

    // 7. Schedule Alerts Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `schedule_alerts` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `schedule_id` INT NOT NULL,
        `title` VARCHAR(255) NOT NULL,
        `text` TEXT NOT NULL,
        `date_notified` DATE NOT NULL,
        `for_user_email` VARCHAR(100) NOT NULL,
        `status` ENUM('unread', 'acknowledged') DEFAULT 'unread',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;");
}
