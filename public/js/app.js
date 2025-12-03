// Application state
let currentUser = null;
let currentChatUser = null;
let messageCheckInterval = null;
let csrfToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    fetchCsrfToken().then(() => {
        checkAuth();
        setupEventListeners();
    });
});

// Fetch CSRF token
async function fetchCsrfToken() {
    try {
        const response = await fetch('/api/csrf-token', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            csrfToken = data.csrfToken;
        }
    } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
    }
}

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        if (response.ok) {
            currentUser = await response.json();
            showApp();
            
            // Check for auth code in URL
            const urlParams = new URLSearchParams(window.location.search);
            const authCode = urlParams.get('code');
            if (authCode) {
                // Remove code from URL
                window.history.replaceState({}, document.title, '/');
            }
        } else {
            showAuthPage();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showAuthPage();
    }
}

// Show authentication page
function showAuthPage() {
    document.getElementById('auth-page').style.display = 'block';
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('profile-page').style.display = 'none';
    document.getElementById('users-page').style.display = 'none';
    document.getElementById('messages-page').style.display = 'none';
    
    // Auto-fill code from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    if (authCode) {
        document.getElementById('auth-code').value = authCode;
    }
}

// Show application
function showApp() {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('navbar').style.display = 'block';
    document.getElementById('username-display').textContent = 
        currentUser.firstName || currentUser.username;
    
    // Show profile page by default
    showPage('profile');
    
    // Start checking for unread messages
    checkUnreadMessages();
    messageCheckInterval = setInterval(checkUnreadMessages, 30000); // Every 30 seconds
}

// Show specific page
function showPage(pageName) {
    document.getElementById('profile-page').style.display = 'none';
    document.getElementById('users-page').style.display = 'none';
    document.getElementById('messages-page').style.display = 'none';
    
    if (pageName === 'profile') {
        document.getElementById('profile-page').style.display = 'block';
        loadProfile();
    } else if (pageName === 'users') {
        document.getElementById('users-page').style.display = 'block';
        loadUsers();
    } else if (pageName === 'messages') {
        document.getElementById('messages-page').style.display = 'block';
        loadConversations();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login
    document.getElementById('login-btn').addEventListener('click', login);
    document.getElementById('auth-code').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Navigation
    document.querySelectorAll('.nav-menu a[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(e.target.dataset.page);
        });
    });
    
    // Profile
    document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
    
    // Users
    document.getElementById('apply-filters-btn').addEventListener('click', loadUsers);
    
    // Messages
    document.getElementById('send-message-btn').addEventListener('click', sendMessage);
    document.getElementById('message-content').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Login
async function login() {
    const code = document.getElementById('auth-code').value.trim();
    const errorDiv = document.getElementById('auth-error');
    
    if (!code) {
        errorDiv.textContent = 'Введите код авторизации';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify({ code }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showApp();
        } else {
            errorDiv.textContent = data.error || 'Ошибка авторизации';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Ошибка подключения к серверу';
        errorDiv.style.display = 'block';
    }
}

// Logout
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'CSRF-Token': csrfToken
            },
            credentials: 'include'
        });
        
        if (messageCheckInterval) {
            clearInterval(messageCheckInterval);
        }
        
        currentUser = null;
        showAuthPage();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Load profile
async function loadProfile() {
    try {
        const response = await fetch('/api/profile', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            const profile = data.profile || {};
            
            document.getElementById('profile-name').value = profile.name || '';
            document.getElementById('profile-role').value = profile.role || 'other';
            document.getElementById('profile-skills').value = 
                (profile.skills || []).join(', ');
            document.getElementById('profile-experience').value = profile.experience || '';
            document.getElementById('profile-bio').value = profile.bio || '';
            document.getElementById('profile-looking').checked = profile.lookingForTeam || false;
        }
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

// Save profile
async function saveProfile() {
    const messageDiv = document.getElementById('profile-message');
    
    const skillsText = document.getElementById('profile-skills').value;
    const skills = skillsText ? skillsText.split(',').map(s => s.trim()) : [];
    
    const profileData = {
        name: document.getElementById('profile-name').value,
        role: document.getElementById('profile-role').value,
        skills: skills,
        experience: document.getElementById('profile-experience').value,
        bio: document.getElementById('profile-bio').value,
        lookingForTeam: document.getElementById('profile-looking').checked
    };
    
    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify(profileData),
            credentials: 'include'
        });
        
        if (response.ok) {
            messageDiv.textContent = 'Профиль успешно сохранен!';
            messageDiv.style.display = 'block';
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 3000);
        } else {
            const data = await response.json();
            messageDiv.textContent = data.error || 'Ошибка сохранения';
            messageDiv.className = 'error-message';
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Save profile error:', error);
        messageDiv.textContent = 'Ошибка подключения к серверу';
        messageDiv.className = 'error-message';
        messageDiv.style.display = 'block';
    }
}

// Load users
async function loadUsers() {
    const lookingForTeam = document.getElementById('filter-looking').checked;
    const role = document.getElementById('filter-role').value;
    
    const params = new URLSearchParams();
    if (lookingForTeam) params.append('lookingForTeam', 'true');
    if (role) params.append('role', role);
    
    try {
        const response = await fetch(`/api/profile/users?${params}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        }
    } catch (error) {
        console.error('Load users error:', error);
    }
}

// Display users
function displayUsers(users) {
    const container = document.getElementById('users-list');
    
    if (users.length === 0) {
        container.innerHTML = '<p>Пользователи не найдены</p>';
        return;
    }
    
    container.innerHTML = users.map(user => {
        const profile = user.profile || {};
        const skills = (profile.skills || []).slice(0, 3).join(', ');
        
        // Escape HTML to prevent XSS
        const escapedName = escapeHtml(profile.name || user.username);
        const escapedSkills = escapeHtml(skills);
        const escapedBio = profile.bio ? escapeHtml(profile.bio.substring(0, 100)) + '...' : '';
        
        return `
            <div class="user-card" data-user-id="${user._id}" data-user-name="${escapedName}">
                <h3>${escapedName}</h3>
                ${profile.role && profile.role !== 'other' ? 
                    `<div class="role">${getRoleText(profile.role)}</div>` : ''}
                ${skills ? `<div class="skills">Навыки: ${escapedSkills}</div>` : ''}
                ${escapedBio ? `<p>${escapedBio}</p>` : ''}
                ${profile.lookingForTeam ? 
                    '<div class="looking">✓ Ищет команду</div>' : ''}
                <button class="btn btn-primary message-btn">
                    Написать сообщение
                </button>
            </div>
        `;
    }).join('');
    
    // Add event listeners to message buttons
    container.querySelectorAll('.message-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.user-card');
            const userId = card.dataset.userId;
            const username = card.dataset.userName;
            startChat(userId, username);
        });
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get role text in Russian
function getRoleText(role) {
    const roles = {
        'frontend': 'Frontend',
        'backend': 'Backend',
        'fullstack': 'Fullstack',
        'designer': 'Дизайнер',
        'project-manager': 'Менеджер',
        'data-scientist': 'Data Scientist',
        'mobile': 'Mobile',
        'other': 'Другое'
    };
    return roles[role] || role;
}

// Start chat with user
function startChat(userId, username) {
    currentChatUser = { id: userId, username };
    showPage('messages');
    setTimeout(() => loadMessages(userId), 100);
}

// Load conversations
async function loadConversations() {
    try {
        const response = await fetch('/api/messages/conversations', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const conversations = await response.json();
            displayConversations(conversations);
        }
    } catch (error) {
        console.error('Load conversations error:', error);
    }
}

// Display conversations
function displayConversations(conversations) {
    const container = document.getElementById('conversations');
    
    if (conversations.length === 0) {
        container.innerHTML = '<p style="padding: 1rem; color: #999;">Нет сообщений</p>';
        return;
    }
    
    container.innerHTML = conversations.map(conv => {
        const escapedName = escapeHtml(conv.firstName || conv.username);
        const escapedPreview = escapeHtml(conv.lastMessage);
        
        return `
            <div class="conversation-item" data-user-id="${conv.userId}">
                <div class="name">
                    ${escapedName}
                    ${conv.unreadCount > 0 ? `<span class="unread">${conv.unreadCount}</span>` : ''}
                </div>
                <div class="preview">${escapedPreview}</div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to conversation items
    container.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
            const userId = item.dataset.userId;
            loadMessages(userId);
        });
    });
}

// Load messages with specific user
async function loadMessages(userId) {
    currentChatUser = { id: userId };
    
    try {
        // Get user info
        const userResponse = await fetch(`/api/profile/${userId}`, {
            credentials: 'include'
        });
        
        if (userResponse.ok) {
            const user = await userResponse.json();
            currentChatUser.username = user.profile?.name || user.username;
        }
        
        // Get messages
        const response = await fetch(`/api/messages/${userId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const messages = await response.json();
            displayMessages(messages);
            
            document.getElementById('no-chat-selected').style.display = 'none';
            document.getElementById('chat-container').style.display = 'flex';
            document.getElementById('chat-username').textContent = currentChatUser.username;
            
            // Update conversations to reflect read messages
            loadConversations();
            checkUnreadMessages();
        }
    } catch (error) {
        console.error('Load messages error:', error);
    }
}

// Display messages
function displayMessages(messages) {
    const container = document.getElementById('messages-list');
    
    container.innerHTML = messages.map(msg => {
        const isSent = msg.from._id === currentUser.id;
        const time = new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Escape HTML to prevent XSS
        const escapedContent = escapeHtml(msg.content);
        
        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div>${escapedContent}</div>
                <div class="time">${time}</div>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Send message
async function sendMessage() {
    if (!currentChatUser) return;
    
    const content = document.getElementById('message-content').value.trim();
    
    if (!content) return;
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                to: currentChatUser.id,
                content
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            document.getElementById('message-content').value = '';
            loadMessages(currentChatUser.id);
        }
    } catch (error) {
        console.error('Send message error:', error);
    }
}

// Check unread messages
async function checkUnreadMessages() {
    try {
        const response = await fetch('/api/messages/unread/count', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            const badge = document.getElementById('unread-badge');
            
            if (data.count > 0) {
                badge.textContent = data.count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Check unread messages error:', error);
    }
}
