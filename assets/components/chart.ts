import { CategoryScale, Chart, Filler, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

export interface Point {
    x: string;
    y: number;
}

// daily installs as a filled line, x is the day (Y-m-d), y the number of installs
export function installsChart(canvas: HTMLCanvasElement, name: string, points: Point[]): Chart<'line', Point[]> {
    return new Chart<'line', Point[]>(canvas, {
        type: 'line',
        data: { datasets: [dataset(name, points)] },
        options: {
            animation: false,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { ticks: { maxTicksLimit: 12 } },
            },
            plugins: { legend: { position: 'top' } },
        },
    });
}

export function dataset(name: string, points: Point[]) {
    return {
        label: name,
        data: points,
        borderColor: '#206bc4',
        backgroundColor: 'rgba(32, 107, 196, 0.16)',
        borderWidth: 2,
        fill: true,
        cubicInterpolationMode: 'monotone' as const,
        pointRadius: 0,
    };
}
