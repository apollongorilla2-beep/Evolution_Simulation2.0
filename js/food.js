export class Food {
    /**
     * Creates a new Food instance.
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.color = 'lime';
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
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}
