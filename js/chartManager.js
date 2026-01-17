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
    lifespanData: [],
    biomePreferenceData: [],
    // New chart data arrays
    attackPowerData: [],
    defenseData: [],
    metabolismData: [],
    clutchSizeData: [],
    sensoryRangeData: [],
    optimalTemperatureData: [],


    fitnessChart: null,
    populationChart: null,
    speedChart: null,
    sizeChart: null,
    foodEatenChart: null,
    visionRangeChart: null,
    lifespanChart: null,
    biomePreferenceChart: null,
    // New chart instances
    attackPowerChart: null,
    defenseChart: null,
    metabolismChart: null,
    clutchSizeChart: null,
    sensoryRangeChart: null,
    optimalTemperatureChart: null,

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
                    title: { display: true, text: 'Generation', color: '#b0b0b0' }, /* Updated text color */
                    ticks: { color: '#b0b0b0' }, /* Updated tick color */
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                y: {
                    title: { display: true, text: 'Value', color: '#b0b0b0' }, /* Updated text color */
                    ticks: { color: '#b0b0b0' }, /* Updated tick color */
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            },
            plugins: {
                legend: { labels: { color: '#e0e0e0' } } /* Updated legend label color */
            }
        };

        // Destroy existing charts to prevent memory leaks
        this.destroyCharts();

        this.fitnessChart = new Chart(document.getElementById('fitnessChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Average Fitness', data: this.fitnessData, borderColor: '#FFC107', tension: 0.1, fill: false }] }, /* Updated borderColor */
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0 } } }
        });
        this.populationChart = new Chart(document.getElementById('populationChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Population (Alive)', data: this.populationData, borderColor: '#03DAC6', tension: 0.1, fill: false }] }, /* Updated borderColor */
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: SIM_CONFIG.FIXED_POPULATION_SIZE * 1.1 } } }
        });
        this.speedChart = new Chart(document.getElementById('speedChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Average Speed', data: this.speedData, borderColor: '#CF6679', tension: 0.1, fill: false }] }, /* Updated borderColor */
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: SIM_CONFIG.BASE_SPEED * 2.5 } } }
        });
        this.sizeChart = new Chart(document.getElementById('sizeChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Average Size', data: this.sizeData, borderColor: '#BB86FC', tension: 0.1, fill: false }] }, /* Updated borderColor */
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: SIM_CONFIG.CREATURE_BASE_RADIUS * 3 } } }
        });
        this.foodEatenChart = new Chart(document.getElementById('foodEatenChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Avg Food Eaten', data: this.foodEatenData, borderColor: '#4CAF50', tension: 0.1, fill: false }] }, /* Updated borderColor */
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0 } } }
        });
        this.visionRangeChart = new Chart(document.getElementById('visionRangeChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Avg Vision Range', data: this.visionRangeData, borderColor: '#3a6ea5', tension: 0.1, fill: false }] }, /* Updated borderColor */
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0 } } }
        });
        this.lifespanChart = new Chart(document.getElementById('lifespanChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Avg Lifespan (frames)', data: this.lifespanData, borderColor: '#b88b4a', tension: 0.1, fill: false }] }, /* Updated borderColor */
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0 } } }
        });
        this.biomePreferenceChart = new Chart(document.getElementById('biomePreferenceChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Avg Biome Preference Index', data: this.biomePreferenceData, borderColor: '#6200EE', tension: 0.1, fill: false }] }, /* Updated borderColor */
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: BIOME_TYPES.length - 1, stepSize: 1 } } }
        });
        // New chart instances
        this.attackPowerChart = new Chart(document.getElementById('attackPowerChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Average Attack Power', data: this.attackPowerData, borderColor: '#FF5722', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0 } } }
        });
        this.defenseChart = new Chart(document.getElementById('defenseChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Average Defense', data: this.defenseData, borderColor: '#1E88E5', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0 } } }
        });
        this.metabolismChart = new Chart(document.getElementById('metabolismChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Average Metabolism Rate', data: this.metabolismData, borderColor: '#8BC34A', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: 0.1 } } }
        });
        this.clutchSizeChart = new Chart(document.getElementById('clutchSizeChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Average Clutch Size', data: this.clutchSizeData, borderColor: '#9C27B0', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: SIM_CONFIG.CLUTCH_SIZE_MUTATION_STRENGTH * 5 } } }
        });
        this.sensoryRangeChart = new Chart(document.getElementById('sensoryRangeChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Average Sensory Range', data: this.sensoryRangeData, borderColor: '#00BCD4', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: 150 } } }
        });
        this.optimalTemperatureChart = new Chart(document.getElementById('optimalTemperatureChart'), {
            type: 'line', data: { labels: this.generationLabels, datasets: [{ label: 'Average Optimal Temperature', data: this.optimalTemperatureData, borderColor: '#FFEB3B', tension: 0.1, fill: false }] },
            options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: 1 } } }
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
        // Destroy new chart instances
        if (this.attackPowerChart) this.attackPowerChart.destroy();
        if (this.defenseChart) this.defenseChart.destroy();
        if (this.metabolismChart) this.metabolismChart.destroy();
        if (this.clutchSizeChart) this.clutchSizeChart.destroy();
        if (this.sensoryRangeChart) this.sensoryRangeChart.destroy();
        if (this.optimalTemperatureChart) this.optimalTemperatureChart.destroy();


        this.fitnessChart = null;
        this.populationChart = null;
        this.speedChart = null;
        this.sizeChart = null;
        this.foodEatenChart = null;
        this.visionRangeChart = null;
        this.lifespanChart = null;
        this.biomePreferenceChart = null;
        // Nullify new chart instances
        this.attackPowerChart = null;
        this.defenseChart = null;
        this.metabolismChart = null;
        this.clutchSizeChart = null;
        this.sensoryRangeChart = null;
        this.optimalTemperatureChart = null;
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
        // Clear new chart data arrays
        this.attackPowerData = [];
        this.defenseData = [];
        this.metabolismData = [];
        this.clutchSizeData = [];
        this.sensoryRangeData = [];
        this.optimalTemperatureData = [];
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
        // New totals for new traits
        let totalAttackPower = 0;
        let totalDefense = 0;
        let totalMetabolism = 0;
        let totalClutchSize = 0;
        let totalSensoryRange = 0;
        let totalOptimalTemperature = 0;

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
                // Sum new traits
                totalAttackPower += creature.attackPower;
                totalDefense += creature.defense;
                totalMetabolism += creature.metabolismRate;
                totalClutchSize += creature.clutchSize;
                totalSensoryRange += creature.sensoryRange;
                totalOptimalTemperature += creature.optimalTemperature;

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
            // Push new average traits
            this.attackPowerData.push(totalAttackPower / aliveCreaturesCount);
            this.defenseData.push(totalDefense / aliveCreaturesCount);
            this.metabolismData.push(totalMetabolism / aliveCreaturesCount);
            this.clutchSizeData.push(totalClutchSize / aliveCreaturesCount);
            this.sensoryRangeData.push(totalSensoryRange / aliveCreaturesCount);
            this.optimalTemperatureData.push(totalOptimalTemperature / aliveCreaturesCount);
        } else {
            // If no creatures are alive, push 0 for averages
            this.speedData.push(0);
            this.sizeData.push(0);
            this.foodEatenData.push(0);
            this.visionRangeData.push(0);
            this.lifespanData.push(0);
            this.biomePreferenceData.push(0);
            // Push 0 for new averages
            this.attackPowerData.push(0);
            this.defenseData.push(0);
            this.metabolismData.push(0);
            this.clutchSizeData.push(0);
            this.sensoryRangeData.push(0);
            this.optimalTemperatureData.push(0);
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
            // Shift new chart data
            this.attackPowerData.shift();
            this.defenseData.shift();
            this.metabolismData.shift();
            this.clutchSizeData.shift();
            this.sensoryRangeData.shift();
            this.optimalTemperatureData.shift();
        }

        this.fitnessChart.update();
        this.populationChart.update();
        this.speedChart.update();
        this.sizeChart.update();
        this.foodEatenChart.update();
        this.visionRangeChart.update();
        this.lifespanChart.update();
        this.biomePreferenceChart.update();
        // Update new charts
        this.attackPowerChart.update();
        this.defenseChart.update();
        this.metabolismChart.update();
        this.clutchSizeChart.update();
        this.sensoryRangeChart.update();
        this.optimalTemperatureChart.update();
    }
};
