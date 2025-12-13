// admin.js
// Admin dashboard functions

// DOM Elements for admin
let adminElements = {
    addCodeBtn: null,
    saveCodeBtn: null,
    deleteCodeBtn: null,
    setAsUserCodeBtn: null,
    refreshPreviewBtn: null,
    languageSelector: null,
    codeEditor: null,
    previewFrame: null,
    codeList: null,
    editorTitle: null,
    selectedCodeDisplay: null,
    codeModal: null,
    modalTitle: null,
    codeTitleInput: null,
    modalLanguageSelector: null,
    codeDescriptionInput: null,
    saveModalBtn: null,
    cancelModalBtn: null,
    resizeHandle: null
};

// Initialize admin elements
function initAdminElements() {
    adminElements = {
        addCodeBtn: document.getElementById('add-code-btn'),
        saveCodeBtn: document.getElementById('save-code-btn'),
        deleteCodeBtn: document.getElementById('delete-code-btn'),
        setAsUserCodeBtn: document.getElementById('set-as-user-code-btn'),
        refreshPreviewBtn: document.getElementById('refresh-preview-btn'),
        languageSelector: document.getElementById('language-selector'),
        codeEditor: document.getElementById('code-editor'),
        previewFrame: document.getElementById('preview-frame'),
        codeList: document.getElementById('code-list'),
        editorTitle: document.getElementById('editor-title'),
        selectedCodeDisplay: document.getElementById('selected-code-display'),
        codeModal: document.getElementById('code-modal'),
        modalTitle: document.getElementById('modal-title'),
        codeTitleInput: document.getElementById('code-title'),
        modalLanguageSelector: document.getElementById('modal-language-selector'),
        codeDescriptionInput: document.getElementById('code-description-input'),
        saveModalBtn: document.getElementById('save-modal-btn'),
        cancelModalBtn: document.getElementById('cancel-modal-btn'),
        resizeHandle: document.getElementById('resize-handle')
    };
}

// Load codes for admin
async function loadCodes() {
    if (!window.api || !window.api.checkConnection()) {
        showDatabaseError("Không thể kết nối đến database");
        return;
    }
    
    window.codes = await window.api.getCodes();
    renderCodeList();
    
    // Select first code if none selected and codes exist
    if (window.codes.length > 0 && !window.currentCode) {
        const selectedCode = window.codes.find(code => code.selected) || window.codes[0];
        selectCode(selectedCode);
    } else if (window.codes.length === 0) {
        // No codes, clear editor
        window.currentCode = null;
        if (adminElements.codeEditor) adminElements.codeEditor.value = '';
        if (adminElements.editorTitle) adminElements.editorTitle.textContent = 'Chỉnh sửa Code';
        if (adminElements.deleteCodeBtn) adminElements.deleteCodeBtn.disabled = true;
        if (adminElements.setAsUserCodeBtn) adminElements.setAsUserCodeBtn.disabled = true;
        if (adminElements.saveCodeBtn) adminElements.saveCodeBtn.disabled = true;
    } else {
        // Enable save button if we have a code selected
        if (adminElements.saveCodeBtn) adminElements.saveCodeBtn.disabled = false;
    }
}

// Render code list
function renderCodeList() {
    if (!adminElements.codeList) return;
    
    if (!window.codes || window.codes.length === 0) {
        adminElements.codeList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-code"></i>
                <p>Chưa có code nào. Hãy thêm code mới!</p>
            </div>
        `;
        return;
    }
    
    adminElements.codeList.innerHTML = window.codes.map(code => `
        <div class="code-item ${code.id === window.currentCode?.id ? 'selected' : ''}" data-id="${code.id}">
            <div class="code-item-header">
                <div class="code-item-title">
                    ${code.title}
                    ${code.selected ? '<span class="badge badge-success">Đang hiển thị</span>' : ''}
                </div>
                <div class="code-item-actions">
                    ${code.selected ? '<i class="fas fa-eye" style="color: var(--success-color);" title="Đang hiển thị cho User"></i>' : ''}
                </div>
            </div>
            <div class="code-item-language ${code.language}">${code.language.toUpperCase()}</div>
            <div class="code-item-date">
                <i class="far fa-clock"></i>
                Cập nhật: ${new Date(code.updatedAt).toLocaleDateString('vi-VN')}
            </div>
        </div>
    `).join('');
    
    // Add click event listeners to code items
    document.querySelectorAll('.code-item').forEach(item => {
        item.addEventListener('click', () => {
            const codeId = item.getAttribute('data-id');
            const code = window.codes.find(c => c.id === codeId);
            if (code) {
                selectCode(code);
            }
        });
    });
}

// Select a code
async function selectCode(code) {
    window.currentCode = code;
    
    // Update UI
    if (adminElements.editorTitle) adminElements.editorTitle.textContent = `Chỉnh sửa: ${code.title}`;
    if (adminElements.codeEditor) adminElements.codeEditor.value = code.content;
    if (adminElements.languageSelector) adminElements.languageSelector.value = code.language;
    
    // Update preview
    updatePreview();
    
    // Update code list selection
    document.querySelectorAll('.code-item').forEach(item => {
        item.classList.toggle('selected', item.getAttribute('data-id') === code.id);
    });
    
    // Enable buttons
    if (adminElements.saveCodeBtn) adminElements.saveCodeBtn.disabled = false;
    
    // Show delete button only if not selected for users
    if (adminElements.deleteCodeBtn) adminElements.deleteCodeBtn.disabled = code.selected;
    if (adminElements.setAsUserCodeBtn) adminElements.setAsUserCodeBtn.disabled = code.selected;
    
    // If this code is selected for users, update the button text
    if (code.selected && adminElements.setAsUserCodeBtn) {
        adminElements.setAsUserCodeBtn.innerHTML = '<i class="fas fa-check"></i> Đang hiển thị cho User';
        adminElements.setAsUserCodeBtn.classList.add('btn-success');
        adminElements.setAsUserCodeBtn.classList.remove('btn-warning');
        if (adminElements.deleteCodeBtn) adminElements.deleteCodeBtn.disabled = true;
    } else if (adminElements.setAsUserCodeBtn) {
        adminElements.setAsUserCodeBtn.innerHTML = '<i class="fas fa-eye"></i> Chọn hiển thị cho User';
        adminElements.setAsUserCodeBtn.classList.add('btn-warning');
        adminElements.setAsUserCodeBtn.classList.remove('btn-success');
        if (adminElements.deleteCodeBtn) adminElements.deleteCodeBtn.disabled = false;
    }
}

// Load selected code info
async function loadSelectedCodeInfo() {
    if (!adminElements.selectedCodeDisplay) return;
    
    const selectedCode = await window.api.getSelectedCode();
    if (selectedCode) {
        adminElements.selectedCodeDisplay.innerHTML = `
            <div style="font-weight: 600; color: var(--primary-color);">${selectedCode.title}</div>
            <div style="margin-top: 5px; font-size: 0.85rem; color: var(--text-light);">
                ${selectedCode.description || 'Không có mô tả'}
            </div>
            <div style="margin-top: 5px; font-size: 0.8rem; color: #999;">
                <i class="far fa-clock"></i> Cập nhật: ${new Date(selectedCode.updatedAt).toLocaleDateString('vi-VN')}
            </div>
        `;
    } else {
        adminElements.selectedCodeDisplay.innerHTML = `
            <div style="color: var(--text-light); font-style: italic;">
                <i class="fas fa-exclamation-circle"></i> Chưa có code nào được chọn
            </div>
        `;
    }
}

// Update preview
function updatePreview() {
    if (!window.currentCode || !adminElements.codeEditor || !adminElements.languageSelector) return;
    
    const code = adminElements.codeEditor.value;
    const language = adminElements.languageSelector.value;
    
    // Update current code object
    window.currentCode.content = code;
    window.currentCode.language = language;
    
    // Render in iframe
    renderCodeInIframe(adminElements.previewFrame, code, language);
}

// Refresh preview
function refreshPreview() {
    updatePreview();
    showNotification('Đã làm mới preview', 'info');
}

// Render code in iframe
function renderCodeInIframe(iframe, code, language = 'html') {
    if (!iframe) return;
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    
    // Wrap code in HTML if it's not already
    if (language === 'html' || !language) {
        iframeDoc.write(code);
    } else if (language === 'css') {
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>${code}</style>
            </head>
            <body>
                <div style="padding: 30px; font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: white;">
                    <h1 style="color: white; margin-bottom: 20px;">CSS Preview</h1>
                    <div class="demo-box" style="padding: 20px; background-color: rgba(255, 255, 255, 0.1); border-radius: 8px; margin-bottom: 20px; backdrop-filter: blur(10px);">
                        Đây là hộp demo với CSS của bạn
                    </div>
                    <button class="demo-btn" style="padding: 12px 24px; background-color: white; color: #667eea; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s;">
                        Nút demo
                    </button>
                </div>
            </body>
            </html>
        `);
    } else if (language === 'javascript') {
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>JavaScript Preview</title>
                <style>
                    body {
                        font-family: 'Segoe UI', sans-serif;
                        padding: 30px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        color: white;
                    }
                    h1 {
                        color: white;
                        margin-bottom: 20px;
                    }
                    #output {
                        padding: 20px;
                        background-color: rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        min-height: 100px;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        backdrop-filter: blur(10px);
                        margin-bottom: 20px;
                    }
                    button {
                        padding: 12px 24px;
                        background-color: white;
                        color: #667eea;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                        transition: all 0.3s;
                    }
                    button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    }
                </style>
            </head>
            <body>
                <h1>JavaScript Preview</h1>
                <div id="output">Kết quả sẽ hiển thị ở đây</div>
                <button onclick="runDemo()">Chạy Demo</button>
                <script>
                    function runDemo() {
                        document.getElementById('output').innerHTML = '<h3>JavaScript đang chạy!</h3><p>Code JS của bạn đã được thực thi thành công.</p>';
                    }
                    ${code}
                <\/script>
            </body>
            </html>
        `);
    }
    
    iframeDoc.close();
}

// Show add code modal
function showAddCodeModal() {
    if (!adminElements.modalTitle || !adminElements.codeTitleInput || 
        !adminElements.modalLanguageSelector || !adminElements.codeDescriptionInput ||
        !adminElements.codeModal) return;
    
    adminElements.modalTitle.textContent = 'Thêm code mới';
    adminElements.codeTitleInput.value = '';
    adminElements.modalLanguageSelector.value = 'html';
    adminElements.codeDescriptionInput.value = '';
    adminElements.codeModal.classList.remove('hidden');
    
    // Set focus
    setTimeout(() => {
        adminElements.codeTitleInput.focus();
    }, 100);
}

// Hide modal
function hideModal() {
    if (adminElements.codeModal) {
        adminElements.codeModal.classList.add('hidden');
    }
}

// Handle save modal
async function handleSaveModal() {
    if (!adminElements.codeTitleInput || !adminElements.modalLanguageSelector || 
        !adminElements.codeDescriptionInput) return;
    
    const title = adminElements.codeTitleInput.value.trim();
    const language = adminElements.modalLanguageSelector.value;
    const description = adminElements.codeDescriptionInput.value.trim();
    
    if (!title) {
        showNotification('Vui lòng nhập tiêu đề code', 'error');
        return;
    }
    
    const codeData = {
        title,
        language,
        description,
        content: `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            text-align: center;
            padding: 40px;
            background-color: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            max-width: 800px;
            width: 100%;
        }
        
        h1 {
            color: white;
            margin-bottom: 20px;
            font-size: 2.5rem;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        
        p {
            font-size: 1.2rem;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .highlight {
            color: #ffcc00;
            font-weight: bold;
        }
        
        .btn {
            padding: 12px 24px;
            background-color: white;
            color: #667eea;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
            margin-top: 20px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <p>Code mới được tạo bởi Admin. Hãy chỉnh sửa nội dung ở đây.</p>
        <p>Thời gian tạo: <span class="highlight" id="current-time"></span></p>
        <button class="btn" onclick="alert('Code mới được tạo thành công!')">Xác nhận</button>
    </div>
    
    <script>
        function updateTime() {
            const now = new Date();
            document.getElementById('current-time').textContent = now.toLocaleString('vi-VN');
        }
        updateTime();
        setInterval(updateTime, 1000);
    <\/script>
</body>
</html>`,
        createdBy: window.currentUser.id
    };
    
    // Show loading
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (loadingOverlay && loadingText) {
        loadingOverlay.classList.remove('hidden');
        loadingText.textContent = 'Đang lưu code...';
    }
    
    try {
        const newCode = await window.api.createCode(codeData);
        hideModal();
        
        // Select the new code
        window.codes = await window.api.getCodes();
        renderCodeList();
        selectCode(newCode);
        
        showNotification(`Đã tạo code "${title}" thành công!`, 'success');
    } catch (error) {
        showNotification('Lỗi khi tạo code: ' + error.message, 'error');
    } finally {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
}

// Save current code
async function saveCurrentCode() {
    if (!window.currentCode) {
        showNotification('Không có code nào được chọn để lưu', 'error');
        return;
    }
    
    if (!adminElements.codeEditor || !adminElements.languageSelector) return;
    
    // Show loading
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (loadingOverlay && loadingText) {
        loadingOverlay.classList.remove('hidden');
        loadingText.textContent = 'Đang lưu thay đổi...';
    }
    
    try {
        const updatedCode = await window.api.updateCode(window.currentCode.id, {
            title: window.currentCode.title,
            content: adminElements.codeEditor.value,
            language: adminElements.languageSelector.value,
            description: window.currentCode.description
        });
        
        if (updatedCode) {
            window.currentCode = updatedCode;
            showNotification('Đã lưu code thành công!', 'success');
            
            // Update code list
            window.codes = await window.api.getCodes();
            renderCodeList();
            
            // If this code is selected for users, update user view
            if (window.currentCode.selected) {
                await updateUserView(window.currentCode);
            }
            
            // Update selected code info
            await loadSelectedCodeInfo();
        } else {
            showNotification('Lỗi khi lưu code', 'error');
        }
    } catch (error) {
        showNotification('Lỗi khi lưu code: ' + error.message, 'error');
    } finally {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
}

// Delete current code
async function deleteCurrentCode() {
    if (!window.currentCode) {
        showNotification('Không có code nào được chọn để xóa', 'error');
        return;
    }
    
    if (window.currentCode.selected) {
        showNotification('Không thể xóa code đang được hiển thị cho User', 'error');
        return;
    }
    
    const confirmation = confirm(`Bạn có chắc chắn muốn xóa code "${window.currentCode.title}"? Hành động này không thể hoàn tác.`);
    
    if (!confirmation) return;
    
    // Show loading
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (loadingOverlay && loadingText) {
        loadingOverlay.classList.remove('hidden');
        loadingText.textContent = 'Đang xóa code...';
    }
    
    try {
        // Delete the code
        await window.api.deleteCode(window.currentCode.id);
        
        // Show success message
        showNotification(`Đã xóa code "${window.currentCode.title}" thành công!`, 'success');
        
        // Clear current code
        window.currentCode = null;
        if (adminElements.codeEditor) adminElements.codeEditor.value = '';
        if (adminElements.editorTitle) adminElements.editorTitle.textContent = 'Chỉnh sửa Code';
        
        // Reload codes
        window.codes = await window.api.getCodes();
        renderCodeList();
        
        // Update selected code info
        await loadSelectedCodeInfo();
        
        // Select first code if available
        if (window.codes.length > 0) {
            // Wait a moment for the list to render
            setTimeout(() => {
                const firstCodeItem = document.querySelector('.code-item');
                if (firstCodeItem) {
                    const codeId = firstCodeItem.getAttribute('data-id');
                    const code = window.codes.find(c => c.id === codeId);
                    if (code) {
                        selectCode(code);
                    }
                }
            }, 100);
        } else {
            // No codes left, disable buttons
            if (adminElements.deleteCodeBtn) adminElements.deleteCodeBtn.disabled = true;
            if (adminElements.setAsUserCodeBtn) adminElements.setAsUserCodeBtn.disabled = true;
            if (adminElements.saveCodeBtn) adminElements.saveCodeBtn.disabled = true;
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Lỗi khi xóa code: ' + error.message, 'error');
    } finally {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
}

// Set as user code
async function setAsUserCode() {
    if (!window.currentCode) {
        showNotification('Không có code nào được chọn', 'error');
        return;
    }
    
    if (window.currentCode.selected) {
        showNotification('Code này đã được chọn hiển thị cho User', 'info');
        return;
    }
    
    // Show loading
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (loadingOverlay && loadingText) {
        loadingOverlay.classList.remove('hidden');
        loadingText.textContent = 'Đang cập nhật code hiển thị...';
    }
    
    try {
        await window.api.setSelectedCode(window.currentCode.id);
        showNotification(`Đã chọn "${window.currentCode.title}" làm code hiển thị cho User`, 'success');
        
        // Update UI
        await loadSelectedCodeInfo();
        window.codes = await window.api.getCodes();
        renderCodeList();
        
        // Update current code from new list and select it
        const updatedCurrentCode = window.codes.find(code => code.id === window.currentCode.id);
        if (updatedCurrentCode) {
            selectCode(updatedCurrentCode);
        }
        
        // Update user view
        await updateUserView(updatedCurrentCode);
        
    } catch (error) {
        console.error('Error setting selected code:', error);
        showNotification('Lỗi khi chọn code hiển thị cho User: ' + error.message, 'error');
    } finally {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
}

// Setup resizable editor
function setupResizable() {
    if (!adminElements.resizeHandle) return;
    
    const editorSection = document.querySelector('.code-editor-section');
    const previewSection = document.querySelector('.preview-section');
    let isResizing = false;
    
    adminElements.resizeHandle.addEventListener('mousedown', startResize);
    
    function startResize(e) {
        isResizing = true;
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }
    
    function resize(e) {
        if (!isResizing) return;
        
        const containerRect = document.querySelector('.editor-container').getBoundingClientRect();
        const isVertical = window.innerWidth <= 1024;
        
        if (isVertical) {
            // Vertical resize (for mobile/tablet)
            const newHeight = e.clientY - containerRect.top;
            const containerHeight = containerRect.height;
            
            if (newHeight > 100 && newHeight < containerHeight - 100) {
                editorSection.style.height = `${newHeight}px`;
                previewSection.style.height = `${containerHeight - newHeight - 8}px`;
            }
        } else {
            // Horizontal resize (for desktop)
            const newWidth = e.clientX - containerRect.left;
            const containerWidth = containerRect.width;
            
            if (newWidth > 200 && newWidth < containerWidth - 200) {
                editorSection.style.width = `${newWidth}px`;
                previewSection.style.width = `${containerWidth - newWidth - 8}px`;
            }
        }
    }
    
    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
}

// Handle codes updated event
function handleCodesUpdated(updatedCodes) {
    window.codes = updatedCodes.map(code => ({
        ...code,
        selected: code.id === window.currentCode?.id ? window.currentCode.selected : code.selected
    }));
    
    renderCodeList();
    
    // Update current code if it exists in updated list
    if (window.currentCode) {
        const updatedCurrentCode = window.codes.find(c => c.id === window.currentCode.id);
        if (updatedCurrentCode) {
            window.currentCode = updatedCurrentCode;
            selectCode(window.currentCode);
        } else {
            // Current code was deleted
            window.currentCode = null;
            if (adminElements.codeEditor) adminElements.codeEditor.value = '';
            if (adminElements.editorTitle) adminElements.editorTitle.textContent = 'Chỉnh sửa Code';
            
            // Select first code if available
            if (window.codes.length > 0) {
                selectCode(window.codes[0]);
            }
        }
    }
}

// Handle selected code updated event
async function handleSelectedCodeUpdated(selectedCodeId) {
    // Update code list
    window.codes = window.codes.map(code => ({
        ...code,
        selected: code.id === selectedCodeId
    }));
    
    renderCodeList();
    await loadSelectedCodeInfo();
    
    // If admin is viewing the selected code, update button
    if (window.currentCode && window.currentCode.id === selectedCodeId) {
        if (adminElements.setAsUserCodeBtn) {
            adminElements.setAsUserCodeBtn.innerHTML = '<i class="fas fa-check"></i> Đang hiển thị cho User';
            adminElements.setAsUserCodeBtn.classList.add('btn-success');
            adminElements.setAsUserCodeBtn.classList.remove('btn-warning');
            adminElements.setAsUserCodeBtn.disabled = true;
        }
        if (adminElements.deleteCodeBtn) {
            adminElements.deleteCodeBtn.disabled = true;
        }
    } else if (window.currentCode) {
        if (adminElements.setAsUserCodeBtn) {
            adminElements.setAsUserCodeBtn.innerHTML = '<i class="fas fa-eye"></i> Chọn hiển thị cho User';
            adminElements.setAsUserCodeBtn.classList.add('btn-warning');
            adminElements.setAsUserCodeBtn.classList.remove('btn-success');
            adminElements.setAsUserCodeBtn.disabled = false;
        }
        if (adminElements.deleteCodeBtn) {
            adminElements.deleteCodeBtn.disabled = false;
        }
    }
}

// Handle code updated event
async function handleCodeUpdated(updatedCode) {
    // Update current code if it's the one that was updated
    if (window.currentCode && window.currentCode.id === updatedCode.id) {
        window.currentCode = updatedCode;
        selectCode(window.currentCode);
    }
}