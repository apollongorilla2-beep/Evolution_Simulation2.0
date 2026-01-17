export const SIM_CONFIG = {
    WORLD_WIDTH: 800,
    WORLD_HEIGHT: 600,
    FIXED_POPULATION_SIZE: 100,
    CREATURE_BASE_RADIUS: 5,
    ENERGY_DECAY_BASE: 0.03,
    ENERGY_FROM_FOOD: 100,
    REPRODUCTION_THRESHOLD: 250,
    REPRODUCTION_ENERGY_COST: 150, // New: Energy cost for a creature to reproduce
    BASE_SPEED: 1.5,
    WALL_HIT_PENALTY: 10,
    PARENT_SELECTION_PERCENTAGE: 0.2, // Percentage of fittest creatures selected for breeding
    ELITE_PERCENTAGE: 0.05, // Percentage of top creatures to carry over directly (elitism)
    BIOME_GRID_X: 4,
    BIOME_GRID_Y: 3,
    MAX_DATA_POINTS: 500, // Max data points for charts
    FOOD_SPAWN_MULTIPLIER: 10, // Multiplier for biome food spawn chance
    FOOD_SPAWN_RATE: 0.1, // New: Average number of food items to spawn per frame (if below max)
    COLLISION_RADIUS_OFFSET: 3, // Additional radius for food collision
    BRAIN_INPUT_NODES: 11, // UPDATED: Food Angle, Food Dist, Energy, Wall X Dist, Wall Y Dist, Biome Type, Vision Range, Nearest Creature Angle, Nearest Creature Dist, Biome Preference, Lifespan
    BRAIN_HIDDEN_NODES: 12, // Increased hidden nodes for more complexity
    BRAIN_OUTPUT_NODES: 2, // Turn Rate, Speed Adjustment
    MAX_TURN_RATE: 0.4, // Max turn rate in radians
    MAX_SPEED_ADJUSTMENT: 1.0, // Max speed adjustment factor
    INITIAL_VISION_RANGE: 100,
    WALL_COLLISION_FITNESS_PENALTY: 50, // Direct fitness penalty for hitting walls
    INITIAL_LIFESPAN_SECONDS: 50, // New: Default initial lifespan in seconds
    LIFESPAN_MUTATION_STRENGTH: 0.1, // How much lifespan can mutate
    BIOME_PREFERENCE_MUTATION_STRENGTH: 0.2, // How much biome preference can mutate
    BIOME_PREFERENCE_FITNESS_MULTIPLIER: 50, // How strongly biome preference affects fitness
};

export const BIOME_TYPES = [
    // Updated colors to fit new dark theme
    { type: 'grassland', color: '#3f6d3f', movement_cost_multiplier: 1.0, food_spawn_chance: 0.005, base_adaptation_score: 1.0, description: 'Normal movement, average food.' },
    { type: 'desert', color: '#b88b4a', movement_cost_multiplier: 1.2, food_spawn_chance: 0.002, base_adaptation_score: 0.8, description: 'Slower movement, less food.' },
    { type: 'water', color: '#3a6ea5', movement_cost_multiplier: 1.5, food_spawn_chance: 0.008, base_adaptation_score: 1.2, description: 'Harder to move, but more food.' },
    { type: 'forest', color: '#2b5a2b', movement_cost_multiplier: 1.1, food_spawn_chance: 0.006, base_adaptation_score: 1.1, description: 'Slightly slower, good food.' },
    { type: 'mountain', color: '#5e5e5e', movement_cost_multiplier: 1.8, food_spawn_chance: 0.001, base_adaptation_score: 0.7, description: 'Very slow movement, sparse food.' },
];
