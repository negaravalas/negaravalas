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

// Waktu terakhir update (hanya berubah saat harga diupdate)
let lastUpdateTime = null;

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

// === RENDER UTAMA: tampilkan ke 4 kolom ===
function renderRates() {
    const col1 = document.getElementById("currency-list-1");
    const col2 = document.getElementById("currency-list-2");
    const col3 = document.getElementById("currency-list-3");
    const col4 = document.getElementById("currency-list-4");
    
    if (!col1 || !col2 || !col3 || !col4) {
        console.error("❌ Element currency list tidak ditemukan");
        return;
    }
    
    col1.innerHTML = "";
    col2.innerHTML = "";
    col3.innerHTML = "";
    col4.innerHTML = "";

    // Bagi menjadi 4 kolom untuk full screen
    const itemsPerColumn = Math.ceil(currencyData.length / 4);
    const column1 = currencyData.slice(0, itemsPerColumn);
    const column2 = currencyData.slice(itemsPerColumn, itemsPerColumn * 2);
    const column3 = currencyData.slice(itemsPerColumn * 2, itemsPerColumn * 3);
    const column4 = currencyData.slice(itemsPerColumn * 3);

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
    
    column4.forEach((item) => {
        const element = createCurrencyItem(item);
        if (element) col4.appendChild(element);
    });
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

// === Tanggal terakhir update (hanya saat harga berubah) ===
function updateCurrentDate() {
    const el = document.getElementById("current-date");
    if (!el) {
        console.error("❌ Element current-date tidak ditemukan");
        return;
    }

    // Jika belum ada waktu update, gunakan waktu sekarang
    if (!lastUpdateTime) {
        lastUpdateTime = new Date();
    }
    
    el.textContent = "Terakhir diperbarui: " + lastUpdateTime.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// === Update waktu hanya ketika data berubah ===
function handleDataUpdate() {
    lastUpdateTime = new Date(); // Update waktu ke sekarang
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
            for (const [key, value] of Object.entries(data)) {
                const item = currencyData.find((c) => c.currency === key);
                if (item && item.rate !== value) {
                    item.rate = value;
                    updated = true;
                }
            }

            if (updated) {
                renderRates();
                handleDataUpdate(); // ← Hanya update waktu ketika data berubah
                console.log("✅ Rates berhasil diperbarui");
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
    currencyData.forEach(item => {
        item.rate = "-";
    });
    renderRates();
    updateCurrentDate();
}

// === Update rate ke Firebase ===
function updateRate(e) {
    e.preventDefault();
    
    const currency = document.getElementById("currency-select").value;
    const newRate = document.getElementById("new-rate").value.trim();
    
    if (!newRate) {
        alert("⚠️ Masukkan nilai baru!");
        return;
    }

    if (!currency) {
        alert("⚠️ Pilih mata uang terlebih dahulu!");
        return;
    }

    if (!db) {
        alert("❌ Database tidak terhubung!");
        return;
    }

    console.log(`🔄 Memperbarui ${currency} ke ${newRate}`);
    
    // Show loading state
    const submitBtn = document.querySelector('#hidden-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Memperbarui...";
    submitBtn.disabled = true;

    db.ref("RATES/" + currency)
        .set(newRate)
        .then(() => {
            console.log(`✅ ${currency} berhasil diperbarui ke ${newRate}`);
            alert(`✅ Harga ${currency} berhasil diperbarui ke ${newRate}`);
            document.getElementById("new-rate").value = "";
            
            // Update waktu secara lokal juga
            handleDataUpdate();
        })
        .catch((err) => {
            console.error("❌ Gagal memperbarui:", err);
            alert("❌ Gagal memperbarui: " + err.message);
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

// === Toggle form update ===
function setupToggleForm() {
    const toggleBtn = document.getElementById("toggle-form-btn");
    if (!toggleBtn) {
        console.error("❌ Toggle button tidak ditemukan");
        return;
    }

    toggleBtn.addEventListener("click", () => {
        const form = document.getElementById("hidden-form");
        if (!form) {
            console.error("❌ Hidden form tidak ditemukan");
            return;
        }
        
        form.style.display = form.style.display === "block" ? "none" : "block";
    });
}

// === Isi dropdown ===
function populateSelect() {
    const sel = document.getElementById("currency-select");
    if (!sel) {
        console.error("❌ Currency select element tidak ditemukan");
        return;
    }
    
    sel.innerHTML = "";
    
    // Tambahkan option default
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Pilih Mata Uang";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    sel.appendChild(defaultOption);
    
    currencyData.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.currency;
        opt.textContent = c.currency;
        sel.appendChild(opt);
    });
}

// === Setup form submission ===
function setupFormSubmission() {
    const form = document.getElementById("update-form");
    if (!form) {
        console.error("❌ Update form tidak ditemukan");
        return;
    }
    
    form.addEventListener("submit", updateRate);
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
    
    // Inisialisasi komponen UI terlebih dahulu
    populateSelect();
    renderRates();
    updateCurrentDate();
    setupToggleForm();
    setupFormSubmission();
    
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

// Export untuk testing (jika diperlukan)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        currencyData,
        formatRate,
        initializeFirebase
    };
}



