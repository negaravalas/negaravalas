// === ADMIN PANEL SCRIPT - FIXED VERSION ===

// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA4WHiQfj5_r5JP_V8UQOZCYUlQP226BNU",
    authDomain: "negara-valas-1cca5.firebaseapp.com",
    databaseURL: "https://negara-valas-1cca5-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "negara-valas-1cca5",
    storageBucket: "negara-valas-1cca5.firebasestorage.app",
    messagingSenderId: "1027331694437",
    appId: "1:1027331694437:web:61f986f0e56c87a46a0b8c",
    measurementId: "G-SDJN00TMZ3"
};

// Inisialisasi Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

const db = firebase.database();

// Data mata uang
const currencies = [
    "USD", "USD T", "USD K", "EUR", "GBP", "JPY", "CNY", "THB", 
    "CHF", "SGD", "MYR", "MYR K", "HKD", "NTY", "KRW", "AUD", 
    "NZD", "CAD"
];

// Credential admin
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "negara2025"
};

// State management
let currentRates = {};
let bulkChanges = {};

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const quickUpdateForm = document.getElementById('quick-update-form');
const bulkUpdateGrid = document.getElementById('bulk-update-grid');
const currentRatesGrid = document.getElementById('current-rates-grid');
const bulkSaveBtn = document.getElementById('bulk-save-btn');
const statusMessages = document.getElementById('status-messages');

// === LOGIN SYSTEM ===
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    console.log('Login attempt...');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    console.log('Username:', username, 'Password:', password);
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        console.log('Login successful');
        loginSuccess();
    } else {
        console.log('Login failed');
        showStatus('Username atau password salah!', 'error');
    }
});

function loginSuccess() {
    loginScreen.style.display = 'none';
    adminDashboard.style.display = 'block';
    showStatus('Login berhasil! Selamat datang di Admin Panel.', 'success');
    initializeAdminPanel();
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (confirm('Yakin ingin logout?')) {
            adminDashboard.style.display = 'none';
            loginScreen.style.display = 'flex';
            loginForm.reset();
            showStatus('Anda telah logout.', 'warning');
        }
    });
}

// === INITIALIZE ADMIN PANEL ===
function initializeAdminPanel() {
    console.log('Initializing admin panel...');
    populateCurrencySelect();
    initializeBulkUpdate();
    initializeRealTimeListener();
}

function populateCurrencySelect() {
    const select = document.getElementById('currency-select');
    if (!select) {
        console.error('Currency select element not found');
        return;
    }
    
    select.innerHTML = '<option value="">Pilih Mata Uang</option>';
    
    currencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency;
        option.textContent = currency;
        select.appendChild(option);
    });
}

function initializeBulkUpdate() {
    if (!bulkUpdateGrid) {
        console.error('Bulk update grid not found');
        return;
    }
    
    bulkUpdateGrid.innerHTML = '';
    bulkChanges = {};
    
    currencies.forEach(currency => {
        const bulkItem = document.createElement('div');
        bulkItem.className = 'bulk-item';
        bulkItem.innerHTML = `
            <div class="bulk-currency">${currency}</div>
            <input type="number" 
                   class="bulk-input" 
                   data-currency="${currency}"
                   placeholder="${currentRates[currency] || '0'}"
                   step="0.01">
        `;
        bulkUpdateGrid.appendChild(bulkItem);
    });
    
    // Add event listeners to bulk inputs
    document.querySelectorAll('.bulk-input').forEach(input => {
        input.addEventListener('input', function() {
            const currency = this.dataset.currency;
            const value = this.value.trim();
            
            if (value) {
                bulkChanges[currency] = value;
            } else {
                delete bulkChanges[currency];
            }
        });
    });
}

// === FIREBASE REAL-TIME LISTENER ===
function initializeRealTimeListener() {
    if (!db) {
        console.error('Database not initialized');
        return;
    }
    
    db.ref('RATES').on('value', (snapshot) => {
        currentRates = snapshot.val() || {};
        console.log('Current rates updated:', currentRates);
        updateCurrentRatesDisplay();
        updateBulkInputsPlaceholders();
        showStatus('Data rates berhasil diupdate', 'success');
    }, (error) => {
        console.error('Firebase error:', error);
        showStatus('Error mengambil data: ' + error.message, 'error');
    });
}

function updateCurrentRatesDisplay() {
    if (!currentRatesGrid) return;
    
    currentRatesGrid.innerHTML = '';
    
    for (const [currency, rate] of Object.entries(currentRates)) {
        const rateItem = document.createElement('div');
        rateItem.className = 'rate-item';
        rateItem.innerHTML = `
            <span class="rate-currency">${currency}</span>
            <span class="rate-value">${formatNumber(rate)}</span>
        `;
        currentRatesGrid.appendChild(rateItem);
    }
}

function updateBulkInputsPlaceholders() {
    document.querySelectorAll('.bulk-input').forEach(input => {
        const currency = input.dataset.currency;
        input.placeholder = currentRates[currency] || '0';
    });
}

// === QUICK UPDATE FORM ===
if (quickUpdateForm) {
    quickUpdateForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currency = document.getElementById('currency-select').value;
        const newRate = document.getElementById('new-rate').value.trim();
        
        if (!currency || !newRate) {
            showStatus('Pilih mata uang dan masukkan harga!', 'error');
            return;
        }
        
        updateRate(currency, newRate, 'quick');
    });
}

// === BULK UPDATE ===
if (bulkSaveBtn) {
    bulkSaveBtn.addEventListener('click', function() {
        if (Object.keys(bulkChanges).length === 0) {
            showStatus('Tidak ada perubahan untuk disimpan!', 'warning');
            return;
        }
        
        if (confirm(`Update ${Object.keys(bulkChanges).length} mata uang?`)) {
            const updates = {};
            Object.keys(bulkChanges).forEach(currency => {
                updates[currency] = bulkChanges[currency];
            });
            
            // Show loading
            bulkSaveBtn.textContent = '🔄 Menyimpan...';
            bulkSaveBtn.disabled = true;
            
            db.ref('RATES').update(updates)
                .then(() => {
                    showStatus(`Berhasil update ${Object.keys(bulkChanges).length} mata uang!`, 'success');
                    bulkChanges = {};
                    initializeBulkUpdate();
                })
                .catch(error => {
                    showStatus('Gagal update bulk: ' + error.message, 'error');
                })
                .finally(() => {
                    bulkSaveBtn.textContent = '💾 Simpan Semua Perubahan';
                    bulkSaveBtn.disabled = false;
                });
        }
    });
}

// === UPDATE SINGLE RATE ===
function updateRate(currency, newRate, source = 'unknown') {
    if (!db) {
        showStatus('Database tidak terhubung!', 'error');
        return;
    }
    
    // Show loading for quick form
    if (source === 'quick') {
        const submitBtn = quickUpdateForm.querySelector('button');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '🔄 Updating...';
        submitBtn.disabled = true;
    }
    
    db.ref('RATES/' + currency).set(newRate)
        .then(() => {
            showStatus(`✅ ${currency} berhasil diupdate ke ${formatNumber(newRate)}`, 'success');
            
            if (source === 'quick') {
                quickUpdateForm.reset();
            }
        })
        .catch(error => {
            showStatus(`❌ Gagal update ${currency}: ${error.message}`, 'error');
        })
        .finally(() => {
            if (source === 'quick') {
                const submitBtn = quickUpdateForm.querySelector('button');
                submitBtn.textContent = '💾 Update';
                submitBtn.disabled = false;
            }
        });
}

// === UTILITY FUNCTIONS ===
function formatNumber(num) {
    if (!num) return '0';
    const number = parseFloat(num);
    return isNaN(number) ? '0' : number.toLocaleString('id-ID');
}

function showStatus(message, type = 'info') {
    if (!statusMessages) {
        console.log('Status:', message);
        return;
    }
    
    const statusItem = document.createElement('div');
    statusItem.className = `status-item ${type}`;
    
    const time = new Date().toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    statusItem.innerHTML = `
        <span class="time">${time}</span>
        <span class="message">${message}</span>
    `;
    
    statusMessages.insertBefore(statusItem, statusMessages.firstChild);
    
    // Auto remove old messages
    if (statusMessages.children.length > 10) {
        statusMessages.removeChild(statusMessages.lastChild);
    }
    
    // Auto scroll to top
    statusMessages.scrollTop = 0;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page loaded successfully');
    showStatus('Sistem admin ready', 'success');
});

// Debug info
console.log('Admin Panel NEGARA VALAS loaded successfully');
