import { SIM_CONFIG, BIOME_TYPES } from './constants.js';
import { clamp } from './utils.js';
import { NeuralNetwork } from './neuralNetwork.js';
import { Food } from './food.js';
import { Creature } from './creature.js';
import { ChartManager } from './chartManager.js';
import { UIManager } from './uiManager.js';

export class Simulation {
    constructor() {
        this.canvas = document.getElementById('evolutionCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.food = [];
        this.creatures = [];
        this.simulationFrameCount = 0;
        this.currentGenerationNumber = 0;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.msPerFrame = 1000 / 60; // Initial FPS, will be updated by slider

        this.currentGenerationEndMode = 'majorityMaxAge'; // 'majorityMaxAge' or 'fixedTime'
        this.fixedTimeGenerationLengthMs = 0;
        this.lastGenerationStartTime = performance.now();
        this.isPaused = false; // New: Pause state
        this.showHealthBars = false; // New: Toggle for health bars

        this.showFood = true;
        this.showBiomes = true;
        this.biomeMap = [];
        this.currentWorldTemperature = 0.5; // New: Global world temperature (normalized 0-1)

        // Tunable parameters (linked to sliders, initialized from SIM_CONFIG defaults)
        this.mutationRate = parseFloat(UIManager.mutationRateSlider.value);
        this.mutationStrength = parseFloat(UIManager.mutationStrengthSlider.value);
        this.foodCount = parseInt(UIManager.foodCountSlider.value);
        this.initialLifespanSeconds = parseInt(UIManager.initialLifespanSlider.value);
        this.maxAgeFrames = this.initialLifespanSeconds * 60;
        this.animationFps = parseInt(UIManager.animationSpeedSlider.value);
        this.visionRange = parseInt(UIManager.visionRangeSlider.value);
        this.initialBiomePreference = parseInt(UIManager.initialBiomePreferenceSlider.value);

        // New slider values
        this.initialDietType = parseInt(UIManager.initialDietTypeSlider.value);
        this.initialAttackPower = parseInt(UIManager.initialAttackPowerSlider.value);
        this.initialDefense = parseInt(UIManager.initialDefenseSlider.value);
        this.initialMetabolismRate = parseFloat(UIManager.initialMetabolismSlider.value);
        this.initialReproductionCooldown = parseInt(UIManager.initialReproductionCooldownSlider.value);
        this.initialClutchSize = parseInt(UIManager.initialClutchSizeSlider.value);
        this.initialSensoryRange = parseInt(UIManager.initialScentHearingRangeSlider.value);
        // Note: Initial Optimal Temperature is not a slider, it's a genetic trait.

        UIManager.init();
        this.addEventListeners();
        this.initSimulation();
    }

    /**
     * Adds event listeners for UI controls.
     */
    addEventListeners() {
        UIManager.resetButton.addEventListener('click', () => this.initSimulation());
        UIManager.togglePauseButton.addEventListener('click', () => this.togglePause());
        UIManager.majorityMaxAgeButton.addEventListener('click', () => this.setMajorityMaxAgeMode());
        UIManager.reset1sButton.addEventListener('click', () => this.setFixedTimeGeneration(1));
        UIManager.reset3sButton.addEventListener('click', () => this.setFixedTimeGeneration(3));
        UIManager.reset5sButton.addEventListener('click', () => this.setFixedTimeGeneration(5));
        UIManager.reset10sButton.addEventListener('click', () => this.setFixedTimeGeneration(10));

        UIManager.animationSpeedSlider.addEventListener('input', (e) => {
            this.animationFps = parseInt(e.target.value);
            UIManager.updateSliderValue(UIManager.animationSpeedValue, this.animationFps, ' FPS');
            this.msPerFrame = 1000 / this.animationFps;
        });
        UIManager.mutationRateSlider.addEventListener('input', (e) => {
            this.mutationRate = parseFloat(e.target.value);
            UIManager.updateSliderValue(UIManager.mutationRateValue, this.mutationRate);
        });
        UIManager.mutationStrengthSlider.addEventListener('input', (e) => {
            this.mutationStrength = parseFloat(e.target.value);
            UIManager.updateSliderValue(UIManager.mutationStrengthValue, this.mutationStrength);
        });
        UIManager.foodCountSlider.addEventListener('input', (e) => {
            this.foodCount = parseInt(e.target.value);
            UIManager.updateSliderValue(UIManager.foodCountValue, this.foodCount);
        });
        UIManager.initialLifespanSlider.addEventListener('input', (e) => {
            this.initialLifespanSeconds = parseInt(e.target.value);
            this.maxAgeFrames = this.initialLifespanSeconds * 60;
            UIManager.updateSliderValue(UIManager.initialLifespanValue, this.initialLifespanSeconds, 's');
        });
        UIManager.visionRangeSlider.addEventListener('input', (e) => {
            this.visionRange = parseInt(e.target.value);
            UIManager.updateSliderValue(UIManager.visionRangeValue, this.visionRange, 'px');
        });
        UIManager.initialBiomePreferenceSlider.addEventListener('input', (e) => {
            this.initialBiomePreference = parseInt(e.target.value);
            UIManager.updateSliderValue(UIManager.initialBiomePreferenceValue, this.initialBiomePreference);
        });

        // New slider event listeners
        UIManager.initialDietTypeSlider.addEventListener('input', (e) => {
            this.initialDietType = parseInt(e.target.value);
            UIManager.updateSliderValue(UIManager.initialDietTypeValue, this.initialDietType);
        });
        UIManager.initialAttackPowerSlider.addEventListener('input', (e) => {
            this.initialAttackPower = parseInt(e.target.value);
            UIManager.updateSliderValue(UIManager.initialAttackPowerValue, this.initialAttackPower);
        });
        UIManager.initialDefenseSlider.addEventListener('input', (e) => {
            this.initialDefense = parseInt(e.target.value);
            UIManager.updateSliderValue(UIManager.initialDefenseValue, this.initialDefense);
        });
        UIManager.initialMetabolismSlider.addEventListener('input', (e) => {
            this.initialMetabolismRate = parseFloat(e.target.value);
            UIManager.updateSliderValue(UIManager.initialMetabolismValue, this.initialMetabolismRate);
        });
        UIManager.initialReproductionCooldownSlider.addEventListener('input', (e) => {
            this.initialReproductionCooldown = parseInt(e.target.value);
            UIManager.updateSliderValue(UIManager.initialReproductionCooldownValue, this.initialReproductionCooldown, 'f');
        });
        UIManager.initialClutchSizeSlider.addEventListener('input', (e) => {
            this.initialClutchSize = parseInt(e.target.value);
            UIManager.updateSliderValue(UIManager.initialClutchSizeValue, this.initialClutchSize);
        });
        UIManager.initialScentHearingRangeSlider.addEventListener('input', (e) => {
            this.initialSensoryRange = parseInt(e.target.value);
            UIManager.updateSliderValue(UIManager.initialScentHearingRangeValue, this.initialSensoryRange, 'px');
        });

        UIManager.toggleFoodButton.addEventListener('click', () => {
            this.showFood = !this.showFood;
            UIManager.toggleFoodButton.textContent = this.showFood ? 'Hide Food' : 'Show Food';
        });
        UIManager.toggleBiomesButton.addEventListener('click', () => {
            this.showBiomes = !this.showBiomes;
            UIManager.toggleBiomesButton.textContent = this.showBiomes ? 'Hide Biomes' : 'Show Biomes';
        });
        UIManager.toggleHealthBarsButton.addEventListener('click', () => { // New button event listener
            this.showHealthBars = !this.showHealthBars;
            UIManager.toggleHealthBarsButton.textContent = this.showHealthBars ? 'Hide Health Bars' : 'Show Health Bars';
        });

        // New: Event listener for clicking on the main canvas
        this.canvas.addEventListener('click', (e) => {
            if (this.isPaused) { // Only allow creature inspection when paused
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                for (const creature of this.creatures) {
                    const dist = Math.sqrt((mouseX - creature.x)**2 + (mouseY - creature.y)**2);
                    if (dist < creature.size) { // Clicked on a creature
                        UIManager.showCreatureInfo(creature, this.biomeMap);
                        return;
                    }
                }
                UIManager.hideCreatureInfo(); // Hide if no creature clicked
            }
        });
    }

    /**
     * Toggles the simulation's paused state.
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        UIManager.togglePauseButton.textContent = this.isPaused ? 'Resume Simulation' : 'Pause Simulation';
        if (!this.isPaused) {
            // If resuming, reset lastFrameTime to prevent a large jump after being paused
            this.lastFrameTime = performance.now();
            this.gameLoop(this.lastFrameTime); // Immediately request a new frame
        } else {
            UIManager.hideCreatureInfo(); // Hide info panel if pausing
        }
    }

    /**
     * Sets the generation end mode to "Majority Max Age".
     */
    setMajorityMaxAgeMode() {
        this.currentGenerationEndMode = 'majorityMaxAge';
        UIManager.updateResetMode('Majority Max Age');
    }

    /**
     * Sets the generation end mode to a fixed time.
     * @param {number} seconds - The duration of the generation in seconds.
     */
    setFixedTimeGeneration(seconds) {
        this.currentGenerationEndMode = 'fixedTime';
        this.fixedTimeGenerationLengthMs = seconds * 1000;
        UIManager.updateResetMode(`${seconds}s Generation`);
        this.lastGenerationStartTime = performance.now();
    }

    /**
     * Generates a new random biome map.
     */
    generateBiomeMap() {
        this.biomeMap = [];
        const biomeTypesCount = BIOME_TYPES.length;
        for (let y = 0; y < SIM_CONFIG.BIOME_GRID_Y; y++) {
            this.biomeMap[y] = [];
            for (let x = 0; x < SIM_CONFIG.BIOME_GRID_X; x++) {
                this.biomeMap[y][x] = Math.floor(Math.random() * biomeTypesCount);
            }
        }
    }

    /**
     * Draws the biome grid on the canvas.
     */
    drawBiomes() {
        if (!this.showBiomes) return;

        const cellWidth = SIM_CONFIG.WORLD_WIDTH / SIM_CONFIG.BIOME_GRID_X;
        const cellHeight = SIM_CONFIG.WORLD_HEIGHT / SIM_CONFIG.BIOME_GRID_Y;
        for (let y = 0; y < SIM_CONFIG.BIOME_GRID_Y; y++) {
            for (let x = 0; x < SIM_CONFIG.BIOME_GRID_X; x++) {
                const biomeType = BIOME_TYPES[this.biomeMap[y][x]];
                this.ctx.fillStyle = biomeType.color;
                this.ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

                this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            }
        }
    }

    /**
     * Clears all food and spawns a new set.
     * @param {number} count - The number of food items to spawn.
     */
    resetAndSpawnAllFood(count) {
        this.food = [];
        this.spawnFood(count);
    }

    /**
     * Spawns a specified number of food items, preferring certain biomes.
     * @param {number} count - The number of food items to spawn.
     */
    spawnFood(count) {
        for (let i = 0; i < count; i++) {
            let randomX, randomY;
            let placed = false;
            let attempts = 0;
            const maxBiomeSpawnAttempts = 50;

            while (!placed && attempts < maxBiomeSpawnAttempts) {
                randomX = Math.random() * SIM_CONFIG.WORLD_WIDTH;
                randomY = Math.random() * SIM_CONFIG.WORLD_HEIGHT;
                const biomeX = Math.floor(randomX / (SIM_CONFIG.WORLD_WIDTH / SIM_CONFIG.BIOME_GRID_X));
                const biomeY = Math.floor(randomY / (SIM_CONFIG.WORLD_HEIGHT / SIM_CONFIG.BIOME_GRID_Y));
                const clampedX = clamp(biomeX, 0, SIM_CONFIG.BIOME_GRID_X - 1);
                const clampedY = clamp(biomeY, 0, SIM_CONFIG.BIOME_GRID_Y - 1);
                const biome = BIOME_TYPES[this.biomeMap[clampedY][clampedX]];

                if (Math.random() < biome.food_spawn_chance * SIM_CONFIG.FOOD_SPAWN_MULTIPLIER) {
                    // New: Randomize food energy value and toxicity
                    const energyValue = SIM_CONFIG.ENERGY_FROM_FOOD + (Math.random() - 0.5) * 50;
                    const isToxic = Math.random() < SIM_CONFIG.FOOD_TOXICITY_CHANCE;
                    this.food.push(new Food(randomX, randomY, 'plant', energyValue, isToxic)); // Default to 'plant'
                    placed = true;
                }
                attempts++;
            }

            if (!placed) { // If unable to place in a preferred biome after attempts, place anywhere
                const energyValue = SIM_CONFIG.ENERGY_FROM_FOOD + (Math.random() - 0.5) * 50;
                const isToxic = Math.random() < SIM_CONFIG.FOOD_TOXICITY_CHANCE;
                this.food.push(new Food(randomX, randomY, 'plant', energyValue, isToxic));
            }
        }
    }

    /**
     * Replenishes food gradually if the current count is below target.
     */
    replenishFoodGradually() {
        if (this.food.length < this.foodCount) {
            // Spawn a few food items per frame based on FOOD_SPAWN_RATE
            const foodToSpawn = Math.min(this.foodCount - this.food.length, Math.floor(SIM_CONFIG.FOOD_SPAWN_RATE));
            if (foodToSpawn > 0) {
                this.spawnFood(foodToSpawn);
            } else if (Math.random() < SIM_CONFIG.FOOD_SPAWN_RATE % 1) { // Handle fractional spawn rate
                this.spawnFood(1);
            }
        }
    }

    /**
     * Initializes the entire simulation.
     */
    initSimulation() {
        this.currentGenerationNumber = 0;
        ChartManager.clearData();
        ChartManager.initCharts();
        this.generateBiomeMap();
        UIManager.hideCreatureInfo(); // Hide info panel on new simulation

        const initialCreatures = Array(SIM_CONFIG.FIXED_POPULATION_SIZE).fill(null).map(() => new Creature({
            x: Math.random() * SIM_CONFIG.WORLD_WIDTH,
            y: Math.random() * SIM_CONFIG.WORLD_HEIGHT,
            color: null, // random color
            speed: SIM_CONFIG.BASE_SPEED + (Math.random() - 0.5), // initial varied speed
            size: SIM_CONFIG.CREATURE_BASE_RADIUS + (Math.random() - 0.5) * 2, // initial varied size
            brain: null, // new brain
            visionRange: this.visionRange + (Math.random() - 0.5) * 50, // initial varied vision range
            lifespan: this.initialLifespanSeconds * 60 + (Math.random() - 0.5) * 60 * 10, // Varied initial lifespan
            biomePreference: clamp(this.initialBiomePreference + Math.round((Math.random() - 0.5) * 2), 0, BIOME_TYPES.length - 1), // Varied initial biome preference
            // New initial traits
            dietType: this.initialDietType,
            attackPower: this.initialAttackPower + (Math.random() - 0.5) * 5,
            defense: this.initialDefense + (Math.random() - 0.5) * 3,
            metabolismRate: this.initialMetabolismRate + (Math.random() - 0.5) * 0.01,
            reproductionCooldown: this.initialReproductionCooldown + (Math.random() - 0.5) * 20,
            clutchSize: this.initialClutchSize + Math.round((Math.random() - 0.5)),
            sensoryRange: this.initialSensoryRange + (Math.random() - 0.5) * 20,
            optimalTemperature: SIM_CONFIG.INITIAL_OPTIMAL_TEMPERATURE + (Math.random() - 0.5) * 0.2, // Varied optimal temperature
        }));

        this.setMajorityMaxAgeMode(); // Set default reset mode
        this.startNewGeneration(initialCreatures);

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.lastFrameTime = 0;
        this.isPaused = false; // Ensure not paused on init
        UIManager.togglePauseButton.textContent = 'Pause Simulation'; // Reset pause button text
        UIManager.resetButton.textContent = 'Reset Simulation'; // Update reset button text
        this.gameLoop();
    }

    /**
     * Ends the current generation and prepares the next one.
     */
    endGenerationAndStartNewOne() {
        const allCreaturesInGeneration = [...this.creatures];

        // Calculate fitness for all creatures before updating charts or selecting parents
        for (const creature of allCreaturesInGeneration) {
            creature.fitness = creature.calculateFitness(this.biomeMap);
        }

        ChartManager.updateChartsData(allCreaturesInGeneration, this.currentGenerationNumber);

        // Sort creatures by fitness to select the fittest parents
        const sortedCreatures = [...allCreaturesInGeneration].sort((a, b) => b.fitness - a.fitness);

        const newGenerationCreatures = [];

        // --- Elitism: Carry over the top N fittest creatures ---
        const eliteCount = Math.floor(SIM_CONFIG.FIXED_POPULATION_SIZE * SIM_CONFIG.ELITE_PERCENTAGE);
        for (let i = 0; i < eliteCount; i++) {
            if (sortedCreatures[i]) {
                newGenerationCreatures.push(sortedCreatures[i].cloneForNextGeneration());
            }
        }

        // Select parents from the remaining fittest for crossover and mutation
        const numParentsForBreeding = Math.max(2, Math.floor(SIM_CONFIG.FIXED_POPULATION_SIZE * SIM_CONFIG.PARENT_SELECTION_PERCENTAGE));
        const parents = sortedCreatures.slice(0, numParentsForBreeding);

        if (parents.length < 2 || parents[0].fitness <= 0) {
            console.warn("Not enough fit creatures survived to reproduce! Starting a fresh, random population.");
            this.startNewGeneration(Array(SIM_CONFIG.FIXED_POPULATION_SIZE).fill(null).map(() => new Creature({
                x: Math.random() * SIM_CONFIG.WORLD_WIDTH,
                y: Math.random() * SIM_CONFIG.WORLD_HEIGHT,
            })));
            return;
        }

        // Fill the rest of the population through crossover and mutation
        while (newGenerationCreatures.length < SIM_CONFIG.FIXED_POPULATION_SIZE) {
            const parent1 = parents[Math.floor(Math.random() * parents.length)];
            let parent2 = parent1;
            // Ensure parent2 is different from parent1 for diversity in crossover
            while (parent2 === parent1) {
                parent2 = parents[Math.floor(Math.random() * parents.length)];
            }

            // Apply reproduction energy cost to parents
            parent1.energy -= SIM_CONFIG.REPRODUCTION_ENERGY_COST / 2;
            parent2.energy -= SIM_CONFIG.REPRODUCTION_ENERGY_COST / 2;
            // Ensure energy doesn't go below zero
            parent1.energy = Math.max(0, parent1.energy);
            parent2.energy = Math.max(0, parent2.energy);


            // Crossover brains
            const offspringBrain = NeuralNetwork.crossover(parent1.brain, parent2.brain);
            // Mutate offspring brain
            const mutatedOffspringBrain = offspringBrain.cloneAndMutate(offspringBrain, (parent1.fitness + parent2.fitness) / 2, this.mutationRate, this.mutationStrength);

            // Mutate physical and new genetic traits
            const offspringSpeed = parent1.speed + (Math.random() - 0.5) * this.mutationStrength;
            const offspringSize = parent1.size + (Math.random() - 0.5) * this.mutationStrength * 1.5;
            const offspringVisionRange = parent1.mutateVisionRange(parent1.visionRange, this.mutationRate, this.mutationStrength);
            const offspringLifespan = parent1.mutateLifespan(parent1.lifespan, this.mutationRate, this.mutationStrength);
            const offspringBiomePreference = parent1.mutateBiomePreference(parent1.biomePreference, this.mutationRate, this.mutationStrength);

            // New trait mutations
            const offspringDietType = parent1.mutateDietType(parent1.dietType, this.mutationRate);
            const offspringAttackPower = parent1.mutateAttackPower(parent1.attackPower, this.mutationRate, this.mutationStrength);
            const offspringDefense = parent1.mutateDefense(parent1.defense, this.mutationRate, this.mutationStrength);
            const offspringMetabolismRate = parent1.mutateMetabolismRate(parent1.metabolismRate, this.mutationRate, this.mutationStrength);
            const offspringReproductionCooldown = parent1.mutateReproductionCooldown(parent1.reproductionCooldown, this.mutationRate, this.mutationStrength);
            const offspringClutchSize = parent1.mutateClutchSize(parent1.clutchSize, this.mutationRate, this.mutationStrength);
            const offspringSensoryRange = parent1.mutateSensoryRange(parent1.sensoryRange, this.mutationRate, this.mutationStrength);
            const offspringOptimalTemperature = parent1.mutateOptimalTemperature(parent1.optimalTemperature, this.mutationRate, this.mutationStrength);


            newGenerationCreatures.push(new Creature({
                x: Math.random() * SIM_CONFIG.WORLD_WIDTH,
                y: Math.random() * SIM_CONFIG.WORLD_HEIGHT,
                color: parent1.mutateColor(parent1.originalColor, this.mutationRate, this.mutationStrength),
                speed: clamp(offspringSpeed, 0.5, SIM_CONFIG.BASE_SPEED * 2.5),
                size: clamp(offspringSize, 3, 15),
                brain: mutatedOffspringBrain,
                visionRange: clamp(offspringVisionRange, 50, 300),
                lifespan: offspringLifespan,
                biomePreference: offspringBiomePreference,
                // Pass new mutated traits
                dietType: offspringDietType,
                attackPower: offspringAttackPower,
                defense: offspringDefense,
                metabolismRate: offspringMetabolismRate,
                reproductionCooldown: offspringReproductionCooldown,
                clutchSize: offspringClutchSize,
                sensoryRange: offspringSensoryRange,
                optimalTemperature: offspringOptimalTemperature,
            }));
        }

        this.startNewGeneration(newGenerationCreatures);
    }

    /**
     * Starts a new generation with a given set of creatures.
     * @param {Creature[]} newCreatures - Array of creatures for the new generation.
     */
    startNewGeneration(newCreatures) {
        this.currentGenerationNumber++;
        this.simulationFrameCount = 0;
        this.lastGenerationStartTime = performance.now();

        this.creatures = newCreatures;
        this.resetAndSpawnAllFood(this.foodCount); // Reset food for new generation

        UIManager.updateGenerationCount(this.currentGenerationNumber);
        UIManager.updatePopulationCount(this.creatures.filter(c => c.isAlive).length);
        UIManager.updateGenerationProgress(0);
        UIManager.updateBrainDisplays(this.creatures);
    }

    /**
     * The main animation loop that calls update and draw.
     * @param {DOMHighResTimeStamp} timestamp - The current time provided by requestAnimationFrame.
     */
    gameLoop(timestamp) {
        if (!this.isPaused) { // Only update if not paused
            if (timestamp < this.lastFrameTime + this.msPerFrame) {
                this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
                return;
            }

            this.lastFrameTime = timestamp;

            this.update();
            this.draw();
        } else {
            // If paused, we still want to draw once to ensure the current state is visible
            // but we don't need to update the simulation logic.
            // The draw call is implicitly handled by the requestAnimationFrame loop
            // as long as the loop continues to run, even if update() is skipped.
            // We can explicitly call draw if we want to ensure a refresh, but usually not needed.
        }

        this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    /**
     * Updates the state of the simulation each frame.
     */
    update() {
        this.simulationFrameCount++;
        const currentTime = performance.now();

        // New: Simulate world temperature fluctuations (simple sine wave)
        this.currentWorldTemperature = 0.5 + Math.sin(this.simulationFrameCount * 0.01) * 0.4; // Ranges from 0.1 to 0.9

        let generationEnded = false;
        let aliveCreaturesThisFrame = 0;
        let maxAgeReachedCount = 0;

        for (let i = this.creatures.length - 1; i >= 0; i--) {
            const creature = this.creatures[i];
            if (creature.isAlive) {
                creature.update(this.biomeMap, this.food, this.creatures, this.mutationRate, this.mutationStrength, this.currentWorldTemperature); // Pass currentWorldTemperature

                // Collision detection for eating and combat
                for (let j = this.food.length - 1; j >= 0; j--) {
                    const f = this.food[j];
                    const dist = Math.sqrt((creature.x - f.x) ** 2 + (creature.y - f.y) ** 2);
                    if (dist < creature.size + f.radius + SIM_CONFIG.COLLISION_RADIUS_OFFSET) {
                        // Check if food type matches creature's diet
                        if ((creature.dietType === 0 && f.type === 'plant') || (creature.dietType === 1 && f.type === 'meat')) {
                             creature.eat(j, this.food, this.biomeMap);
                             break;
                        }
                    }
                }

                // New: Combat logic (only for carnivores)
                if (creature.dietType === 1 && creature.energy > SIM_CONFIG.COMBAT_ENERGY_COST * 2) { // Only attack if enough energy
                    for (let k = this.creatures.length - 1; k >= 0; k--) {
                        const otherCreature = this.creatures[k];
                        if (creature !== otherCreature && otherCreature.isAlive && otherCreature.dietType !== 1) { // Carnivore attacks non-carnivore
                            const combatHappened = creature.engageCombat(otherCreature);
                            if (combatHappened) {
                                // If target died, it will be removed in the next filter pass
                                break; // Only one combat per creature per frame for simplicity
                            }
                        }
                    }
                }

                // New: Mating logic (if two creatures are close and both have enough energy and off cooldown)
                if (creature.currentReproductionCooldown <= 0 && creature.energy >= SIM_CONFIG.REPRODUCTION_THRESHOLD) {
                    for (let k = i + 1; k < this.creatures.length; k++) { // Check only creatures after current to avoid double counting
                        const mate = this.creatures[k];
                        if (mate.isAlive && mate.currentReproductionCooldown <= 0 && mate.energy >= SIM_CONFIG.REPRODUCTION_THRESHOLD) {
                            const dist = Math.sqrt((creature.x - mate.x)**2 + (creature.y - mate.y)**2);
                            if (dist < SIM_CONFIG.MATING_RANGE) {
                                // Both creatures mate, reproduction happens in endGenerationAndStartNewOne
                                // For now, just reset cooldowns and mark energy cost
                                creature.currentReproductionCooldown = creature.reproductionCooldown;
                                mate.currentReproductionCooldown = mate.reproductionCooldown;
                                creature.energy -= SIM_CONFIG.REPRODUCTION_ENERGY_COST / 2;
                                mate.energy -= SIM_CONFIG.REPRODUCTION_ENERGY_COST / 2;
                                creature.energy = Math.max(0, creature.energy);
                                mate.energy = Math.max(0, mate.energy);
                                break; // Only one mating per creature per frame for simplicity
                            }
                        }
                    }
                }


                if (creature.isAlive) {
                    aliveCreaturesThisFrame++;
                }
            } else {
                maxAgeReachedCount++;
                // New: If a creature dies, spawn meat at its location
                if (creature.energy <= 0) { // Ensure it's not just old age, but energy depletion
                    this.food.push(new Food(creature.x, creature.y, 'meat', SIM_CONFIG.MEAT_FROM_DEAD_CREATURE));
                }
            }
        }

        // Remove dead creatures
        this.creatures = this.creatures.filter(c => c.isAlive);

        this.replenishFoodGradually(); // Call the new gradual food spawning

        UIManager.updatePopulationCount(aliveCreaturesThisFrame);

        if (this.currentGenerationEndMode === 'majorityMaxAge') {
            // In this mode, we check against the global maxAgeFrames derived from the slider,
            // or if all creatures are dead.
            const majorityReached = maxAgeReachedCount > (SIM_CONFIG.FIXED_POPULATION_SIZE / 2);
            if (majorityReached || aliveCreaturesThisFrame === 0) {
                generationEnded = true;
            }
            const progress = Math.min(100, Math.floor((maxAgeReachedCount / SIM_CONFIG.FIXED_POPULATION_SIZE) * 100));
            UIManager.updateGenerationProgress(progress);
        } else if (this.currentGenerationEndMode === 'fixedTime') {
            if (currentTime - this.lastGenerationStartTime >= this.fixedTimeGenerationLengthMs) {
                generationEnded = true;
            }
            const elapsed = currentTime - this.lastGenerationStartTime;
            const progress = Math.min(100, Math.floor((elapsed / this.fixedTimeGenerationLengthMs) * 100));
            UIManager.updateGenerationProgress(progress);
        }

        if (generationEnded) {
            this.endGenerationAndStartNewOne();
        }
    }

    /**
     * Draws all elements on the canvas.
     */
    draw() {
        this.ctx.clearRect(0, 0, SIM_CONFIG.WORLD_WIDTH, SIM_CONFIG.WORLD_HEIGHT);

        this.drawBiomes();

        for (const f of this.food) {
            f.draw(this.ctx, this.showFood);
        }

        let bestCreature = null;
        let highestFitness = -1;

        for (const creature of this.creatures) {
            creature.draw(this.ctx, this.showHealthBars); // Pass showHealthBars
            // Calculate fitness here again for display highlighting, as it might change
            if (creature.isAlive && creature.calculateFitness(this.biomeMap) > highestFitness) {
                highestFitness = creature.calculateFitness(this.biomeMap);
                bestCreature = creature;
            }
        }

        // Highlight the best creature with a yellow ring
        if (bestCreature) {
            this.ctx.beginPath();
            this.ctx.arc(bestCreature.x, bestCreature.y, bestCreature.size + 3, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'yellow';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        UIManager.drawMiniMap(this.creatures, this.biomeMap); // Draw mini-map
    }
}
