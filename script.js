document.addEventListener("DOMContentLoaded", () => {
  // Variabel global dari index.html: transactionsCollection, firebase

  const FISH_VARIETIES = [
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
  const form = document.getElementById("transaction-form");
  const tableBody = document.querySelector("#history-table tbody");
  const totalBalanceEl = document.getElementById("total-balance");
  const packageContainer = document.getElementById("fish-package-container");
  const addFishBtn = document.getElementById("add-fish-btn");
  const submitBtn = document.getElementById("submit-btn");
  const formTitle = document.getElementById("form-title");
  const editModeControls = document.getElementById("edit-mode-controls");

  // VARIABEL UNTUK MODE EDIT
  let isEditMode = false;
  let currentEditId = null;

  // -----------------------------------------------------
  // FUNGSI UTILITY (FISH INPUT)
  // -----------------------------------------------------

  function getFishOptionsHTML(selectedValue = "") {
    let options = '<option value="" disabled>Pilih Jenis Ikan</option>';
    FISH_VARIETIES.forEach((fish) => {
      const selected = fish.id === selectedValue ? "selected" : "";
      options += `<option value="${fish.id}" ${selected}>${fish.name}</option>`;
    });
    // OPSI BARU: LAINNYA
    const otherSelected = selectedValue === "other" ? "selected" : "";
    options += `<option value="other" ${otherSelected}>Lainnya (Input Teks)</option>`;
    return options;
  }

  // Menghapus semua input ikan yang ada
  function deleteFishInputs() {
    packageContainer.innerHTML = "";
  }

  // Merender input ikan dari data transaksi (digunakan saat Edit)
  function renderFishInputs(packageContent) {
    deleteFishInputs();

    if (packageContent && packageContent.length > 0) {
      packageContent.forEach((item) => {
        const id = Date.now() + Math.random();

        // Cek apakah item ini adalah "Lainnya" yang sudah disimpan
        const isOther = item.type.startsWith("other:");
        const selectedType = isOther ? "other" : item.type;
        const otherValue = isOther ? item.type.substring(6) : ""; // Ambil teks setelah 'other:'

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

  // Menambahkan satu baris input ikan baru
  function addFishInput(initialType = "") {
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
  // LOGIKA PENANGANAN INPUT LAINNYA (Teks Bebas)
  // -----------------------------------------------------
  packageContainer.addEventListener("change", (e) => {
    if (e.target.classList.contains("fish-type")) {
      const selectEl = e.target;
      const parentDiv = selectEl.parentElement;

      // Hapus input 'other' yang mungkin sudah ada
      let existingInput = parentDiv.querySelector(".other-input");
      if (existingInput) {
        existingInput.remove();
      }

      if (selectEl.value === "other") {
        // Tambahkan input teks baru
        const otherInputHTML = `
                    <input type="text" placeholder="Isi Lainnya..." class="other-input mt-2 shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                `;
        parentDiv.insertAdjacentHTML("beforeend", otherInputHTML);
      }
    }
  });

  // Menghapus baris input ikan saat tombol "Hapus" diklik
  packageContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-fish-btn")) {
      const rowId = e.target.dataset.rowId;
      document.getElementById(`fish-row-${rowId}`).remove();
    }
  });

  addFishBtn.addEventListener("click", addFishInput);

  // -----------------------------------------------------
  // LOGIKA CRUD: DELETE (TIDAK BERUBAH)
  // -----------------------------------------------------
  window.deleteTransaction = async function (id) {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus transaksi ini secara permanen?"
      )
    ) {
      return;
    }
    try {
      await transactionsCollection.doc(id).delete();
      alert("Transaksi berhasil dihapus.");
      fetchAndRenderTransactions();
    } catch (error) {
      console.error("Error removing document: ", error);
      alert("Gagal menghapus transaksi. Cek koneksi atau aturan Firebase.");
    }
  };

  // -----------------------------------------------------
  // LOGIKA CRUD: EDIT / SETUP EDIT MODE (TIDAK BERUBAH)
  // -----------------------------------------------------
  window.editTransaction = async function (id) {
    try {
      const doc = await transactionsCollection.doc(id).get();
      if (!doc.exists) {
        alert("Transaksi tidak ditemukan.");
        return;
      }

      const tx = doc.data();

      // 1. Set Mode Edit
      isEditMode = true;
      currentEditId = id;
      submitBtn.textContent = "Simpan Perubahan Transaksi";
      submitBtn.classList.remove("bg-green-500", "hover:bg-green-700");
      submitBtn.classList.add("bg-blue-500", "hover:bg-blue-700");
      formTitle.textContent = `Edit Transaksi (ID: ${id.substring(0, 5)}...)`;
      editModeControls.classList.remove("hidden");

      // 2. Isi Form Utama
      document.getElementById("type").value = tx.type;
      document.getElementById("package_price").value = tx.packagePrice || 0;
      document.getElementById("shipping_cost").value = tx.shippingCost || 0;
      document.getElementById("destination").value = tx.destination || "";
      document.getElementById("client_name").value = tx.clientName || "";

      // 3. Isi Input Ikan Dinamis
      renderFishInputs(tx.packageContent);

      // 4. Scroll ke atas agar user bisa melihat form
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error fetching document for edit: ", error);
      alert("Gagal memuat data transaksi untuk diedit.");
    }
  };

  // -----------------------------------------------------
  // LOGIKA RESET FORM (TIDAK BERUBAH)
  // -----------------------------------------------------
  window.resetForm = function () {
    isEditMode = false;
    currentEditId = null;
    form.reset();

    // Reset tampilan form
    submitBtn.textContent = "Catat Transaksi Paket";
    submitBtn.classList.remove("bg-blue-500", "hover:bg-blue-700");
    submitBtn.classList.add("bg-green-500", "hover:bg-green-700");
    formTitle.textContent = "Input Transaksi Baru (Paket)";
    editModeControls.classList.add("hidden");

    // Reset input ikan
    deleteFishInputs();
    addFishInput();
  };

  // -----------------------------------------------------
  // Fungsi Render Tampilan (MENANGANI "OTHER" PADA DISPLAY)
  // -----------------------------------------------------

  async function fetchAndRenderTransactions() {
    if (typeof transactionsCollection === "undefined") {
      totalBalanceEl.textContent =
        "IDR 0 (Gagal memuat Firebase. Cek koneksi.)";
      return;
    }

    try {
      const snapshot = await transactionsCollection
        .orderBy("timestamp", "desc")
        .get();
      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      tableBody.innerHTML = "";
      let totalBalance = 0;

      transactions.forEach((tx, index) => {
        const packagePrice = tx.packagePrice || 0;
        const shippingCost = tx.shippingCost || 0;

        // Saldo: Hanya Harga Paket
        if (tx.type === "sale") {
          totalBalance += packagePrice;
        } else {
          totalBalance -= packagePrice;
        }

        const totalTransactionValue = packagePrice + shippingCost;

        const packageContent = tx.packageContent || [];

        const fishDetails = packageContent
          .map((item) => {
            let itemName = item.type;

            // Logic untuk menampilkan item "Lainnya"
            if (itemName.startsWith("other:")) {
              itemName = itemName.substring(6); // Menghilangkan prefiks 'other:'
            } else {
              // Untuk item yang ada di daftar FISH_VARIETIES
              itemName =
                FISH_VARIETIES.find((f) => f.id === item.type)?.name ||
                item.type;
            }

            return `${item.count}x ${itemName}`;
          })
          .join(", ");

        let dateToDisplay = "N/A";
        if (tx.timestamp && typeof tx.timestamp.toDate === "function") {
          dateToDisplay = new Date(tx.timestamp.toDate()).toLocaleString();
        } else if (tx.timestamp) {
          dateToDisplay = new Date(tx.timestamp).toLocaleString();
        }

        const row = tableBody.insertRow();
        const typeClass =
          tx.type === "sale" ? "text-green-600" : "text-red-600";

        row.innerHTML = `
                    <td class="py-3 px-6 whitespace-nowrap">${dateToDisplay}</td>
                    <td class="py-3 px-6 whitespace-nowrap font-semibold ${typeClass}">${
          tx.type === "sale" ? "JUAL" : "BELI"
        }</td>
                    <td class="py-3 px-6 text-sm">
                        <span class="font-semibold">Nama:</span> ${
                          tx.clientName || "-"
                        } <br> 
                        Isi: ${fishDetails || "-"} <br>
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

      // Update tampilan saldo
      totalBalanceEl.textContent = `IDR ${totalBalance.toLocaleString(
        "id-ID"
      )}`;
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
    } catch (error) {
      console.error("Error fetching transactions: ", error);
      alert(
        "Gagal memuat data dari database. Cek koneksi dan aturan Firebase (Rules)."
      );
    }
  }

  // -----------------------------------------------------
  // Event Handler Form Submission (HANDLE OTHER)
  // -----------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (typeof transactionsCollection === "undefined") {
      alert("Sistem database tidak siap.");
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

    // Loop melalui setiap baris input ikan
    for (const row of fishRows) {
      const typeSelect = row.querySelector(".fish-type");
      const countInput = row.querySelector(".fish-count");
      const otherInput = row.querySelector(".other-input");

      const type = typeSelect.value;
      const count = parseInt(countInput.value);

      let finalType = type;

      // Logika baru untuk menangani input "Lainnya"
      if (type === "other") {
        if (otherInput && otherInput.value.trim()) {
          // Gunakan prefiks 'other:' untuk menandai item ini di database
          finalType = "other:" + otherInput.value.trim();
        } else {
          alert('Harap isi deskripsi untuk item "Lainnya".');
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

    // ... (Validasi tetap sama) ...
    if (packageContent.length === 0) {
      alert(
        "Harap masukkan minimal satu jenis item dan jumlahnya dalam paket."
      );
      return;
    }

    if (packagePrice <= 0 || isNaN(packagePrice)) {
      alert("Harga Paket harus diisi dengan nilai yang valid.");
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

    try {
      if (isEditMode && currentEditId) {
        // MODE EDIT: Update Data
        await transactionsCollection.doc(currentEditId).update(transactionData);
        alert("Transaksi berhasil diperbarui!");
        resetForm();
      } else {
        // MODE CREATE: Tambah Data Baru
        transactionData.timestamp =
          firebase.firestore.FieldValue.serverTimestamp();
        await transactionsCollection.add(transactionData);
        alert("Transaksi berhasil dicatat!");
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "adding"} document: `,
        error
      );
      alert(
        `Gagal ${
          isEditMode ? "memperbarui" : "menyimpan"
        } transaksi. Cek konfigurasi dan aturan Firebase Anda.`
      );
      return;
    }

    fetchAndRenderTransactions();

    if (!isEditMode) {
      form.reset();
      packageContainer.innerHTML = "";
      addFishInput();
    }
  });

  addFishInput();
  fetchAndRenderTransactions();
});
