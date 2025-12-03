// =====================================================
// INISIALISASI
// CATATAN: auth, db, dan transactionsCollection
//          diinisialisasi di index.html
// =====================================================

// DOM Elements terkait Auth & Loading
const loginContainer = document.getElementById("login-container");
const appContainer = document.getElementById("app-container");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");
const loginErrorEl = document.getElementById("login-error");
const loadingOverlay = document.getElementById("loading-overlay");

// Variabel Global
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
let allTransactions = []; // Menyimpan semua data transaksi
let filteredTransactions = []; // Menyimpan data setelah difilter/search
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
// FUNGSI PENGATUR LOADING
// ==========================================================
function showLoading() {
  if (loadingOverlay) loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
  if (loadingOverlay) loadingOverlay.classList.add("hidden");
}

// -----------------------------------------------------
// FUNGSI AUTH DAN TOGGLE APLIKASI
// -----------------------------------------------------

function toggleApp(loggedIn) {
  if (loggedIn) {
    // Inisialisasi DOM Elements saat app container muncul
    if (!form) {
      initializeDOMElements();
    }

    loginContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");

    addFishInput();
  } else {
    appContainer.classList.add("hidden");
    loginContainer.classList.remove("hidden");
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
    }
  });
}

// PEMERIKSAAN STATUS OTENTIKASI (Paling Penting)
auth.onAuthStateChanged((user) => {
  showLoading();
  if (user) {
    toggleApp(true);
    fetchTransactions();
  } else {
    toggleApp(false);
    hideLoading();
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

  // DOM Elements
  form = document.getElementById("transaction-form");
  tableBody = document.querySelector("#history-table tbody");
  totalBalanceEl = document.getElementById("total-balance");
  packageContainer = document.getElementById("fish-package-container");
  addFishBtn = document.getElementById("add-fish-btn");
  submitBtn = document.getElementById("submit-btn");
  formTitle = document.getElementById("form-title");
  editModeControls = document.getElementById("edit-mode-controls");

  // INISIALISASI DOM BARU
  filterSelect = document.getElementById("transaction-filter");
  searchInput = document.getElementById("transaction-search");
  prevPageBtn = document.getElementById("prev-page-btn");
  nextPageBtn = document.getElementById("next-page-btn");
  paginationInfo = document.getElementById("pagination-info");
  exportCsvBtn = document.getElementById("export-csv-btn");

  // Event Listeners yang tergantung pada DOM app-container
  if (addFishBtn) addFishBtn.addEventListener("click", addFishInput);
  if (form) form.addEventListener("submit", handleFormSubmission);
  if (packageContainer) {
    packageContainer.addEventListener("change", handlePackageChange);
    packageContainer.addEventListener("click", handlePackageClick);
  }

  // EVENT LISTENERS BARU UNTUK FILTER, SEARCH, PAGINATION, DAN EXPORT
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
                <div id="fish-row-${id}" class="flex space-x-2 items-end">
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
        <div id="fish-row-${id}" class="flex space-x-2 items-end">
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
// LOGIKA PENANGANAN INPUT & TOMBOL
// -----------------------------------------------------

function handlePackageChange(e) {
  if (e.target.classList.contains("fish-type")) {
    const selectEl = e.target;
    const parentDiv = selectEl.parentElement;

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
  if (e.target.classList.contains("remove-fish-btn")) {
    const rowId = e.target.dataset.rowId;
    document.getElementById(`fish-row-${rowId}`).remove();
  }
}

// -----------------------------------------------------
// LOGIKA CRUD: DELETE
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
// LOGIKA PEMBUATAN NOTA/INVOICE
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

    // 2. Template HTML untuk Invoice
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
// LOGIKA CRUD: EDIT / SETUP EDIT MODE
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
// LOGIKA RESET FORM
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
// FUNGSI FETCH, FILTER, PAGINATION, DAN SALDO
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
    hideLoading();
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
    if (totalBalanceEl) totalBalanceEl.textContent = "IDR 0"; // Reset saldo
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
    if (tx.type === "sale") {
      totalBalance += packagePrice;
    } else {
      totalBalance -= packagePrice;
    }
  });

  if (totalBalanceEl) {
    totalBalanceEl.textContent = `IDR ${totalBalance.toLocaleString("id-ID")}`;
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
                    Paket: IDR ${packagePrice.toLocaleString("id-ID")} <br>
                    Ongkir: IDR ${shippingCost.toLocaleString("id-ID")} <br>
                    <hr class="my-1 border-gray-300">
                    <span class="${typeClass}">TOTAL: IDR ${totalTransactionValue.toLocaleString(
        "id-ID"
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
    const displayStart = totalFiltered > 0 ? start + 1 : 0;
    const displayEnd = Math.min(end, totalFiltered);
    paginationInfo.textContent = `Menampilkan ${displayStart} sampai ${displayEnd} dari ${totalFiltered} data`;
  }

  if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
  if (nextPageBtn)
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// -----------------------------------------------------
// FUNGSI EXPORT DATA KE CSV
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
// Event Handler Form Submission (DILENGKAPI)
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

  const fishRows = Array.from(packageContainer.children);
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
    hideLoading();
  }
}
