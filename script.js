// === NEGARA VALAS - Luxury LED Edition ===
// Terhubung ke Firebase Realtime Database (data real-time dari node "RATES")

const currencyData = [
  { currency: "USD", rate: "-", flag: "https://flagcdn.com/w320/us.png" },
  { currency: "USD T", rate: "-", flag: "https://flagcdn.com/w320/us.png" },
  { currency: "USD K", rate: "-", flag: "https://flagcdn.com/w320/us.png" },
  { currency: "EUR", rate: "-", flag: "https://flagcdn.com/w320/eu.png" },
  { currency: "GBP", rate: "-", flag: "https://flagcdn.com/w320/gb.png" },
  { currency: "JPY", rate: "-", flag: "https://flagcdn.com/w320/jp.png" },
  { currency: "CNY", rate: "-", flag: "https://flagcdn.com/w320/cn.png" },
  { currency: "THB", rate: "-", flag: "https://flagcdn.com/w320/th.png" },
  { currency: "CHF", rate: "-", flag: "https://flagcdn.com/w320/ch.png" },
  { currency: "SGD", rate: "-", flag: "https://flagcdn.com/w320/sg.png" },
  { currency: "MYR", rate: "-", flag: "https://flagcdn.com/w320/my.png" },
  { currency: "MYR T", rate: "-", flag: "https://flagcdn.com/w320/my.png" },
  { currency: "HKD", rate: "-", flag: "https://flagcdn.com/w320/hk.png" },
  { currency: "NTY", rate: "-", flag: "https://flagcdn.com/w320/tw.png" },
  { currency: "KRW", rate: "-", flag: "https://flagcdn.com/w320/kr.png" },
  { currency: "AUD", rate: "-", flag: "https://flagcdn.com/w320/au.png" },
  { currency: "NZD", rate: "-", flag: "https://flagcdn.com/w320/nz.png" },
  { currency: "CAD", rate: "-", flag: "https://flagcdn.com/w320/ca.png" },
];

// Variabel global untuk Firebase database
let db;

// Waktu terakhir update (simpan di localStorage agar persist)
let lastUpdateTime = localStorage.getItem('negaraValas_lastUpdateTime');

// === INISIALISASI FIREBASE ===
function initializeFirebase() {
    try {
        console.log("🔄 Menginisialisasi Firebase...");
        
        // Gunakan firebase yang sudah diinisialisasi di index.html
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK tidak terload');
        }
        
        db = firebase.database();
        console.log("✅ Firebase Database berhasil diinisialisasi");
        return true;
    } catch (error) {
        console.error("❌ Error inisialisasi Firebase:", error);
        return false;
    }
}

// === RENDER UTAMA: tampilkan ke 3 kolom ===
function renderRates() {
    console.log("🔄 Rendering rates...");
    
    const col1 = document.getElementById("currency-list-1");
    const col2 = document.getElementById("currency-list-2");
    const col3 = document.getElementById("currency-list-3");
    
    if (!col1 || !col2 || !col3) {
        console.error("❌ Element currency list tidak ditemukan");
        return;
    }
    
    col1.innerHTML = "";
    col2.innerHTML = "";
    col3.innerHTML = "";

    // Bagi menjadi 3 kolom
    const itemsPerColumn = Math.ceil(currencyData.length / 3);
    const column1 = currencyData.slice(0, itemsPerColumn);
    const column2 = currencyData.slice(itemsPerColumn, itemsPerColumn * 2);
    const column3 = currencyData.slice(itemsPerColumn * 2);

    console.log("Kolom 1:", column1.length, "items");
    console.log("Kolom 2:", column2.length, "items");
    console.log("Kolom 3:", column3.length, "items");

    column1.forEach((item) => {
        const element = createCurrencyItem(item);
        if (element) col1.appendChild(element);
    });
    
    column2.forEach((item) => {
        const element = createCurrencyItem(item);
        if (element) col2.appendChild(element);
    });
    
    column3.forEach((item) => {
        const element = createCurrencyItem(item);
        if (element) col3.appendChild(element);
    });
    
    console.log("✅ Rates berhasil di-render");
}

function createCurrencyItem(item) {
    try {
        const div = document.createElement("div");
        div.className = "currency-item";
        div.innerHTML = `
            <div class="currency-left">
                <img src="${item.flag}" alt="${item.currency} flag" onerror="this.src='https://flagcdn.com/w320/us.png'">
                <div class="currency-code">${item.currency}</div>
            </div>
            <div class="currency-rate">${formatRate(item.rate)}</div>
        `;
        return div;
    } catch (error) {
        console.error("Error membuat currency item:", error);
        return null;
    }
}

// Format rate dengan pemisah ribuan
function formatRate(rate) {
    if (rate === "-" || rate === "" || rate === null || rate === undefined) return "-";
    
    // Coba format sebagai number
    const num = parseFloat(rate);
    if (!isNaN(num)) {
        return num.toLocaleString('id-ID');
    }
    
    return rate;
}

// === Tanggal terakhir update ===
function updateCurrentDate() {
    const el = document.getElementById("current-date");
    if (!el) {
        console.error("❌ Element current-date tidak ditemukan");
        return;
    }

    // Gunakan waktu dari localStorage jika ada, jika tidak gunakan waktu sekarang
    if (lastUpdateTime) {
        const savedTime = new Date(lastUpdateTime);
        el.textContent = "Terakhir diperbarui: " + savedTime.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } else {
        // Jika belum pernah update, gunakan waktu Firebase data pertama kali load
        const currentTime = new Date();
        el.textContent = "Terakhir diperbarui: " + currentTime.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
}

// === Update waktu hanya ketika data berubah ===
function handleDataUpdate() {
    lastUpdateTime = new Date().toISOString(); // Simpan sebagai ISO string
    localStorage.setItem('negaraValas_lastUpdateTime', lastUpdateTime); // Simpan ke localStorage
    updateCurrentDate(); // Tampilkan waktu update
    console.log("🕐 Waktu update diperbarui:", lastUpdateTime);
}

// === Firebase listener real-time ===
function initializeFirebaseListener() {
    if (!db) {
        console.error("❌ Database tidak terinisialisasi");
        return;
    }

    try {
        console.log("🔄 Memulai Firebase listener...");
        
        const ratesRef = db.ref("RATES");
        
        ratesRef.on("value", (snapshot) => {
            const data = snapshot.val();
            console.log("📊 Data diterima dari Firebase:", data);
            
            if (!data) {
                console.warn("⚠️ Data Firebase kosong");
                showDefaultRates();
                return;
            }

            let updated = false;
            let initialLoad = false;
            
            // Cek apakah ini load pertama kali (semua rate masih "-")
            if (currencyData.every(item => item.rate === "-")) {
                initialLoad = true;
            }

            for (const [key, value] of Object.entries(data)) {
                const item = currencyData.find((c) => c.currency === key);
                if (item) {
                    if (item.rate !== value) {
                        item.rate = value;
                        updated = true;
                    }
                }
            }

            if (updated) {
                renderRates();
                // Update waktu hanya jika bukan initial load pertama
                if (!initialLoad) {
                    handleDataUpdate();
                } else {
                    // Untuk initial load, set waktu ke sekarang tapi jangan simpan ke localStorage
                    const currentTime = new Date();
                    document.getElementById("current-date").textContent = "Terakhir diperbarui: " + currentTime.toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    });
                }
                console.log("✅ Rates berhasil diperbarui dari Firebase");
            }
        }, (error) => {
            console.error("❌ Error Firebase listener:", error);
            document.getElementById("current-date").textContent = "Error loading data";
            showDefaultRates();
        });

    } catch (error) {
        console.error("❌ Error inisialisasi Firebase listener:", error);
        showDefaultRates();
    }
}

// Tampilkan rates default jika Firebase error
function showDefaultRates() {
    console.log("🔄 Menampilkan rates default");
    currencyData.forEach(item => {
        item.rate = "-";
    });
    renderRates();
    updateCurrentDate();
}

// === Test koneksi Firebase ===
function testFirebaseConnection() {
    if (!db) {
        console.error("❌ Database tidak tersedia untuk test");
        return;
    }
    
    db.ref(".info/connected").on("value", (snap) => {
        if (snap.val() === true) {
            console.log("✅ Terhubung ke Firebase Database");
        } else {
            console.log("❌ Tidak terhubung ke Firebase Database");
        }
    });
}

// === Init ===
window.onload = function() {
    console.log("🚀 Aplikasi NEGARA VALAS dimulai...");
    console.log("Jumlah mata uang:", currencyData.length);
    
    // Inisialisasi komponen UI terlebih dahulu
    renderRates();
    updateCurrentDate();
    
    // Inisialisasi Firebase
    const firebaseInitialized = initializeFirebase();
    
    if (firebaseInitialized) {
        // Test koneksi
        setTimeout(() => {
            testFirebaseConnection();
        }, 1000);
        
        // Start listener
        setTimeout(() => {
            initializeFirebaseListener();
        }, 1500);
    } else {
        console.error("❌ Gagal menginisialisasi Firebase");
        showDefaultRates();
    }
};

// === Error handling global ===
window.addEventListener('error', function(e) {
    console.error('❌ Global error:', e.error);
});

// Debug: Export untuk testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        currencyData,
        formatRate,
        initializeFirebase,
        renderRates
    };
}
