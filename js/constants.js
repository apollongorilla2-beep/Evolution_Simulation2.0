export const SIM_CONFIG = {
    WORLD_WIDTH: 800,
    WORLD_HEIGHT: 600,
    FIXED_POPULATION_SIZE: 100,
    CREATURE_BASE_RADIUS: 5,
    ENERGY_DECAY_BASE: 0.03,
    ENERGY_FROM_FOOD: 100,
    REPRODUCTION_THRESHOLD: 250,
    BASE_SPEED: 1.5,
    WALL_HIT_PENALTY: 10,
    PARENT_SELECTION_PERCENTAGE: 0.2,
    BIOME_GRID_X: 4,
    BIOME_GRID_Y: 3,
    MAX_DATA_POINTS: 500, // Max data points for charts
    FOOD_SPAWN_MULTIPLIER: 10, // Multiplier for biome food spawn chance
    COLLISION_RADIUS_OFFSET: 3, // Additional radius for food collision
    BRAIN_INPUT_NODES: 7, // Food Angle, Food Dist, Energy, Wall X Dist, Wall Y Dist, Biome Type, Vision Range
    BRAIN_HIDDEN_NODES: 8, // Increased hidden nodes for more complexity
    BRAIN_OUTPUT_NODES: 2, // Turn Rate, Speed Adjustment
    MAX_TURN_RATE: 0.4, // Max turn rate in radians
    MAX_SPEED_ADJUSTMENT: 1.0, // Max speed adjustment factor
    INITIAL_VISION_RANGE: 100,
};

export const BIOME_TYPES = [
    { type: 'grassland', color: '#558B2F', movement_cost_multiplier: 1.0, food_spawn_chance: 0.005, base_adaptation_score: 1.0, description: 'Normal movement, average food.' },
    { type: 'desert', color: '#FFCC80', movement_cost_multiplier: 1.2, food_spawn_chance: 0.002, base_adaptation_score: 0.8, description: 'Slower movement, less food.' },
    { type: 'water', color: '#42A5F5', movement_cost_multiplier: 1.5, food_spawn_chance: 0.008, base_adaptation_score: 1.2, description: 'Harder to move, but more food.' },
    { type: 'forest', color: '#2E7D32', movement_cost_multiplier: 1.1, food_spawn_chance: 0.006, base_adaptation_score: 1.1, description: 'Slightly slower, good food.' },
    { type: 'mountain', color: '#757575', movement_cost_multiplier: 1.8, food_spawn_chance: 0.001, base_adaptation_score: 0.7, description: 'Very slow movement, sparse food.' },
];
