export class SmokeParticle {
	public x: number = 0;
	public y: number = 0;
	public vx: number = 0;
	public vy: number = 0;
	public size: number = 1;
	public life: number = 1.0;
	public maxLife: number = 1.0;
	public active: boolean = false;

	constructor() {
		this.reset();
	}

	public reset(): void {
		this.x = 0;
		this.y = 0;
		this.vx = 0;
		this.vy = 0;
		this.size = 1;
		this.life = 1.0;
		this.maxLife = 1.0;
		this.active = false;
	}

	public update(): void {
		if (!this.active) return;

		// Add slight random drift for more natural movement
		this.vx += (Math.random() - 0.5) * 0.02;
		this.vy += (Math.random() - 0.5) * 0.01;

		// Smoke behavior: barely rise, spread horizontally more, like a puff
		this.vy -= 0.015; // Much slower upward movement - just a gentle drift
		this.vx *= 0.95; // More drag for realistic puff behavior
		this.vy *= 0.92; // More vertical drag to settle quickly
		
		// Update position
		this.x += this.vx;
		this.y += this.vy;
		
		// Grow faster over time (smoke expands like a larger puff)
		this.size += 0.08; // Expand even faster for bigger cloud effect
		
		// Update life for fading effect (shorter lived puff)
		this.life -= 0.012; // Faster fade - shorter lived puff
		
		// Deactivate when life is gone
		if (this.life <= 0) {
			this.active = false;
		}
	}

	public isOutOfBounds(width: number, height: number): boolean {
		// Allow smoke to go higher off-screen (smoke rises)
		return this.x < -50 || this.x > width + 50 || this.y > height + 50;
	}

	public getAlpha(): number {
		// Fade out gradually, with extra fade at the end
		const lifeFactor = this.life / this.maxLife;
		// Make it even more subtle and fade out faster at the end
		return Math.min(0.25, lifeFactor * 0.25 * Math.sqrt(lifeFactor)); // Max alpha of 0.25, with faster end fade
	}

	public getColor(): string {
		const alpha = this.getAlpha();
		// Smoke is light grayish-white, more subtle
		return `rgba(180, 180, 180, ${alpha})`;
	}
}
