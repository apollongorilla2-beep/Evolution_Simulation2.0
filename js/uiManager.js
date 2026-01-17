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
    toggleFoodButton: document.getElementById('toggleFoodButton'),
    toggleBiomesButton: document.getElementById('toggleBiomesButton'),
    brainDisplays: [
        { container: document.getElementById('brainDisplay1'), title: document.querySelector('#brainDisplay1 h4'), canvas: document.querySelector('#brainDisplay1 .brain-canvas') },
        { container: document.getElementById('brainDisplay2'), title: document.querySelector('#brainDisplay2 h4'), canvas: document.querySelector('#brainDisplay2 .brain-canvas') },
        { container: document.getElementById('brainDisplay3'), title: document.querySelector('#brainDisplay3 h4'), canvas: document.querySelector('#brainDisplay3 .brain-canvas') },
    ],
    brainContexts: [],

    /**
     * Initializes the UI elements and their contexts.
     */
    init() {
        this.brainContexts = this.brainDisplays.map(bd => bd.canvas.getContext('2d'));
        // Set max for biome preference slider
        if (this.initialBiomePreferenceSlider) {
            this.initialBiomePreferenceSlider.max = BIOME_TYPES.length - 1;
        }
    },

    /**
     * Updates the generation count displayed in the UI.
     * @param {number} count - The current generation number.
     */
    updateGenerationCount(count) {
        this.generationCountSpan.textContent = count;
    },

    /**
     * Updates the alive population count displayed in the UI.
     * @param {number} count - The number of alive creatures.
     */
    updatePopulationCount(count) {
        this.populationCountSpan.textContent = count;
    },

    /**
     * Updates the generation progress displayed in the UI.
     * @param {number} progress - The progress percentage (0-100).
     */
    updateGenerationProgress(progress) {
        this.generationProgressSpan.textContent = `\${progress}%`;
    },

    /**
     * Updates the displayed reset mode.
     * @param {string} modeText - Text describing the current reset mode.
     */
    updateResetMode(modeText) {
        this.resetModeSpan.textContent = modeText;
    },

    /**
     * Updates the displayed value for a given slider.
     * @param {HTMLElement} valueSpan - The span element displaying the value.
     * @param {number} value - The new value.
     * @param {string} [suffix=''] - Optional suffix for the value (e.g., 'FPS', 's').
     */
    updateSliderValue(valueSpan, value, suffix = '') {
        valueSpan.textContent = value + suffix;
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
            ctx.fillStyle = '#e0e0e0';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(inputLabels[i], x - nodeRadius - 5, y + 3);
        }

        // Draw hidden nodes
        for (let i = 0; i < hiddenNodes; i++) {
            const x = horizontalSpacing * 2;
            const y = (i + 1) * hiddenYStep;
