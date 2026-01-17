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

        // NEW: Track current hidden nodes for dynamic NN growth
        this.currentHiddenNodes = SIM_CONFIG.MIN_BRAIN_HIDDEN_NODES;

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
        this.initialArmor = parseInt(UIManager.initialArmorSlider.value); // NEW: Initial Armor slider value
        // Note: Initial Optimal Temperature is not a slider, it's a genetic trait.

        UIManager.init();
        this.addEventListeners();
        this.initSimulation();
    }

    /**
     * Adds event listeners for UI controls.
     * */
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
        UIManager.initialArmorSlider.addEventListener('input', (e) => { // NEW: Armor slider event
            this.initialArmor = parseInt(e.target.value);
            UIManager.updateSliderValue(UIManager.initialArmorValue, this.initialArmor);
        });

        UIManager.toggleFoodButton.addEventListener('click', () => {
            this.showFood = !this.showFood;
            UIManager.toggleFoodButton.textContent = this.showFood ? 'Hide Food' : 'Show Food';
        });
        UIManager.toggleBiomesButton.addEventListener('click', () => {
            this.showBiomes = !this.showBiomes;
            UIManager.toggleBiomesButton.textContent = this.showBiomes ? 'Hide Biomes' : 'Show Biomes';
        });
        UIManager.toggleHealthBarsButton.addEventListener('click', () => {
            this.showHealthBars = !this.showHealthBars;
            UIManager.toggleHealthBarsButton.textContent = this.showHealthBars ? 'Hide Health Bars' : 'Show Health Bars';
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.isPaused) {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                for (const creature of this.creatures) {
                    const dist = Math.sqrt((mouseX - creature.x)**2 + (mouseY - creature.y)**2);
                    if (dist < creature.size) {
                        UIManager.showCreatureInfo(creature, this.biomeMap);
                        return;
                    }
                }
                UIManager.hideCreatureInfo();
            }
        });
    }

    /**
     * Toggles the simulation's paused state.
     * */
    togglePause() {
        this.isPaused = !this.isPaused;
        UIManager.togglePauseButton.textContent = this.isPaused ? 'Resume Simulation' : 'Pause Simulation';
        if (!this.isPaused) {
            this.lastFrameTime = performance.now();
            this.gameLoop(this.lastFrameTime);
        } else {
            UIManager.hideCreatureInfo();
        }
    }

    /**
     * Sets the generation end mode to "Majority Max Age".
     * */
    setMajorityMaxAgeMode() {
        this.currentGenerationEndMode = 'majorityMaxAge';
        UIManager.updateResetMode('Majority Max Age');
    }

    /**
     * Sets the generation end mode to a fixed time.
     * @param {number} seconds - The duration of the generation in seconds.
     * */
    setFixedTimeGeneration(seconds) {
        this.currentGenerationEndMode = 'fixedTime';
        this.fixedTimeGenerationLengthMs = seconds * 1000;
        UIManager.updateResetMode(`${seconds}s Generation`);
        this.lastGenerationStartTime = performance.now();
    }

    /**
     * Generates a new random biome map.
     * */
    generateBiomeMap() {
        this.biomeMap = [];
        const biomeTypesCount = BIOME_TYPES.length;
        for (let y = 0; y < SIM_CONFIG.BIOME_GRID_Y; y++) {
            this.biomeMap[y] = [];
            for (let x = 0; x < SIM_CONFIG.BIOME_GRID_X; x++) {
                this.biomeMap[y][x] = Math.floor(Math.random() * biomeTypesCount);
            }
        }
        console.log("Biome map generated."); // Debug
    }

    /**
     * Clears all food and spawns a new set.
     * @param {number} count - The number of food items to spawn.
     * */
    resetAndSpawnAllFood(count) {
        this.food = [];
        this.spawnFood(count);
        console.log(`Food reset and spawned: ${this.food.length} items.`); // Debug
    }

    /**
     * Spawns a specified number of food items, preferring certain biomes.
     * @param {number} count - The number of food items to spawn.
     * */
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

                if (Math.random() < (biome ? biome.food_spawn_chance : 0.005) * SIM_CONFIG.FOOD_SPAWN_MULTIPLIER) { // Defensive check
                    const energyValue = SIM_CONFIG.ENERGY_FROM_FOOD + (Math.random() - 0.5) * 50;
                    const isToxic = Math.random() < SIM_CONFIG.FOOD_TOXICITY_CHANCE;
                    this.food.push(new Food(randomX, randomY, 'plant', energyValue, isToxic));
                    placed = true;
                }
                attempts++;
            }

            if (!placed) {
                const energyValue = SIM_CONFIG.ENERGY_FROM_FOOD + (Math.random() - 0.5) * 50;
                const isToxic = Math.random() < SIM_CONFIG.FOOD_TOXICITY_CHANCE;
                this.food.push(new Food(randomX, randomY, 'plant', energyValue, isToxic));
            }
        }
    }

    /**
     * Replenishes food gradually if the current count is below target.
     * */
    replenishFoodGradually() {
        if (this.food.length < this.foodCount) {
            const foodToSpawn = Math.min(this.foodCount - this.food.length, Math.floor(SIM_CONFIG.FOOD_SPAWN_RATE));
            if (foodToSpawn > 0) {
                this.spawnFood(foodToSpawn);
            } else if (Math.random() < SIM_CONFIG.FOOD_SPAWN_RATE % 1) {
                this.spawnFood(1);
            }
        }
    }

    /**
     * Initializes the entire simulation.
     * */
    initSimulation() {
        console.log("Initializing new simulation..."); // Debug
        this.currentGenerationNumber = 0;
        ChartManager.clearData();
        ChartManager.initCharts();
        this.generateBiomeMap();
        UIManager.hideCreatureInfo();
        
        // NEW: Reset currentHiddenNodes to minimum on full simulation reset
        this.currentHiddenNodes = SIM_CONFIG.MIN_BRAIN_HIDDEN_NODES;

        const initialCreatures = Array(SIM_CONFIG.FIXED_POPULATION_SIZE).fill(null).map(() => new Creature({
            x: Math.random() * SIM_CONFIG.WORLD_WIDTH,
            y: Math.random() * SIM_CONFIG.WORLD_HEIGHT,
            color: null,
            speed: SIM_CONFIG.DEFAULT_INITIAL_SPEED,
            size: SIM_CONFIG.DEFAULT_INITIAL_SIZE,
            brain: null,
            hiddenNodes: this.currentHiddenNodes, // NEW: Pass initial hidden nodes
            visionRange: SIM_CONFIG.DEFAULT_INITIAL_VISION_RANGE,
            lifespan: SIM_CONFIG.DEFAULT_INITIAL_LIFESPAN_FRAMES,
            biomePreference: SIM_CONFIG.DEFAULT_INITIAL_BIOME_PREFERENCE,
            dietType: SIM_CONFIG.DEFAULT_INITIAL_DIET_TYPE,
            attackPower: SIM_CONFIG.DEFAULT_INITIAL_ATTACK_POWER,
            defense: SIM_CONFIG.DEFAULT_INITIAL_DEFENSE,
            metabolismRate: SIM_CONFIG.DEFAULT_INITIAL_METABOLISM_RATE,
            reproductionCooldown: SIM_CONFIG.DEFAULT_INITIAL_REPRODUCTION_COOLDOWN_FRAMES,
            clutchSize: SIM_CONFIG.DEFAULT_INITIAL_CLUTCH_SIZE,
            sensoryRange: SIM_CONFIG.DEFAULT_INITIAL_SENSORY_RANGE,
            optimalTemperature: SIM_CONFIG.DEFAULT_INITIAL_OPTIMAL_TEMPERATURE,
            armor: SIM_CONFIG.DEFAULT_INITIAL_ARMOR, // NEW: Pass initial armor
        }));
        console.log(`Initial creatures created: ${initialCreatures.length}`); // Debug

        this.setMajorityMaxAgeMode();
        this.startNewGeneration(initialCreatures);

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.lastFrameTime = 0;
        this.isPaused = false;
        UIManager.togglePauseButton.textContent = 'Pause Simulation';
        UIManager.resetButton.textContent = 'Reset Simulation';
        this.gameLoop();
        console.log("Simulation initialized and gameLoop started."); // Debug
    }

    /**
     * Ends the current generation and prepares the next one.
     * */
    endGenerationAndStartNewOne() {
        console.log(`Ending Generation ${this.currentGenerationNumber}...`); // Debug
        const allCreaturesInGeneration = [...this.creatures];

        for (const creature of allCreaturesInGeneration) {
            creature.fitness = creature.calculateFitness(this.biomeMap);
        }

        ChartManager.updateChartsData(allCreaturesInGeneration, this.currentGenerationNumber);

        const sortedCreatures = [...allCreaturesInGeneration].sort((a, b) => b.fitness - a.fitness);

        const newGenerationCreatures = [];

        // NEW: Logic to potentially increase hidden nodes for the next generation
        let nextGenerationHiddenNodes = this.currentHiddenNodes;
        if (this.currentGenerationNumber > 0 && this.currentGenerationNumber % SIM_CONFIG.HIDDEN_NODE_GROWTH_RATE_GENERATIONS === 0) {
            if (this.currentHiddenNodes < SIM_CONFIG.MAX_BRAIN_HIDDEN_NODES) {
                nextGenerationHiddenNodes = Math.min(SIM_CONFIG.MAX_BRAIN_HIDDEN_NODES, this.currentHiddenNodes + SIM_CONFIG.HIDDEN_NODE_GROWTH_AMOUNT);
                console.log(`Generation ${this.currentGenerationNumber}: Increasing hidden nodes to ${nextGenerationHiddenNodes}`);
            }
        }
        this.currentHiddenNodes = nextGenerationHiddenNodes; // Update for next generation

        const eliteCount = Math.floor(SIM_CONFIG.FIXED_POPULATION_SIZE * SIM_CONFIG.ELITE_PERCENTAGE);
        for (let i = 0; i < eliteCount; i++) {
            if (sortedCreatures[i]) {
                // NEW: Pass nextGenerationHiddenNodes to cloned elites
                newGenerationCreatures.push(sortedCreatures[i].cloneForNextGeneration(this.currentHiddenNodes)); 
            }
        }

        const numParentsForBreeding = Math.max(2, Math.floor(SIM_CONFIG.FIXED_POPULATION_SIZE * SIM_CONFIG.PARENT_SELECTION_PERCENTAGE));
        const parents = sortedCreatures.slice(0, numParentsForBreeding);

        if (parents.length < 2 || parents[0].fitness <= 0) {
            console.warn("Not enough fit creatures survived to reproduce! Starting a fresh, random population.");
            this.startNewGeneration(Array(SIM_CONFIG.FIXED_POPULATION_SIZE).fill(null).map(() => new Creature({
                x: Math.random() * SIM_CONFIG.WORLD_WIDTH,
                y: Math.random() * SIM_CONFIG.WORLD_HEIGHT,
                speed: SIM_CONFIG.DEFAULT_INITIAL_SPEED,
                size: SIM_CONFIG.DEFAULT_INITIAL_SIZE,
                hiddenNodes: this.currentHiddenNodes, // NEW: Pass current hidden nodes
                visionRange: SIM_CONFIG.DEFAULT_INITIAL_VISION_RANGE,
                lifespan: SIM_CONFIG.DEFAULT_INITIAL_LIFESPAN_FRAMES,
                biomePreference: SIM_CONFIG.DEFAULT_INITIAL_BIOME_PREFERENCE,
                dietType: SIM_CONFIG.DEFAULT_INITIAL_DIET_TYPE,
                attackPower: SIM_CONFIG.DEFAULT_INITIAL_ATTACK_POWER,
                defense: SIM_CONFIG.DEFAULT_INITIAL_DEFENSE,
                metabolismRate: SIM_CONFIG.DEFAULT_INITIAL_METABOLISM_RATE,
                reproductionCooldown: SIM_CONFIG.DEFAULT_INITIAL_REPRODUCTION_COOLDOWN_FRAMES,
                clutchSize: SIM_CONFIG.DEFAULT_INITIAL_CLUTCH_SIZE,
                sensoryRange: SIM_CONFIG.DEFAULT_INITIAL_SENSORY_RANGE,
                optimalTemperature: SIM_CONFIG.DEFAULT_INITIAL_OPTIMAL_TEMPERATURE,
                armor: SIM_CONFIG.DEFAULT_INITIAL_ARMOR, // NEW: Pass default initial armor
            })));
            return;
        }

        while (newGenerationCreatures.length < SIM_CONFIG.FIXED_POPULATION_SIZE) {
            const parent1 = parents[Math.floor(Math.random() * parents.length)];
            let parent2 = parent1;
            while (parent2 === parent1) {
                parent2 = parents[Math.floor(Math.random() * parents.length)];
            }

            parent1.energy -= SIM_CONFIG.REPRODUCTION_ENERGY_COST / 2;
            parent2.energy -= SIM_CONFIG.REPRODUCTION_ENERGY_COST / 2;
            parent1.energy = Math.max(0, parent1.energy);
            parent2.energy = Math.max(0, parent2.energy);

            // NEW: Pass nextGenerationHiddenNodes to crossover and mutate
            const offspringBrain = NeuralNetwork.crossover(parent1.brain, parent2.brain, this.currentHiddenNodes);
            const mutatedOffspringBrain = offspringBrain.cloneAndMutate(offspringBrain, (parent1.fitness + parent2.fitness) / 2, this.mutationRate, this.mutationStrength, this.currentHiddenNodes);

            const offspringSpeed = parent1.speed + (Math.random() - 0.5) * this.mutationStrength * SIM_CONFIG.DEFAULT_INITIAL_SPEED * 0.2;
            const offspringSize = parent1.size + (Math.random() - 0.5) * this.mutationStrength * SIM_CONFIG.CREATURE_BASE_RADIUS * 0.5;
            const offspringVisionRange = parent1.mutateVisionRange(parent1.visionRange, this.mutationRate, this.mutationStrength);
            const offspringLifespan = parent1.mutateLifespan(parent1.lifespan, this.mutationRate, this.mutationStrength * SIM_CONFIG.LIFESPAN_MUTATION_STRENGTH_MULTIPLIER);
            const offspringBiomePreference = parent1.mutateBiomePreference(parent1.biomePreference, this.mutationRate, this.mutationStrength * SIM_CONFIG.BIOME_PREFERENCE_MUTATION_STRENGTH_MULTIPLIER);

            const offspringDietType = parent1.mutateDietType(parent1.dietType, this.mutationRate * SIM_CONFIG.DIET_TYPE_MUTATION_CHANCE_MULTIPLIER);
            const offspringAttackPower = parent1.mutateAttackPower(parent1.attackPower, this.mutationRate, this.mutationStrength * SIM_CONFIG.ATTACK_POWER_MUTATION_STRENGTH_MULTIPLIER);
            const offspringDefense = parent1.mutateDefense(parent1.defense, this.mutationRate, this.mutationStrength * SIM_CONFIG.DEFENSE_MUTATION_STRENGTH_MULTIPLIER);
            const offspringMetabolismRate = parent1.mutateMetabolismRate(parent1.metabolismRate, this.mutationRate, this.mutationStrength * SIM_CONFIG.METABOLISM_MUTATION_STRENGTH_MULTIPLIER);
            const offspringReproductionCooldown = parent1.mutateReproductionCooldown(parent1.reproductionCooldown, this.mutationRate, this.mutationStrength * SIM_CONFIG.REPRODUCTION_COOLDOWN_MUTATION_STRENGTH_MULTIPLIER);
            const offspringClutchSize = parent1.mutateClutchSize(parent1.clutchSize, this.mutationRate, this.mutationStrength * SIM_CONFIG.CLUTCH_SIZE_MUTATION_STRENGTH_MULTIPLIER);
            const offspringSensoryRange = parent1.mutateSensoryRange(parent1.sensoryRange, this.mutationRate, this.mutationStrength * SIM_CONFIG.SENSORY_RANGE_MUTATION_STRENGTH_MULTIPLIER);
            const offspringOptimalTemperature = parent1.mutateOptimalTemperature(parent1.optimalTemperature, this.mutationRate, this.mutationStrength * SIM_CONFIG.OPTIMAL_TEMPERATURE_MUTATION_STRENGTH_MULTIPLIER);
            const offspringArmor = parent1.mutateArmor(parent1.armor, this.mutationRate, this.mutationStrength * SIM_CONFIG.ARMOR_MUTATION_STRENGTH_MULTIPLIER); // NEW: Mutate armor

            newGenerationCreatures.push(new Creature({
                x: Math.random() * SIM_CONFIG.WORLD_WIDTH,
                y: Math.random() * SIM_CONFIG.WORLD_HEIGHT,
                color: parent1.mutateColor(parent1.originalColor, this.mutationRate, this.mutationStrength),
                speed: clamp(offspringSpeed, 0.5, SIM_CONFIG.BASE_SPEED * 2.5),
                size: clamp(offspringSize, 3, 15),
                brain: mutatedOffspringBrain,
                hiddenNodes: this.currentHiddenNodes, // NEW: Pass current hidden nodes
                visionRange: clamp(offspringVisionRange, 50, 300),
                lifespan: offspringLifespan,
                biomePreference: offspringBiomePreference,
                dietType: offspringDietType,
                attackPower: offspringAttackPower,
                defense: offspringDefense,
                metabolismRate: offspringMetabolismRate,
                reproductionCooldown: offspringReproductionCooldown,
                clutchSize: offspringClutchSize,
                sensoryRange: offspringSensoryRange,
                optimalTemperature: offspringOptimalTemperature,
                armor: offspringArmor, // NEW: Pass mutated armor
            }));
        }
        console.log(`New generation creatures prepared: ${newGenerationCreatures.length}`); // Debug

        this.startNewGeneration(newGenerationCreatures);
    }

    /**
     * Starts a new generation with a given set of creatures.
     * @param {Creature[]} newCreatures - Array of creatures for the new generation.
     * */
    startNewGeneration(newCreatures) {
        this.currentGenerationNumber++;
        this.simulationFrameCount = 0;
        this.lastGenerationStartTime = performance.now();

        this.creatures = newCreatures;
        this.resetAndSpawnAllFood(this.foodCount);

        UIManager.updateGenerationCount(this.currentGenerationNumber);
        UIManager.updatePopulationCount(this.creatures.filter(c => c.isAlive).length);
        UIManager.updateGenerationProgress(0);

        UIManager.updateOverlayGenerationCount(this.currentGenerationNumber);
        UIManager.updateOverlayPopulationCount(this.creatures.filter(c => c.isAlive).length);
        UIManager.updateOverlayGenerationProgress(0);
        UIManager.updateOverlayCurrentTemperature(this.currentWorldTemperature);

        UIManager.updateBrainDisplays(this.creatures);
        console.log(`Generation ${this.currentGenerationNumber} started with ${this.creatures.length} creatures.`); // Debug
    }

    /**
     * The main animation loop that calls update and draw.
     * @param {DOMHighResTimeStamp} timestamp - The current time provided by requestAnimationFrame.
     * */
    gameLoop(timestamp) {
        if (!this.isPaused) {
            if (timestamp < this.lastFrameTime + this.msPerFrame) {
                this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
                return;
            }

            this.lastFrameTime = timestamp;

            this.update();
            this.draw();
        } else {
            // If paused, we still want to draw once to ensure the current state is visible.
            // No need to explicitly call draw() here as requestAnimationFrame will eventually
            // trigger it again, but without an update.
        }

        this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    /**
     * Updates the state of the simulation each frame.
     * */
    update() {
        // console.log(`Simulation Update: Frame ${this.simulationFrameCount}, Alive Creatures: ${this.creatures.filter(c => c.isAlive).length}`); // Debug for every frame (can be chatty)
        this.simulationFrameCount++;
        const currentTime = performance.now();

        this.currentWorldTemperature = 0.5 + Math.sin(this.simulationFrameCount * 0.01) * 0.4;
        UIManager.updateOverlayCurrentTemperature(this.currentWorldTemperature);

        let generationEnded = false;
        let aliveCreaturesThisFrame = 0;
        let maxAgeReachedCount = 0;

        for (let i = this.creatures.length - 1; i >= 0; i--) {
            const creature = this.creatures[i];
            if (creature.isAlive) {
                creature.update(this.biomeMap, this.food, this.creatures, this.mutationRate, this.mutationStrength, this.currentWorldTemperature);

                for (let j = this.food.length - 1; j >= 0; j--) {
                    const f = this.food[j];
                    const dist = Math.sqrt((creature.x - f.x) ** 2 + (creature.y - f.y) ** 2);
                    if (dist < creature.size + f.radius + SIM_CONFIG.COLLISION_RADIUS_OFFSET) {
                        if ((creature.dietType === 0 && f.type === 'plant') || (creature.dietType === 1 && f.type === 'meat')) {
                             creature.eat(j, this.food, this.biomeMap);
                             break;
                        }
                    }
                }

                if (creature.dietType === 1 && creature.energy > SIM_CONFIG.COMBAT_ENERGY_COST * 2) {
                    for (let k = this.creatures.length - 1; k >= 0; k--) {
                        const otherCreature = this.creatures[k];
                        if (creature !== otherCreature && otherCreature.isAlive && otherCreature.dietType !== 1) {
                            const combatHappened = creature.engageCombat(otherCreature);
                            if (combatHappened) {
                                break;
                            }
                        }
                    }
                }

                if (creature.currentReproductionCooldown <= 0 && creature.energy >= SIM_CONFIG.REPRODUCTION_THRESHOLD) {
                    for (let k = i + 1; k < this.creatures.length; k++) {
                        const mate = this.creatures[k];
                        if (mate.isAlive && mate.currentReproductionCooldown <= 0 && mate.energy >= SIM_CONFIG.REPRODUCTION_THRESHOLD) {
                            const dist = Math.sqrt((creature.x - mate.x)**2 + (creature.y - mate.y)**2);
                            if (dist < SIM_CONFIG.MATING_RANGE) {
                                creature.currentReproductionCooldown = creature.reproductionCooldown;
                                mate.currentReproductionCooldown = mate.reproductionCooldown;
                                creature.energy -= SIM_CONFIG.REPRODUCTION_ENERGY_COST / 2;
                                mate.energy -= SIM_CONFIG.REPRODUCTION_ENERGY_COST / 2;
                                creature.energy = Math.max(0, creature.energy);
                                mate.energy = Math.max(0, mate.energy);
                                break;
                            }
                        }
                    }
                }

                if (creature.isAlive) {
                    aliveCreaturesThisFrame++;
                }
            } else {
                maxAgeReachedCount++;
                if (creature.energy <= 0) {
                    this.food.push(new Food(creature.x, creature.y, 'meat', SIM_CONFIG.MEAT_FROM_DEAD_CREATURE));
                }
            }
        }

        this.creatures = this.creatures.filter(c => c.isAlive);

        this.replenishFoodGradually();

        UIManager.updatePopulationCount(aliveCreaturesThisFrame);
        const progress = Math.min(100, Math.floor((this.simulationFrameCount / this.maxAgeFrames) * 100));
        UIManager.updateGenerationProgress(progress);

        UIManager.updateOverlayPopulationCount(aliveCreaturesThisFrame);
        UIManager.updateOverlayGenerationProgress(progress);


        if (this.currentGenerationEndMode === 'majorityMaxAge') {
            const majorityReached = maxAgeReachedCount > (SIM_CONFIG.FIXED_POPULATION_SIZE / 2);
            if (majorityReached || aliveCreaturesThisFrame === 0) {
                generationEnded = true;
            }
        } else if (this.currentGenerationEndMode === 'fixedTime') {
            if (currentTime - this.lastGenerationStartTime >= this.fixedTimeGenerationLengthMs) {
                generationEnded = true;
            }
        }

        if (generationEnded) {
            this.endGenerationAndStartNewOne();
        }
    }

    /**
     * Draws all elements on the canvas.
     * */
    draw() {
        this.ctx.clearRect(0, 0, SIM_CONFIG.WORLD_WIDTH, SIM_CONFIG.WORLD_HEIGHT);

        this.drawBiomes();

        for (const f of this.food) {
            f.draw(this.ctx, this.showFood);
        }

        let bestCreature = null;
        let highestFitness = -1;

        if (this.creatures.length === 0) {
            console.warn("No creatures to draw."); // Debug
        }

        for (const creature of this.creatures) {
            creature.draw(this.ctx, this.showHealthBars);
            if (creature.isAlive && creature.calculateFitness(this.biomeMap) > highestFitness) {
                highestFitness = creature.calculateFitness(this.biomeMap);
                bestCreature = creature;
            }
        }

        if (bestCreature) {
            this.ctx.beginPath();
            this.ctx.arc(bestCreature.x, bestCreature.y, bestCreature.size + 3, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'yellow';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        UIManager.drawMiniMap(this.creatures, this.biomeMap);
    }
}
