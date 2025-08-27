import { ParticlePool } from './ParticlePool.js';
import { Particle } from './Particle.js';

export class HanabiEffect {
	private canvas: HTMLCanvasElement;
	private glowCanvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private glowCtx: CanvasRenderingContext2D;
	private particlePool: ParticlePool;
	private explosionSize: number;
	private animationId: number | null = null;
	private colorMultiplier: number = 0.8;
	private colorDirection: number = 1;
	private lastTime: number = 0;
	private targetFPS: number = 30;
	private frameInterval: number;

	constructor(
		canvas: HTMLCanvasElement,
		glowCanvas: HTMLCanvasElement,
		explosionSize: number = 10,
		fps: number = 30
	) {
		this.canvas = canvas;
		this.glowCanvas = glowCanvas;
		this.explosionSize = explosionSize;
		this.targetFPS = Math.min(60, Math.max(1, fps));
		this.frameInterval = 1000 / this.targetFPS;
		
		const ctx = canvas.getContext('2d');
		const glowCtx = glowCanvas.getContext('2d');
		
		if (!ctx || !glowCtx) {
			throw new Error('Failed to get 2D context');
		}
		
		this.ctx = ctx;
		this.glowCtx = glowCtx;
		this.particlePool = new ParticlePool(2000);
		
		// Set up glow canvas (1/4 scale)
		this.glowCanvas.width = Math.floor(canvas.width / 4);
		this.glowCanvas.height = Math.floor(canvas.height / 4);
		
		// Configure contexts
		this.ctx.imageSmoothingEnabled = false; // Keep particles sharp
		this.glowCtx.imageSmoothingEnabled = true; // Allow glow to be smoothed when scaled
	}

	public explode(x: number, y: number): void {
		// Create 200 particles for the explosion (matching original)
		for (let i = 0; i < 200; i++) {
			this.createParticle(x, y);
		}
	}

	private createParticle(x: number, y: number): void {
		const particle = this.particlePool.getParticle();
		if (!particle) return;

		particle.x = x;
		particle.y = y;

		// Random explosion pattern (polar coordinates)
		const radius = Math.sqrt(Math.random()) * this.explosionSize;
		const angle = Math.random() * Math.PI * 2;
		
		particle.vx = Math.cos(angle) * radius;
		particle.vy = Math.sin(angle) * radius;
		
		// More vibrant colors with higher saturation and lightness for better glow
		const colorType = Math.random();
		let hue: number;
		
		if (colorType < 0.4) {
			// Gold/yellow particles
			hue = 45 + Math.random() * 15;
		} else if (colorType < 0.7) {
			// Orange/red particles  
			hue = 15 + Math.random() * 30;
		} else {
			// White/blue particles for variety
			hue = 200 + Math.random() * 60;
		}
		
		const saturation = 70 + Math.random() * 30; // Higher saturation
		const lightness = 70 + Math.random() * 30;  // Higher lightness for better glow
		particle.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
		particle.life = 1.0;
		particle.maxLife = 1.0;
	}

	public start(): void {
		if (this.animationId !== null) return;
		this.lastTime = performance.now();
		this.animate();
	}

	public stop(): void {
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	private animate = (): void => {
		const currentTime = performance.now();
		const deltaTime = currentTime - this.lastTime;

		if (deltaTime >= this.frameInterval) {
			this.update();
			this.render();
			this.lastTime = currentTime - (deltaTime % this.frameInterval);
		}

		this.animationId = requestAnimationFrame(this.animate);
	};

	private update(): void {
		// Update color multiplier (similar to original color transform)
		this.colorMultiplier += this.colorDirection * 0.01;
		if (this.colorMultiplier > 0.9) {
			this.colorDirection = -1;
		} else if (this.colorMultiplier < 0.8) {
			this.colorDirection = 1;
		}

		// Update particles
		this.particlePool.update(this.canvas.width, this.canvas.height);
	}

	private render(): void {
		// Instead of fade, we'll manage particle trails through particle life
		// Clear both canvases completely each frame for true transparency
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.glowCtx.clearRect(0, 0, this.glowCanvas.width, this.glowCanvas.height);

		// Render particles on main canvas (transparent background)
		this.ctx.globalCompositeOperation = 'source-over';
		const particles = this.particlePool.getActiveParticles();
		
		// First, draw all particles to main canvas
		for (const particle of particles) {
			const alpha = particle.life / particle.maxLife;
			const color = this.adjustColorAlpha(particle.color, alpha); 

			// Render main particle - sharp and clean
			this.ctx.fillStyle = color;
			this.ctx.fillRect(Math.floor(particle.x), Math.floor(particle.y), 1, 1);
		}

		// Now create glow by drawing particles directly to glow canvas at 1/4 scale
		// This creates the blur effect through pixel loss during scaling
		this.glowCtx.globalCompositeOperation = 'source-over';
		
		for (const particle of particles) {
			const alpha = particle.life / particle.maxLife;
			// Make glow slightly more transparent and colorful
			const color = this.adjustColorAlpha(particle.color, alpha * 0.6); 

			// Draw to glow canvas at 1/4 position - this will be scaled up 4x
			this.glowCtx.fillStyle = color;
			this.glowCtx.fillRect(
				Math.floor(particle.x / 4),
				Math.floor(particle.y / 4),
				1, 1
			);
		}
	}

	private adjustColorAlpha(color: string, alpha: number): string {
		// Convert HSL to HSLA with alpha
		if (color.startsWith('hsl(')) {
			return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
		}
		return color;
	}

	public getStats(): { active: number; pooled: number } {
		return {
			active: this.particlePool.getActiveCount(),
			pooled: this.particlePool.getPoolCount()
		};
	}

	public destroy(): void {
		this.stop();
	}
}
