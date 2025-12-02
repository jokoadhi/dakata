document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------------------------------
  // Daftar Varietas Ikan Molly Anda (Untuk Dropdown)
  // -----------------------------------------------------
  const FISH_VARIETIES = [
    { id: "molly_zebra", name: "Molly Zebra" },
    { id: "molly_platinum_cawang", name: "Molly Platinum (Cawang)" },
    { id: "molly_platinum_rontel", name: "Molly Platinum (Rontel)" },
    { id: "molly_gold_cawang", name: "Molly Gold (Cawang)" },
    { id: "molly_gold_rontel", name: "Molly Gold (Rontel)" },
    { id: "molly_marble", name: "Molly Marble" },
    { id: "molly_kaliko", name: "Molly Kaliko" }, // Ditambahkan Kaliko
    { id: "molly_trico", name: "Molly Trico" },
    { id: "molly_sankis", name: "Molly Sankis" },
    { id: "molly_tiger", name: "Molly Tiger" },
    { id: "molly_leopard", name: "Molly Leopard" },
    { id: "mix", name: "Mix (Campur)" },
  ];

  // -----------------------------------------------------
  // DOM Elements
  // -----------------------------------------------------
  const form = document.getElementById("transaction-form");
  const tableBody = document.querySelector("#history-table tbody");
  const totalBalanceEl = document.getElementById("total-balance");
  const packageContainer = document.getElementById("fish-package-container");
  const addFishBtn = document.getElementById("add-fish-btn");

  // Memuat data dari Local Storage
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  // -----------------------------------------------------
  // Fungsi Utility untuk Input Ikan Dinamis
  // -----------------------------------------------------

  // Membuat HTML untuk opsi dropdown ikan
  function getFishOptionsHTML() {
    let options =
      '<option value="" disabled selected>Pilih Jenis Ikan</option>';
    FISH_VARIETIES.forEach((fish) => {
      options += `<option value="${fish.id}">${fish.name}</option>`;
    });
    return options;
  }

  // Menambahkan baris input ikan ke form
  function addFishInput() {
    const id = Date.now(); // ID unik untuk baris ini
    const fishInputHTML = `
            <div id="fish-row-${id}" class="flex space-x-2 items-end">
                <div class="flex-grow">
                    <select class="fish-type shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                        ${getFishOptionsHTML()}
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

  // Event listener untuk tombol hapus baris ikan
  packageContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-fish-btn")) {
      const rowId = e.target.dataset.rowId;
      document.getElementById(`fish-row-${rowId}`).remove();
    }
  });

  // Event listener untuk tombol tambah ikan
  addFishBtn.addEventListener("click", addFishInput);

  // Tambahkan input ikan pertama saat inisialisasi
  addFishInput();

  // -----------------------------------------------------
  // Fungsi Render Tampilan
  // -----------------------------------------------------

  function renderTransactions() {
    tableBody.innerHTML = "";
    let totalBalance = 0;

    // Loop untuk menghitung saldo dan merender tabel
    transactions.forEach((tx, index) => {
      const total = tx.packagePrice;
      if (tx.type === "sale") {
        totalBalance += total; // Penjualan menambah saldo
      } else {
        totalBalance -= total; // Pembelian mengurangi saldo
      }

      // Gabungkan detail ikan menjadi string untuk ditampilkan di tabel
      // Format: "Jumlah x Nama Ikan; Jumlah x Nama Ikan"
      const fishDetails = tx.packageContent
        .map((item) => {
          const fishName =
            FISH_VARIETIES.find((f) => f.id === item.type)?.name || item.type;
          return `${item.count}x ${fishName}`;
        })
        .join(", "); // Gabungkan dengan koma dan spasi

      const row = tableBody.insertRow();
      const typeClass = tx.type === "sale" ? "text-green-600" : "text-red-600";

      row.innerHTML = `
                <td class="py-3 px-6 whitespace-nowrap">${new Date(
                  tx.timestamp
                ).toLocaleString()}</td>
                <td class="py-3 px-6 whitespace-nowrap font-semibold ${typeClass}">${
        tx.type === "sale" ? "JUAL" : "BELI"
      }</td>
                <td class="py-3 px-6 text-sm">${fishDetails}</td>
                <td class="py-3 px-6 whitespace-nowrap font-bold">IDR ${total.toLocaleString(
                  "id-ID"
                )}</td>
            `;
      // Memberi warna latar selang-seling (Zebra Stripping)
      if (index % 2 === 0) {
        row.classList.add("bg-gray-50");
      }
    });

    // Update tampilan saldo
    totalBalanceEl.textContent = `IDR ${totalBalance.toLocaleString("id-ID")}`;

    // Update warna saldo
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

  // -----------------------------------------------------
  // Event Handler Form Submission
  // -----------------------------------------------------
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const packagePrice = parseFloat(
      document.getElementById("package_price").value
    );

    // Ambil semua data input ikan yang ada di form
    const fishTypes = Array.from(document.querySelectorAll(".fish-type"));
    const fishCounts = Array.from(document.querySelectorAll(".fish-count"));

    const packageContent = [];

    // Kumpulkan data isi paket dari input dinamis
    for (let i = 0; i < fishTypes.length; i++) {
      const type = fishTypes[i].value;
      const count = parseInt(fishCounts[i].value);

      // Hanya masukkan item yang valid
      if (type && count > 0 && !isNaN(count)) {
        packageContent.push({
          type: type, // ID ikan (misal: molly_platinum_cawang)
          count: count, // Jumlah ikan dalam paket
        });
      }
    }

    // Validasi minimal 1 jenis ikan dalam paket
    if (packageContent.length === 0) {
      alert(
        "Harap masukkan minimal satu jenis ikan dan jumlahnya dalam paket sebelum mencatat transaksi."
      );
      return;
    }

    const newTransaction = {
      timestamp: Date.now(),
      type: document.getElementById("type").value,
      packagePrice: packagePrice,
      packageContent: packageContent, // Menyimpan detail isi paket
    };

    // Simpan data
    transactions.push(newTransaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    // Render ulang tampilan
    renderTransactions();

    // Reset form input dinamis dan utama
    form.reset();
    packageContainer.innerHTML = "";
    addFishInput(); // Tambahkan input ikan pertama lagi
  });

  // Jalankan render saat halaman pertama kali dimuat
  renderTransactions();
});
