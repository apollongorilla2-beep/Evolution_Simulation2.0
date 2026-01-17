import { SIM_CONFIG, BIOME_TYPES } from './constants.js';
import { clamp, normalizeAngle } from './utils.js';
import { NeuralNetwork } from './neuralNetwork.js';
import { Food } from './food.js'; // Import Food to check its type

export class Creature {
    /**
     * Creates a new Creature instance.
     * @param {object} options - Configuration options for the creature.
     * @param {number} options.x - Initial X position.
     * @param {number} options.y - Initial Y position.
     * @param {string} [options.color=null] - Creature's color. If null, a random color is generated.
     * @param {number} [options.speed=SIM_CONFIG.BASE_SPEED] - Creature's movement speed.
     * @param {number} [options.size=SIM_CONFIG.CREATURE_BASE_RADIUS] - Creature's size (radius).
     * @param {NeuralNetwork} [options.brain=null] - Creature's neural network. If null, a new one is created.
     * @param {number} [options.visionRange=SIM_CONFIG.INITIAL_VISION_RANGE] - Creature's vision range.
     * @param {number} [options.lifespan=SIM_CONFIG.INITIAL_LIFESPAN_SECONDS * 60] - Creature's maximum age in frames.
     * @param {number} [options.biomePreference=0] - Creature's preferred biome type index.
     * @param {number} [options.dietType=SIM_CONFIG.INITIAL_DIET_TYPE] - Creature's diet type (0=Herbivore, 1=Carnivore).
     * @param {number} [options.attackPower=SIM_CONFIG.INITIAL_ATTACK_POWER] - Creature's attack power.
     * @param {number} [options.defense=SIM_CONFIG.INITIAL_DEFENSE] - Creature's defense.
     * @param {number} [options.metabolismRate=SIM_CONFIG.INITIAL_METABOLISM_RATE] - Creature's metabolism rate.
     * @param {number} [options.reproductionCooldown=SIM_CONFIG.INITIAL_REPRODUCTION_COOLDOWN] - Frames before next reproduction.
     * @param {number} [options.clutchSize=SIM_CONFIG.INITIAL_CLUTCH_SIZE] - Number of offspring per reproduction.
     * @param {number} [options.sensoryRange=SIM_CONFIG.INITIAL_SENSORY_RANGE] - Range for non-visual senses.
     * @param {number} [options.optimalTemperature=SIM_CONFIG.INITIAL_OPTIMAL_TEMPERATURE] - Creature's optimal temperature (normalized 0-1).
     */
    constructor(options) {
        this.id = Math.random().toString(36).substring(2, 9); // Unique ID for info panel
        this.x = options.x;
        this.y = options.y;
        this.originalColor = options.color || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        this.color = this.originalColor;
        this.speed = options.speed;
        this.size = options.size;
        this.energy = 100;
        this.age = 0;
        this.direction = Math.random() * Math.PI * 2;
        this.foodEatenCount = 0;
        this.isAlive = true;
        this.fitness = 0; // Stored fitness from previous generation for selection and adaptive mutation
        this.visionRange = options.visionRange;
        this.wallHits = 0; // Track wall hits for fitness penalty
        this.lifespan = options.lifespan; // Creature's individual lifespan in frames
        this.biomePreference = options.biomePreference; // Creature's preferred biome type index

        // New Genetic Traits
        this.dietType = options.dietType; // 0=Herbivore, 1=Carnivore
        this.attackPower = options.attackPower;
        this.defense = options.defense;
        this.metabolismRate = options.metabolismRate;
        this.reproductionCooldown = options.reproductionCooldown;
        this.currentReproductionCooldown = 0; // Tracks frames until next reproduction is possible
        this.clutchSize = options.clutchSize;
        this.sensoryRange = options.sensoryRange; // For scent/hearing
        this.optimalTemperature = options.optimalTemperature; // Normalized 0-1

        this.brain = options.brain || new NeuralNetwork(
            SIM_CONFIG.BRAIN_INPUT_NODES,
            SIM_CONFIG.BRAIN_HIDDEN_NODES,
            SIM_CONFIG.BRAIN_OUTPUT_NODES
        );
        this.trail = []; // For visual trails
        this.maxTrailLength = 30;
    }

    /**
     * Determines the current biome the creature is in.
     * @param {number[][]} biomeMap - The global biome map.
     * @returns {object} The biome type object.
     */
    getBiome(biomeMap) {
        const biomeX = Math.floor(this.x / (SIM_CONFIG.WORLD_WIDTH / SIM_CONFIG.BIOME_GRID_X));
        const biomeY = Math.floor(this.y / (SIM_CONFIG.WORLD_HEIGHT / SIM_CONFIG.BIOME_GRID_Y));
        const clampedX = clamp(biomeX, 0, SIM_CONFIG.BIOME_GRID_X - 1);
        const clampedY = clamp(biomeY, 0, SIM_CONFIG.BIOME_GRID_Y - 1);
        return BIOME_TYPES[biomeMap[clampedY][clampedX]];
    }

    /**
     * The creature's "thinking" process using its neural network.
     * @param {Food[]} globalFood - Array of all food items.
     * @param {Creature[]} globalCreatures - Array of all other creatures.
     * @param {number[][]} biomeMap - The global biome map.
     * @param {number} currentTemperature - The normalized current temperature of the world.
     * @returns {{turnRate: number, speedAdjustment: number}} The actions determined by the brain.
     */
    think(globalFood, globalCreatures, biomeMap, currentTemperature) {
        // Gather inputs (normalized 0-1)
        let foodAngleInput = 0.5; // Neutral if no food
        let foodDistanceInput = 0; // Farthest if no food (0 implies no food, 1 implies very close)
        let closestFood = null;
        let minFoodDistance = Infinity;

        // Find closest food within combined vision and sensory range
        for (const f of globalFood) {
            // Check if food type matches diet
            if ((this.dietType === 0 && f.type === 'plant') || (this.dietType === 1 && f.type === 'meat')) {
                const dist = Math.sqrt((this.x - f.x) ** 2 + (this.y - f.y) ** 2);
                if (dist < minFoodDistance && dist <= (this.visionRange + this.sensoryRange)) {
                    minFoodDistance = dist;
                    closestFood = f;
                }
            }
        }

        if (closestFood) {
            const angleToFood = Math.atan2(closestFood.y - this.y, closestFood.x - this.x);
            let relativeAngle = normalizeAngle(angleToFood - this.direction);
            foodAngleInput = relativeAngle / (2 * Math.PI);

            // Normalize food distance: closer is higher value (1 is closest, 0 is furthest within combined range)
            foodDistanceInput = 1 - (minFoodDistance / (this.visionRange + this.sensoryRange));
        }

        // Nearest other creature inputs
        let nearestCreatureAngleInput = 0.5; // Neutral if no other creature
        let nearestCreatureDistanceInput = 0; // Farthest if no other creature
        let closestOtherCreature = null;
        let minCreatureDistance = Infinity;

        for (const otherCreature of globalCreatures) {
            if (otherCreature !== this && otherCreature.isAlive) { // Don't consider self or dead creatures
                const dist = Math.sqrt((this.x - otherCreature.x) ** 2 + (this.y - otherCreature.y) ** 2);
                if (dist < minCreatureDistance && dist <= (this.visionRange + this.sensoryRange)) { // Use combined range
                    minCreatureDistance = dist;
                    closestOtherCreature = otherCreature;
                }
            }
        }

        if (closestOtherCreature) {
            const angleToCreature = Math.atan2(closestOtherCreature.y - this.y, closestOtherCreature.x - this.x);
            let relativeAngle = normalizeAngle(angleToCreature - this.direction);
            nearestCreatureAngleInput = relativeAngle / (2 * Math.PI);
            nearestCreatureDistanceInput = 1 - (minCreatureDistance / (this.visionRange + this.sensoryRange));
        }


        // Creature energy (normalized)
        let energyInput = clamp(this.energy / (SIM_CONFIG.REPRODUCTION_THRESHOLD * 2), 0, 1);

        // Distance to nearest horizontal wall (normalized: 0 is wall, 1 is center)
        let wallXDistanceInput = Math.min(this.x, SIM_CONFIG.WORLD_WIDTH - this.x);
        wallXDistanceInput = wallXDistanceInput / (SIM_CONFIG.WORLD_WIDTH / 2);

        // Distance to nearest vertical wall (normalized: 0 is wall, 1 is center)
        let wallYDistanceInput = Math.min(this.y, SIM_CONFIG.WORLD_HEIGHT - this.y);
        wallYDistanceInput = wallYDistanceInput / (SIM_CONFIG.WORLD_HEIGHT / 2);

        // Biome type input (normalized index)
        const biomeX = Math.floor(this.x / (SIM_CONFIG.WORLD_WIDTH / SIM_CONFIG.BIOME_GRID_X));
        const biomeY = Math.floor(this.y / (SIM_CONFIG.WORLD_HEIGHT / SIM_CONFIG.BIOME_GRID_Y));
        const clampedBiomeX = clamp(biomeX, 0, SIM_CONFIG.BIOME_GRID_X - 1);
        const clampedBiomeY = clamp(biomeY, 0, SIM_CONFIG.BIOME_GRID_Y - 1);
        const currentBiomeIndex = biomeMap[clampedBiomeY][clampedBiomeX];
        const biomeInput = currentBiomeIndex / (BIOME_TYPES.length - 1);

        // Vision Range input (normalized)
        let visionRangeInput = clamp(this.visionRange / 300, 0, 1); // Max vision range is 300 from slider

        // Biome Preference input (normalized)
        const biomePreferenceInput = this.biomePreference / (BIOME_TYPES.length - 1);

        // Lifespan input (normalized)
        const lifespanInput = clamp(this.age / this.lifespan, 0, 1); // Normalize current age against individual lifespan

        // New: Diet Type input (normalized: 0 for herbivore, 1 for carnivore)
        const dietTypeInput = this.dietType;

        // New: Sensory Range input (normalized)
        const sensoryRangeInput = clamp(this.sensoryRange / 150, 0, 1); // Max sensory range is 150 from slider

        // New: Current Temperature input (normalized)
        const currentTemperatureInput = currentTemperature;

        // New: Hazard Proximity input (normalized distance to nearest hazard, if any)
        let hazardProximityInput = 0; // 0 if no hazard, 1 if very close
        const currentBiome = this.getBiome(biomeMap);
        if (currentBiome.is_hazardous) {
            // Simplified: if in a hazardous biome, consider it close to a hazard
            hazardProximityInput = 1;
        }


        const inputs = [
            foodAngleInput, foodDistanceInput, energyInput,
            wallXDistanceInput, wallYDistanceInput, biomeInput,
            visionRangeInput,
            nearestCreatureAngleInput, nearestCreatureDistanceInput,
            biomePreferenceInput,
            lifespanInput,
            dietTypeInput,
            sensoryRangeInput,
            currentTemperatureInput,
            hazardProximityInput
        ];

        const outputs = this.brain.feedForward(inputs);

        // Map outputs to actions: turn rate and speed adjustment
        const turnRate = outputs[0] * SIM_CONFIG.MAX_TURN_RATE;
        const speedAdjustment = outputs[1] * SIM_CONFIG.MAX_SPEED_ADJUSTMENT;

        return { turnRate, speedAdjustment };
    }

    /**
     * Draws the creature on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     * @param {boolean} showHealthBars - Whether to draw health bars.
     */
    draw(ctx, showHealthBars) {
        if (!this.isAlive) {
            // Draw dead creatures as smaller, greyed-out circles
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            return;
        }

        // Draw trail
        ctx.beginPath();
        const colorR = parseInt(this.color.substring(1, 3), 16);
        const colorG = parseInt(this.color.substring(3, 5), 16);
        const colorB = parseInt(this.color.substring(5, 7), 16);
        ctx.strokeStyle = `rgba(${colorR}, ${colorG}, ${colorB}, 0.3)`;
        ctx.lineWidth = 1;
        if (this.trail.length > 1) {
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
        }
        ctx.stroke();

        // Draw creature body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw a small "eye" to indicate direction
        ctx.beginPath();
        const eyeX = this.x + Math.cos(this.direction) * (this.size * 0.7);
        const eyeY = this.y + Math.sin(this.direction) * (this.size * 0.7);
        ctx.arc(eyeX, eyeY, this.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        // New: Draw Health Bar
        if (showHealthBars) {
            const barWidth = Math.max(10, this.size * 2); // Bar width scales with creature size, min 10
            const barHeight = 3;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.size - barHeight - 5; // Position above creature

            ctx.fillStyle = '#555'; // Background of the bar
            ctx.fillRect(barX, barY, barWidth, barHeight);

            const healthPercentage = Math.max(0, this.energy / (SIM_CONFIG.REPRODUCTION_THRESHOLD * 2)); // Normalized energy
            ctx.fillStyle = healthPercentage > 0.5 ? '#4CAF50' : (healthPercentage > 0.2 ? '#FFC107' : '#CF6679'); // Green, Orange, Red
            ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);

            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }

    /**
     * Handles food consumption.
     * @param {number} foodIndex - The index of the food item in the global food array.
     * @param {Food[]} globalFood - The global food array.
     * @param {number[][]} biomeMap - The global biome map.
     */
    eat(foodIndex, globalFood, biomeMap) {
        const foodItem = globalFood[foodIndex];

        // New: Check for toxic food
        if (foodItem.isToxic) {
            this.energy -= SIM_CONFIG.TOXIC_FOOD_ENERGY_LOSS;
            this.color = 'purple'; // Flash purple for toxic
        } else {
            this.energy += foodItem.energyValue; // Use food's energy value
            this.foodEatenCount++;
            this.color = 'yellow'; // Flash yellow
        }

        globalFood.splice(foodIndex, 1);

        setTimeout(() => {
            this.color = this.originalColor;
        }, 100);
    }

    /**
     * New: Handles combat with another creature.
     * @param {Creature} targetCreature - The creature being attacked.
     * @returns {boolean} True if combat occurred, false otherwise.
     */
    engageCombat(targetCreature) {
        if (!this.isAlive || !targetCreature.isAlive || this.dietType !== 1) { // Only alive carnivores can attack
            return false;
        }

        const distance = Math.sqrt((this.x - targetCreature.x)**2 + (this.y - targetCreature.y)**2);
        if (distance > SIM_CONFIG.COMBAT_RANGE) {
            return false;
        }

        // Consume energy for combat
        this.energy -= SIM_CONFIG.COMBAT_ENERGY_COST;
        if (this.energy <= 0) {
            this.isAlive = false;
            return false;
        }

        // Calculate damage
        const rawDamage = this.attackPower * SIM_CONFIG.COMBAT_DAMAGE_MULTIPLIER;
        const damageDealt = Math.max(0, rawDamage - targetCreature.defense);

        targetCreature.energy -= damageDealt;

        // Visual feedback for combat
        this.color = 'red';
        targetCreature.color = 'red';
        setTimeout(() => {
            this.color = this.originalColor;
            targetCreature.color = targetCreature.originalColor;
        }, 100);

        if (targetCreature.energy <= 0) {
            targetCreature.isAlive = false;
            // Transfer energy from dead creature
            this.energy += Math.max(0, SIM_CONFIG.MEAT_FROM_DEAD_CREATURE);
        }
        return true;
    }


    /**
     * Updates the creature's state each frame.
     * @param {number[][]} biomeMap - The global biome map.
     * @param {Food[]} globalFood - Array of all food items.
     * @param {Creature[]} globalCreatures - Array of all other creatures.
     * @param {number} mutationRate - Current mutation rate.
     * @param {number} mutationStrength - Current mutation strength.
     * @param {number} currentTemperature - The normalized current temperature of the world.
     */
    update(biomeMap, globalFood, globalCreatures, mutationRate, mutationStrength, currentTemperature) {
        this.age++;
        this.currentReproductionCooldown = Math.max(0, this.currentReproductionCooldown - 1);

        const currentBiome = this.getBiome(biomeMap);

        // New: Apply metabolism rate
        let energyDecay = SIM_CONFIG.ENERGY_DECAY_BASE * this.metabolismRate * currentBiome.movement_cost_multiplier;

        // New: Apply temperature effects
        const tempDeviation = Math.abs(currentTemperature - this.optimalTemperature);
        energyDecay += tempDeviation * SIM_CONFIG.TEMPERATURE_EFFECT_MULTIPLIER;

        // New: Apply hazard energy drain
        if (currentBiome.is_hazardous) {
            energyDecay += SIM_CONFIG.HAZARD_ENERGY_DRAIN;
        }

        this.energy -= energyDecay;


        const { turnRate, speedAdjustment } = this.think(globalFood, globalCreatures, biomeMap, currentTemperature); // Pass currentTemperature
        this.direction = normalizeAngle(this.direction + turnRate);
        this.speed = clamp(SIM_CONFIG.BASE_SPEED + speedAdjustment, 0.5, SIM_CONFIG.BASE_SPEED * 2.5);

        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        let hitWall = false;
        if (this.x < this.size) {
            this.x = this.size;
            this.direction = Math.PI - this.direction;
            hitWall = true;
        } else if (this.x > SIM_CONFIG.WORLD_WIDTH - this.size) {
            this.x = SIM_CONFIG.WORLD_WIDTH - this.size;
            this.direction = Math.PI - this.direction;
            hitWall = true;
        }
        if (this.y < this.size) {
            this.y = this.size;
            this.direction = -this.direction;
            hitWall = true;
        } else if (this.y > SIM_CONFIG.WORLD_HEIGHT - this.size) {
            this.y = SIM_CONFIG.WORLD_HEIGHT - this.size;
            this.direction = -this.direction;
            hitWall = true;
        }
        if (hitWall) {
            this.energy -= SIM_CONFIG.WALL_HIT_PENALTY;
            this.wallHits++; // Increment wall hit counter
        }

        // Add current position to trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Creature becomes "not alive" only when it reaches its individual lifespan or runs out of energy
        if (this.age > this.lifespan || this.energy <= 0) {
            this.isAlive = false;
        }
    }

    /**
     * Calculates the creature's fitness for selection.
     * @param {number[][]} biomeMap - The global biome map.
     * @returns {number} The calculated fitness score.
     */
    calculateFitness(biomeMap) {
        let baseFitness = this.foodEatenCount * 200; // Increased food reward
        baseFitness += this.age * 0.8; // Reward for surviving longer
        baseFitness += Math.max(0, this.energy) * 0.2; // Reward for remaining energy (cannot be negative)
        baseFitness -= (this.age > this.lifespan ? 0 : (this.lifespan - this.age)) * 0.02; // Small penalty for not reaching max age if it died early

        // Reward for being in a biome it's adapted to (or penalize for being in a bad one)
        const currentBiome = this.getBiome(biomeMap);
        baseFitness += currentBiome.base_adaptation_score * 75;

        // Reward/penalty based on biome preference
        const currentBiomeIndex = BIOME_TYPES.findIndex(b => b.type === currentBiome.type);
        const biomePreferenceDifference = Math.abs(this.biomePreference - currentBiomeIndex);
        baseFitness -= biomePreferenceDifference * SIM_CONFIG.BIOME_PREFERENCE_FITNESS_MULTIPLIER; // Penalty for being in a non-preferred biome


        // Reward for optimal speed (not too fast, not too slow)
        const speedDifference = Math.abs(this.speed - SIM_CONFIG.BASE_SPEED);
        baseFitness -= speedDifference * 10; // Penalty for deviating too much from base speed

        // Reward for efficient vision range
        baseFitness -= Math.abs(this.visionRange - SIM_CONFIG.DEFAULT_INITIAL_VISION_RANGE) * 0.5; // Small penalty for deviating from initial vision

        // Penalty for frequent wall collisions
        baseFitness -= this.wallHits * SIM_CONFIG.WALL_COLLISION_FITNESS_PENALTY;

        // Reward for optimal lifespan (not too short, not too long relative to initial)
        const lifespanDifference = Math.abs(this.lifespan - SIM_CONFIG.DEFAULT_INITIAL_LIFESPAN_FRAMES);
        baseFitness -= lifespanDifference * 0.1;

        // New: Reward for optimal metabolism (closer to default base is better)
        const metabolismDifference = Math.abs(this.metabolismRate - SIM_CONFIG.DEFAULT_INITIAL_METABOLISM_RATE);
        baseFitness -= metabolismDifference * 1000; // Penalize deviation from default metabolism

        // New: Reward for optimal reproduction cooldown (not too long, not too short relative to default)
        const reproCooldownDifference = Math.abs(this.reproductionCooldown - SIM_CONFIG.DEFAULT_INITIAL_REPRODUCTION_COOLDOWN_FRAMES);
        baseFitness -= reproCooldownDifference * 0.5;

        // New: Reward for attack/defense balance (complex, but simple for now: penalize very low values, reward higher values)
        baseFitness += this.attackPower * 2;
        baseFitness += this.defense * 2;
        if (this.attackPower < 5) baseFitness -= 50;
        if (this.defense < 2) baseFitness -= 50;

        // New: Reward for sensory range (up to a point)
        baseFitness += this.sensoryRange * 0.5;
        if (this.sensoryRange > SIM_CONFIG.DEFAULT_INITIAL_SENSORY_RANGE * 2 && SIM_CONFIG.DEFAULT_INITIAL_SENSORY_RANGE !== 0) baseFitness -= 20; // Penalize excessive sensory range if there was an initial baseline
        else if (this.sensoryRange > 50 && SIM_CONFIG.DEFAULT_INITIAL_SENSORY_RANGE === 0) baseFitness -= (this.sensoryRange - 50) * 0.5; // If starting at 0, penalize very high values

        // New: Reward for optimal temperature (closer to default is better)
        const optimalTempDifference = Math.abs(this.optimalTemperature - SIM_CONFIG.DEFAULT_INITIAL_OPTIMAL_TEMPERATURE);
        baseFitness -= optimalTempDifference * 100; // Penalize deviation from default optimal temp

        return Math.max(0, baseFitness); // Fitness cannot be negative
    }

    /**
     * Mutates the creature's color for visual diversity.
     * @param {string} originalColor - The original color string (e.g., '#RRGGBB').
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {string} The new mutated color.
     */
    mutateColor(originalColor, mutationRate, mutationStrength) {
        const hex = originalColor.substring(1);
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);

        // Adjust color mutation based on mutationStrength
        const colorMutationMagnitude = 60 * mutationStrength; // Link to mutation strength

        if (Math.random() < mutationRate * 2) r = clamp(r + Math.floor((Math.random() - 0.5) * colorMutationMagnitude), 0, 255);
        if (Math.random() < mutationRate * 2) g = clamp(g + Math.floor((Math.random() - 0.5) * colorMutationMagnitude), 0, 255);
        if (Math.random() < mutationRate * 2) b = clamp(b + Math.floor((Math.random() - 0.5) * colorMutationMagnitude), 0, 255);

        return '#' +
            Math.round(r).toString(16).padStart(2, '0') +
            Math.round(g).toString(16).padStart(2, '0') +
            Math.round(b).toString(16).padStart(2, '0');
    }

    /**
     * Mutates a creature's vision range.
     * @param {number} parentVisionRange - The parent's vision range.
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {number} The new mutated vision range.
     */
    mutateVisionRange(parentVisionRange, mutationRate, mutationStrength) {
        if (Math.random() < mutationRate) {
            return clamp(parentVisionRange + (Math.random() - 0.5) * mutationStrength * 50, 50, 300);
        }
        return parentVisionRange;
    }

    /**
     * Mutates a creature's lifespan.
     * @param {number} parentLifespan - The parent's lifespan.
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {number} The new mutated lifespan.
     */
    mutateLifespan(parentLifespan, mutationRate, mutationStrength) {
        if (Math.random() < mutationRate) {
            return clamp(parentLifespan + (Math.random() - 0.5) * mutationStrength * SIM_CONFIG.LIFESPAN_MUTATION_STRENGTH_MULTIPLIER * 60, // Multiply by 60 for seconds to frames
                10 * 60, // Minimum 10 seconds lifespan
                150 * 60 // Maximum 150 seconds lifespan
            );
        }
        return parentLifespan;
    }

    /**
     * Mutates a creature's biome preference.
     * @param {number} parentBiomePreference - The parent's biome preference.
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {number} The new mutated biome preference.
     */
    mutateBiomePreference(parentBiomePreference, mutationRate, mutationStrength) {
        if (Math.random() < mutationRate) {
            const numBiomeTypes = BIOME_TYPES.length;
            let newPreference = parentBiomePreference + Math.round((Math.random() - 0.5) * mutationStrength * SIM_CONFIG.BIOME_PREFERENCE_MUTATION_STRENGTH_MULTIPLIER * numBiomeTypes);
            return clamp(newPreference, 0, numBiomeTypes - 1);
        }
        return parentBiomePreference;
    }

    /**
     * New: Mutates a creature's diet type.
     * @param {number} parentDietType - The parent's diet type.
     * @param {number} mutationRate - The current mutation rate.
     * @returns {number} The new mutated diet type.
     */
    mutateDietType(parentDietType, mutationRate) {
        if (Math.random() < mutationRate * SIM_CONFIG.DIET_TYPE_MUTATION_CHANCE_MULTIPLIER) {
            return parentDietType === 0 ? 1 : 0; // Flip between herbivore (0) and carnivore (1)
        }
        return parentDietType;
    }

    /**
     * New: Mutates a creature's attack power.
     * @param {number} parentAttackPower - The parent's attack power.
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {number} The new mutated attack power.
     */
    mutateAttackPower(parentAttackPower, mutationRate, mutationStrength) {
        if (Math.random() < mutationRate) {
            return clamp(parentAttackPower + (Math.random() - 0.5) * mutationStrength * SIM_CONFIG.ATTACK_POWER_MUTATION_STRENGTH_MULTIPLIER * 10,
                1, 50);
        }
        return parentAttackPower;
    }

    /**
     * New: Mutates a creature's defense.
     * @param {number} parentDefense - The parent's defense.
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {number} The new mutated defense.
     */
    mutateDefense(parentDefense, mutationRate, mutationStrength) {
        if (Math.random() < mutationRate) {
            return clamp(parentDefense + (Math.random() - 0.5) * mutationStrength * SIM_CONFIG.DEFENSE_MUTATION_STRENGTH_MULTIPLIER * 10,
                0, 30);
        }
        return parentDefense;
    }

    /**
     * New: Mutates a creature's metabolism rate.
     * @param {number} parentMetabolismRate - The parent's metabolism rate.
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {number} The new mutated metabolism rate.
     */
    mutateMetabolismRate(parentMetabolismRate, mutationRate, mutationStrength) {
        if (Math.random() < mutationRate) {
            return clamp(parentMetabolismRate + (Math.random() - 0.5) * mutationStrength * SIM_CONFIG.METABOLISM_MUTATION_STRENGTH_MULTIPLIER,
                0.01, 0.1);
        }
        return parentMetabolismRate;
    }

    /**
     * New: Mutates a creature's reproduction cooldown.
     * @param {number} parentReproductionCooldown - The parent's reproduction cooldown.
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {number} The new mutated reproduction cooldown.
     */
    mutateReproductionCooldown(parentReproductionCooldown, mutationRate, mutationStrength) {
        if (Math.random() < mutationRate) {
            return clamp(parentReproductionCooldown + (Math.random() - 0.5) * mutationStrength * SIM_CONFIG.REPRODUCTION_COOLDOWN_MUTATION_STRENGTH_MULTIPLIER,
                30, 300);
        }
        return parentReproductionCooldown;
    }

    /**
     * New: Mutates a creature's clutch size.
     * @param {number} parentClutchSize - The parent's clutch size.
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {number} The new mutated clutch size.
     */
    mutateClutchSize(parentClutchSize, mutationRate, mutationStrength) {
        if (Math.random() < mutationRate) {
            return clamp(parentClutchSize + Math.round((Math.random() - 0.5) * mutationStrength * SIM_CONFIG.CLUTCH_SIZE_MUTATION_STRENGTH_MULTIPLIER),
                1, 5);
        }
        return parentClutchSize;
    }

    /**
     * New: Mutates a creature's sensory range.
     * @param {number} parentSensoryRange - The parent's sensory range.
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {number} The new mutated sensory range.
     */
    mutateSensoryRange(parentSensoryRange, mutationRate, mutationStrength) {
        if (Math.random() < mutationRate) {
            return clamp(parentSensoryRange + (Math.random() - 0.5) * mutationStrength * SIM_CONFIG.SENSORY_RANGE_MUTATION_STRENGTH_MULTIPLIER * 10,
                0, 150);
        }
        return parentSensoryRange;
    }

    /**
     * New: Mutates a creature's optimal temperature.
     * @param {number} parentOptimalTemperature - The parent's optimal temperature.
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {number} The new mutated optimal temperature.
     */
    mutateOptimalTemperature(parentOptimalTemperature, mutationRate, mutationStrength) {
        if (Math.random() < mutationRate) {
            return clamp(parentOptimalTemperature + (Math.random() - 0.5) * mutationStrength * SIM_CONFIG.OPTIMAL_TEMPERATURE_MUTATION_STRENGTH_MULTIPLIER,
                0, 1);
        }
        return parentOptimalTemperature;
    }


    /**
     * Creates a clone of the creature for elitism, resetting mutable state.
     * @returns {Creature} A new Creature instance that is a clone.
     */
    cloneForNextGeneration() {
        const clonedCreature = new Creature({
            x: Math.random() * SIM_CONFIG.WORLD_WIDTH, // New random position for next gen
            y: Math.random() * SIM_CONFIG.WORLD_HEIGHT,
            color: this.originalColor, // Keep original color
            speed: this.speed,
            size: this.size,
            brain: this.brain, // Keep the same brain
            visionRange: this.visionRange,
            lifespan: this.lifespan, // Carry over lifespan
            biomePreference: this.biomePreference, // Carry over biome preference
            dietType: this.dietType, // Carry over diet type
            attackPower: this.attackPower, // Carry over attack power
            defense: this.defense, // Carry over defense
            metabolismRate: this.metabolismRate, // Carry over metabolism rate
            reproductionCooldown: this.reproductionCooldown, // Carry over reproduction cooldown
            clutchSize: this.clutchSize, // Carry over clutch size
            sensoryRange: this.sensoryRange, // Carry over sensory range
            optimalTemperature: this.optimalTemperature, // Carry over optimal temperature
        });
        clonedCreature.fitness = this.fitness; // Carry over fitness for potential re-evaluation or reference
        return clonedCreature;
    }
}
