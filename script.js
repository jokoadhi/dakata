// script.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("transaction-form");
  const tableBody = document.querySelector("#history-table tbody");
  const totalBalanceEl = document.getElementById("total-balance");

  // 1. Fungsi untuk Memuat Data dari Local Storage
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  // 2. Fungsi untuk Render Tampilan
  function renderTransactions() {
    // Membersihkan tabel
    tableBody.innerHTML = "";
    let totalBalance = 0;

    transactions.forEach((tx) => {
      // Hitung total dan saldo
      const total = tx.amount * tx.price;
      if (tx.type === "sale") {
        totalBalance += total; // Penjualan menambah saldo
      } else {
        totalBalance -= total; // Pembelian mengurangi saldo
      }

      // Buat baris tabel baru
      const row = tableBody.insertRow();
      row.innerHTML = `
                <td>${new Date(tx.timestamp).toLocaleString()}</td>
                <td class="${tx.type}">${
        tx.type === "sale" ? "Jual" : "Beli"
      }</td>
                <td>${tx.item}</td>
                <td>${tx.amount} Kg</td>
                <td>IDR ${total.toLocaleString("id-ID")}</td>
            `;
    });

    // Update tampilan saldo
    totalBalanceEl.textContent = `IDR ${totalBalance.toLocaleString("id-ID")}`;
  }

  // 3. Fungsi untuk Menangani Form Submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const newTransaction = {
      timestamp: Date.now(),
      type: document.getElementById("type").value,
      item: document.getElementById("item").value.trim(),
      amount: parseFloat(document.getElementById("amount").value),
      price: parseFloat(document.getElementById("price").value),
    };

    // Tambahkan ke array
    transactions.push(newTransaction);

    // Simpan ke Local Storage (Penyimpanan Data Sementara)
    localStorage.setItem("transactions", JSON.stringify(transactions));

    // Render ulang tampilan
    renderTransactions();

    // Reset form
    form.reset();
  });

  // Jalankan render saat halaman pertama kali dimuat
  renderTransactions();
});
