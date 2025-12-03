// =========================================================
// 1. INI ADALAH FILE: script.js (KODE LENGKAP)
// =========================================================

// =====================================================
// INISIALISASI
// CATATAN: auth, db, dan transactionsCollection
//          diinisialisasi di index.html
// =====================================================

// DOM Elements terkait Auth & Loading
const loginContainer = document.getElementById("login-container");
const appContainer = document.getElementById("app-container"); // Container utama DAKATA
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");
const loginErrorEl = document.getElementById("login-error");
const loadingOverlay = document.getElementById("loading-overlay");

// =========================================================
// VARIABEL & KOLEKSI KHUSUS REKENING PRIBADI
// =========================================================

// Email pengguna yang memiliki akses penuh ke fitur Rekening Pribadi
const ADMIN_EMAIL = "dakata@gmail.com"; // Pastikan email ini sama dengan yang di index.html

// PENTING: Koleksi Firebase baru untuk data pribadi
const personalTransactionsCollection = db.collection("personalTransactions");

// DOM Elements terkait Rekening Pribadi
let personalFinanceBtn,
  personalContainer,
  personalForm,
  personalTransactionsList,
  dakattaHomeBtn;
let personalBalanceContainer; // Container Saldo Pribadi (diganti dari personalBalanceEl)

// Variabel Global DAKATA Aquatic (Diambil dari DOM yang sudah ada)
let FISH_VARIETIES = [];
let form,
  tableBody,
  totalBalanceEl,
  packageContainer,
  addFishBtn,
  submitBtn,
  formTitle,
  editModeControls;

// VARIABEL BARU UNTUK FILTER, SEARCH, PAGINATION, dan EXPORT
let allTransactions = []; // Menyimpan semua data transaksi DAKATA
let filteredTransactions = []; // Menyimpan data setelah difilter/search DAKATA
let currentPage = 1;
const rowsPerPage = 10;
let filterSelect,
  searchInput,
  prevPageBtn,
  nextPageBtn,
  paginationInfo,
  exportCsvBtn;

// Variabel untuk Mode Edit
let isEditMode = false;
let currentEditId = null;

// ==========================================================
// FUNGSI PENGATUR LOADING & UTILITY
// ==========================================================
function showLoading() {
  if (loadingOverlay) loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
  if (loadingOverlay) loadingOverlay.classList.add("hidden");
}

/**
 * Fungsi untuk format mata uang IDR
 * @param {number} amount
 */
function formatRupiah(amount) {
  if (isNaN(amount) || amount === null) return "IDR 0";
  const sign = amount < 0 ? "-" : "";
  const absAmount = Math.abs(amount);
  return sign + "IDR " + new Intl.NumberFormat("id-ID").format(absAmount);
}

// -----------------------------------------------------
// FUNGSI AUTH DAN TOGGLE APLIKASI
// -----------------------------------------------------

/**
 * Mengatur tampilan aplikasi (Login, DAKATA Main, atau Rekening Pribadi)
 * @param {boolean} loggedIn - Status login
 * @param {firebase.User | null} user - Objek user dari Firebase
 */
function toggleApp(loggedIn, user) {
  // Pastikan appContainer sudah diinisialisasi, jika belum panggil initializeDOMElements
  if (loggedIn && !form) {
    initializeDOMElements();
  }

  if (loggedIn) {
    loginContainer.classList.add("hidden");

    // Tentukan visibilitas tombol Rekening Pribadi
    if (user && user.email === ADMIN_EMAIL) {
      if (personalFinanceBtn) personalFinanceBtn.classList.remove("hidden");
    } else {
      if (personalFinanceBtn) personalFinanceBtn.classList.add("hidden");
    }

    // Panggil view default setelah login (DAKATA Main)
    switchView("main");
  } else {
    // Logika saat LOGOUT
    if (appContainer) appContainer.classList.add("hidden");
    if (personalContainer) personalContainer.classList.add("hidden");
    loginContainer.classList.remove("hidden");

    // Sembunyikan semua tombol navigasi saat logout
    if (personalFinanceBtn) personalFinanceBtn.classList.add("hidden");
    if (dakattaHomeBtn) dakattaHomeBtn.classList.add("hidden");
    hideLoading();
  }
}

// Event Listener untuk Login
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (loginErrorEl) loginErrorEl.classList.add("hidden");

    showLoading();

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error("Login Error:", error);
      if (loginErrorEl) {
        loginErrorEl.textContent =
          "Email atau Password salah. (" +
          (error.code || "unknown error") +
          ")";
        loginErrorEl.classList.remove("hidden");
      }
      Swal.fire({
        title: "Gagal Login",
        text: "Cek Email dan Password Anda.",
        icon: "error",
      });
    } finally {
      hideLoading();
    }
  });
}

// Event Listener untuk Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    // Sinkronisasi tombol logout di halaman pribadi (jika ada)
    const personalLogoutBtn = document.getElementById("logout-btn-personal");
    if (personalLogoutBtn)
      personalLogoutBtn.removeEventListener("click", handleLogout);

    handleLogout();
  });
}

async function handleLogout() {
  showLoading();
  try {
    await auth.signOut();
    Swal.fire({
      title: "Logout Berhasil",
      text: "Anda telah keluar dari aplikasi.",
      icon: "info",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    Swal.fire({
      title: "Gagal Logout",
      text: "Terjadi kesalahan saat logout.",
      icon: "error",
    });
  } finally {
    hideLoading();
  }
}

// PEMERIKSAAN STATUS OTENTIKASI (Paling Penting)
auth.onAuthStateChanged((user) => {
  showLoading();
  if (user) {
    // Teruskan objek 'user' ke toggleApp
    toggleApp(true, user);
    // Sinkronisasi tombol logout di halaman pribadi
    const personalLogoutBtn = document.getElementById("logout-btn-personal");
    if (personalLogoutBtn)
      personalLogoutBtn.addEventListener("click", handleLogout);
  } else {
    // Panggil toggleApp saat logout, user bernilai null
    toggleApp(false, null);
  }
});

// =====================================================
// DOM INITIALIZATION
// =====================================================

function initializeDOMElements() {
  FISH_VARIETIES = [
    { id: "molly_zebra", name: "Molly Zebra" },
    { id: "molly_platinum_cawang", name: "Molly Platinum (Cawang)" },
    { id: "molly_platinum_rontel", name: "Molly Platinum (Rontel)" },
    { id: "molly_gold_cawang", name: "Molly Gold (Cawang)" },
    { id: "molly_gold_rontel", name: "Molly Gold (Rontel)" },
    { id: "molly_marble", name: "Molly Marble" },
    { id: "molly_kaliko", name: "Molly Kaliko" },
    { id: "molly_trico", name: "Molly Trico" },
    { id: "molly_sankis", name: "Molly Sankis" },
    { id: "molly_tiger", name: "Molly Tiger" },
    { id: "molly_leopard", name: "Molly Leopard" },
    { id: "mix", name: "Mix (Tidak Spesifik)" },
  ];

  // DOM Elements DAKATA (Bisnis)
  form = document.getElementById("transaction-form");
  tableBody = document.querySelector("#history-table tbody");
  totalBalanceEl = document.getElementById("total-balance");
  packageContainer = document.getElementById("fish-package-container");
  addFishBtn = document.getElementById("add-fish-btn");
  submitBtn = document.getElementById("submit-btn");
  formTitle = document.getElementById("form-title");
  editModeControls = document.getElementById("edit-mode-controls");

  // INISIALISASI DOM BARU DAKATA (Filter, Search, Pagination)
  filterSelect = document.getElementById("transaction-filter");
  searchInput = document.getElementById("transaction-search");

  // Ambil elemen pagination dari HTML
  const paginationControls = document.getElementById("pagination-controls");
  if (paginationControls) {
    const buttons = paginationControls.querySelectorAll("button");
    if (buttons.length >= 2) {
      prevPageBtn = buttons[0];
      nextPageBtn = buttons[1];
    }
    paginationInfo = paginationControls.querySelector("span"); // Asumsi span pertama adalah info
  }

  exportCsvBtn = document.getElementById("export-csv-btn");

  // INISIALISASI DOM BARU REKENING PRIBADI
  personalFinanceBtn = document.getElementById("personalFinanceBtn"); // Tombol Navigasi ke Finance
  personalContainer = document.getElementById("personal-container"); // Container Halaman Finance
  personalForm = document.getElementById("personal-transaction-form"); // Form Finance
  personalTransactionsList = document.getElementById(
    "personal-transactions-list"
  ); // List Transaksi Finance
  dakattaHomeBtn = document.getElementById("dakattaHomeBtn"); // Tombol Navigasi ke DAKATA
  personalBalanceContainer = document.getElementById("personal-balance"); // Saldo Pribadi Container

  // Event Listeners DAKATA
  if (addFishBtn) addFishBtn.addEventListener("click", addFishInput);
  if (form) form.addEventListener("submit", handleFormSubmission);
  if (packageContainer) {
    packageContainer.addEventListener("change", handlePackageChange);
    packageContainer.addEventListener("click", handlePackageClick);
  }

  // EVENT LISTENERS BARU UNTUK FILTER, SEARCH, PAGINATION, DAN EXPORT DAKATA
  if (filterSelect)
    filterSelect.addEventListener("change", () => {
      currentPage = 1;
      applyFiltersAndPagination();
    });
  if (searchInput)
    searchInput.addEventListener("input", () => {
      currentPage = 1;
      applyFiltersAndPagination();
    });
  if (prevPageBtn)
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        applyFiltersAndPagination();
      }
    });
  if (nextPageBtn)
    nextPageBtn.addEventListener("click", () => {
      const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        applyFiltersAndPagination();
      }
    });
  if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportToCsv);

  // EVENT LISTENERS BARU UNTUK REKENING PRIBADI
  if (personalFinanceBtn)
    personalFinanceBtn.addEventListener("click", () => switchView("personal"));
  if (dakattaHomeBtn)
    dakattaHomeBtn.addEventListener("click", () => switchView("main"));
  if (personalForm)
    personalForm.addEventListener("submit", handlePersonalSubmit);

  // Reset form saat inisialisasi
  resetForm();
}

// -----------------------------------------------------
// FUNGSI UTILITY (FISH INPUT, ETC.)
// -----------------------------------------------------

function getFishOptionsHTML(selectedValue = "") {
  let options = '<option value="" disabled>Pilih Jenis Ikan</option>';
  FISH_VARIETIES.forEach((fish) => {
    const selected = fish.id === selectedValue ? "selected" : "";
    options += `<option value="${fish.id}" ${selected}>${fish.name}</option>`;
  });
  // OPSI LAINNYA
  const otherSelected = selectedValue === "other" ? "selected" : "";
  options += `<option value="other" ${otherSelected}>Lainnya (Input Teks)</option>`;
  return options;
}

function deleteFishInputs() {
  if (packageContainer) packageContainer.innerHTML = "";
}

function renderFishInputs(packageContent) {
  deleteFishInputs();

  if (!packageContainer) return;

  if (packageContent && packageContent.length > 0) {
    packageContent.forEach((item) => {
      const id = Date.now() + Math.random();

      const isOther = item.type.startsWith("other:");
      const selectedType = isOther ? "other" : item.type;
      const otherValue = isOther ? item.type.substring(6) : "";

      const fishInputHTML = `
                <div id="fish-row-${id}" class="flex space-x-2 items-end fish-package-item">
                    <div class="flex-grow">
                        <select id="select-${id}" class="fish-type shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                            ${getFishOptionsHTML(selectedType)}
                        </select>
                        ${
                          isOther
                            ? `
                            <input type="text" value="${otherValue}" placeholder="Isi Lainnya..." class="other-input mt-2 shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>`
                            : ""
                        }
                    </div>
                    <div class="w-24">
                        <input type="number" min="1" value="${
                          item.count
                        }" placeholder="Jml" class="fish-count shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                    </div>
                    <button type="button" data-row-id="${id}" class="remove-fish-btn bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm focus:outline-none focus:shadow-outline">
                        Hapus
                    </button>
                </div>
            `;
      packageContainer.insertAdjacentHTML("beforeend", fishInputHTML);
    });
  } else {
    addFishInput();
  }
}

function addFishInput(initialType = "") {
  if (!packageContainer) return;

  const id = Date.now() + Math.random();
  const fishInputHTML = `
        <div id="fish-row-${id}" class="flex space-x-2 items-end fish-package-item">
            <div class="flex-grow">
                <select id="select-${id}" class="fish-type shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                    ${getFishOptionsHTML(initialType)}
                </select>
            </div>
            <div class="w-24">
                <input type="number" min="1" value="1" placeholder="Jml" class="fish-count shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
            </div>
            <button type="button" data-row-id="${id}" class="remove-fish-btn bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm focus:outline-none focus:shadow-outline">
                Hapus
            </button>
        </div>
    `;
  packageContainer.insertAdjacentHTML("beforeend", fishInputHTML);
}

// -----------------------------------------------------
// LOGIKA PENANGANAN INPUT & TOMBOL (DAKATA)
// -----------------------------------------------------

function handlePackageChange(e) {
  if (e.target.classList.contains("fish-type")) {
    const selectEl = e.target;
    const parentDiv = selectEl
      .closest(".fish-package-item")
      .querySelector(".flex-grow");

    let existingInput = parentDiv.querySelector(".other-input");
    if (existingInput) {
      existingInput.remove();
    }

    if (selectEl.value === "other") {
      const otherInputHTML = `
                <input type="text" placeholder="Isi Lainnya..." class="other-input mt-2 shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
            `;
      parentDiv.insertAdjacentHTML("beforeend", otherInputHTML);
    }
  }
}

function handlePackageClick(e) {
  if (
    e.target.classList.contains("remove-fish-btn") ||
    e.target.closest(".remove-fish-btn")
  ) {
    const btn = e.target.closest(".remove-fish-btn");
    const rowId = btn.dataset.rowId;
    document.getElementById(`fish-row-${rowId}`).remove();
  }
}

// -----------------------------------------------------
// LOGIKA CRUD: DELETE (DAKATA)
// -----------------------------------------------------
window.deleteTransaction = async function (id) {
  const result = await Swal.fire({
    title: "Konfirmasi Hapus",
    text: "Apakah Anda yakin ingin menghapus transaksi ini secara permanen?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (!result.isConfirmed) return;

  showLoading();

  try {
    await transactionsCollection.doc(id).delete();
    Swal.fire({
      title: "Dihapus!",
      text: "Transaksi berhasil dihapus.",
      icon: "success",
    });
    fetchTransactions();
  } catch (error) {
    console.error("Error removing document: ", error);
    Swal.fire({
      title: "Gagal!",
      text: "Gagal menghapus transaksi.",
      icon: "error",
    });
    hideLoading();
  }
};

// -----------------------------------------------------
// LOGIKA PEMBUATAN NOTA/INVOICE (DAKATA)
// -----------------------------------------------------
window.generateInvoice = async function (id) {
  showLoading();
  try {
    const doc = await transactionsCollection.doc(id).get();
    if (!doc.exists) {
      Swal.fire({
        title: "Error",
        text: "Transaksi tidak ditemukan.",
        icon: "error",
      });
      return;
    }

    const tx = doc.data();
    const packageContent = tx.packageContent || [];

    const destination = tx.destination || "-";
    const clientName = tx.clientName || "-";
    const packagePrice = tx.packagePrice || 0;
    const shippingCost = tx.shippingCost || 0;
    const totalAmount = packagePrice + shippingCost;

    const SHOP_NAME = "DAKATA Aquatic";
    const LOGO_PATH = "logo.png";

    let dateToDisplay = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    if (tx.timestamp && typeof tx.timestamp.toDate === "function") {
      dateToDisplay = tx.timestamp.toDate().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }

    let itemDetailsHTML = "";

    packageContent.forEach((item, index) => {
      let itemName = item.type;
      if (itemName.startsWith("other:")) {
        itemName = item.type.substring(6);
      } else {
        itemName =
          FISH_VARIETIES.find((f) => f.id === item.type)?.name || item.type;
      }

      itemDetailsHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${itemName}</td>
                    <td style="text-align: center;">${item.count}</td>
                </tr>
            `;
    });

    // 2. Template HTML untuk Invoice (Sisanya sama persis dari kode yang Anda berikan)
    const invoiceHTML = `
            <html>
            <head>
                <title>Nota Transaksi #${id.substring(0, 8)}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; margin: 0; padding: 0; background-color: #f0f0f0; }
                    .invoice-page { 
                        width: 210mm; 
                        min-height: 297mm; 
                        margin: 10mm auto; 
                        background: white; 
                        box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
                        position: relative;
                        padding: 20mm;
                    }
                    /* Watermark Logo Transparan */
                    .watermark {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        opacity: 0.08; 
                        z-index: 0;
                        pointer-events: none;
                    }
                    .watermark img {
                        width: 600px; 
                        height: auto;
                    }
                    /* Header Style */
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 3px solid #007bff; 
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .header h1 {
                        color: #007bff;
                        font-size: 20px;
                        margin: 0;
                    }
                    /* Logo Kecil di Header */
                    .header img {
                        width: 70px; 
                        height: 70px;
                    }
                    .header-info {
                        padding: 10px 0;
                        border-bottom: 1px dashed #ccc;
                        margin-bottom: 15px;
                    }
                    .header-info p {
                        margin: 3px 0;
                    }

                    /* Table Style */
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #fff; }
                    th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
                    th { 
                        background-color: #e9f5ff; 
                        color: #333; 
                        border-bottom: 2px solid #007bff;
                    }
                    tr:nth-child(even) { background-color: #f9f9f9; } 
                    
                    /* Total Section */
                    .total-box {
                        width: 50%;
                        float: right;
                        padding: 10px;
                        border: 1px solid #007bff;
                        background-color: #f7faff;
                    }
                    .total-box p { 
                        text-align: right; 
                        margin: 5px 0; 
                        font-size: 13px;
                    }
                    .total-box .final-total {
                        font-size: 16px;
                        font-weight: bold;
                        color: #dc3545; 
                        border-top: 1px solid #007bff;
                        padding-top: 5px;
                        margin-top: 5px;
                    }

                    /* Footer */
                    .footer {
                        clear: both;
                        text-align: center;
                        margin-top: 50px;
                        padding-top: 10px;
                        border-top: 1px solid #aaa;
                        font-style: italic;
                        color: #555;
                    }

                    /* Media Print */
                    @media print {
                        body { background: white; }
                        .invoice-page { box-shadow: none; margin: 0; border: none; }
                        
                        th { background-color: #e9f5ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .total-box { background-color: #f7faff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; border: 1px solid #333; }
                        
                        .watermark { opacity: 0.1 !important; } 
                    }
                </style>
            </head>
            <body>
                <div class="invoice-page">
                    
                    <div class="watermark">
                        <img src="${LOGO_PATH}" alt="${SHOP_NAME} Logo">
                    </div>
                    
                    <div class="header">
                        <div>
                            <h1>NOTA TRANSAKSI PEMBELIAN</h1>
                            <p style="color: #555;">${SHOP_NAME}</p>
                        </div>
                        <img src="${LOGO_PATH}" alt="Logo Kecil" style="width: 70px; height: 70px;">
                    </div>

                    <div class="header-info">
                        <p><strong>Nomor Nota:</strong> #${id.substring(
                          0,
                          8
                        )}</p>
                        <p><strong>Tanggal:</strong> ${dateToDisplay}</p>
                        <p><strong>Kepada:</strong> ${clientName}</p>
                        <p><strong>Tujuan Pengiriman:</strong> ${destination}</p>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 5%;">No.</th>
                                <th>Deskripsi Item (Isi Paket)</th>
                                <th style="width: 15%; text-align: center;">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemDetailsHTML}
                        </tbody>
                    </table>

                    <div class="total-box">
                        <p>Subtotal (Harga Paket): IDR ${packagePrice.toLocaleString(
                          "id-ID"
                        )}</p>
                        <p>Biaya Kirim (Ongkir): IDR ${shippingCost.toLocaleString(
                          "id-ID"
                        )}</p>
                        <p class="final-total">TOTAL AKHIR: IDR ${totalAmount.toLocaleString(
                          "id-ID"
                        )}</p>
                    </div>

                    <div class="footer">
                        <p>Terima kasih atas transaksinya. Mohon periksa kembali rincian di atas.</p>
                        <p>Dibuat pada ${new Date().toLocaleString("id-ID")}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

    // 3. Buka jendela baru dan cetak
    const printWindow = window.open("", "", "height=700,width=800");
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();

    printWindow.print();
  } catch (error) {
    console.error("Error generating invoice: ", error);
    Swal.fire({
      title: "Error",
      text: "Gagal membuat nota. Periksa data transaksi atau koneksi Anda.",
      icon: "error",
    });
  } finally {
    hideLoading();
  }
};

// -----------------------------------------------------
// LOGIKA CRUD: EDIT / SETUP EDIT MODE (DAKATA)
// -----------------------------------------------------
window.editTransaction = async function (id) {
  if (!auth.currentUser) return;

  showLoading();

  try {
    const doc = await transactionsCollection.doc(id).get();
    if (!doc.exists) {
      Swal.fire({
        title: "Error",
        text: "Transaksi tidak ditemukan.",
        icon: "error",
      });
      return;
    }
    const tx = doc.data();

    isEditMode = true;
    currentEditId = id;
    if (submitBtn) {
      submitBtn.textContent = "Simpan Perubahan Transaksi";
      submitBtn.classList.remove("bg-green-500", "hover:bg-green-700");
      submitBtn.classList.add("bg-blue-500", "hover:bg-blue-700");
    }
    if (formTitle)
      formTitle.textContent = `Edit Transaksi (ID: ${id.substring(0, 5)}...)`;
    if (editModeControls) editModeControls.classList.remove("hidden");

    document.getElementById("type").value = tx.type;
    document.getElementById("package_price").value = tx.packagePrice || 0;
    document.getElementById("shipping_cost").value = tx.shippingCost || 0;
    document.getElementById("destination").value = tx.destination || "";
    document.getElementById("client_name").value = tx.clientName || "";

    renderFishInputs(tx.packageContent);

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Error fetching document for edit: ", error);
    Swal.fire({
      title: "Error",
      text: "Gagal memuat data transaksi untuk diedit.",
      icon: "error",
    });
  } finally {
    hideLoading();
  }
};

// -----------------------------------------------------
// LOGIKA RESET FORM (DAKATA)
// -----------------------------------------------------
window.resetForm = function () {
  isEditMode = false;
  currentEditId = null;
  if (form) form.reset();

  if (submitBtn) {
    submitBtn.textContent = "Catat Transaksi";
    submitBtn.classList.remove("bg-blue-500", "hover:bg-blue-700");
    submitBtn.classList.add("bg-green-500", "hover:bg-green-700");
  }
  if (formTitle) formTitle.textContent = "Input Transaksi Baru";
  if (editModeControls) editModeControls.classList.add("hidden");

  deleteFishInputs();
  addFishInput();
};

// =====================================================
// FUNGSI FETCH, FILTER, PAGINATION, DAN SALDO (DAKATA)
// =====================================================

// -----------------------------------------------------
// 1. Fungsi Mengambil Data Transaksi dari Firebase (Fetch)
// -----------------------------------------------------
async function fetchTransactions() {
  if (!auth.currentUser) return;
  showLoading();

  try {
    const snapshot = await transactionsCollection
      .orderBy("timestamp", "desc")
      .get();

    // Simpan semua data transaksi ke variabel global
    allTransactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Terapkan filter dan render tampilan
    applyFiltersAndPagination();
  } catch (error) {
    console.error("Error fetching transactions: ", error);
    if (auth.currentUser) {
      Swal.fire({
        title: "Koneksi Error",
        text: "Gagal memuat data dari database. Cek koneksi dan aturan Firebase (Rules).",
        icon: "error",
      });
    }
  } finally {
    // hideLoading() dipindahkan ke applyFiltersAndPagination untuk memastikan loading hilang setelah rendering
  }
}

// -----------------------------------------------------
// 2. Fungsi Menerapkan Filter, Search, dan Pagination
// -----------------------------------------------------
function applyFiltersAndPagination() {
  if (!allTransactions.length) {
    if (tableBody)
      tableBody.innerHTML =
        '<tr><td colspan="5" class="py-6 text-center text-gray-500">Belum ada data transaksi.</td></tr>';
    if (paginationInfo) paginationInfo.textContent = "0 data";
    if (prevPageBtn) prevPageBtn.disabled = true;
    if (nextPageBtn) nextPageBtn.disabled = true;
    if (totalBalanceEl) totalBalanceEl.textContent = formatRupiah(0); // Reset saldo
    hideLoading();
    return;
  }

  // 1. FILTERING & SEARCHING
  const filterType = filterSelect ? filterSelect.value : "all";
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";

  filteredTransactions = allTransactions.filter((tx) => {
    // Filter Jenis (sale, purchase, atau all)
    if (filterType !== "all" && tx.type !== filterType) {
      return false;
    }

    // Search
    if (searchTerm) {
      const clientName = (tx.clientName || "").toLowerCase();
      const destination = (tx.destination || "").toLowerCase();

      // Buat teks isi paket untuk pencarian
      const fishDetailsText = (tx.packageContent || [])
        .map((item) => {
          let itemName = item.type;
          if (itemName.startsWith("other:")) {
            itemName = item.type.substring(6);
          } else {
            itemName =
              FISH_VARIETIES.find((f) => f.id === item.type)?.name || item.type;
          }
          return itemName;
        })
        .join(" ")
        .toLowerCase();

      // Cek apakah search term ada di Nama, Tujuan, atau Isi Paket
      if (
        !clientName.includes(searchTerm) &&
        !destination.includes(searchTerm) &&
        !fishDetailsText.includes(searchTerm)
      ) {
        return false;
      }
    }

    return true;
  });

  // 2. PERHITUNGAN SALDO (Diambil dari SEMUA transaksi)
  let totalBalance = 0;
  allTransactions.forEach((tx) => {
    const packagePrice = tx.packagePrice || 0;
    // Asumsi: packagePrice adalah nilai yang mempengaruhi saldo (Masuk saat Sale, Keluar saat Purchase)
    if (tx.type === "sale") {
      totalBalance += packagePrice;
    } else {
      totalBalance -= packagePrice;
    }
    // Biaya kirim (shippingCost) biasanya diabaikan dalam perhitungan saldo inti jika dianggap biaya operasional
  });

  if (totalBalanceEl) {
    totalBalanceEl.textContent = formatRupiah(totalBalance);
    totalBalanceEl.classList.remove(
      "text-blue-600",
      "text-green-600",
      "text-red-600"
    );
    if (totalBalance < 0) {
      totalBalanceEl.classList.add("text-red-600");
    } else if (totalBalance > 0) {
      totalBalanceEl.classList.add("text-green-600");
    } else {
      totalBalanceEl.classList.add("text-blue-600");
    }
  }

  // 3. PAGINATION
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);

  // Koreksi halaman jika keluar batas
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }
  if (currentPage < 1 && totalPages > 0) {
    currentPage = 1;
  } else if (totalPages === 0) {
    currentPage = 1;
  }

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const transactionsToDisplay = filteredTransactions.slice(start, end);

  // 4. RENDERING
  if (tableBody) tableBody.innerHTML = "";

  if (transactionsToDisplay.length === 0) {
    if (tableBody)
      tableBody.innerHTML =
        '<tr><td colspan="5" class="py-6 text-center text-gray-500">Tidak ada transaksi yang cocok dengan kriteria pencarian/filter.</td></tr>';
  } else {
    transactionsToDisplay.forEach((tx, index) => {
      const packagePrice = tx.packagePrice || 0;
      const shippingCost = tx.shippingCost || 0;
      // Perhitungan Total Nilai Transaksi (Harga Paket + Ongkir)
      const totalTransactionValue = packagePrice + shippingCost;
      const packageContent = tx.packageContent || [];

      const fishDetails = packageContent
        .map((item) => {
          let itemName = item.type;
          if (itemName.startsWith("other:")) {
            itemName = item.type.substring(6);
          } else {
            itemName =
              FISH_VARIETIES.find((f) => f.id === item.type)?.name || item.type;
          }
          return `${item.count}x ${itemName}`;
        })
        .join(", ");

      let dateToDisplay = "N/A";
      if (tx.timestamp && typeof tx.timestamp.toDate === "function") {
        dateToDisplay = new Date(tx.timestamp.toDate()).toLocaleString("id-ID");
      } else if (tx.timestamp) {
        dateToDisplay = new Date(tx.timestamp).toLocaleString("id-ID");
      }

      const row = tableBody.insertRow();
      const typeClass = tx.type === "sale" ? "text-green-600" : "text-red-600";

      row.innerHTML = `
                <td class="py-3 px-6 whitespace-nowrap">${dateToDisplay}</td>
                <td class="py-3 px-6 whitespace-nowrap font-semibold ${typeClass}">${
        tx.type === "sale" ? "JUAL" : "BELI"
      }</td>
                <td class="py-3 px-6 text-sm min-w-[250px]">
                    <span class="font-semibold">Nama:</span> ${
                      tx.clientName || "-"
                    } <br> 
                    <span class="font-semibold">Isi:</span> ${
                      fishDetails || "-"
                    } <br>
                    <span class="font-semibold">Tujuan:</span> ${
                      tx.destination || "-"
                    } 
                </td>
                <td class="py-3 px-6 whitespace-nowrap font-bold">
                    Paket: ${formatRupiah(packagePrice)} <br>
                    Ongkir: ${formatRupiah(shippingCost)} <br>
                    <hr class="my-1 border-gray-300">
                    <span class="${typeClass}">TOTAL: ${formatRupiah(
        totalTransactionValue
      )}</span>
                </td>
                <td class="py-3 px-6 text-center whitespace-nowrap">
                    <button onclick="editTransaction('${
                      tx.id
                    }')" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm focus:outline-none focus:shadow-outline mr-2">
                        Edit
                    </button>
                    <button onclick="generateInvoice('${
                      tx.id
                    }')" class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm focus:outline-none focus:shadow-outline mr-2">
                        Nota
                    </button>
                    <button onclick="deleteTransaction('${
                      tx.id
                    }')" class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm focus:outline-none focus:shadow-outline">
                        Hapus
                    </button>
                </td>
            `;
      if (index % 2 === 0) {
        row.classList.add("bg-gray-50");
      }
    });
  }

  // 5. UPDATE KONTROL PAGINATION
  if (paginationInfo) {
    const totalFiltered = filteredTransactions.length;
    const totalPages = Math.ceil(totalFiltered / rowsPerPage);
    const displayStart = totalFiltered > 0 ? start + 1 : 0;
    const displayEnd = Math.min(end, totalFiltered);

    // Sesuaikan format sesuai HTML
    paginationInfo.innerHTML = `Menampilkan ${displayStart} sampai ${displayEnd} dari ${totalFiltered} data`;
  }

  if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
  if (nextPageBtn)
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

  hideLoading();
}

// -----------------------------------------------------
// FUNGSI EXPORT DATA KE CSV (DAKATA)
// -----------------------------------------------------

function exportToCsv() {
  if (filteredTransactions.length === 0) {
    Swal.fire({
      title: "Tidak Ada Data",
      text: "Tidak ada transaksi yang cocok dengan filter saat ini untuk diexport.",
      icon: "info",
    });
    return;
  }

  // 1. Tentukan Header CSV
  const headers = [
    "ID Transaksi",
    "Waktu",
    "Jenis",
    "Nama Klien",
    "Tujuan",
    "Isi Paket (Detail)",
    "Harga Paket (IDR)",
    "Biaya Ongkir (IDR)",
    "Total Transaksi (IDR)",
  ];

  let csvContent = headers.join(",") + "\n"; // Tambahkan header, dipisahkan koma

  // 2. Map Data Transaksi ke Baris CSV
  filteredTransactions.forEach((tx) => {
    const packagePrice = tx.packagePrice || 0;
    const shippingCost = tx.shippingCost || 0;
    const totalTransactionValue = packagePrice + shippingCost;

    let dateToDisplay = "N/A";
    if (tx.timestamp && typeof tx.timestamp.toDate === "function") {
      dateToDisplay = new Date(tx.timestamp.toDate()).toLocaleString("id-ID");
    } else if (tx.timestamp) {
      dateToDisplay = new Date(tx.timestamp).toLocaleString("id-ID");
    }

    // Konversi Isi Paket ke format string yang mudah dibaca untuk CSV
    const fishDetails = (tx.packageContent || [])
      .map((item) => {
        let itemName = item.type;
        if (itemName.startsWith("other:")) {
          itemName = item.type.substring(6);
        } else {
          itemName =
            FISH_VARIETIES.find((f) => f.id === item.type)?.name || item.type;
        }
        // Format: "Jumlah x Nama Ikan"
        return `${item.count}x ${itemName}`;
      })
      // Gabungkan detail paket, dan bungkus dengan kutip dua jika mengandung koma
      .join(" | ");

    // 3. Susun Baris Data
    const rowData = [
      `'${tx.id}'`, // Kutip satu untuk menjaga ID agar tidak diubah formatnya oleh Excel
      `"${dateToDisplay}"`,
      tx.type === "sale" ? "JUAL" : "BELI",
      // Pastikan data yang mungkin mengandung koma dibungkus kutip dua (CSV standard)
      `"${(tx.clientName || "N/A").replace(/"/g, '""')}"`,
      `"${(tx.destination || "N/A").replace(/"/g, '""')}"`,
      `"${fishDetails.replace(/"/g, '""')}"`,
      packagePrice,
      shippingCost,
      totalTransactionValue,
    ];

    // Gabungkan elemen baris, dipisahkan koma
    csvContent += rowData.join(",") + "\n";
  });

  // 4. Buat File dan Unduh
  const today = new Date().toISOString().slice(0, 10);
  const filename = `dakata_transaksi_export_${today}.csv`;

  // Gunakan BOM (Byte Order Mark) untuk memastikan Excel membuka file dengan encoding UTF-8 (agar karakter khusus aman)
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Bersihkan URL objek
  } else {
    Swal.fire({
      title: "Error Browser",
      text: "Browser Anda tidak mendukung fitur unduhan otomatis.",
      icon: "error",
    });
  }
}

// -----------------------------------------------------
// Event Handler Form Submission (DAKATA)
// -----------------------------------------------------
async function handleFormSubmission(e) {
  e.preventDefault();

  if (!auth.currentUser) {
    Swal.fire({
      title: "Akses Ditolak",
      text: "Anda harus login untuk mencatat transaksi.",
      icon: "error",
    });
    return;
  }

  const packagePrice = parseFloat(
    document.getElementById("package_price").value
  );
  const shippingCost = parseFloat(
    document.getElementById("shipping_cost").value
  );
  const destination = document.getElementById("destination").value.trim();
  const clientName = document.getElementById("client_name").value.trim();

  const fishRows = Array.from(
    packageContainer.querySelectorAll(".fish-package-item")
  );
  const packageContent = [];

  for (const row of fishRows) {
    const typeSelect = row.querySelector(".fish-type");
    const countInput = row.querySelector(".fish-count");
    const otherInput = row.querySelector(".other-input");

    const type = typeSelect.value;
    const count = parseInt(countInput.value);

    let finalType = type;

    if (type === "other") {
      if (otherInput && otherInput.value.trim()) {
        finalType = "other:" + otherInput.value.trim();
      } else {
        Swal.fire({
          title: "Validasi",
          text: 'Harap isi deskripsi untuk item "Lainnya".',
          icon: "warning",
        });
        return;
      }
    }

    if (finalType && count > 0 && !isNaN(count)) {
      packageContent.push({
        type: finalType,
        count: count,
      });
    }
  }

  if (packageContent.length === 0) {
    Swal.fire({
      title: "Validasi",
      text: "Harap masukkan minimal satu jenis item dan jumlahnya dalam paket.",
      icon: "warning",
    });
    return;
  }

  if (packagePrice <= 0 || isNaN(packagePrice)) {
    Swal.fire({
      title: "Validasi",
      text: "Harga Paket harus diisi dengan nilai yang valid.",
      icon: "warning",
    });
    return;
  }

  const transactionData = {
    type: document.getElementById("type").value,
    packagePrice: packagePrice,
    shippingCost: shippingCost,
    destination: destination,
    clientName: clientName,
    packageContent: packageContent,
  };

  showLoading();

  try {
    if (isEditMode && currentEditId) {
      // Update mode
      await transactionsCollection.doc(currentEditId).update(transactionData);

      Swal.fire({
        title: "Berhasil!",
        text: "Transaksi berhasil diperbarui.",
        icon: "success",
      });

      resetForm();
    } else {
      // New entry mode
      transactionData.timestamp =
        firebase.firestore.FieldValue.serverTimestamp();
      await transactionsCollection.add(transactionData);

      Swal.fire({
        title: "Berhasil!",
        text: "Transaksi baru berhasil dicatat.",
        icon: "success",
      });

      resetForm();
    }

    fetchTransactions();
  } catch (error) {
    console.error("Error saving transaction: ", error);
    Swal.fire({
      title: "Gagal!",
      text: `Gagal mencatat transaksi: ${error.message}`,
      icon: "error",
    });
  } finally {
    // hideLoading() dipanggil di fetchTransactions()
  }
}

// =========================================================
// LOGIKA REKENING PRIBADI (BARU DAN TERINTEGRASI)
// =========================================================

/**
 * Fungsi untuk mengganti tampilan antara DAKATA Main dan Rekening Pribadi
 * @param {'main' | 'personal'} viewName - Nama tampilan yang akan diaktifkan
 */
function switchView(viewName) {
  showLoading();

  // Pastikan DOM Elements sudah terinisialisasi
  if (!form) initializeDOMElements();

  // Atur tampilan container
  if (viewName === "main") {
    appContainer.classList.remove("hidden");
    if (personalContainer) personalContainer.classList.add("hidden");

    // Atur tombol navigasi
    if (dakattaHomeBtn) dakattaHomeBtn.classList.add("hidden");
    if (
      auth.currentUser &&
      auth.currentUser.email === ADMIN_EMAIL &&
      personalFinanceBtn
    ) {
      personalFinanceBtn.classList.remove("hidden");
    }

    fetchTransactions(); // Muat data DAKATA
  } else if (viewName === "personal") {
    appContainer.classList.add("hidden");
    if (personalContainer) personalContainer.classList.remove("hidden");

    // Atur tombol navigasi
    if (dakattaHomeBtn) dakattaHomeBtn.classList.remove("hidden");
    if (personalFinanceBtn) personalFinanceBtn.classList.add("hidden");

    fetchAndRenderPersonalTransactions(); // Muat data pribadi
  } else {
    hideLoading(); // Safety net
  }
}

/**
 * Logika submit form transaksi pribadi
 */
async function handlePersonalSubmit(e) {
  e.preventDefault();

  const type = document.getElementById("personalType").value;
  const valueInput = document.getElementById("personalValue");
  const note = document.getElementById("personalNote").value;

  const value = parseInt(valueInput.value);
  const user = auth.currentUser;

  // Validasi
  if (!user) {
    Swal.fire("Akses Ditolak", "Anda harus login.", "error");
    return;
  }
  if (!value || value <= 0 || isNaN(value) || !note.trim()) {
    Swal.fire("Error", "Nilai dan Catatan harus diisi dengan benar.", "error");
    return;
  }

  showLoading();

  try {
    await personalTransactionsCollection.add({
      userId: user.uid,
      type: type, // MASUK atau KELUAR
      value: value,
      note: note.trim(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    personalForm.reset();
    Swal.fire("Berhasil", "Transaksi pribadi berhasil dicatat!", "success");
    fetchAndRenderPersonalTransactions(); // Refresh list
  } catch (error) {
    console.error("Error mencatat transaksi pribadi:", error);
    Swal.fire("Gagal", "Gagal mencatat transaksi pribadi.", "error");
  } finally {
    // hideLoading() dipanggil di fetchAndRenderPersonalTransactions
  }
}

/**
 * Mengambil dan merender data transaksi pribadi dari Firebase
 */
async function fetchAndRenderPersonalTransactions() {
  const user = auth.currentUser;
  if (!user || !personalTransactionsList) return;

  showLoading();

  try {
    const snapshot = await personalTransactionsCollection
      .where("userId", "==", user.uid)
      .orderBy("timestamp", "desc")
      .get();

    personalTransactionsList.innerHTML = "";

    let personalBalance = 0;
    let listHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id; // Ambil ID dokumen

      // Hitung saldo
      if (data.type === "MASUK") {
        personalBalance += data.value;
      } else {
        personalBalance -= data.value;
      }

      const typeClass =
        data.type === "MASUK" ? "text-green-600" : "text-red-600";
      const bgColor = data.type === "MASUK" ? "bg-green-50" : "bg-red-50";

      const dateToDisplay =
        data.timestamp && typeof data.timestamp.toDate === "function"
          ? new Date(data.timestamp.toDate()).toLocaleString("id-ID")
          : "N/A";

      listHTML += `
                <div class="p-4 rounded-lg shadow-sm mb-3 ${bgColor} border-l-4 border-gray-300">
                    <div class="flex justify-between items-start pb-2 mb-2 border-b border-gray-200">
                        <div>
                            <p class="font-bold text-lg ${typeClass}">
                                <i class="fas ${
                                  data.type === "MASUK"
                                    ? "fa-arrow-circle-up"
                                    : "fa-arrow-circle-down"
                                } mr-2"></i>
                                ${data.type}
                            </p>
                            <p class="text-xl font-extrabold text-gray-800">${formatRupiah(
                              data.value
                            )}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="editPersonalTransaction('${id}')" 
                                class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-xs focus:outline-none focus:shadow-outline">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="deletePersonalTransaction('${id}')" 
                                class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs focus:outline-none focus:shadow-outline">
                                <i class="fas fa-trash"></i> Hapus
                            </button>
                        </div>
                    </div>
                    <p class="text-sm mt-1 text-gray-700">Catatan: ${
                      data.note
                    }</p>
                    <p class="text-xs text-gray-400 mt-1">Waktu: ${dateToDisplay}</p>
                    <p class="text-xs text-gray-400">ID: ${id.substring(
                      0,
                      8
                    )}...</p>
                </div>
            `;
    });

    // Render List Transaksi
    personalTransactionsList.innerHTML = listHTML;

    // Update Saldo Pribadi
    if (personalBalanceContainer) {
      const balanceClass =
        personalBalance >= 0 ? "text-green-500" : "text-red-500";

      personalBalanceContainer.innerHTML = `
                <p class="mb-2 md:mb-0 w-full text-center">
                    Total Saldo:
                    <span
                        class="font-bold text-4xl block mt-2 ${balanceClass}"
                        >
                        ${formatRupiah(personalBalance)}
                    </span>
                </p>
            `;
    }

    if (snapshot.empty) {
      personalTransactionsList.innerHTML =
        '<p class="text-center text-gray-500 p-8">Belum ada transaksi pribadi yang tercatat.</p>';
    }
  } catch (error) {
    console.error("Error fetching personal transactions:", error);
    personalTransactionsList.innerHTML =
      '<p class="text-center text-red-500 p-8">Gagal memuat data pribadi. Cek koneksi Anda. (Perlu Indeks Firestore: userId, timestamp)</p>';
  } finally {
    hideLoading();
  }
}

// -----------------------------------------------------
// LOGIKA CRUD: DELETE (REKENING PRIBADI)
// -----------------------------------------------------
window.deletePersonalTransaction = async function (id) {
  const result = await Swal.fire({
    title: "Konfirmasi Hapus",
    text: "Apakah Anda yakin ingin menghapus catatan pribadi ini?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (!result.isConfirmed) return;

  showLoading();

  try {
    await personalTransactionsCollection.doc(id).delete();
    Swal.fire({
      title: "Dihapus!",
      text: "Catatan pribadi berhasil dihapus.",
      icon: "success",
    });
    fetchAndRenderPersonalTransactions(); // Refresh list
  } catch (error) {
    console.error("Error removing personal document: ", error);
    Swal.fire({
      title: "Gagal!",
      text: "Gagal menghapus catatan pribadi.",
      icon: "error",
    });
    hideLoading();
  }
};

// -----------------------------------------------------
// LOGIKA CRUD: EDIT (REKENING PRIBADI)
// -----------------------------------------------------
window.editPersonalTransaction = async function (id) {
  showLoading();
  let tx;
  try {
    const doc = await personalTransactionsCollection.doc(id).get();
    if (!doc.exists) {
      Swal.fire("Error", "Transaksi tidak ditemukan.", "error");
      return;
    }
    tx = doc.data();
  } catch (error) {
    console.error("Error fetching personal document for edit: ", error);
    Swal.fire("Error", "Gagal memuat data untuk diedit.", "error");
    return;
  } finally {
    hideLoading();
  }

  // Tampilkan form edit menggunakan SweetAlert2
  const { value: formValues } = await Swal.fire({
    title: "Edit Transaksi Pribadi",
    html:
      `<select id="swal-type" class="swal2-input">
                <option value="MASUK" ${
                  tx.type === "MASUK" ? "selected" : ""
                }>Pemasukan (MASUK)</option>
                <option value="KELUAR" ${
                  tx.type === "KELUAR" ? "selected" : ""
                }>Pengeluaran (KELUAR)</option>
            </select>` +
      `<input id="swal-value" type="number" min="1" placeholder="Nilai (IDR)" value="${tx.value}" class="swal2-input">` +
      `<input id="swal-note" type="text" placeholder="Catatan/Keterangan" value="${tx.note}" class="swal2-input">`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan Perubahan",
    preConfirm: () => {
      const type = document.getElementById("swal-type").value;
      const value = parseInt(document.getElementById("swal-value").value);
      const note = document.getElementById("swal-note").value.trim();

      if (!type || isNaN(value) || value <= 0 || !note) {
        Swal.showValidationMessage(
          `Harap lengkapi semua bidang dengan nilai yang benar.`
        );
        return false;
      }
      return { type, value, note };
    },
  });

  if (formValues) {
    showLoading();
    try {
      // Hapus timestamp karena kita tidak ingin mengubah waktu catatan
      delete formValues.timestamp;
      await personalTransactionsCollection.doc(id).update(formValues);
      Swal.fire(
        "Berhasil!",
        "Transaksi pribadi berhasil diperbarui.",
        "success"
      );
      fetchAndRenderPersonalTransactions();
    } catch (error) {
      console.error("Error updating personal transaction: ", error);
      Swal.fire("Gagal!", `Gagal memperbarui: ${error.message}`, "error");
    } finally {
      hideLoading();
    }
  }
};
