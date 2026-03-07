document.addEventListener("DOMContentLoaded", () => {
  const flash = document.querySelector(".flash");
  if (flash) {
    setTimeout(() => {
      flash.style.opacity = "0";
      flash.style.transition = "opacity 300ms ease";
      setTimeout(() => flash.remove(), 320);
    }, 3000);
  }

  if (window.Chart && Array.isArray(window.reportChartData)) {
    const canvas = document.getElementById("reportChart");
    if (canvas) {
      new window.Chart(canvas, {
        type: "bar",
        data: {
          labels: window.reportChartData.map((item) => item.label),
          datasets: [
            {
              label: "Yearly target",
              data: window.reportChartData.map((item) => item.yearlyTarget),
              backgroundColor: "rgba(11, 59, 92, 0.75)",
            },
            {
              label: "Today performance",
              data: window.reportChartData.map((item) => item.todayPerformance),
              backgroundColor: "rgba(255, 154, 90, 0.8)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      });
    }
  }
});
