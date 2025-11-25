// Change backend URL if needed
const BASE_URL = "http://127.0.0.1:5000";

/* ============================
   API CALL HELPERS
============================ */

// Predict API
async function predictPayment(data) {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Log API
async function logTransaction(data) {
  const res = await fetch(`${BASE_URL}/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Stats API
async function getStats() {
  const res = await fetch(`${BASE_URL}/stats`);
  return res.json();
}

/* ============================
   UI INTERACTION
============================ */

document.getElementById("btnPredict").addEventListener("click", async () => {
  // Read input values
  const data = {
    method: document.getElementById("method").value,
    bank: document.getElementById("bank").value,
    amount: parseFloat(document.getElementById("amount").value),
    network: document.getElementById("network").value,
    time_of_day: document.getElementById("time").value,
    retries: parseInt(document.getElementById("retries").value),
    past_failures: parseInt(document.getElementById("failures").value),
  };

  // Call predict API
  const result = await predictPayment(data);

  // Show result card
  document.getElementById("resultCard").classList.remove("hidden");
  document.getElementById("percent").innerText = `${result.success_prob}%`;
  document.getElementById("statusText").innerText = result.status.toUpperCase();
  document.getElementById("reasonText").innerText = result.reason;

  // Log the transaction automatically
  await logTransaction({
    ...data,
    success_prob: result.success_prob,
    status: result.status,
    reason: result.reason,
  });

  // Refresh dashboard charts
  refreshDashboard();
});

/* ============================
   DASHBOARD CHARTS
============================ */

let bankChart, methodChart, reasonChart;

async function refreshDashboard() {
  const stats = await getStats();

  updateOverview(stats);
  updateBankChart(stats.bank_stats);
  updateMethodChart(stats.method_stats);
  updateReasonChart(stats.failure_reasons);
}

// Update Top Stats Area
function updateOverview(stats) {
  const bankStats = stats.bank_stats ?? [];

  let avg =
    bankStats.reduce((sum, b) => sum + b.avg_success, 0) /
    (bankStats.length || 1);

  document.getElementById("avgSuccess").innerText = `${avg.toFixed(1)}%`;
  document.getElementById("totalAttempts").innerText = stats.bank_stats.length;

  const highRiskCount = stats.failure_reasons.filter((r) =>
    r.reason.toLowerCase().includes("fail")
  ).length;

  document.getElementById("highRisk") &&
    (document.getElementById("highRisk").innerText = `${highRiskCount}`);
}

/* === BANK CHART === */
function updateBankChart(data) {
  const labels = data.map((x) => x.bank);
  const values = data.map((x) => x.avg_success);

  if (!bankChart) {
    bankChart = new Chart(document.getElementById("bankChart"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Avg Success %",
            data: values,
            backgroundColor: "#0d6efd",
          },
        ],
      },
      options: { responsive: true },
    });
  } else {
    bankChart.data.labels = labels;
    bankChart.data.datasets[0].data = values;
    bankChart.update();
  }
}

/* === METHOD CHART === */
function updateMethodChart(data) {
  const labels = data.map((x) => x.method);
  const values = data.map((x) => x.avg_success);

  if (!methodChart) {
    methodChart = new Chart(document.getElementById("methodChart"), {
      type: "pie",
      data: {
        labels: labels,
        datasets: [{ data: values }],
      },
    });
  } else {
    methodChart.data.labels = labels;
    methodChart.data.datasets[0].data = values;
    methodChart.update();
  }
}

/* === FAILURE REASON CHART === */
function updateReasonChart(data) {
  const labels = data.map((x) => x.reason);
  const values = data.map((x) => x.count);

  if (!reasonChart) {
    reasonChart = new Chart(document.getElementById("reasonChart"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Count",
            data: values,
            backgroundColor: "#0a58ca",
          },
        ],
      },
    });
  } else {
    reasonChart.data.labels = labels;
    reasonChart.data.datasets[0].data = values;
    reasonChart.update();
  }
}

/* ============================
   INITIAL LOAD
============================ */

refreshDashboard();
