export class Particle {
	public x: number = 0;
	public y: number = 0;
	public vx: number = 0;
	public vy: number = 0;
	public color: string = 'rgba(255, 255, 255, 1)';
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
		this.color = 'rgba(255, 255, 255, 1)';
		this.life = 1.0;
		this.maxLife = 1.0;
		this.active = false;
	}

	public update(): void {
		if (!this.active) return;

		// Apply gravity and drag (similar to original AS3)
		this.vy += 0.2; // gravity
		this.vx *= 0.9; // drag
		this.vy *= 0.9; // drag
		
		// Update position
		this.x += this.vx;
		this.y += this.vy;
		
		// Update life
		this.life -= 0.01;
		
		// Deactivate if life is depleted or velocity too low
		if (this.life <= 0 || (Math.abs(this.vx) < 0.01 && Math.abs(this.vy) < 0.01)) {
			this.active = false;
		}
	}

	public isOutOfBounds(width: number, height: number): boolean {
		return this.x < 0 || this.x > width || this.y < 0 || this.y > height;
	}
}
