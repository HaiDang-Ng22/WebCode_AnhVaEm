 // auth.js
// Authentication functions

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="flex: 1;">
            <strong>${type === 'success' ? 'Thành công!' : type === 'error' ? 'Lỗi!' : 'Thông báo'}</strong>
            <p style="margin-top: 5px; font-size: 0.9rem;">${message}</p>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
    }
}

function hideError(element) {
    if (element) {
        element.classList.add('hidden');
    }
}

// Login handler
async function handleLogin() {
    if (!window.api || !window.api.checkConnection()) {
        showDatabaseError("Không thể kết nối đến database");
        return;
    }
    
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    const loginError = document.getElementById('login-error');
    
    if (!email || !password) {
        showError(loginError, 'Vui lòng nhập email và mật khẩu');
        return;
    }
    
    // Show loading
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (loadingOverlay && loadingText) {
        loadingOverlay.classList.remove('hidden');
        loadingText.textContent = 'Đang đăng nhập...';
    }
    
    const result = await window.api.login(email, password);
    
    // Hide loading
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
    
    if (result.success) {
        window.currentUser = result.user;
        localStorage.setItem('coderunner_current_user', JSON.stringify(window.currentUser));
        showAppropriateView();
        loadData();
        showNotification('Đăng nhập thành công!', 'success');
    } else {
        showError(loginError, result.message);
    }
}

// Logout handler
function handleLogout() {
    window.currentUser = null;
    localStorage.removeItem('coderunner_current_user');
    
    const authContainer = document.getElementById('auth-container');
    const adminDashboard = document.getElementById('admin-dashboard');
    const userView = document.getElementById('user-view');
    
    if (authContainer) authContainer.classList.remove('hidden');
    if (adminDashboard) adminDashboard.classList.add('hidden');
    if (userView) userView.classList.add('hidden');
    
    // Khôi phục overflow
    document.body.style.overflow = '';
    
    // Clear form
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
    
    hideError(document.getElementById('login-error'));
    
    showNotification('Đã đăng xuất thành công!', 'info');
}

// Show appropriate view based on user role
function showAppropriateView() {
    const authContainer = document.getElementById('auth-container');
    const adminDashboard = document.getElementById('admin-dashboard');
    const userView = document.getElementById('user-view');
    
    if (authContainer) authContainer.classList.add('hidden');
    
    if (window.currentUser?.role === 'admin') {
        if (adminDashboard) adminDashboard.classList.remove('hidden');
        if (userView) userView.classList.add('hidden');
        
        // Update admin UI
        const adminName = document.getElementById('admin-name');
        const adminAvatar = document.getElementById('admin-avatar');
        if (adminName) adminName.textContent = window.currentUser.name;
        if (adminAvatar) adminAvatar.textContent = window.currentUser.avatar;
    } else {
        if (adminDashboard) adminDashboard.classList.add('hidden');
        if (userView) userView.classList.remove('hidden');
        
        // Update mini user UI
        const userNameMini = document.getElementById('user-name-mini');
        const userAvatarMini = document.getElementById('user-avatar-mini');
        if (userNameMini) userNameMini.textContent = window.currentUser.name;
        if (userAvatarMini) userAvatarMini.textContent = window.currentUser.avatar;
        
        // Enter fullscreen mode for user
        enterFullscreenMode();
    }
}

function enterFullscreenMode() {
    // Ẩn thanh cuộn
    document.body.style.overflow = 'hidden';
    
    // Tự động ẩn các overlay sau 5 giây
    setTimeout(() => {
        const miniControls = document.querySelector('.user-mini-controls');
        const codeInfo = document.querySelector('.code-info-overlay');
        const exitBtn = document.querySelector('.fullscreen-exit-btn');
        
        if (miniControls) miniControls.style.opacity = '0.3';
        if (codeInfo) codeInfo.style.opacity = '0.3';
        if (exitBtn) exitBtn.style.opacity = '0.3';
    }, 5000);
    
    // Hiển thị lại khi hover
    const containers = ['.user-mini-controls', '.code-info-overlay', '.fullscreen-exit-btn'];
    containers.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.addEventListener('mouseenter', () => {
                element.style.opacity = '1';
            });
            element.addEventListener('mouseleave', () => {
                element.style.opacity = '0.3';
            });
        }
    });
}

function exitFullscreenView() {
    handleLogout();
}