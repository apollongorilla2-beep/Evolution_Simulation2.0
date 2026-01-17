export const SIM_CONFIG = {
    WORLD_WIDTH: 800,
    WORLD_HEIGHT: 600,
    FIXED_POPULATION_SIZE: 100,
    CREATURE_BASE_RADIUS: 5,
    ENERGY_DECAY_BASE: 0.03, // Base metabolism rate
    ENERGY_FROM_FOOD: 100,
    REPRODUCTION_THRESHOLD: 250,
    REPRODUCTION_ENERGY_COST: 150, // Energy cost for a creature to reproduce
    BASE_SPEED: 1.5,
    WALL_HIT_PENALTY: 10,
    PARENT_SELECTION_PERCENTAGE: 0.2, // Percentage of fittest creatures selected for breeding
    ELITE_PERCENTAGE: 0.05, // Percentage of top creatures to carry over directly (elitism)
    BIOME_GRID_X: 4,
    BIOME_GRID_Y: 3,
    MAX_DATA_POINTS: 500, // Max data points for charts
    FOOD_SPAWN_MULTIPLIER: 10, // Multiplier for biome food spawn chance
    FOOD_SPAWN_RATE: 0.1, // Average number of food items to spawn per frame (if below max)
    COLLISION_RADIUS_OFFSET: 3, // Additional radius for food collision
    BRAIN_INPUT_NODES: 15, // UPDATED: Food Angle, Food Dist, Energy, Wall X Dist, Wall Y Dist, Biome Type, Vision Range, Nearest Creature Angle, Nearest Creature Dist, Biome Preference, Lifespan, Diet Type, Sensory Dist, Current Temp, Hazard Proximity
    BRAIN_HIDDEN_NODES: 16, // Increased hidden nodes for more complexity
    BRAIN_OUTPUT_NODES: 2, // Turn Rate, Speed Adjustment (Aggression/Avoidance can be implicit from creature sensing inputs)
    MAX_TURN_RATE: 0.4, // Max turn rate in radians
    MAX_SPEED_ADJUSTMENT: 1.0, // Max speed adjustment factor
    INITIAL_VISION_RANGE: 100,
    WALL_COLLISION_FITNESS_PENALTY: 50, // Direct fitness penalty for hitting walls
    INITIAL_LIFESPAN_SECONDS: 50, // Default initial lifespan in seconds
    LIFESPAN_MUTATION_STRENGTH: 0.1, // How much lifespan can mutate
    BIOME_PREFERENCE_MUTATION_STRENGTH: 0.2, // How much biome preference can mutate
    BIOME_PREFERENCE_FITNESS_MULTIPLIER: 50, // How strongly biome preference affects fitness

    // New Genetic Trait Defaults & Mutation Strengths
    INITIAL_DIET_TYPE: 0, // 0 = Herbivore, 1 = Carnivore
    DIET_TYPE_MUTATION_STRENGTH: 0.5, // Chance to flip diet type
    INITIAL_ATTACK_POWER: 10,
    ATTACK_POWER_MUTATION_STRENGTH: 0.5,
    INITIAL_DEFENSE: 5,
    DEFENSE_MUTATION_STRENGTH: 0.5,
    INITIAL_METABOLISM_RATE: 0.03, // Multiplier for ENERGY_DECAY_BASE
    METABOLISM_MUTATION_STRENGTH: 0.01,
    INITIAL_REPRODUCTION_COOLDOWN: 60, // Frames
    REPRODUCTION_COOLDOWN_MUTATION_STRENGTH: 10,
    INITIAL_CLUTCH_SIZE: 2,
    CLUTCH_SIZE_MUTATION_STRENGTH: 0.5,
    INITIAL_SENSORY_RANGE: 50, // For scent/hearing
    SENSORY_RANGE_MUTATION_STRENGTH: 10,
    INITIAL_OPTIMAL_TEMPERATURE: 0.5, // Normalized 0-1 (e.g., 0=cold, 0.5=mild, 1=hot)
    OPTIMAL_TEMPERATURE_MUTATION_STRENGTH: 0.1,

    // Combat System
    COMBAT_RANGE: 10, // Distance within which creatures can engage in combat
    COMBAT_ENERGY_COST: 5, // Energy cost per combat round
    COMBAT_DAMAGE_MULTIPLIER: 0.5, // Multiplier for attack power to actual damage
    MEAT_FROM_DEAD_CREATURE: 80, // Energy value of meat from a dead creature

    // Environmental Dynamics
    HAZARD_ENERGY_DRAIN: 0.5, // Energy drain per frame in hazardous biomes
    TEMPERATURE_EFFECT_MULTIPLIER: 0.01, // How much temperature deviation affects energy decay
    FOOD_TOXICITY_CHANCE: 0.1, // 10% chance for food to be toxic
    TOXIC_FOOD_ENERGY_LOSS: 50, // Energy loss from toxic food
    MATING_RANGE: 15, // Distance within which creatures can mate
};

export const BIOME_TYPES = [
    // Updated colors to fit new dark theme
    { type: 'grassland', color: '#3f6d3f', movement_cost_multiplier: 1.0, food_spawn_chance: 0.005, base_adaptation_score: 1.0, is_hazardous: false, optimal_temp_range: [0.3, 0.7], description: 'Normal movement, average food, mild temp.' },
    { type: 'desert', color: '#b88b4a', movement_cost_multiplier: 1.2, food_spawn_chance: 0.002, base_adaptation_score: 0.8, is_hazardous: false, optimal_temp_range: [0.7, 1.0], description: 'Slower movement, less food, hot temp.' },
    { type: 'water', color: '#3a6ea5', movement_cost_multiplier: 1.5, food_spawn_chance: 0.008, base_adaptation_score: 1.2, is_hazardous: false, optimal_temp_range: [0.0, 0.4], description: 'Harder to move, but more food, cold temp.' },
    { type: 'forest', color: '#2b5a2b', movement_cost_multiplier: 1.1, food_spawn_chance: 0.006, base_adaptation_score: 1.1, is_hazardous: false, optimal_temp_range: [0.2, 0.6], description: 'Slightly slower, good food, cool temp.' },
    { type: 'mountain', color: '#5e5e5e', movement_cost_multiplier: 1.8, food_spawn_chance: 0.001, base_adaptation_score: 0.7, is_hazardous: true, optimal_temp_range: [0.1, 0.3], description: 'Very slow movement, sparse food, hazardous, cold temp.' }, // Example hazard
    { type: 'toxic_swamp', color: '#6a008a', movement_cost_multiplier: 1.3, food_spawn_chance: 0.004, base_adaptation_score: 0.5, is_hazardous: true, optimal_temp_range: [0.4, 0.6], description: 'Slow movement, some food, highly hazardous, mild temp.' }, // Another hazard
];
