import { SIM_CONFIG } from './constants.js';

export class Food {
    /**
     * Creates a new Food instance.
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {string} [type='plant'] - Type of food ('plant' or 'meat').
     * @param {number} [energyValue=SIM_CONFIG.ENERGY_FROM_FOOD] - Energy provided by this food item.
     * @param {boolean} [isToxic=false] - Whether this food item is toxic.
     */
    constructor(x, y, type = 'plant', energyValue = SIM_CONFIG.ENERGY_FROM_FOOD, isToxic = false) {
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.color = type === 'plant' ? 'lime' : 'red'; // Different colors for plant/meat
        this.type = type; // New: Food type
        this.energyValue = energyValue; // New: Variable energy value
        this.isToxic = isToxic; // New: Toxicity flag
    }

    /**
     * Draws the food on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     * @param {boolean} showFood - Whether food should be visible.
     */
    draw(ctx, showFood) {
        if (!showFood) return;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isToxic ? 'purple' : this.color; // Toxic food is purple
        ctx.fill();
        ctx.strokeStyle = this.isToxic ? 'darkred' : 'green';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }
}
