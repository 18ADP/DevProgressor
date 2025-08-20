// src/components/DashboardCharts.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the specific Chart.js components we need for a line chart.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardCharts({ entries }) {
  // We use React.useMemo to prevent re-calculating the chart data on every single render.
  // It will only re-run if the `entries` prop has changed.
  const journalTrendData = React.useMemo(() => {
    const countsByDate = {};
    // Loop through each entry and count how many occur on the same date.
    entries.forEach(entry => {
      const date = new Date(entry.date || entry.createdAt?.toDate()).toLocaleDateString();
      countsByDate[date] = (countsByDate[date] || 0) + 1;
    });
    
    // Sort the dates chronologically to ensure the line chart is drawn correctly.
    const sortedDates = Object.keys(countsByDate).sort((a, b) => new Date(a) - new Date(b));
    
    // Return the final data object in the exact structure that Chart.js expects.
    return {
      labels: sortedDates,
      datasets: [{
        label: 'Entries per Day',
        data: sortedDates.map(date => countsByDate[date]),
        borderColor: 'rgb(79, 70, 229)', // Indigo color
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        fill: true,
        tension: 0.2,
      }],
    };
  }, [entries]);

  // Chart options to configure y-axis to show only whole numbers
  const chartOptions = React.useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1, // Force steps of 1
          callback: function(value) {
            // Only show integer values
            return Number.isInteger(value) ? value : '';
          },
        },
      },
    },
  }), []);

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Journal Activity Trend</h3>
      {/* Conditionally render the chart only if there's enough data to show a trend */}
      {entries.length > 1 ? (
        <Line data={journalTrendData} options={chartOptions} />
      ) : (
        <p className="text-slate-500 dark:text-slate-400 text-center pt-8">
          Add more journal entries to see your activity trend.
        </p>
      )}
    </div>
  );
}