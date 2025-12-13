// firebase-api.js
// ========== FIREBASE CONFIGURATION ==========
const firebaseConfig = {
    apiKey: "AIzaSyCibFrVhSBB-jzZa-af8joC4PyMBPUyabU",
    authDomain: "chathub-46d8f.firebaseapp.com",
    databaseURL: "https://chathub-46d8f-default-rtdb.firebaseio.com",
    projectId: "chathub-46d8f",
    storageBucket: "chathub-46d8f.appspot.com",
    messagingSenderId: "269084298645",
    appId: "1:269084298645:web:d64abd09aeac50d73e7a9c",
    measurementId: "G-D3Q0GELQ30"
};

// ========== FIREBASE API ==========
class FirebaseAPI {
    constructor() {
        this.database = null;
        this.listeners = [];
        this.isConnected = false;
        
        // Initialize references
        this.usersRef = null;
        this.codesRef = null;
        this.selectedCodeRef = null;
        
        // Initialize Firebase
        this.initializeFirebase();
    }
    
    initializeFirebase() {
        try {
            // Check if Firebase is already initialized
            if (!firebase.apps.length) {
                window.app = firebase.initializeApp(firebaseConfig);
            } else {
                window.app = firebase.app();
            }
            
            window.database = firebase.database();
            this.database = window.database;
            
            // Initialize references
            this.usersRef = this.database.ref('users');
            this.codesRef = this.database.ref('codes');
            this.selectedCodeRef = this.database.ref('selectedCode');
            
            console.log("Firebase initialized successfully");
            this.isConnected = true;
            
            // Set up connection state listener
            this.setupConnectionListener();
            
            return true;
        } catch (error) {
            console.error("Firebase initialization error:", error);
            this.isConnected = false;
            this.showDatabaseError(error.message);
            return false;
        }
    }
    
    setupConnectionListener() {
        // Listen for connection state changes
        const connectedRef = this.database.ref(".info/connected");
        connectedRef.on("value", (snap) => {
            if (snap.val() === true) {
                this.isConnected = true;
                this.hideDatabaseError();
                console.log("Connected to Firebase Database");
            } else {
                this.isConnected = false;
                console.log("Disconnected from Firebase Database");
            }
        });
        
        // Listen for database errors
        this.codesRef.on("value", () => {}, (error) => {
            console.error("Firebase database error:", error);
            this.isConnected = false;
            this.showDatabaseError(error.message);
        });
    }
    
    showDatabaseError(message) {
        // This method will be implemented in app.js
        if (typeof showDatabaseError === 'function') {
            showDatabaseError(message);
        }
    }
    
    hideDatabaseError() {
        // This method will be implemented in app.js
        if (typeof hideDatabaseError === 'function') {
            hideDatabaseError();
        }
    }
    
    // User methods
    async login(email, password) {
        if (!this.isConnected || !this.usersRef) {
            return { 
                success: false, 
                message: 'Không thể kết nối đến database. Vui lòng kiểm tra kết nối Internet.' 
            };
        }
        
        try {
            const snapshot = await this.usersRef.once('value');
            const users = snapshot.val();
            
            if (!users) {
                // Create default users
                const defaultUsers = [
                    {
                        id: 'admin_1',
                        name: 'Admin User',
                        email: 'dh813345@gmail.com',
                        password: 'D@ng0799192226',
                        role: 'admin',
                        avatar: 'A',
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'user_1',
                        name: 'Regular User',
                        email: 'user@example.com',
                        password: 'user123',
                        role: 'user',
                        avatar: 'U',
                        createdAt: new Date().toISOString()
                    }
                ];
                
                for (const user of defaultUsers) {
                    await this.usersRef.child(user.id).set(user);
                }
                
                // Retry login after creating users
                return this.login(email, password);
            }
            
            // Find user
            const user = Object.values(users).find(u => u.email === email && u.password === password);
            
            if (user) {
                return {
                    success: true,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        avatar: user.avatar
                    }
                };
            } else {
                return {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                };
            }
        } catch (error) {
            console.error("Login error:", error);
            return { 
                success: false, 
                message: 'Lỗi kết nối đến server: ' + (error.message || 'Unknown error') 
            };
        }
    }
    
    // Code methods
    async getCodes() {
        if (!this.isConnected) {
            this.showDatabaseError("Mất kết nối database");
            return [];
        }
        
        try {
            const codesSnapshot = await this.codesRef.once('value');
            const selectedCodeSnapshot = await this.selectedCodeRef.once('value');
            const selectedCodeId = selectedCodeSnapshot.val();
            
            const codes = codesSnapshot.val();
            if (!codes) {
                // Create default code if none exists
                await this.createDefaultCode();
                return this.getCodes();
            }
            
            // Convert to array and mark selected code
            return Object.values(codes).map(code => ({
                ...code,
                selected: code.id === selectedCodeId
            }));
        } catch (error) {
            console.error("Get codes error:", error);
            this.showDatabaseError("Lỗi khi tải code: " + error.message);
            return [];
        }
    }
    
    async createDefaultCode() {
        try {
            const defaultCode = {
                id: 'code_1',
                title: 'Trang chào mừng',
                description: 'Trang chào mừng đơn giản',
                language: 'html',
                content: `<!DOCTYPE html>
<html>
<head>
    <title>Chào mừng đến với CodeRunner</title>
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
            max-width: 900px;
            width: 100%;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        }
        
        h1 {
            font-size: 3.5rem;
            margin-bottom: 20px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        
        .highlight {
            color: #ffcc00;
            font-weight: bold;
        }
        
        p {
            font-size: 1.3rem;
            line-height: 1.7;
            margin-bottom: 30px;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .time-display {
            font-size: 1.5rem;
            background-color: rgba(0, 0, 0, 0.2);
            padding: 15px 25px;
            border-radius: 10px;
            display: inline-block;
            margin-top: 20px;
            font-weight: bold;
        }
        
        .features {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 40px;
        }
        
        .feature {
            background-color: rgba(255, 255, 255, 0.15);
            padding: 20px;
            border-radius: 10px;
            width: 200px;
            transition: transform 0.3s;
        }
        
        .feature:hover {
            transform: translateY(-5px);
        }
        
        .feature i {
            font-size: 2.5rem;
            margin-bottom: 15px;
            color: #ffcc00;
        }
        
        @media (max-width: 768px) {
            h1 {
                font-size: 2.5rem;
            }
            
            p {
                font-size: 1.1rem;
            }
            
            .container {
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Chào mừng đến với <span class="highlight">CodeRunner</span></h1>
        <p>Hệ thống quản lý code với tính năng Admin và User. Code này đang được hiển thị cho tất cả người dùng.</p>
        
        <div class="time-display">
            Thời gian hiện tại: <span id="time">00:00:00</span>
        </div>
        
        <div class="features">
            <div class="feature">
                <i class="fas fa-code"></i>
                <h3>Code HTML/CSS/JS</h3>
                <p>Hỗ trợ đa ngôn ngữ</p>
            </div>
            <div class="feature">
                <i class="fas fa-user-shield"></i>
                <h3>Phân quyền</h3>
                <p>Admin & User riêng biệt</p>
            </div>
            <div class="feature">
                <i class="fas fa-sync-alt"></i>
                <h3>Cập nhật real-time</h3>
                <p>Thay đổi ngay lập tức</p>
            </div>
        </div>
    </div>
    
    <script>
        function updateTime() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString();
            document.getElementById('time').textContent = timeStr;
        }
        updateTime();
        setInterval(updateTime, 1000);
    <\/script>
</body>
</html>`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'admin_1'
            };
            
            await this.codesRef.child(defaultCode.id).set(defaultCode);
            await this.selectedCodeRef.set(defaultCode.id);
            
            return defaultCode;
        } catch (error) {
            console.error("Error creating default code:", error);
            throw error;
        }
    }
    
    async getCodeById(id) {
        if (!this.isConnected) {
            this.showDatabaseError("Mất kết nối database");
            return null;
        }
        
        try {
            const snapshot = await this.codesRef.child(id).once('value');
            return snapshot.val();
        } catch (error) {
            console.error("Get code by id error:", error);
            return null;
        }
    }
    
    async createCode(codeData) {
        if (!this.isConnected) {
            throw new Error('Không thể kết nối đến database. Vui lòng kiểm tra kết nối Internet.');
        }
        
        try {
            const newCodeId = 'code_' + Date.now();
            const newCode = {
                ...codeData,
                id: newCodeId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await this.codesRef.child(newCodeId).set(newCode);
            
            // Notify listeners
            this.notifyListeners('codesUpdated', await this.getCodes());
            return newCode;
        } catch (error) {
            console.error("Create code error:", error);
            throw new Error('Lỗi khi tạo code: ' + error.message);
        }
    }
    
    async updateCode(id, codeData) {
        if (!this.isConnected) {
            throw new Error('Không thể kết nối đến database. Vui lòng kiểm tra kết nối Internet.');
        }
        
        try {
            const codeRef = this.codesRef.child(id);
            const snapshot = await codeRef.once('value');
            
            if (!snapshot.exists()) {
                throw new Error('Code không tồn tại');
            }
            
            const updatedCode = {
                ...snapshot.val(),
                ...codeData,
                updatedAt: new Date().toISOString()
            };
            
            await codeRef.update(updatedCode);
            
            // Notify listeners
            this.notifyListeners('codesUpdated', await this.getCodes());
            this.notifyListeners('codeUpdated', { id, ...updatedCode });
            return updatedCode;
        } catch (error) {
            console.error("Update code error:", error);
            throw new Error('Lỗi khi cập nhật code: ' + error.message);
        }
    }
    
    async deleteCode(id) {
        if (!this.isConnected) {
            throw new Error('Không thể kết nối đến database. Vui lòng kiểm tra kết nối Internet.');
        }
        
        try {
            // Check if this code is selected
            const selectedCodeSnapshot = await this.selectedCodeRef.once('value');
            const selectedCodeId = selectedCodeSnapshot.val();
            
            if (selectedCodeId === id) {
                // If deleting selected code, clear selection
                await this.selectedCodeRef.remove();
                this.notifyListeners('selectedCodeUpdated', null);
            }
            
            // Delete the code
            await this.codesRef.child(id).remove();
            
            // Notify listeners
            this.notifyListeners('codesUpdated', await this.getCodes());
            return true;
        } catch (error) {
            console.error("Delete code error:", error);
            throw new Error('Lỗi khi xóa code: ' + error.message);
        }
    }
    
    async setSelectedCode(id) {
        if (!this.isConnected) {
            throw new Error('Không thể kết nối đến database. Vui lòng kiểm tra kết nối Internet.');
        }
        
        try {
            // First check if code exists
            const codeSnapshot = await this.codesRef.child(id).once('value');
            if (!codeSnapshot.exists()) {
                throw new Error('Code không tồn tại');
            }
            
            await this.selectedCodeRef.set(id);
            this.notifyListeners('selectedCodeUpdated', id);
            return true;
        } catch (error) {
            console.error("Set selected code error:", error);
            throw new Error('Lỗi khi chọn code hiển thị: ' + error.message);
        }
    }
    
    async getSelectedCode() {
        if (!this.isConnected) {
            this.showDatabaseError("Mất kết nối database");
            return null;
        }
        
        try {
            const selectedCodeSnapshot = await this.selectedCodeRef.once('value');
            const selectedCodeId = selectedCodeSnapshot.val();
            
            if (!selectedCodeId) return null;
            
            return this.getCodeById(selectedCodeId);
        } catch (error) {
            console.error("Get selected code error:", error);
            return null;
        }
    }
    
    // Real-time listeners
    addListener(event, callback) {
        this.listeners.push({ event, callback });
        
        // Set up Firebase real-time listeners if connected
        if (this.isConnected) {
            if (event === 'codesUpdated') {
                this.codesRef.on('value', async (snapshot) => {
                    try {
                        const selectedCodeSnapshot = await this.selectedCodeRef.once('value');
                        const selectedCodeId = selectedCodeSnapshot.val();
                        const codes = snapshot.val();
                        
                        if (!codes) {
                            callback([]);
                            return;
                        }
                        
                        const codesArray = Object.values(codes).map(code => ({
                            ...code,
                            selected: code.id === selectedCodeId
                        }));
                        
                        callback(codesArray);
                    } catch (error) {
                        console.error("Real-time codes update error:", error);
                    }
                }, (error) => {
                    console.error("Real-time codes listener error:", error);
                });
            } else if (event === 'selectedCodeUpdated') {
                this.selectedCodeRef.on('value', (snapshot) => {
                    callback(snapshot.val());
                }, (error) => {
                    console.error("Real-time selected code listener error:", error);
                });
            } else if (event === 'codeUpdated') {
                // Listen for updates to individual codes
                this.codesRef.on('child_changed', (snapshot) => {
                    callback(snapshot.val());
                }, (error) => {
                    console.error("Real-time code update listener error:", error);
                });
            }
        }
    }
    
    notifyListeners(event, data) {
        this.listeners.forEach(listener => {
            if (listener.event === event) {
                listener.callback(data);
            }
        });
    }
    
    // Check connection
    checkConnection() {
        return this.isConnected;
    }
    
    // Reconnect
    async reconnect() {
        try {
            this.initializeFirebase();
            return this.isConnected;
        } catch (error) {
            console.error("Reconnection failed:", error);
            return false;
        }
    }
}