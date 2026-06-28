// API URL configuration (automatically toggles between local server and deployed URL)
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.')
  ? `http://${window.location.hostname}:5000/api`
  : 'https://nietassignment.onrender.com/api'; // Replace with your actual Render backend URL


// ========================
// REGISTER FUNCTIONALITY
// ========================

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!fullName || !email || !password || !confirmPassword) {
      alert('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullName, email, password, confirmPassword })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error(error);
      alert('Error during registration');
    }
  });
}

// ========================
// LOGIN FUNCTIONALITY
// ========================

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      alert('Email and password are required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('Login successful!');
        window.location.href = 'dashboard.html';
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error(error);
      alert('Error during login');
    }
  });
}

// ========================
// DASHBOARD FUNCTIONALITY
// ========================

// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    window.location.href = 'login.html';
  }

  const userData = JSON.parse(user);
  const userNameElement = document.getElementById('userName');
  if (userNameElement) {
    userNameElement.textContent = userData.fullName;
  }
}

// Load assignments on dashboard
async function loadAssignments() {
  const token = localStorage.getItem('token');

  if (!token) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/assignments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const assignments = await response.json();

    if (response.ok) {
      displayAssignments(assignments);
      updateStats(assignments);
    }
  } catch (error) {
    console.error(error);
  }
}

// Display assignments
function displayAssignments(assignments) {
  const container = document.getElementById('assignmentsContainer');
  if (!container) return;

  if (assignments.length === 0) {
    container.innerHTML = '<p>No assignments yet. Create one to get started!</p>';
    return;
  }

  let html = '<table style="width: 100%; border-collapse: collapse;"><tr style="background: #001f4d; color: white;"><th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Subject</th><th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Assignment</th><th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Due Date</th><th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Status</th><th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Actions</th></tr>';

  assignments.forEach(assignment => {
    const statusColor = assignment.status === 'pending' ? 'color: orange;' : assignment.status === 'completed' ? 'color: green;' : 'color: #0072ff;';
    html += `<tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 15px;">${assignment.subject}</td>
      <td style="padding: 15px;">${assignment.title}</td>
      <td style="padding: 15px;">${new Date(assignment.dueDate).toLocaleDateString()}</td>
      <td style="padding: 15px; ${statusColor}; font-weight: 600;">${assignment.status}</td>
      <td style="padding: 15px;">
        <button onclick="deleteAssignment(${assignment.id})" style="background: #ff6b6b; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Delete</button>
      </td>
    </tr>`;
  });

  html += '</table>';
  container.innerHTML = html;
}

// Update dashboard stats
function updateStats(assignments) {
  const totalElement = document.getElementById('totalAssignments');
  const pendingElement = document.getElementById('pendingAssignments');
  const completedElement = document.getElementById('completedAssignments');

  if (totalElement) totalElement.textContent = assignments.length;
  
  if (pendingElement) {
    const pending = assignments.filter(a => a.status === 'pending').length;
    pendingElement.textContent = pending;
  }
  
  if (completedElement) {
    const completed = assignments.filter(a => a.status === 'completed').length;
    completedElement.textContent = completed;
  }
}

// Create new assignment
const assignmentForm = document.getElementById('assignmentForm');
if (assignmentForm) {
  assignmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const subject = document.getElementById('subject').value;
    const dueDate = document.getElementById('dueDate').value;

    try {
      const response = await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description, subject, dueDate })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Assignment created successfully');
        assignmentForm.reset();
        loadAssignments();
      } else {
        alert(data.message || 'Failed to create assignment');
      }
    } catch (error) {
      console.error(error);
      alert('Error creating assignment');
    }
  });
}

// Delete assignment
async function deleteAssignment(id) {
  if (!confirm('Are you sure?')) return;

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/assignments/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      alert('Assignment deleted');
      loadAssignments();
    }
  } catch (error) {
    console.error(error);
    alert('Error deleting assignment');
  }
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on dashboard
  if (document.getElementById('assignmentsContainer')) {
    checkAuth();
    loadAssignments();
  }
});
