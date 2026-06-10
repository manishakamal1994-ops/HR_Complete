# HR Department Portal: LAMP Deployment Package

This directory contains a complete clone of the HR Associate Portal designed specifically for standard **LAMP** (Linux, Apache, MySQL, PHP) hosting architectures.

## Architecture & Features

The LAMP stack application mirrors our React fullstack features:
1. **`db.php`**: Secure database connections using PHP PDO to prevent SQL Injection.
2. **`auth.php`**: Handshakes registration, sign-ins, and multi-role pending authorization with state hashing (`password_hash` and `password_verify`).
3. **`api.php`**: Standard JSON REST controller dealing with candidates, recruitment, grievances ticketing, scheduler calendar items, and notification alerts.
4. **`index.php`**: A modern UI styled with Tailwind CSS via CDN. Leverages Javascript Fetch/AJAX queries to deliver responsive, in-place app states.

---

## 1. Database Creation (MySQL Schema)

Run the following DDL query inside your MySQL database panel or CLI to create the structured multi-role HR database:

```sql
CREATE DATABASE IF NOT EXISTS `hr_department_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hr_department_db`;

-- Users & Administrative authentication
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('HR', 'Director', 'CEO', 'Employee') DEFAULT 'Employee',
  `status` ENUM('pending', 'approved') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default pre-seeded high-privilege Administrator (CEO)
INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `status`)
VALUES ('Manisha Kamal', 'manishakamal1994@gmail.com', '$2y$10$W19KkLwT6R/UeX72D98W6eYfVpUzD1V/R8G7S8C8FqC8KzTux9E3C', 'CEO', 'approved')
ON DUPLICATE KEY UPDATE `email` = `email`;
-- Default password: Admin123! (Properly hashed using BCRYPT)

-- Candidates / Prospects pipelines
CREATE TABLE IF NOT EXISTS `prospects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `role_applied` VARCHAR(100) NOT NULL,
  `cv_summary` TEXT NOT NULL,
  `stage` ENUM('Prospect', 'Contacted', 'Interviewing', 'Offered', 'Rejected') DEFAULT 'Prospect',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Internal recruiting chat logs
CREATE TABLE IF NOT EXISTS `chats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `prospect_id` INT NOT NULL,
  `sender_name` VARCHAR(100) NOT NULL,
  `sender_email` VARCHAR(100) NOT NULL,
  `sender_role` VARCHAR(30) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Incident grievances
CREATE TABLE IF NOT EXISTS `grievances` (
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
) ENGINE=InnoDB;

-- Grievances dialogue updates
CREATE TABLE IF NOT EXISTS `grievance_replies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `grievance_id` INT NOT NULL,
  `sender_name` VARCHAR(100) NOT NULL,
  `sender_email` VARCHAR(100) NOT NULL,
  `sender_role` VARCHAR(30) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`grievance_id`) REFERENCES `grievances`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Schedules (events, gatherings, festivals)
CREATE TABLE IF NOT EXISTS `schedules` (
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
) ENGINE=InnoDB;

-- Schedule Alerts for relevant personnel
CREATE TABLE IF NOT EXISTS `schedule_alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `text` TEXT NOT NULL,
  `date_notified` DATE NOT NULL,
  `for_user_email` VARCHAR(100) NOT NULL,
  `status` ENUM('unread', 'acknowledged') DEFAULT 'unread',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
```

---

## 2. Configuration Setup

Modify the `db.php` credential profiles with your active MySQL instance parameters:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'hr_department_db');
define('DB_USER', 'my_mysql_user');
define('DB_PASS', 'my_mysql_password');
```

---

## 3. Server Integration

1. Move the `/lamp/` file contents to your Apache Document Root (e.g. `/var/www/html/` or your virtual hosting public folder).
2. Assure read-write permissions are aligned (Apache `www-data` group read configuration).
3. Access `http://<your-server-ip>/` inside your internet browser to start operations right away!
