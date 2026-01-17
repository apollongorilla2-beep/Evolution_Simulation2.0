import { SIM_CONFIG } from './constants.js';
import { BIOME_TYPES } from './constants.js'; // Import BIOME_TYPES

export const ChartManager = {
    generationLabels: [],
    fitnessData: [],
    populationData: [],
    speedData: [],
    sizeData: [],
    foodEatenData: [],
    visionRangeData: [],
    lifespanData: [], // New chart data for lifespan
    biomePreferenceData: [], // New chart data for biome preference

    fitnessChart: null,
    populationChart: null,
    speedChart: null,
    sizeChart: null,
    foodEatenChart: null,
    visionRangeChart: null,
    lifespanChart: null, // New chart instance
    biomePreferenceChart: null, // New chart instance

    /**
     * Initializes all Chart.js instances.
     */
    initCharts() {
        if (typeof Chart === 'undefined') {
            console.error("Chart.js is not loaded. Cannot initialize charts. Please ensure the Chart.js script is accessible.");
            return;
        }

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Generation', color: 'white' },
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                y: {
                    title: { display: true, text: 'Value', color: 'white' },
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            },
            plugins: {
                legend: { labels: { color: 'white' } }
            }
        };

        // Destroy existing charts to prevent memory leaks
        this.destroyCharts();

        this.fitnessChart = new Chart(document.getElementById('fitnessChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Average Fitness', data: this.fitnessData, borderColor: 'rgb(255, 159, 64)', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0 } } }
        });
        this.populationChart = new Chart(document.getElementById('populationChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Population (Alive)', data: this.populationData, borderColor: 'rgb(75, 192, 192)', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: SIM_CONFIG.FIXED_POPULATION_SIZE * 1.1 } } }
        });
        this.speedChart = new Chart(document.getElementById('speedChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Average Speed', data: this.speedData, borderColor: 'rgb(255, 99, 132)', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: SIM_CONFIG.BASE_SPEED * 2.5 } } }
        });
        this.sizeChart = new Chart(document.getElementById('sizeChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Average Size', data: this.sizeData, borderColor: 'rgb(54, 162, 235)', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: SIM_CONFIG.CREATURE_BASE_RADIUS * 3 } } }
        });
        this.foodEatenChart = new Chart(document.getElementById('foodEatenChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Avg Food Eaten', data: this.foodEatenData, borderColor: 'rgb(255, 205, 86)', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0 } } }
        });
        this.visionRangeChart = new Chart(document.getElementById('visionRangeChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Avg Vision Range', data: this.visionRangeData, borderColor: 'rgb(153, 102, 255)', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0 } } }
        });
        this.lifespanChart = new Chart(document.getElementById('lifespanChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Avg Lifespan (frames)', data: this.lifespanData, borderColor: 'rgb(0, 123, 255)', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0 } } }
        });
        this.biomePreferenceChart = new Chart(document.getElementById('biomePreferenceChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Avg Biome Preference Index', data: this.biomePreferenceData, borderColor: 'rgb(255, 193, 7)', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: BIOME_TYPES.length - 1, stepSize: 1 } } }
        });
    },

    /**
     * Destroys all existing chart instances.
     */
    destroyCharts() {
        if (this.fitnessChart) this.fitnessChart.destroy();
        if (this.populationChart) this.populationChart.destroy();
        if (this.speedChart) this.speedChart.destroy();
        if (this.sizeChart) this.sizeChart.destroy();
        if (this.foodEatenChart) this.foodEatenChart.destroy();
        if (this.visionRangeChart) this.visionRangeChart.destroy();
        if (this.lifespanChart) this.lifespanChart.destroy();
        if (this.biomePreferenceChart) this.biomePreferenceChart.destroy();

        this.fitnessChart = null;
        this.populationChart = null;
        this.speedChart = null;
        this.sizeChart = null;
        this.foodEatenChart = null;
        this.visionRangeChart = null;
        this.lifespanChart = null;
        this.biomePreferenceChart = null;
    },

    /**
     * Clears all chart data.
     */
    clearData() {
        this.generationLabels = [];
        this.fitnessData = [];
        this.populationData = [];
        this.speedData = [];
        this.sizeData = [];
        this.foodEatenData = [];
        this.visionRangeData = [];
        this.lifespanData = [];
        this.biomePreferenceData = [];
    },

    /**
     * Updates data for all charts with the given creature statistics.
     * @param {Creature[]} allCreaturesInGeneration - Array of creatures from the just-finished generation.
     * @param {number} currentGenerationNumber - The current generation number.
     */
    updateChartsData(allCreaturesInGeneration, currentGenerationNumber) {
        if (typeof Chart === 'undefined') { return; }

        this.generationLabels.push(currentGenerationNumber);

        let totalFitness = 0;
        let totalSpeed = 0;
        let totalSize = 0;
        let totalFoodEaten = 0;
        let totalVisionRange = 0;
        let totalLifespan = 0;
        let totalBiomePreference = 0;
        let aliveCreaturesCount = 0;

        for (const creature of allCreaturesInGeneration) {
            totalFitness += creature.fitness; // Use pre-calculated fitness
            if (creature.isAlive) {
                totalSpeed += creature.speed;
                totalSize += creature.size;
                totalFoodEaten += creature.foodEatenCount;
                totalVisionRange += creature.visionRange;
                totalLifespan += creature.lifespan; // Sum up lifespans
                totalBiomePreference += creature.biomePreference; // Sum up biome preferences
                aliveCreaturesCount++;
            }
        }

        this.fitnessData.push(totalFitness / allCreaturesInGeneration.length);
        this.populationData.push(aliveCreaturesCount); // Only alive population for this chart

        if (aliveCreaturesCount > 0) {
            this.speedData.push(totalSpeed / aliveCreaturesCount);
            this.sizeData.push(totalSize / aliveCreaturesCount);
            this.foodEatenData.push(totalFoodEaten / aliveCreaturesCount);
            this.visionRangeData.push(totalVisionRange / aliveCreaturesCount);
            this.lifespanData.push(totalLifespan / aliveCreaturesCount); // Avg lifespan
            this.biomePreferenceData.push(totalBiomePreference / aliveCreaturesCount); // Avg biome preference
        } else {
            // If no creatures are alive, push 0 for averages
            this.speedData.push(0);
            this.sizeData.push(0);
            this.foodEatenData.push(0);
            this.visionRangeData.push(0);
            this.lifespanData.push(0);
            this.biomePreferenceData.push(0);
        }

        // Limit data points to keep charts performant
        if (this.generationLabels.length > SIM_CONFIG.MAX_DATA_POINTS) {
            this.generationLabels.shift();
            this.fitnessData.shift();
            this.populationData.shift();
            this.speedData.shift();
            this.sizeData.shift();
            this.foodEatenData.shift();
            this.visionRangeData.shift();
            this.lifespanData.shift();
            this.biomePreferenceData.shift();
        }

        this.fitnessChart.update();
        this.populationChart.update();
        this.speedChart.update();
        this.sizeChart.update();
        this.foodEatenChart.update();
        this.visionRangeChart.update();
        this.lifespanChart.update();
        this.biomePreferenceChart.update();
    }
};
