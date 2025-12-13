// user.js
// User view functions

// Load user code
async function loadUserCode() {
    const selectedCode = await window.api.getSelectedCode();
    if (selectedCode) {
        // Cập nhật thông tin overlay
        const currentCodeTitle = document.getElementById('current-code-title');
        const codeDescription = document.getElementById('code-description');
        const codeUpdateTime = document.getElementById('code-update-time');
        
        if (currentCodeTitle) currentCodeTitle.textContent = selectedCode.title;
        if (codeDescription) codeDescription.textContent = selectedCode.description || 'Code này anh thay lời muốn nói của anh á em yêu';
        if (codeUpdateTime) codeUpdateTime.textContent = `Cập nhật: ${new Date(selectedCode.updatedAt).toLocaleString('vi-VN')}`;
        
        // Cập nhật thông tin user mini
        if (window.currentUser) {
            const userNameMini = document.getElementById('user-name-mini');
            const userAvatarMini = document.getElementById('user-avatar-mini');
            if (userNameMini) userNameMini.textContent = window.currentUser.name;
            if (userAvatarMini) userAvatarMini.textContent = window.currentUser.avatar;
        }
        
        // Render code fullscreen
        const userPreviewFrame = document.getElementById('user-preview-frame');
        if (userPreviewFrame) {
            renderUserCodeInIframe(userPreviewFrame, selectedCode.content);
        }
    } else {
        // Hiển thị màn hình không có code
        const currentCodeTitle = document.getElementById('current-code-title');
        const codeDescription = document.getElementById('code-description');
        const codeUpdateTime = document.getElementById('code-update-time');
        
        if (currentCodeTitle) currentCodeTitle.textContent = 'Không có code nào';
        if (codeDescription) codeDescription.textContent = 'Admin chưa chọn code để hiển thị';
        if (codeUpdateTime) codeUpdateTime.textContent = '';
        
        const userPreviewFrame = document.getElementById('user-preview-frame');
        if (userPreviewFrame) {
            renderUserCodeInIframe(userPreviewFrame, `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                            font-family: 'Segoe UI', sans-serif;
                        }
                        
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
                            color: #fff;
                            padding: 20px;
                        }
                        
                        .container {
                            text-align: center;
                            padding: 40px;
                            background-color: rgba(255, 255, 255, 0.05);
                            border-radius: 15px;
                            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                            max-width: 600px;
                            width: 100%;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            backdrop-filter: blur(10px);
                        }
                        
                        h1 {
                            color: #ff6b6b;
                            margin-bottom: 20px;
                            font-size: 2.5rem;
                        }
                        
                        p {
                            font-size: 1.2rem;
                            line-height: 1.6;
                            margin-bottom: 30px;
                            color: #ccc;
                        }
                        
                        .icon {
                            font-size: 4rem;
                            color: #4dabf7;
                            margin-bottom: 20px;
                        }
                        
                        .highlight {
                            color: #ffcc00;
                            font-weight: bold;
                        }
                        
                        .loading {
                            display: inline-block;
                            width: 20px;
                            height: 20px;
                            border: 3px solid rgba(255, 255, 255, 0.3);
                            border-top-color: #4dabf7;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin-left: 10px;
                        }
                        
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">👨‍💻</div>
                        <h1>Đang chờ code...</h1>
                        <p>Quản trị viên chưa chọn code nào để hiển thị.</p>
                        <p>Vui lòng chờ trong giây lát <span class="loading"></span></p>
                        <p>Hoặc liên hệ với <span class="highlight">quản trị viên</span> để biết thêm thông tin.</p>
                    </div>
                </body>
                </html>
            `);
        }
    }
}

// Render code in user iframe
function renderUserCodeInIframe(iframe, code) {
    if (!iframe) return;
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(code);
    iframeDoc.close();
}

// Update user view with code
async function updateUserView(code) {
    if (!code) return;
    
    const selectedCode = await window.api.getSelectedCode();
    if (selectedCode && selectedCode.id === code.id) {
        const currentCodeTitle = document.getElementById('current-code-title');
        const codeDescription = document.getElementById('code-description');
        const codeUpdateTime = document.getElementById('code-update-time');
        
        if (currentCodeTitle) currentCodeTitle.textContent = code.title;
        if (codeDescription) codeDescription.textContent = code.description || 'Code được chọn bởi Admin';
        if (codeUpdateTime) codeUpdateTime.textContent = `Cập nhật: ${new Date(code.updatedAt).toLocaleString('vi-VN')}`;
        
        const userPreviewFrame = document.getElementById('user-preview-frame');
        if (userPreviewFrame) {
            renderUserCodeInIframe(userPreviewFrame, code.content);
        }
    }
}