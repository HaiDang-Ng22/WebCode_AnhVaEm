 // app.js
// Main application file

// Application state
window.currentUser = null;
window.currentCode = null;
window.codes = [];
window.dbErrorCount = 0;
window.api = null;
const MAX_DB_ERROR_RETRIES = 3;

// Initialize
async function init() {
    // Show loading
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (loadingOverlay && loadingText) {
        loadingOverlay.classList.remove('hidden');
        loadingText.textContent = 'Đang khởi tạo Firebase...';
    }
    
    // Initialize Firebase API
    window.api = new FirebaseAPI();
    
    // Wait a moment for Firebase to initialize
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check connection
    if (!window.api.checkConnection()) {
        if (loadingText) loadingText.textContent = 'Đang thử kết nối lại...';
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (!window.api.checkConnection()) {
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            showDatabaseError("Không thể kết nối đến Firebase Database");
            return;
        }
    }
    
    // Hide loading
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
    
    // Show auth container
    const authContainer = document.getElementById('auth-container');
    if (authContainer) authContainer.classList.remove('hidden');
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('coderunner_current_user');
    if (savedUser) {
        try {
            window.currentUser = JSON.parse(savedUser);
            showAppropriateView();
            loadData();
        } catch (e) {
            console.error('Error loading saved user:', e);
            localStorage.removeItem('coderunner_current_user');
        }
    }
    
    // Add event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Auth events
    const loginBtn = document.getElementById('login-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const userLogoutBtn = document.getElementById('user-logout-btn');
    
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', handleLogout);
    if (userLogoutBtn) userLogoutBtn.addEventListener('click', handleLogout);
    
    // User mini controls events
    const exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');
    if (exitFullscreenBtn) {
        exitFullscreenBtn.addEventListener('click', exitFullscreenView);
    }
    
    // Database error events
    const retryConnectionBtn = document.getElementById('retry-connection-btn');
    const checkFirebaseBtn = document.getElementById('check-firebase-btn');
    
    if (retryConnectionBtn) retryConnectionBtn.addEventListener('click', handleRetryConnection);
    if (checkFirebaseBtn) checkFirebaseBtn.addEventListener('click', () => {
        window.open('https://console.firebase.google.com/u/0/project/chathub-46d8f/database/chathub-46d8f-default-rtdb/data', '_blank');
    });
    
    // Initialize admin elements and events
    initAdminElements();
    setupAdminEventListeners();
    
    // Listen for real-time updates
    if (window.api) {
        window.api.addListener('codesUpdated', handleCodesUpdated);
        window.api.addListener('selectedCodeUpdated', handleSelectedCodeUpdated);
        window.api.addListener('codeUpdated', handleCodeUpdated);
    }
}

// Setup admin event listeners
function setupAdminEventListeners() {
    if (adminElements.addCodeBtn) adminElements.addCodeBtn.addEventListener('click', showAddCodeModal);
    if (adminElements.saveCodeBtn) adminElements.saveCodeBtn.addEventListener('click', saveCurrentCode);
    if (adminElements.deleteCodeBtn) adminElements.deleteCodeBtn.addEventListener('click', deleteCurrentCode);
    if (adminElements.setAsUserCodeBtn) adminElements.setAsUserCodeBtn.addEventListener('click', setAsUserCode);
    if (adminElements.refreshPreviewBtn) adminElements.refreshPreviewBtn.addEventListener('click', refreshPreview);
    if (adminElements.languageSelector) adminElements.languageSelector.addEventListener('change', updatePreview);
    if (adminElements.codeEditor) adminElements.codeEditor.addEventListener('input', updatePreview);
    if (adminElements.saveModalBtn) adminElements.saveModalBtn.addEventListener('click', handleSaveModal);
    if (adminElements.cancelModalBtn) adminElements.cancelModalBtn.addEventListener('click', hideModal);
    
    // Setup resize handle
    if (adminElements.resizeHandle) {
        setupResizable();
    }
}

// Load data
async function loadData() {
    if (!window.api || !window.api.checkConnection()) {
        showDatabaseError("Không thể kết nối đến database");
        return;
    }
    
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (loadingOverlay && loadingText) {
        loadingOverlay.classList.remove('hidden');
        loadingText.textContent = 'Đang tải dữ liệu...';
    }
    
    try {
        if (window.currentUser.role === 'admin') {
            await loadCodes();
            await loadSelectedCodeInfo();
        } else {
            await loadUserCode();
        }
    } catch (error) {
        console.error("Load data error:", error);
        showDatabaseError(error.message);
    } finally {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
}

// Database error handling
function showDatabaseError(errorMessage = "") {
    window.dbErrorCount++;
    
    // Only show modal if we've had multiple errors
    if (window.dbErrorCount >= MAX_DB_ERROR_RETRIES) {
        const dbErrorModal = document.getElementById('db-error-modal');
        if (dbErrorModal) {
            dbErrorModal.classList.remove('hidden');
            
            // Update error message if provided
            if (errorMessage) {
                const errorDetails = dbErrorModal.querySelector('.offline-mode p');
                if (errorDetails) {
                    errorDetails.innerHTML = `Không thể kết nối đến Firebase Database. Chi tiết lỗi: <strong>${errorMessage}</strong>`;
                }
            }
        }
    }
}

function hideDatabaseError() {
    window.dbErrorCount = 0;
    const dbErrorModal = document.getElementById('db-error-modal');
    if (dbErrorModal) {
        dbErrorModal.classList.add('hidden');
    }
}

// Handle retry connection
async function handleRetryConnection() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (loadingOverlay && loadingText) {
        loadingOverlay.classList.remove('hidden');
        loadingText.textContent = 'Đang thử kết nối lại...';
    }
    
    if (window.api) {
        const reconnected = await window.api.reconnect();
        
        if (reconnected) {
            hideDatabaseError();
            showNotification('Đã kết nối lại Firebase thành công!', 'success');
            
            // Reload data if user is logged in
            if (window.currentUser) {
                loadData();
            }
        } else {
            showDatabaseError("Vẫn không thể kết nối đến Firebase");
        }
    }
    
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// Add floating hearts animation
function createHearts() {
    const body = document.body;
    const heartCount = 30;
    
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.innerHTML = '❤️';
        
        // Kích thước ngẫu nhiên
        const size = Math.random() * 20 + 10;
        heart.style.fontSize = `${size}px`;
        heart.style.position = 'fixed';
        
        // Vị trí ngẫu nhiên
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.top = `${Math.random() * 100}%`;
        heart.style.color = 'rgba(255, 126, 185, 0.15)';
        
        // Thời gian animation ngẫu nhiên
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        heart.style.animation = `float-heart ${duration}s ${delay}s infinite ease-in-out`;
        heart.style.zIndex = '-1';
        
        body.appendChild(heart);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    init();
    createHearts();
});
// Initialize Diary Manager
function initDiary() {
    // Diary manager sẽ tự động khởi tạo khi DOM ready
    // Chúng ta chỉ cần đảm bảo nó được load sau khi app chính khởi tạo
    console.log('Diary feature ready to be initialized');
}

// Gọi initDiary sau khi app khởi tạo
// Sửa trong hàm init() của app.js, thêm dòng này trước dòng cuối cùng:
initDiary();