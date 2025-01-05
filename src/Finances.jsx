import { Line } from "react-chartjs-2";
import React from "react";

const Finances = ({ cleaningSummary, oneTimeCleanings, recurringPaid }) => {
  const getChartData = () => {
    if (
      (!oneTimeCleanings || oneTimeCleanings.length === 0) &&
      (!recurringPaid || recurringPaid.length === 0)
    ) {
      return {
        labels: Array(12).fill("N/A"),
        datasets: [],
      };
    }

    const months = Array.from({ length: 12 }, (_, i) =>
      new Date(new Date().setMonth(i)).toLocaleString("default", {
        month: "short",
      })
    );

    const monthlyOneTimeEarnings = Array(12).fill(0);
    oneTimeCleanings.forEach((cleaning) => {
      const cleaningDate = new Date(cleaning.date_time);
      const monthIndex = cleaningDate.getMonth();
      monthlyOneTimeEarnings[monthIndex] += cleaning.amount;
    });

    const monthlyRecurringEarnings = Array(12).fill(0);
    recurringPaid.forEach((payment) => {
      if (payment.dates_related) {
        const dates = payment.dates_related
          .split(", ")
          .map((date) => new Date(date));
        const firstDate = dates.sort((a, b) => a - b)[0];
        if (firstDate) {
          const monthIndex = firstDate.getMonth();
          monthlyRecurringEarnings[monthIndex] += payment.amount_paid;
        }
      }
    });

    return {
      labels: months,
      datasets: [
        {
          label: "One-Time Cleanings",
          data: monthlyOneTimeEarnings,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
        },
        {
          label: "Recurring Payments",
          data: monthlyRecurringEarnings,
          borderColor: "rgba(153, 102, 255, 1)",
          backgroundColor: "rgba(153, 102, 255, 0.2)",
        },
      ],
    };
  };

  return (
    <div>
      {cleaningSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <div className="p-6 rounded-lg shadow-lg bg-gradient-to-br from-green-200 to-green-400 text-gray-800">
            <h3 className="text-lg font-bold mb-2">One-Time Cleanings</h3>
            <p className="text-2xl font-semibold">
              ${cleaningSummary.one_time_total.toFixed(2)}
            </p>
          </div>
          <div className="p-6 rounded-lg shadow-lg bg-gradient-to-br from-blue-200 to-blue-400 text-gray-800">
            <h3 className="text-lg font-bold mb-2">Recurring Payments</h3>
            <p className="text-2xl font-semibold">
              ${cleaningSummary.recurring_total.toFixed(2)}
            </p>
          </div>
          <div className="p-6 rounded-lg shadow-lg bg-gradient-to-br from-purple-200 to-purple-400 text-gray-800">
            <h3 className="text-lg font-bold mb-2">Total Earnings</h3>
            <p className="text-2xl font-semibold">
              ${cleaningSummary.total_paid.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <div className="chart-container bg-gradient-to-br from-gray-800 to-black p-15 pb-20 rounded-lg shadow-lg">
        {cleaningSummary ? (
          <>
            <h2 className="text-4xl font-bold text-white text-center mb-4">
              Earnings Overview
            </h2>
            <Line
              data={getChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: "#ffffff",
                    },
                  },
                },
                scales: {
                  x: {
                    ticks: { color: "#cccccc" },
                    grid: { color: "rgba(255, 255, 255, 0.2)" },
                  },
                  y: {
                    ticks: { color: "#cccccc" },
                    grid: { color: "rgba(255, 255, 255, 0.2)" },
                  },
                },
              }}
            />
          </>
        ) : (
          <p className="text-center text-gray-400 animate-pulse">
            Loading chart data...
          </p>
        )}
      </div>
    </div>
  );
};

export default Finances;
