// script.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("transaction-form");
  const tableBody = document.querySelector("#history-table tbody");
  const totalBalanceEl = document.getElementById("total-balance");

  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  function renderTransactions() {
    tableBody.innerHTML = "";
    let totalBalance = 0;

    transactions.forEach((tx) => {
      const total = tx.amount * tx.price;
      if (tx.type === "sale") {
        totalBalance += total;
      } else {
        // purchase
        totalBalance -= total;
      }

      const row = tableBody.insertRow();
      // Menambahkan kelas Tailwind untuk warna teks
      const typeClass = tx.type === "sale" ? "text-green-600" : "text-red-600";

      row.innerHTML = `
                <td class="py-3 px-6 whitespace-nowrap">${new Date(
                  tx.timestamp
                ).toLocaleString()}</td>
                <td class="py-3 px-6 whitespace-nowrap font-semibold ${typeClass}">${
        tx.type === "sale" ? "Jual" : "Beli"
      }</td>
                <td class="py-3 px-6 whitespace-nowrap">${tx.item}</td>
                <td class="py-3 px-6 whitespace-nowrap">${tx.amount} Kg</td>
                <td class="py-3 px-6 whitespace-nowrap">IDR ${total.toLocaleString(
                  "id-ID"
                )}</td>
            `;
      // Alternating row background for better readability
      if (transactions.indexOf(tx) % 2 === 0) {
        row.classList.add("bg-gray-50");
      }
    });

    totalBalanceEl.textContent = `IDR ${totalBalance.toLocaleString("id-ID")}`;
    // Update warna saldo
    if (totalBalance < 0) {
      totalBalanceEl.classList.remove("text-blue-600", "text-green-600");
      totalBalanceEl.classList.add("text-red-600");
    } else if (totalBalance > 0) {
      totalBalanceEl.classList.remove("text-blue-600", "text-red-600");
      totalBalanceEl.classList.add("text-green-600");
    } else {
      totalBalanceEl.classList.remove("text-green-600", "text-red-600");
      totalBalanceEl.classList.add("text-blue-600");
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const newTransaction = {
      timestamp: Date.now(),
      type: document.getElementById("type").value,
      item: document.getElementById("item").value.trim(),
      amount: parseFloat(document.getElementById("amount").value),
      price: parseFloat(document.getElementById("price").value),
    };

    transactions.push(newTransaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    renderTransactions();
    form.reset();
  });

  renderTransactions();
});
