import { SIM_CONFIG, BIOME_TYPES } from './constants.js';
import { clamp, normalizeAngle } from './utils.js';
import { NeuralNetwork } from './neuralNetwork.js';

export class Creature {
    /**
     * Creates a new Creature instance.
     * @param {number} x - Initial X position.
     * @param {number} y - Initial Y position.
     * @param {string} [color=null] - Creature's color. If null, a random color is generated.
     * @param {number} [speed=SIM_CONFIG.BASE_SPEED] - Creature's movement speed.
     * @param {number} [size=SIM_CONFIG.CREATURE_BASE_RADIUS] - Creature's size (radius).
     * @param {NeuralNetwork} [brain=null] - Creature's neural network. If null, a new one is created.
     * @param {number} [visionRange=SIM_CONFIG.INITIAL_VISION_RANGE] - Creature's vision range.
     * @param {number} [lifespan=SIM_CONFIG.INITIAL_LIFESPAN_SECONDS * 60] - Creature's maximum age in frames.
     * @param {number} [biomePreference=0] - Creature's preferred biome type index.
     */
    constructor(x, y, color = null, speed = SIM_CONFIG.BASE_SPEED, size = SIM_CONFIG.CREATURE_BASE_RADIUS, brain = null, visionRange = SIM_CONFIG.INITIAL_VISION_RANGE, lifespan = SIM_CONFIG.INITIAL_LIFESPAN_SECONDS * 60, biomePreference = 0) {
        this.x = x;
        this.y = y;
        this.originalColor = color || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        this.color = this.originalColor;
        this.speed = speed;
        this.size = size;
        this.energy = 100;
        this.age = 0;
        this.direction = Math.random() * Math.PI * 2;
        this.foodEatenCount = 0;
        this.isAlive = true;
        this.fitness = 0; // Stored fitness from previous generation for selection and adaptive mutation
        this.visionRange = visionRange;
        this.wallHits = 0; // Track wall hits for fitness penalty
        this.lifespan = lifespan; // New: Creature's individual lifespan
        this.biomePreference = biomePreference; // New: Creature's preferred biome type index

        this.brain = brain || new NeuralNetwork(
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
     * @returns {{turnRate: number, speedAdjustment: number}} The actions determined by the brain.
     */
    think(globalFood, globalCreatures, biomeMap) {
        // Gather inputs (normalized 0-1)
        let foodAngleInput = 0.5; // Neutral if no food
        let foodDistanceInput = 0; // Farthest if no food (0 implies no food, 1 implies very close)
        let closestFood = null;
        let minFoodDistance = Infinity;

        // Find closest food within vision range
        for (const f of globalFood) {
            const dist = Math.sqrt((this.x - f.x) ** 2 + (this.y - f.y) ** 2);
            if (dist < minFoodDistance && dist <= this.visionRange) {
                minFoodDistance = dist;
                closestFood = f;
            }
        }

        if (closestFood) {
            const angleToFood = Math.atan2(closestFood.y - this.y, closestFood.x - this.x);
            let relativeAngle = normalizeAngle(angleToFood - this.direction);
            foodAngleInput = relativeAngle / (2 * Math.PI);

            // Normalize food distance: closer is higher value (1 is closest, 0 is furthest within vision)
            foodDistanceInput = 1 - (minFoodDistance / this.visionRange);
        }

        // New: Nearest other creature inputs
        let nearestCreatureAngleInput = 0.5; // Neutral if no other creature
        let nearestCreatureDistanceInput = 0; // Farthest if no other creature
        let closestOtherCreature = null;
        let minCreatureDistance = Infinity;

        for (const otherCreature of globalCreatures) {
            if (otherCreature !== this && otherCreature.isAlive) { // Don't consider self or dead creatures
                const dist = Math.sqrt((this.x - otherCreature.x) ** 2 + (this.y - otherCreature.y) ** 2);
                if (dist < minCreatureDistance && dist <= this.visionRange) {
                    minCreatureDistance = dist;
                    closestOtherCreature = otherCreature;
                }
            }
        }

        if (closestOtherCreature) {
            const angleToCreature = Math.atan2(closestOtherCreature.y - this.y, closestOtherCreature.x - this.x);
            let relativeAngle = normalizeAngle(angleToCreature - this.direction);
            nearestCreatureAngleInput = relativeAngle / (2 * Math.PI);
            nearestCreatureDistanceInput = 1 - (minCreatureDistance / this.visionRange);
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

        // New: Biome Preference input (normalized)
        const biomePreferenceInput = this.biomePreference / (BIOME_TYPES.length - 1);

        // New: Lifespan input (normalized)
        const lifespanInput = clamp(this.lifespan / (SIM_CONFIG.INITIAL_LIFESPAN_SECONDS * 60 * 2), 0, 1); // Normalize against double max initial lifespan


        const inputs = [
            foodAngleInput, foodDistanceInput, energyInput,
            wallXDistanceInput, wallYDistanceInput, biomeInput,
            visionRangeInput,
            nearestCreatureAngleInput, nearestCreatureDistanceInput, // New creature sensing inputs
            biomePreferenceInput, // New biome preference input
            lifespanInput // New lifespan input
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
     */
    draw(ctx) {
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
    }

    /**
     * Updates the creature's state each frame.
     * @param {number[][]} biomeMap - The global biome map.
     * @param {Food[]} globalFood - Array of all food items.
     * @param {Creature[]} globalCreatures - Array of all other creatures.
     * @param {number} mutationRate - Current mutation rate.
     * @param {number} mutationStrength - Current mutation strength.
     */
    update(biomeMap, globalFood, globalCreatures, mutationRate, mutationStrength) {
        this.age++;

        const currentBiome = this.getBiome(biomeMap);
        this.energy -= SIM_CONFIG.ENERGY_DECAY_BASE * currentBiome.movement_cost_multiplier;

        const { turnRate, speedAdjustment } = this.think(globalFood, globalCreatures, biomeMap); // Pass globalCreatures
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
     * Handles food consumption.
     * @param {number} foodIndex - The index of the food item in the global food array.
     * @param {Food[]} globalFood - The global food array.
     */
    eat(foodIndex, globalFood) {
        this.energy += SIM_CONFIG.ENERGY_FROM_FOOD;
        this.foodEatenCount++;
        globalFood.splice(foodIndex, 1);
        this.color = 'yellow'; // Flash yellow
        setTimeout(() => {
            this.color = this.originalColor;
        }, 100);
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

        // New: Reward/penalty based on biome preference
        const currentBiomeIndex = BIOME_TYPES.findIndex(b => b.type === currentBiome.type);
        const biomePreferenceDifference = Math.abs(this.biomePreference - currentBiomeIndex);
        baseFitness -= biomePreferenceDifference * SIM_CONFIG.BIOME_PREFERENCE_FITNESS_MULTIPLIER; // Penalty for being in a non-preferred biome


        // Reward for optimal speed (not too fast, not too slow)
        const speedDifference = Math.abs(this.speed - SIM_CONFIG.BASE_SPEED);
        baseFitness -= speedDifference * 10; // Penalty for deviating too much from base speed

        // Reward for efficient vision range
        baseFitness -= Math.abs(this.visionRange - SIM_CONFIG.INITIAL_VISION_RANGE) * 0.5; // Small penalty for deviating from initial vision

        // Penalty for frequent wall collisions
        baseFitness -= this.wallHits * SIM_CONFIG.WALL_COLLISION_FITNESS_PENALTY;

        // New: Reward for optimal lifespan (not too short, not too long relative to initial)
        const lifespanDifference = Math.abs(this.lifespan - (SIM_CONFIG.INITIAL_LIFESPAN_SECONDS * 60));
        baseFitness -= lifespanDifference * 0.1;


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
     * New: Mutates a creature's lifespan.
     * @param {number} parentLifespan - The parent's lifespan.
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {number} The new mutated lifespan.
     */
    mutateLifespan(parentLifespan, mutationRate, mutationStrength) {
        if (Math.random() < mutationRate) {
            return clamp(parentLifespan + (Math.random() - 0.5) * mutationStrength * SIM_CONFIG.LIFESPAN_MUTATION_STRENGTH * 60, // Multiply by 60 for seconds to frames
                10 * 60, // Minimum 10 seconds lifespan
                150 * 60 // Maximum 150 seconds lifespan
            );
        }
        return parentLifespan;
    }

    /**
     * New: Mutates a creature's biome preference.
     * @param {number} parentBiomePreference - The parent's biome preference.
     * @param {number} mutationRate - The current mutation rate.
     * @param {number} mutationStrength - The current mutation strength.
     * @returns {number} The new mutated biome preference.
     */
    mutateBiomePreference(parentBiomePreference, mutationRate, mutationStrength) {
        if (Math.random() < mutationRate) {
            const numBiomeTypes = BIOME_TYPES.length;
            let newPreference = parentBiomePreference + Math.round((Math.random() - 0.5) * mutationStrength * SIM_CONFIG.BIOME_PREFERENCE_MUTATION_STRENGTH * numBiomeTypes);
            return clamp(newPreference, 0, numBiomeTypes - 1);
        }
        return parentBiomePreference;
    }


    /**
     * Creates a clone of the creature for elitism, resetting mutable state.
     * @returns {Creature} A new Creature instance that is a clone.
     */
    cloneForNextGeneration() {
        const clonedCreature = new Creature(
            Math.random() * SIM_CONFIG.WORLD_WIDTH, // New random position for next gen
            Math.random() * SIM_CONFIG.WORLD_HEIGHT,
            this.originalColor, // Keep original color
            this.speed,
            this.size,
            this.brain, // Keep the same brain
            this.visionRange,
            this.lifespan, // Carry over lifespan
            this.biomePreference // Carry over biome preference
        );
        clonedCreature.fitness = this.fitness; // Carry over fitness for potential re-evaluation or reference
        return clonedCreature;
    }
}
