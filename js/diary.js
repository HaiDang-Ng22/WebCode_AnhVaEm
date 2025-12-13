// diary.js - Optimized for Shared Diary
class DiaryManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.selectedEntry = null;
        this.diaryEntries = {};
        this.isLoading = false;
        this.diaryRef = null;
        this.currentImages = [];
        this.viewMode = 'all';
        
        this.init();
    }
    
    init() {
        this.createDiaryButtons();
        this.createDiaryModal();
        this.cacheDOMElements();
        this.setupEventListeners();
        this.initFirebase();
    }
    
    createDiaryButtons() {
        // Create button in admin toolbar
        const adminToolbar = document.querySelector('.admin-toolbar-actions');
        if (adminToolbar && !document.getElementById('admin-toolbar-diary-btn')) {
            const diaryBtn = this.createButton({
                id: 'admin-toolbar-diary-btn',
                text: 'Mở nhật ký',
                icon: 'fa-book-heart',
                className: 'btn btn-love',
                gradient: 'linear-gradient(135deg, #ff9ec0 0%, #d9a6ff 100%)'
            });
            adminToolbar.prepend(diaryBtn);
        }
        
        // Create button in user mini controls
        const userControls = document.querySelector('.user-mini-controls');
        if (userControls && !document.getElementById('user-diary-btn')) {
            const diaryBtn = this.createButton({
                id: 'user-diary-btn',
                text: 'Nhật ký',
                icon: 'fa-book-heart',
                className: 'btn btn-sm',
                gradient: 'linear-gradient(135deg, #ff9ec0 0%, #d9a6ff 100%)'
            });
            
            // Insert after user info
            const userInfo = userControls.querySelector('.user-info-mini');
            if (userInfo) {
                userInfo.after(diaryBtn);
            } else {
                userControls.appendChild(diaryBtn);
            }
        }
    }
    
    createButton({ id, text, icon, className, gradient }) {
        const button = document.createElement('button');
        button.id = id;
        button.className = className;
        button.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
        button.style.background = gradient;
        button.style.color = 'white';
        button.style.borderRadius = '20px';
        button.style.padding = '8px 15px';
        button.style.margin = '0 5px';
        return button;
    }
    
    createDiaryModal() {
        if (document.getElementById('diary-modal')) return;
        
        const modalHTML = `
            <div id="diary-modal" class="diary-modal hidden">
                <div class="diary-modal-content">
                    <div class="diary-modal-header">
                        <h2><i class="fas fa-book-heart"></i> Nhật ký tình yêu</h2>
                        <div class="diary-view-mode">
                            <button class="view-mode-btn active" data-mode="all">
                                <i class="fas fa-users"></i> Tất cả
                            </button>
                            <button class="view-mode-btn" data-mode="mine">
                                <i class="fas fa-user"></i> Của tôi
                            </button>
                        </div>
                        <button class="diary-close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="calendar-container">
                        <div class="calendar-header">
                            <h3><i class="fas fa-calendar-heart"></i> Lịch nhật ký</h3>
                            <div class="calendar-nav">
                                <button class="calendar-nav-btn" id="prev-month-btn">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <span id="calendar-month-year" class="calendar-month-year"></span>
                                <button class="calendar-nav-btn" id="next-month-btn">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="calendar-weekdays">
                            <div class="weekday">CN</div>
                            <div class="weekday">T2</div>
                            <div class="weekday">T3</div>
                            <div class="weekday">T4</div>
                            <div class="weekday">T5</div>
                            <div class="weekday">T6</div>
                            <div class="weekday">T7</div>
                        </div>
                        
                        <div class="calendar-days" id="calendar-days"></div>
                    </div>
                    
                    <div class="diary-entry-container">
                        <div class="diary-entry-form">
                            <div class="selected-date-display">
                                <i class="fas fa-calendar-day"></i>
                                <h4 id="selected-date-display">Chọn ngày để viết nhật ký</h4>
                            </div>
                            
                            <div class="diary-form-group">
                                <label for="diary-title-input">
                                    <i class="fas fa-heading"></i> Tiêu đề
                                </label>
                                <input type="text" id="diary-title-input" class="diary-title-input" 
                                       placeholder="Viết tiêu đề nhật ký...">
                            </div>
                            
                            <div class="diary-form-group">
                                <label for="diary-content-input">
                                    <i class="fas fa-pen-fancy"></i> Nội dung
                                </label>
                                <textarea id="diary-content-input" class="diary-content-input" 
                                          placeholder="Viết những điều muốn chia sẻ... ❤️"></textarea>
                            </div>
                            
                            <div class="diary-form-group">
                                <label>
                                    <i class="fas fa-images"></i> Hình ảnh (tối đa 5 ảnh)
                                </label>
                                <div class="image-upload-container" id="image-upload-container">
                                    <div class="image-upload-icon">
                                        <i class="fas fa-cloud-upload-alt"></i>
                                    </div>
                                    <div class="image-upload-text">
                                        <h4>Kéo thả ảnh hoặc nhấn để chọn</h4>
                                        <p>Lưu giữ những khoảnh khắc đáng nhớ</p>
                                    </div>
                                    <div class="image-upload-btn">Chọn ảnh</div>
                                    <input type="file" id="image-file-input" accept="image/*" multiple>
                                </div>
                                <div class="image-preview-container" id="image-preview-container"></div>
                            </div>
                            
                            <div class="diary-actions">
                                <button class="diary-save-btn" id="diary-save-btn" disabled>
                                    <i class="fas fa-heart"></i> Lưu nhật ký
                                </button>
                                <button class="diary-delete-btn" id="diary-delete-btn" disabled>
                                    <i class="fas fa-trash"></i> Xóa
                                </button>
                            </div>
                        </div>
                        
                        <div class="diary-entries-container">
                            <div class="diary-entries-header">
                                <h3><i class="fas fa-history"></i> Nhật ký đã viết</h3>
                                <div class="diary-stats">
                                    <div>
                                        <i class="fas fa-heart"></i>
                                        <span id="total-entries">0</span>
                                    </div>
                                    <div>
                                        <i class="fas fa-image"></i>
                                        <span id="total-images">0</span>
                                    </div>
                                </div>
                            </div>
                            <div class="diary-entries-list" id="diary-entries-list"></div>
                        </div>
                    </div>
                    
                    <div class="diary-love-quote">
                        "Mỗi ngày bên em là một trang nhật ký đẹp nhất của đời anh"
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    cacheDOMElements() {
        this.diaryModal = document.getElementById('diary-modal');
        this.calendarMonthYear = document.getElementById('calendar-month-year');
        this.calendarDays = document.getElementById('calendar-days');
        this.selectedDateDisplay = document.getElementById('selected-date-display');
        this.diaryTitleInput = document.getElementById('diary-title-input');
        this.diaryContentInput = document.getElementById('diary-content-input');
        this.imageUploadContainer = document.getElementById('image-upload-container');
        this.imageFileInput = document.getElementById('image-file-input');
        this.imagePreviewContainer = document.getElementById('image-preview-container');
        this.diarySaveBtn = document.getElementById('diary-save-btn');
        this.diaryDeleteBtn = document.getElementById('diary-delete-btn');
        this.diaryEntriesList = document.getElementById('diary-entries-list');
        this.totalEntries = document.getElementById('total-entries');
        this.totalImages = document.getElementById('total-images');
    }
    
    setupEventListeners() {
        // Open diary modal
        document.addEventListener('click', (e) => {
            if (e.target.closest('#admin-toolbar-diary-btn') || 
                e.target.closest('#user-diary-btn')) {
                this.openDiary();
            }
        });
        
        // Close modal
        this.diaryModal?.querySelector('.diary-close-btn').addEventListener('click', () => this.closeDiary());
        
        // Calendar navigation
        document.getElementById('prev-month-btn')?.addEventListener('click', () => this.previousMonth());
        document.getElementById('next-month-btn')?.addEventListener('click', () => this.nextMonth());
        
        // Date selection
        this.calendarDays?.addEventListener('click', (e) => {
            const dayEl = e.target.closest('.calendar-day:not(.empty-day):not(.disabled-day)');
            if (dayEl) {
                const day = parseInt(dayEl.textContent);
                const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
                this.selectDate(date);
            }
        });
        
        // View mode
        this.diaryModal?.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.closest('.view-mode-btn').dataset.mode;
                this.setViewMode(mode);
            });
        });
        
        // Form inputs
        this.diaryTitleInput?.addEventListener('input', () => this.updateSaveButtonState());
        this.diaryContentInput?.addEventListener('input', () => this.updateSaveButtonState());
        
        // Image upload
        this.imageUploadContainer?.addEventListener('click', () => this.imageFileInput.click());
        
        this.imageUploadContainer?.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.imageUploadContainer.classList.add('dragover');
        });
        
        this.imageUploadContainer?.addEventListener('dragleave', () => {
            this.imageUploadContainer.classList.remove('dragover');
        });
        
        this.imageUploadContainer?.addEventListener('drop', (e) => {
            e.preventDefault();
            this.imageUploadContainer.classList.remove('dragover');
            this.handleImageFiles(Array.from(e.dataTransfer.files));
        });
        
        this.imageFileInput?.addEventListener('change', (e) => {
            this.handleImageFiles(Array.from(e.target.files));
        });
        
        // Save/Delete
        this.diarySaveBtn?.addEventListener('click', () => this.saveDiaryEntry());
        this.diaryDeleteBtn?.addEventListener('click', () => this.deleteDiaryEntry());
        
        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.diaryModal && !this.diaryModal.classList.contains('hidden')) {
                this.closeDiary();
            }
        });
        
        // Close on outside click
        this.diaryModal?.addEventListener('click', (e) => {
            if (e.target === this.diaryModal) {
                this.closeDiary();
            }
        });
    }
    
    initFirebase() {
        if (window.api && window.api.database) {
            this.diaryRef = window.api.database.ref('shared_diary');
            this.loadDiaryEntries();
        }
    }
    
    openDiary() {
        if (!this.diaryModal) return;
        
        this.diaryModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        this.renderCalendar();
        this.selectDate(new Date());
        this.loadDiaryEntries();
        this.updateStats();
    }
    
    closeDiary() {
        if (!this.diaryModal) return;
        
        this.diaryModal.classList.add('hidden');
        document.body.style.overflow = '';
        this.resetForm();
    }
    
    renderCalendar() {
        if (!this.calendarMonthYear || !this.calendarDays) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month/year
        const monthNames = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
        
        this.calendarMonthYear.textContent = `${monthNames[month]} ${year}`;
        
        // Get calendar data
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();
        let firstDayIndex = firstDay.getDay();
        firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
        
        // Clear calendar
        this.calendarDays.innerHTML = '';
        
        // Add empty days
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty-day';
            this.calendarDays.appendChild(emptyDay);
        }
        
        // Add days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= totalDays; day++) {
            const dayDate = new Date(year, month, day);
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            // Today
            if (dayDate.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            
            // Has entry
            const dateKey = this.formatDateKey(dayDate);
            const entry = this.diaryEntries[dateKey];
            if (entry) {
                dayElement.classList.add('has-entry');
                
                // Add indicator
                const indicator = document.createElement('div');
                indicator.className = 'calendar-day-indicator';
                indicator.style.backgroundColor = this.isMyEntry(entry) ? 'var(--love-red)' : 'var(--love-pink)';
                dayElement.appendChild(indicator);
            }
            
            // Disable future dates
            if (dayDate > today) {
                dayElement.classList.add('disabled-day');
            }
            
            // Selected date
            if (dayDate.toDateString() === this.selectedDate.toDateString()) {
                dayElement.classList.add('selected');
            }
            
            this.calendarDays.appendChild(dayElement);
        }
        
        // Update nav buttons
        const nextMonthBtn = document.getElementById('next-month-btn');
        if (nextMonthBtn) {
            const nextMonth = new Date(year, month + 1, 1);
            const firstDayNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            nextMonthBtn.disabled = nextMonth > firstDayNextMonth;
        }
    }
    
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }
    
    selectDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date > today) {
            showNotification('Không thể viết nhật ký cho ngày tương lai!', 'error');
            return;
        }
        
        this.selectedDate = date;
        
        // Update display
        if (this.selectedDateDisplay) {
            this.selectedDateDisplay.textContent = this.formatDateDisplay(date);
        }
        
        // Update calendar
        this.renderCalendar();
        
        // Load entry
        this.loadEntryForDate(date);
        
        // Update save button
        this.updateSaveButtonState();
    }
    
    loadEntryForDate(date) {
        const dateKey = this.formatDateKey(date);
        const entry = this.diaryEntries[dateKey];
        
        if (entry) {
            // Existing entry
            this.selectedEntry = entry;
            this.diaryTitleInput.value = entry.title || '';
            this.diaryContentInput.value = entry.content || '';
            this.currentImages = entry.images || [];
            
            // Update delete button
            if (this.diaryDeleteBtn) {
                this.diaryDeleteBtn.disabled = !this.isMyEntry(entry);
                this.diaryDeleteBtn.innerHTML = this.isMyEntry(entry) 
                    ? '<i class="fas fa-trash"></i> Xóa nhật ký của tôi'
                    : '<i class="fas fa-lock"></i> Chỉ tác giả mới xóa được';
            }
        } else {
            // New entry
            this.selectedEntry = null;
            this.diaryTitleInput.value = '';
            this.diaryContentInput.value = '';
            this.currentImages = [];
            
            // Disable delete button
            if (this.diaryDeleteBtn) {
                this.diaryDeleteBtn.disabled = true;
                this.diaryDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Xóa nhật ký';
            }
        }
        
        this.renderImagePreviews();
    }
    
    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update button styles
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Reload entries
        this.loadDiaryEntriesList();
    }
    
    updateSaveButtonState() {
        if (!this.diarySaveBtn) return;
        
        const hasTitle = this.diaryTitleInput?.value.trim().length > 0;
        const hasContent = this.diaryContentInput?.value.trim().length > 0;
        const hasImages = this.currentImages.length > 0;
        
        this.diarySaveBtn.disabled = !(hasTitle || hasContent || hasImages);
    }
    
    handleImageFiles(files) {
        // Limit to 5 images
        const remainingSlots = 5 - this.currentImages.length;
        if (remainingSlots <= 0) {
            showNotification('Chỉ có thể thêm tối đa 5 ảnh!', 'error');
            return;
        }
        
        const validFiles = files.slice(0, remainingSlots);
        
        validFiles.forEach(file => {
            // Validate file
            if (!file.type.match('image.*')) {
                showNotification('Chỉ chấp nhận file hình ảnh!', 'error');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showNotification('Ảnh quá lớn! Tối đa 5MB.', 'error');
                return;
            }
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentImages.push({
                    file: file,
                    dataUrl: e.target.result,
                    name: file.name
                });
                
                this.renderImagePreviews();
                this.updateSaveButtonState();
            };
            reader.readAsDataURL(file);
        });
    }
    
    renderImagePreviews() {
        if (!this.imagePreviewContainer) return;
        
        this.imagePreviewContainer.innerHTML = '';
        
        this.currentImages.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'image-preview-item';
            
            const img = document.createElement('img');
            img.src = image.dataUrl;
            img.alt = image.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-image-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeImage(index);
            });
            
            item.appendChild(img);
            item.appendChild(removeBtn);
            this.imagePreviewContainer.appendChild(item);
        });
    }
    
    removeImage(index) {
        this.currentImages.splice(index, 1);
        this.renderImagePreviews();
        this.updateSaveButtonState();
    }
    
    async saveDiaryEntry() {
        if (!window.currentUser) {
            showNotification('Vui lòng đăng nhập để lưu nhật ký!', 'error');
            return;
        }
        
        if (!window.api?.checkConnection()) {
            showNotification('Không thể kết nối database!', 'error');
            return;
        }
        
        const dateKey = this.formatDateKey(this.selectedDate);
        const title = this.diaryTitleInput?.value.trim() || '';
        const content = this.diaryContentInput?.value.trim() || '';
        
        if (!title && !content && this.currentImages.length === 0) {
            showNotification('Hãy viết gì đó hoặc thêm ảnh!', 'error');
            return;
        }
        
        // Show loading
        this.showLoading('Đang lưu nhật ký...');
        
        try {
            // Prepare entry data
            const diaryEntry = {
                id: dateKey,
                date: this.selectedDate.toISOString(),
                dateKey: dateKey,
                title: title,
                content: content,
                images: this.currentImages.map(img => img.dataUrl),
                userId: window.currentUser.id,
                userName: window.currentUser.name,
                userAvatar: window.currentUser.avatar,
                createdAt: this.selectedEntry?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updatedBy: window.currentUser.name
            };
            
            // Save to Firebase
            if (this.diaryRef) {
                await this.diaryRef.child(dateKey).set(diaryEntry);
                
                // Update local cache
                this.diaryEntries[dateKey] = diaryEntry;
                
                showNotification('Đã lưu nhật ký thành công! ❤️', 'success');
                
                // Update UI
                this.renderCalendar();
                this.loadDiaryEntriesList();
                this.updateStats();
                
                // Update form
                this.selectedEntry = diaryEntry;
                if (this.diaryDeleteBtn) {
                    this.diaryDeleteBtn.disabled = false;
                    this.diaryDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Xóa nhật ký của tôi';
                }
            }
        } catch (error) {
            console.error('Error saving diary:', error);
            showNotification('Lỗi khi lưu nhật ký: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async deleteDiaryEntry() {
        if (!this.selectedEntry || !window.api || !window.currentUser) return;
        
        // Only author can delete
        if (!this.isMyEntry(this.selectedEntry)) {
            showNotification('Chỉ người viết mới có thể xóa nhật ký này!', 'error');
            return;
        }
        
        const confirmation = confirm('Bạn có chắc chắn muốn xóa nhật ký này?');
        if (!confirmation) return;
        
        this.showLoading('Đang xóa nhật ký...');
        
        try {
            // Delete from Firebase
            if (this.diaryRef) {
                await this.diaryRef.child(this.selectedEntry.dateKey).remove();
                
                // Update local cache
                delete this.diaryEntries[this.selectedEntry.dateKey];
                
                showNotification('Đã xóa nhật ký thành công!', 'success');
                
                // Reset form
                this.resetForm();
                
                // Update UI
                this.renderCalendar();
                this.loadDiaryEntriesList();
                this.updateStats();
            }
        } catch (error) {
            console.error('Error deleting diary:', error);
            showNotification('Lỗi khi xóa nhật ký: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async loadDiaryEntries() {
        if (!window.api?.checkConnection() || this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            if (this.diaryRef) {
                this.diaryRef.on('value', (snapshot) => {
                    this.diaryEntries = snapshot.val() || {};
                    this.renderCalendar();
                    this.loadDiaryEntriesList();
                    this.updateStats();
                    this.isLoading = false;
                });
            }
        } catch (error) {
            console.error('Error loading diary:', error);
            this.isLoading = false;
        }
    }
    
    loadDiaryEntriesList() {
        if (!this.diaryEntriesList) return;
        
        // Convert to array and sort
        let entries = Object.values(this.diaryEntries)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Filter by view mode
        if (this.viewMode === 'mine' && window.currentUser) {
            entries = entries.filter(entry => this.isMyEntry(entry));
        }
        
        // Display
        if (entries.length === 0) {
            const message = this.viewMode === 'mine' 
                ? 'Bạn chưa viết nhật ký nào. Hãy bắt đầu viết nhật ký tình yêu nhé!'
                : 'Chưa có nhật ký nào được viết. Hãy cùng nhau viết những kỷ niệm đẹp!';
            
            this.diaryEntriesList.innerHTML = `
                <div class="diary-empty-state">
                    <i class="fas fa-book-open"></i>
                    <h4>${this.viewMode === 'mine' ? 'Chưa có nhật ký của bạn' : 'Chưa có nhật ký nào'}</h4>
                    <p>${message}</p>
                </div>
            `;
            return;
        }
        
        this.diaryEntriesList.innerHTML = entries.map(entry => {
            const date = new Date(entry.date);
            const isSelected = this.selectedEntry?.id === entry.id;
            const isMine = this.isMyEntry(entry);
            const hasImages = entry.images?.length > 0;
            
            return `
                <div class="diary-entry-item ${isSelected ? 'selected' : ''}" data-id="${entry.id}">
                    <div class="diary-entry-header">
                        <div class="diary-entry-date">
                            <i class="far fa-calendar"></i>
                            ${this.formatDateDisplay(date)}
                            <span class="author-badge ${isMine ? 'mine' : 'other'}">
                                ${isMine ? 'Của tôi' : entry.userName || 'Người yêu'}
                            </span>
                        </div>
                        ${hasImages ? `
                            <div class="diary-entry-has-images" title="Có ${entry.images.length} ảnh">
                                <i class="fas fa-camera"></i> ${entry.images.length}
                            </div>
                        ` : ''}
                    </div>
                    <div class="diary-entry-title">
                        ${entry.title || 'Nhật ký không tiêu đề'}
                    </div>
                    <div class="diary-entry-preview">
                        ${entry.content ? (entry.content.length > 100 ? entry.content.substring(0, 100) + '...' : entry.content) : 'Không có nội dung'}
                    </div>
                    <div class="entry-footer">
                        <div>
                            <i class="far fa-clock"></i> ${new Date(entry.updatedAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div>
                            ${isMine ? '<i class="fas fa-edit"></i> Có thể chỉnh sửa' : '<i class="fas fa-eye"></i> Chỉ xem'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click listeners
        this.diaryEntriesList.querySelectorAll('.diary-entry-item').forEach(item => {
            item.addEventListener('click', () => {
                const entryId = item.dataset.id;
                const entry = this.diaryEntries[entryId];
                
                if (entry) {
                    const date = new Date(entry.date);
                    this.selectDate(date);
                    
                    // Scroll to form
                    const form = document.querySelector('.diary-entry-form');
                    form?.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }
    
    updateStats() {
        if (!this.totalEntries || !this.totalImages) return;
        
        const entries = Object.values(this.diaryEntries);
        const totalImages = entries.reduce((sum, entry) => 
            sum + (entry.images?.length || 0), 0);
        
        this.totalEntries.textContent = entries.length;
        this.totalImages.textContent = totalImages;
    }
    
    resetForm() {
        this.selectedEntry = null;
        this.diaryTitleInput.value = '';
        this.diaryContentInput.value = '';
        this.currentImages = [];
        this.renderImagePreviews();
        this.diarySaveBtn.disabled = true;
        this.diaryDeleteBtn.disabled = true;
        this.diaryDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Xóa nhật ký';
        
        // Select today
        this.selectDate(new Date());
    }
    
    formatDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    formatDateDisplay(date) {
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).charAt(0).toUpperCase() + 
        date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).slice(1);
    }
    
    isMyEntry(entry) {
        return window.currentUser && entry.userId === window.currentUser.id;
    }
    
    showLoading(text) {
        const overlay = document.getElementById('loading-overlay');
        const textEl = document.getElementById('loading-text');
        if (overlay && textEl) {
            textEl.textContent = text;
            overlay.classList.remove('hidden');
        }
    }
    
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    }
}

// Initialize when DOM is ready
let diaryManager = null;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!diaryManager) {
            diaryManager = new DiaryManager();
            console.log('Diary Manager initialized');
        }
    }, 1000);
});