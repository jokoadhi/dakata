document.addEventListener("DOMContentLoaded", () => {
  // Variabel 'db' dan 'transactionsCollection' sudah didefinisikan
  // di dalam tag <script> di index.html, setelah inisialisasi Firebase.

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

  // -----------------------------------------------------
  // DOM Elements
  // -----------------------------------------------------
  const form = document.getElementById("transaction-form");
  const tableBody = document.querySelector("#history-table tbody");
  const totalBalanceEl = document.getElementById("total-balance");
  const packageContainer = document.getElementById("fish-package-container");
  const addFishBtn = document.getElementById("add-fish-btn");

  // -----------------------------------------------------
  // Fungsi Utility untuk Input Ikan Dinamis
  // -----------------------------------------------------

  function getFishOptionsHTML() {
    let options =
      '<option value="" disabled selected>Pilih Jenis Ikan</option>';
    FISH_VARIETIES.forEach((fish) => {
      options += `<option value="${fish.id}">${fish.name}</option>`;
    });
    return options;
  }

  function addFishInput() {
    const id = Date.now();
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

  packageContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-fish-btn")) {
      const rowId = e.target.dataset.rowId;
      document.getElementById(`fish-row-${rowId}`).remove();
    }
  });

  addFishBtn.addEventListener("click", addFishInput);
  addFishInput();

  // -----------------------------------------------------
  // Fungsi Render Tampilan (Mengambil data dari Firestore)
  // -----------------------------------------------------

  async function fetchAndRenderTransactions() {
    // Cek inisialisasi Firebase (menghindari error jika CDN gagal dimuat)
    if (typeof transactionsCollection === "undefined") {
      totalBalanceEl.textContent =
        "IDR 0 (Gagal memuat Firebase. Cek koneksi.)";
      return;
    }

    try {
      // Mengambil data dari Firestore, diurutkan berdasarkan timestamp
      const snapshot = await transactionsCollection
        .orderBy("timestamp", "desc")
        .get();
      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Mulai proses rendering
      tableBody.innerHTML = "";
      let totalBalance = 0;

      transactions.forEach((tx, index) => {
        // Gunakan 0 jika properti tidak ada (untuk kompatibilitas data lama jika ada)
        const packagePrice = tx.packagePrice || 0;
        const shippingCost = tx.shippingCost || 0;

        const totalTransactionValue = packagePrice + shippingCost;

        if (tx.type === "sale") {
          totalBalance += totalTransactionValue;
        } else {
          totalBalance -= totalTransactionValue;
        }

        // Menangani jika packageContent hilang
        const packageContent = tx.packageContent || [];

        const fishDetails = packageContent
          .map((item) => {
            const fishName =
              FISH_VARIETIES.find((f) => f.id === item.type)?.name || item.type;
            return `${item.count}x ${fishName}`;
          })
          .join(", ");

        // Menangani konversi Timestamp dari Firebase
        let dateToDisplay = "N/A";
        if (tx.timestamp && typeof tx.timestamp.toDate === "function") {
          dateToDisplay = new Date(tx.timestamp.toDate()).toLocaleString();
        } else if (tx.timestamp) {
          // Jika timestamp adalah angka biasa (dari Local Storage/Data lama)
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
  // Event Handler Form Submission
  // -----------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validasi Firebase
    if (typeof transactionsCollection === "undefined") {
      alert(
        "Sistem database tidak siap. Harap muat ulang halaman atau cek konfigurasi Firebase."
      );
      return;
    }

    const packagePrice = parseFloat(
      document.getElementById("package_price").value
    );
    const shippingCost = parseFloat(
      document.getElementById("shipping_cost").value
    );
    const destination = document.getElementById("destination").value.trim();

    const fishTypes = Array.from(document.querySelectorAll(".fish-type"));
    const fishCounts = Array.from(document.querySelectorAll(".fish-count"));

    const packageContent = [];

    for (let i = 0; i < fishTypes.length; i++) {
      const type = fishTypes[i].value;
      const count = parseInt(fishCounts[i].value);

      if (type && count > 0 && !isNaN(count)) {
        packageContent.push({
          type: type,
          count: count,
        });
      }
    }

    if (packageContent.length === 0) {
      alert(
        "Harap masukkan minimal satu jenis ikan dan jumlahnya dalam paket sebelum mencatat transaksi."
      );
      return;
    }

    if (packagePrice <= 0 || isNaN(packagePrice)) {
      alert("Harga Paket harus diisi dengan nilai yang valid.");
      return;
    }

    const newTransaction = {
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      type: document.getElementById("type").value,
      packagePrice: packagePrice,
      shippingCost: shippingCost,
      destination: destination,
      packageContent: packageContent,
    };

    try {
      await transactionsCollection.add(newTransaction);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert(
        "Gagal menyimpan transaksi. Cek konfigurasi dan aturan Firebase Anda."
      );
      return;
    }

    // Render ulang tampilan dengan data terbaru dari Firebase
    fetchAndRenderTransactions();

    // Reset form
    form.reset();
    packageContainer.innerHTML = "";
    addFishInput();
  });

  // Jalankan fetch saat halaman pertama kali dimuat
  fetchAndRenderTransactions();
});
