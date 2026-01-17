import { SIM_CONFIG, BIOME_TYPES } from './constants.js'; // Import BIOME_TYPES
import { clamp } from './utils.js';
import { NeuralNetwork } from './neuralNetwork.js'; // Import NeuralNetwork for type hinting

export const UIManager = {
    // UI Elements
    generationCountSpan: document.getElementById('generationCount'),
    populationCountSpan: document.getElementById('populationCount'),
    generationProgressSpan: document.getElementById('generationProgress'),
    resetModeSpan: document.getElementById('resetMode'),
    resetButton: document.getElementById('resetButton'),
    togglePauseButton: document.getElementById('togglePauseButton'),
    majorityMaxAgeButton: document.getElementById('majorityMaxAgeButton'),
    reset1sButton: document.getElementById('reset1sButton'),
    reset3sButton: document.getElementById('reset3sButton'),
    reset5sButton: document.getElementById('reset5sButton'),
    reset10sButton: document.getElementById('reset10sButton'),
    animationSpeedSlider: document.getElementById('animationSpeedSlider'),
    animationSpeedValue: document.getElementById('animationSpeedValue'),
    mutationRateSlider: document.getElementById('mutationRateSlider'),
    mutationRateValue: document.getElementById('mutationRateValue'),
    mutationStrengthSlider: document.getElementById('mutationStrengthSlider'),
    mutationStrengthValue: document.getElementById('mutationStrengthValue'),
    foodCountSlider: document.getElementById('foodCountSlider'),
    foodCountValue: document.getElementById('foodCountValue'),
    initialLifespanSlider: document.getElementById('initialLifespanSlider'), // New slider
    initialLifespanValue: document.getElementById('initialLifespanValue'),   // New span
    visionRangeSlider: document.getElementById('visionRangeSlider'),
    visionRangeValue: document.getElementById('visionRangeValue'),
    initialBiomePreferenceSlider: document.getElementById('initialBiomePreferenceSlider'), // New slider
    initialBiomePreferenceValue: document.getElementById('initialBiomePreferenceValue'),   // New span

    // New slider elements
    initialDietTypeSlider: document.getElementById('initialDietTypeSlider'),
    initialDietTypeValue: document.getElementById('initialDietTypeValue'),
    initialAttackPowerSlider: document.getElementById('initialAttackPowerSlider'),
    initialAttackPowerValue: document.getElementById('initialAttackPowerValue'),
    initialDefenseSlider: document.getElementById('initialDefenseSlider'),
    initialDefenseValue: document.getElementById('initialDefenseValue'),
    initialMetabolismSlider: document.getElementById('initialMetabolismSlider'),
    initialMetabolismValue: document.getElementById('initialMetabolismValue'),
    initialReproductionCooldownSlider: document.getElementById('initialReproductionCooldownSlider'),
    initialReproductionCooldownValue: document.getElementById('initialReproductionCooldownValue'),
    initialClutchSizeSlider: document.getElementById('initialClutchSizeSlider'),
    initialClutchSizeValue: document.getElementById('initialClutchSizeValue'),
    initialScentHearingRangeSlider: document.getElementById('initialScentHearingRangeSlider'),
    initialScentHearingRangeValue: document.getElementById('initialScentHearingRangeValue'),
    // Note: Optimal Temperature slider is not added to UI, it's an internal trait for now.

    toggleFoodButton: document.getElementById('toggleFoodButton'),
    toggleBiomesButton: document.getElementById('toggleBiomesButton'),
    toggleHealthBarsButton: document.getElementById('toggleHealthBarsButton'), // New button

    brainDisplays: [
        { container: document.getElementById('brainDisplay1'), title: document.querySelector('#brainDisplay1 h4'), canvas: document.querySelector('#brainDisplay1 .brain-canvas') },
        { container: document.getElementById('brainDisplay2'), title: document.querySelector('#brainDisplay2 h4'), canvas: document.querySelector('#brainDisplay2 .brain-canvas') },
        { container: document.getElementById('brainDisplay3'), title: document.querySelector('#brainDisplay3 h4'), canvas: document.querySelector('#brainDisplay3 .brain-canvas') },
    ],
    brainContexts: [],

    creatureInfoPanel: document.getElementById('creatureInfoPanel'), // New info panel
    closeInfoPanelButton: document.getElementById('closeInfoPanelButton'), // New close button for panel

    miniMapCanvas: document.getElementById('miniMapCanvas'), // New mini-map canvas
    miniMapCtx: null,

    // New: Overlay stats elements
    overlayGenerationCount: document.getElementById('overlayGenerationCount'),
    overlayPopulationCount: document.getElementById('overlayPopulationCount'),
    overlayGenerationProgress: document.getElementById('overlayGenerationProgress'),
    overlayCurrentTemperature: document.getElementById('overlayCurrentTemperature'),


    /**
     * Initializes the UI elements and their contexts.
     */
    init() {
        this.brainContexts = this.brainDisplays.map(bd => bd.canvas.getContext('2d'));
        if (this.miniMapCanvas) {
            this.miniMapCtx = this.miniMapCanvas.getContext('2d');
        }

        // Set max for biome preference slider
        if (this.initialBiomePreferenceSlider) {
            this.initialBiomePreferenceSlider.max = BIOME_TYPES.length - 1;
        }

        // Attach event listener for closing info panel
        if (this.closeInfoPanelButton) {
            this.closeInfoPanelButton.addEventListener('click', () => {
                this.hideCreatureInfo();
            });
        }
    },

    /**
     * Updates the generation count displayed in the UI.
     * @param {number} count - The current generation number.
     */
    updateGenerationCount(count) {
        if (this.generationCountSpan) this.generationCountSpan.textContent = count;
        if (this.overlayGenerationCount) this.overlayGenerationCount.textContent = count; // Update overlay
    },

    /**
     * Updates the alive population count displayed in the UI.
     * @param {number} count - The number of alive creatures.
     */
    updatePopulationCount(count) {
        if (this.populationCountSpan) this.populationCountSpan.textContent = count;
        if (this.overlayPopulationCount) this.overlayPopulationCount.textContent = count; // Update overlay
    },

    /**
     * Updates the generation progress displayed in the UI.
     * @param {number} progress - The progress percentage (0-100).
     */
    updateGenerationProgress(progress) {
        if (this.generationProgressSpan) this.generationProgressSpan.textContent = `${progress}%`;
        if (this.overlayGenerationProgress) this.overlayGenerationProgress.textContent = `${progress}%`; // Update overlay
    },

    /**
     * New: Updates the current world temperature in the overlay.
     * @param {number} temperature - The normalized current world temperature.
     */
    updateCurrentTemperature(temperature) {
        if (this.overlayCurrentTemperature) this.overlayCurrentTemperature.textContent = temperature.toFixed(2);
    },

    /**
     * Updates the displayed reset mode.
     * @param {string} modeText - Text describing the current reset mode.
     */
    updateResetMode(modeText) {
        if (this.resetModeSpan) this.resetModeSpan.textContent = modeText;
    },

    /**
     * Updates the displayed value for a given slider.
     * @param {HTMLElement} valueSpan - The span element displaying the value.
     * @param {number} value - The new value.
     * @param {string} [suffix=''] - Optional suffix for the value (e.g., 'FPS', 's').
     */
    updateSliderValue(valueSpan, value, suffix = '') {
        if (valueSpan) valueSpan.textContent = value + suffix;
    },

    /**
     * Draws a neural network visualization on a given canvas context.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     * @param {NeuralNetwork} brain - The neural network to draw.
     * @param {string[]} inputLabels - Labels for input nodes.
     * @param {string[]} outputLabels - Labels for output nodes.
     */
    drawNeuralNetwork(ctx, brain, inputLabels, outputLabels) {
        if (!ctx) return;

        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#2a2a4a'; /* Matches simulation canvas background */
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const nodeRadius = 8;
        const horizontalSpacing = canvasWidth / 4;

        const inputNodes = brain.inputNodes;
        const hiddenNodes = brain.hiddenNodes;
        const outputNodes = brain.outputNodes;

        const inputYStep = canvasHeight / (inputNodes + 1);
        const hiddenYStep = canvasHeight / (hiddenNodes + 1);
        const outputYStep = canvasHeight / (outputNodes + 1);

        const nodes = { input: [], hidden: [], output: [] };

        // Draw input nodes
        for (let i = 0; i < inputNodes; i++) {
            const x = horizontalSpacing;
            const y = (i + 1) * inputYStep;
            nodes.input.push({ x, y });
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#BB86FC'; /* Light purple for input nodes */
            ctx.fill();
            ctx.strokeStyle = '#555';
            ctx.stroke();
            ctx.fillStyle = 'white'; // Changed to white for readability
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(inputLabels[i], x - nodeRadius - 5, y + 3);
        }

        // Draw hidden nodes
        for (let i = 0; i < hiddenNodes; i++) {
            const x = horizontalSpacing * 2;
            const y = (i + 1) * hiddenYStep;
            nodes.hidden.push({ x, y });
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#03DAC6'; /* Teal for hidden nodes */
            ctx.fill();
            ctx.strokeStyle = '#555';
            ctx.stroke();
        }

        // Draw output nodes
        for (let i = 0; i < outputNodes; i++) {
            const x = horizontalSpacing * 3;
            const y = (i + 1) * outputYStep;
            nodes.output.push({ x, y });
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFC107'; /* Orange for output nodes */
            ctx.fill();
            ctx.strokeStyle = '#555';
            ctx.stroke();
            ctx.fillStyle = 'white'; // Changed to white for readability
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(outputLabels[i], x + nodeRadius + 5, y + 3);
        }

        // Draw connections (weights) from input to hidden layer
        for (let i = 0; i < inputNodes; i++) {
            for (let j = 0; j < hiddenNodes; j++) {
                const weight = brain.weights_ih[i][j];
                ctx.beginPath();
                ctx.moveTo(nodes.input[i].x, nodes.input[i].y);
                ctx.lineTo(nodes.hidden[j].x, nodes.hidden[j].y);
                ctx.strokeStyle = weight > 0 ? `rgba(0, 255, 0, ${clamp(Math.abs(weight / 2), 0, 1)})` : `rgba(255, 0, 0, ${clamp(Math.abs(weight / 2), 0, 1)})`;
                ctx.lineWidth = Math.abs(weight) * 1.5;
                ctx.stroke();
            }
        }

        // Draw connections (weights) from hidden to output layer
        for (let i = 0; i < hiddenNodes; i++) {
            for (let j = 0; j < outputNodes; j++) {
                const weight = brain.weights_ho[i][j];
                ctx.beginPath();
                ctx.moveTo(nodes.hidden[i].x, nodes.hidden[i].y);
                ctx.lineTo(nodes.output[j].x, nodes.output[j].y);
                ctx.strokeStyle = weight > 0 ? `rgba(0, 255, 0, ${clamp(Math.abs(weight / 2), 0, 1)})` : `rgba(255, 0, 0, ${clamp(Math.abs(weight / 2), 0, 1)})`;
                ctx.lineWidth = Math.abs(weight) * 1.5;
                ctx.stroke();
            }
        }
    },

    /**
     * Updates the displayed neural networks for the top 3 creatures.
     * @param {Creature[]} creatures - Array of all creatures in the current generation.
     */
    updateBrainDisplays(creatures) {
        // Sort creatures by current food eaten count for display
        const sortedCreaturesForDisplay = [...creatures].sort((a, b) => b.foodEatenCount - a.foodEatenCount);

        // Updated input labels to reflect new NN inputs
        const inputLabels = [
            "F Angle", "F Dist", "Energy", "Wall X", "Wall Y",
            "Biome", "Vision", "Crt Angle", "Crt Dist", "Biome Pref",
            "Lifespan", "Diet Type", "Sensory Dist", "Curr Temp", "Hazard"
        ];
        const outputLabels = ["Turn Rate", "Speed Adj"];

        for (let i = 0; i < 3; i++) {
            const display = this.brainDisplays[i];
            const creature = sortedCreaturesForDisplay[i];

            if (creature) {
                const colorBox = display.title.querySelector('.color-box');
                colorBox.style.backgroundColor = creature.originalColor; // Show original color
                display.title.innerHTML = `Creature ${i + 1} <span class="color-box" style="background-color: ${creature.originalColor};"></span>`;

                this.drawNeuralNetwork(this.brainContexts[i], creature.brain, inputLabels, outputLabels);
            } else {
                const colorBox = display.title.querySelector('.color-box');
                colorBox.style.backgroundColor = 'gray';
                display.title.innerHTML = `Creature ${i + 1} <span class="color-box" style="background-color: gray;"></span>`;
                if (this.brainContexts[i]) {
                    this.brainContexts[i].clearRect(0, 0, display.canvas.width, display.canvas.height);
                    this.brainContexts[i].fillStyle = '#2a2a4a';
                    this.brainContexts[i].fillRect(0, 0, display.canvas.width, display.canvas.height);
                }
            }
        }
    },

    /**
     * Displays detailed information about a clicked creature.
     * @param {Creature} creature - The creature to display.
     * @param {number[][]} biomeMap - The current biome map.
     */
    showCreatureInfo(creature, biomeMap) {
        if (!this.creatureInfoPanel) return;

        // Populate basic info
        document.getElementById('infoCreatureId').textContent = creature.id;
        document.getElementById('infoCreatureStatus').textContent = creature.isAlive ? 'Alive' : 'Dead';
        document.getElementById('infoCreatureAge').textContent = Math.round(creature.age);
        document.getElementById('infoCreatureLifespan').textContent = Math.round(creature.lifespan);
        document.getElementById('infoCreatureEnergy').textContent = Math.round(creature.energy);
        document.getElementById('infoCreatureFoodEaten').textContent = creature.foodEatenCount;
        document.getElementById('infoCreatureColor').style.backgroundColor = creature.originalColor;

        // Populate genetic traits
        document.getElementById('infoCreatureSpeed').textContent = creature.speed.toFixed(2);
        document.getElementById('infoCreatureSize').textContent = creature.size.toFixed(2);
        document.getElementById('infoCreatureVision').textContent = Math.round(creature.visionRange);
        document.getElementById('infoCreatureBiomePref').textContent = BIOME_TYPES[creature.biomePreference].type;
        document.getElementById('infoCreatureDiet').textContent = creature.dietType === 0 ? 'Herbivore' : 'Carnivore';
        document.getElementById('infoCreatureAttack').textContent = creature.attackPower.toFixed(1);
        document.getElementById('infoCreatureDefense').textContent = creature.defense.toFixed(1);
        document.getElementById('infoCreatureMetabolism').textContent = creature.metabolismRate.toFixed(3);
        document.getElementById('infoCreatureReproCooldown').textContent = Math.round(creature.reproductionCooldown);
        document.getElementById('infoCreatureClutchSize').textContent = creature.clutchSize;
        document.getElementById('infoCreatureSensoryRange').textContent = Math.round(creature.sensoryRange);
        document.getElementById('infoCreatureOptimalTemp').textContent = creature.optimalTemperature.toFixed(2);


        this.creatureInfoPanel.classList.remove('hidden');
    },

    /**
     * Hides the creature information panel.
     */
    hideCreatureInfo() {
        if (this.creatureInfoPanel) {
            this.creatureInfoPanel.classList.add('hidden');
        }
    },

    /**
     * Draws the mini-map.
     * @param {Creature[]} creatures - Array of all creatures.
     * @param {number[][]} biomeMap - The biome map.
     */
    drawMiniMap(creatures, biomeMap) {
        if (!this.miniMapCtx) return;

        const mapWidth = this.miniMapCanvas.width;
        const mapHeight = this.miniMapCanvas.height;
        this.miniMapCtx.clearRect(0, 0, mapWidth, mapHeight);

        // Scale factors
        const scaleX = mapWidth / SIM_CONFIG.WORLD_WIDTH;
        const scaleY = mapHeight / SIM_CONFIG.WORLD_HEIGHT;

        // Draw biomes on mini-map
        const cellWidth = mapWidth / SIM_CONFIG.BIOME_GRID_X;
        const cellHeight = mapHeight / SIM_CONFIG.BIOME_GRID_Y;
        for (let y = 0; y < SIM_CONFIG.BIOME_GRID_Y; y++) {
            for (let x = 0; x < SIM_CONFIG.BIOME_GRID_X; x++) {
                const biomeType = BIOME_TYPES[biomeMap[y][x]];
                this.miniMapCtx.fillStyle = biomeType.color;
                this.miniMapCtx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            }
        }

        // Draw creatures on mini-map
        for (const creature of creatures) {
            if (creature.isAlive) {
                this.miniMapCtx.beginPath();
                this.miniMapCtx.arc(creature.x * scaleX, creature.y * scaleY, 2, 0, Math.PI * 2); // Small dot for creature
                this.miniMapCtx.fillStyle = creature.originalColor;
                this.miniMapCtx.fill();
            }
        }
    }
};
