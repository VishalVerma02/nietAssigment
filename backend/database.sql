-- Create Database
CREATE DATABASE IF NOT EXISTS niet_assignment_tracker;
USE niet_assignment_tracker;

-- Users Table (Students)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') DEFAULT 'student',
  profilePic LONGTEXT DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Admin/Teachers Table
CREATE TABLE IF NOT EXISTS admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  department VARCHAR(100),
  designation VARCHAR(100),
  phone VARCHAR(15),
  qualifications VARCHAR(255),
  experience INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_department (department),
  INDEX idx_isActive (isActive)
);

-- Assignments Table (Created by Admin)
CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adminId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  dueDate DATETIME NOT NULL,
  status ENUM('active', 'closed') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (adminId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_adminId (adminId),
  INDEX idx_dueDate (dueDate),
  INDEX idx_status (status)
);

-- Student Assignments (Tracking Student Progress)
CREATE TABLE IF NOT EXISTS student_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  assignmentId INT NOT NULL,
  status ENUM('pending', 'submitted', 'completed') DEFAULT 'pending',
  submissionFile VARCHAR(500),
  submissionFileData LONGTEXT DEFAULT NULL,
  submittedAt DATETIME,
  feedback TEXT,
  marks INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignmentId) REFERENCES assignments(id) ON DELETE CASCADE,
  INDEX idx_studentId (studentId),
  INDEX idx_assignmentId (assignmentId),
  INDEX idx_status (status),
  UNIQUE KEY unique_student_assignment (studentId, assignmentId)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  assignmentId INT NOT NULL,
  message TEXT NOT NULL,
  type ENUM('new_assignment', 'submission_feedback', 'reminder') DEFAULT 'new_assignment',
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignmentId) REFERENCES assignments(id) ON DELETE CASCADE,
  INDEX idx_studentId (studentId),
  INDEX idx_isRead (isRead)
);

-- Add Sample Data
INSERT INTO users (fullName, email, password, role) VALUES 
('Admin User', 'admin@niet.com', '$2a$10$SPdlaESU/k5RzHR2Jpg9W.VhAzAy1J8wmcI9ULTbWtMsqk8Ywste.', 'admin'),
('Raj Kumar', 'raj@niet.com', '$2a$10$94PJgeF.GyD/KGyUbtmpvuKDVokT7z4hzbGbocMeoqK3kB4hW8k1u', 'student'),
('Priya Singh', 'priya@niet.com', '$2a$10$94PJgeF.GyD/KGyUbtmpvuKDVokT7z4hzbGbocMeoqK3kB4hW8k1u', 'student');

-- Add Admin Details
INSERT INTO admin (userId, department, designation, phone, qualifications, experience, isActive) VALUES 
(1, 'Computer Science', 'Head of Department', '9876543210', 'B.Tech, M.Tech', 10, TRUE);

INSERT INTO assignments (adminId, title, description, subject, dueDate, status) VALUES 
(1, 'Data Structures Assignment', 'Implement linked list operations', 'DSA', '2024-07-15 23:59:00', 'active'),
(1, 'Web Development Project', 'Build a responsive website', 'Web Dev', '2024-07-20 23:59:00', 'active');

INSERT INTO student_assignments (studentId, assignmentId, status) VALUES 
(2, 1, 'pending'),
(2, 2, 'pending'),
(3, 1, 'pending'),
(3, 2, 'pending');
