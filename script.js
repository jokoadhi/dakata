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

  // Variabel untuk Mode Edit
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
    // OPSI LAINNYA
    const otherSelected = selectedValue === "other" ? "selected" : "";
    options += `<option value="other" ${otherSelected}>Lainnya (Input Teks)</option>`;
    return options;
  }

  function deleteFishInputs() {
    packageContainer.innerHTML = "";
  }

  function renderFishInputs(packageContent) {
    deleteFishInputs();

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
  });

  packageContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-fish-btn")) {
      const rowId = e.target.dataset.rowId;
      document.getElementById(`fish-row-${rowId}`).remove();
    }
  });

  addFishBtn.addEventListener("click", addFishInput);

  // -----------------------------------------------------
  // LOGIKA CRUD: DELETE (MENGGUNAKAN SWEETALERT)
  // -----------------------------------------------------
  window.deleteTransaction = async function (id) {
    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus transaksi ini secara permanen? Tindakan ini tidak dapat dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await transactionsCollection.doc(id).delete();

      Swal.fire({
        title: "Dihapus!",
        text: "Transaksi berhasil dihapus.",
        icon: "success",
      });

      fetchAndRenderTransactions();
    } catch (error) {
      console.error("Error removing document: ", error);

      Swal.fire({
        title: "Gagal!",
        text: "Gagal menghapus transaksi. Cek koneksi atau aturan Firebase.",
        icon: "error",
      });
    }
  };

  // -----------------------------------------------------
  // LOGIKA PEMBUATAN NOTA/INVOICE (TANPA HARGA PER UNIT)
  // -----------------------------------------------------
  window.generateInvoice = async function (id) {
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

      // 1. Buat detail item (Isi Paket) untuk tabel invoice
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
                        <td>${item.count}</td>
                    </tr>
                `;
      });

      // 2. Template HTML untuk Invoice (Menghilangkan kolom harga per unit)
      const invoiceHTML = `
                <html>
                <head>
                    <title>Nota Transaksi #${id.substring(0, 8)}</title>
                    <style>
                        body { font-family: Arial, sans-serif; font-size: 12px; margin: 30px; }
                        .container { width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
                        h2 { text-align: center; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
                        th { background-color: #f4f4f4; }
                        .header-info, .total { margin-bottom: 15px; }
                        .total p { text-align: right; margin: 5px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>NOTA TRANSAKSI ${
                          tx.type === "sale" ? "PENJUALAN" : "PEMBELIAN"
                        } <br> DAKATA Aquatic</h2>
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
                                    <th style="width: 15%;">Jumlah</th>
                                    </tr>
                            </thead>
                            <tbody>
                                ${itemDetailsHTML}
                            </tbody>
                        </table>

                        <div class="total">
                            <p><strong>Subtotal (Harga Paket):</strong> IDR ${packagePrice.toLocaleString(
                              "id-ID"
                            )}</p>
                            <p><strong>Biaya Kirim (Ongkir):</strong> IDR ${shippingCost.toLocaleString(
                              "id-ID"
                            )}</p>
                            <hr style="border-top: 1px solid #000; margin: 5px 0;">
                            <p><strong>TOTAL AKHIR:</strong> IDR ${totalAmount.toLocaleString(
                              "id-ID"
                            )}</p>
                        </div>

                        <p style="text-align: center; margin-top: 30px;">Terima kasih atas transaksinya.</p>
                    </div>
                </body>
                </html>
            `;

      // 3. Buka jendela baru dan cetak
      const printWindow = window.open("", "", "height=600,width=800");
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
    }
  };

  // -----------------------------------------------------
  // LOGIKA CRUD: EDIT / SETUP EDIT MODE
  // -----------------------------------------------------
  window.editTransaction = async function (id) {
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
      submitBtn.textContent = "Simpan Perubahan Transaksi";
      submitBtn.classList.remove("bg-green-500", "hover:bg-green-700");
      submitBtn.classList.add("bg-blue-500", "hover:bg-blue-700");
      formTitle.textContent = `Edit Transaksi (ID: ${id.substring(0, 5)}...)`;
      editModeControls.classList.remove("hidden");

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
    }
  };

  // -----------------------------------------------------
  // LOGIKA RESET FORM
  // -----------------------------------------------------
  window.resetForm = function () {
    isEditMode = false;
    currentEditId = null;
    form.reset();

    submitBtn.textContent = "Catat Transaksi Paket";
    submitBtn.classList.remove("bg-blue-500", "hover:bg-blue-700");
    submitBtn.classList.add("bg-green-500", "hover:bg-green-700");
    formTitle.textContent = "Input Transaksi Baru (Paket)";
    editModeControls.classList.add("hidden");

    deleteFishInputs();
    addFishInput();
  };

  // -----------------------------------------------------
  // Fungsi Render Tampilan & Perhitungan Saldo
  // -----------------------------------------------------

  async function fetchAndRenderTransactions() {
    if (typeof transactionsCollection === "undefined") {
      Swal.fire({
        title: "Koneksi Error",
        text: "Gagal memuat Firebase. Cek koneksi.",
        icon: "error",
      });
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

        // SALDO HANYA DARI HARGA PAKET
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

            if (itemName.startsWith("other:")) {
              itemName = item.type.substring(6);
            } else {
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
      Swal.fire({
        title: "Koneksi Error",
        text: "Gagal memuat data dari database. Cek koneksi dan aturan Firebase (Rules).",
        icon: "error",
      });
    }
  }

  // -----------------------------------------------------
  // Event Handler Form Submission
  // -----------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (typeof transactionsCollection === "undefined") {
      Swal.fire({
        title: "Error",
        text: "Sistem database tidak siap.",
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

    try {
      if (isEditMode && currentEditId) {
        await transactionsCollection.doc(currentEditId).update(transactionData);

        Swal.fire({
          title: "Berhasil!",
          text: "Transaksi berhasil diperbarui.",
          icon: "success",
        });

        resetForm();
      } else {
        transactionData.timestamp =
          firebase.firestore.FieldValue.serverTimestamp();
        await transactionsCollection.add(transactionData);

        Swal.fire({
          title: "Berhasil!",
          text: "Transaksi berhasil dicatat.",
          icon: "success",
        });
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "adding"} document: `,
        error
      );

      Swal.fire({
        title: "Gagal!",
        text: `Gagal ${
          isEditMode ? "memperbarui" : "menyimpan"
        } transaksi. Cek konfigurasi dan aturan Firebase Anda.`,
        icon: "error",
      });
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
