import { Particle } from './Particle.js';

export class ParticlePool {
	private pool: Particle[] = [];
	private activeParticles: Particle[] = [];
	private maxPoolSize: number;

	constructor(maxPoolSize: number = 1000) {
		this.maxPoolSize = maxPoolSize;
		// Pre-populate pool
		for (let i = 0; i < maxPoolSize; i++) {
			this.pool.push(new Particle());
		}
	}

	public getParticle(): Particle | null {
		let particle = this.pool.pop();
		if (!particle) {
			// Pool exhausted, create new particle if under limit
			if (this.activeParticles.length < this.maxPoolSize) {
				particle = new Particle();
			} else {
				return null;
			}
		}
		
		particle.reset();
		particle.active = true;
		this.activeParticles.push(particle);
		return particle;
	}

	public update(canvasWidth: number, canvasHeight: number): void {
		for (let i = this.activeParticles.length - 1; i >= 0; i--) {
			const particle = this.activeParticles[i];
			particle.update();

			// Check if particle should be recycled
			if (!particle.active || particle.isOutOfBounds(canvasWidth, canvasHeight)) {
				this.recycleParticle(i);
			}
		}
	}

	private recycleParticle(index: number): void {
		const particle = this.activeParticles.splice(index, 1)[0];
		particle.reset();
		this.pool.push(particle);
	}

	public getActiveParticles(): Particle[] {
		return this.activeParticles;
	}

	public getActiveCount(): number {
		return this.activeParticles.length;
	}

	public getPoolCount(): number {
		return this.pool.length;
	}
}
