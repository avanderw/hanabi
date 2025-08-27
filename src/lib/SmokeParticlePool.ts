import { SmokeParticle } from './SmokeParticle.js';

export class SmokeParticlePool {
	private particles: SmokeParticle[] = [];
	private poolSize: number;

	constructor(poolSize: number = 500) {
		this.poolSize = poolSize;
		this.initializePool();
	}

	private initializePool(): void {
		for (let i = 0; i < this.poolSize; i++) {
			this.particles.push(new SmokeParticle());
		}
	}

	public getParticle(): SmokeParticle | null {
		for (const particle of this.particles) {
			if (!particle.active) {
				particle.active = true;
				return particle;
			}
		}
		return null; // Pool is full
	}

	public returnParticle(particle: SmokeParticle): void {
		particle.reset();
	}

	public update(width: number, height: number): void {
		for (const particle of this.particles) {
			if (particle.active) {
				particle.update();
				
				// Check if particle should be deactivated
				if (!particle.active || particle.isOutOfBounds(width, height)) {
					this.returnParticle(particle);
				}
			}
		}
	}

	public getActiveParticles(): SmokeParticle[] {
		return this.particles.filter(p => p.active);
	}

	public getActiveCount(): number {
		return this.particles.filter(p => p.active).length;
	}

	public getPoolCount(): number {
		return this.particles.filter(p => !p.active).length;
	}
}
