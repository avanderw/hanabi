import { ParticlePool } from './ParticlePool.js';
import { Particle } from './Particle.js';

export type PaletteType = 'fire' | 'blue' | 'purple';

export class HanabiEffect {
	private canvas: HTMLCanvasElement;
	private glowCanvas: HTMLCanvasElement;
	private trailCanvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private glowCtx: CanvasRenderingContext2D;
	private trailCtx: CanvasRenderingContext2D;
	private particlePool: ParticlePool;
	private explosionSize: number;
	private animationId: number | null = null;
	private colorMultiplier: number = 0.8;
	private colorDirection: number = 1;
	private lastTime: number = 0;
	private targetFPS: number = 30;
	private frameInterval: number;
	private fpsCounter: number = 0;
	private fpsLastTime: number = 0;
	private currentFPS: number = 0;

	// Color palettes for different explosion types
	private readonly colorPalettes = {
		fire: [
			{ hue: 357, saturation: 73, lightness: 47 }, // Fire Engine Red
			{ hue: 58, saturation: 100, lightness: 84 },  // Calamansi
			{ hue: 46, saturation: 100, lightness: 74 },  // Jasmine
			{ hue: 9, saturation: 100, lightness: 65 },   // Tomato
			{ hue: 352, saturation: 44, lightness: 39 }   // Smoky Topaz
		],
		blue: [
			{ hue: 220, saturation: 85, lightness: 60 },  // Deep Sky Blue
			{ hue: 200, saturation: 90, lightness: 75 },  // Light Blue
			{ hue: 240, saturation: 80, lightness: 50 },  // Royal Blue
			{ hue: 180, saturation: 95, lightness: 70 },  // Cyan
			{ hue: 210, saturation: 70, lightness: 40 }   // Dark Blue
		],
		purple: [
			{ hue: 280, saturation: 85, lightness: 60 },  // Medium Purple
			{ hue: 300, saturation: 90, lightness: 70 },  // Magenta
			{ hue: 260, saturation: 80, lightness: 50 },  // Blue Violet
			{ hue: 320, saturation: 75, lightness: 65 },  // Orchid
			{ hue: 270, saturation: 65, lightness: 45 }   // Dark Violet
		]
	};

	constructor(
		canvas: HTMLCanvasElement,
		glowCanvas: HTMLCanvasElement,
		trailCanvas: HTMLCanvasElement,
		explosionSize: number = 10,
		fps: number = 30
	) {
		this.canvas = canvas;
		this.glowCanvas = glowCanvas;
		this.trailCanvas = trailCanvas;
		this.explosionSize = explosionSize;
		this.targetFPS = Math.min(60, Math.max(1, fps));
		this.frameInterval = 1000 / this.targetFPS;
		
		const ctx = canvas.getContext('2d');
		const glowCtx = glowCanvas.getContext('2d');
		const trailCtx = trailCanvas.getContext('2d');
		
		if (!ctx || !glowCtx || !trailCtx) {
			throw new Error('Failed to get 2D context');
		}
		
		this.ctx = ctx;
		this.glowCtx = glowCtx;
		this.trailCtx = trailCtx;
		this.particlePool = new ParticlePool(2000);
		
		// Set up glow canvas (1/4 scale)
		this.glowCanvas.width = Math.floor(canvas.width / 4);
		this.glowCanvas.height = Math.floor(canvas.height / 4);
		
		// Configure contexts
		this.ctx.imageSmoothingEnabled = false; // Keep particles sharp
		this.glowCtx.imageSmoothingEnabled = false; // Disable smoothing to lose pixels during scaling
		this.trailCtx.imageSmoothingEnabled = true; // Enable smoothing for blur effect
	}

	public explode(x: number, y: number, palette: PaletteType = 'fire'): void {
		// Create 200 particles for the explosion (matching original)
		for (let i = 0; i < 200; i++) {
			this.createParticle(x, y, palette);
		}
	}

	public explodeRandom(x: number, y: number): void {
		// Randomly select a palette for the explosion
		const palettes: PaletteType[] = ['fire', 'blue', 'purple'];
		const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];
		this.explode(x, y, randomPalette);
	}

	public getAvailablePalettes(): PaletteType[] {
		return Object.keys(this.colorPalettes) as PaletteType[];
	}

	private createParticle(x: number, y: number, palette: PaletteType): void {
		const particle = this.particlePool.getParticle();
		if (!particle) return;

		particle.x = x;
		particle.y = y;

		// Random explosion pattern (polar coordinates)
		const radius = Math.sqrt(Math.random()) * this.explosionSize;
		const angle = Math.random() * Math.PI * 2;
		
		particle.vx = Math.cos(angle) * radius;
		particle.vy = Math.sin(angle) * radius;
		
		// Get the selected color palette
		const colors = this.colorPalettes[palette];
		
		// Randomly select a color from the specified palette
		const baseColor = colors[Math.floor(Math.random() * colors.length)];
		
		// Add slight variation to create sparkle variety while keeping the base colors recognizable
		const hue = baseColor.hue + (Math.random() - 0.5) * 10; // ±5° hue variation
		const saturation = Math.max(30, Math.min(100, baseColor.saturation + (Math.random() - 0.5) * 20)); // ±10% saturation variation
		const lightness = Math.max(30, Math.min(90, baseColor.lightness + (Math.random() - 0.5) * 20)); // ±10% lightness variation
		
		particle.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
		particle.life = 1.0;
		particle.maxLife = 1.0;
	}

	public start(): void {
		if (this.animationId !== null) return;
		this.lastTime = performance.now();
		this.fpsLastTime = performance.now();
		this.fpsCounter = 0;
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
			
			// Update FPS counter
			this.fpsCounter++;
			if (currentTime - this.fpsLastTime >= 1000) {
				this.currentFPS = Math.round((this.fpsCounter * 1000) / (currentTime - this.fpsLastTime));
				this.fpsCounter = 0;
				this.fpsLastTime = currentTime;
			}
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
		// Step 1: Apply trail effect (blur + fade) to trail canvas
		// This mimics the original AS3: canvas.bitmapData.applyFilter() + colorTransform()
		this.applyTrailEffect();

		// Step 2: Clear particle canvas (we draw fresh particles each frame)
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		
		// Step 3: Draw fresh particles to both particle canvas AND trail canvas
		// This mimics the original AS3: canvas.bitmapData.setPixel32(p.x, p.y, p.c);
		this.ctx.globalCompositeOperation = 'source-over';
		this.trailCtx.globalCompositeOperation = 'source-over';
		
		const particles = this.particlePool.getActiveParticles();
		
		for (const particle of particles) {
			const alpha = particle.life / particle.maxLife;
			const color = this.adjustColorAlpha(particle.color, alpha);
			
			// Draw to particle canvas (sharp, current frame only)
			this.ctx.fillStyle = color;
			this.ctx.fillRect(Math.floor(particle.x), Math.floor(particle.y), 1, 1);
			
			// Draw to trail canvas with reduced alpha for more subtle trails
			// Make trail particles dimmer so they don't dominate
			const trailAlpha = alpha * 0.6; // Slightly more visible trails
			const trailColor = this.adjustColorAlpha(particle.color, trailAlpha);
			this.trailCtx.fillStyle = trailColor;
			this.trailCtx.fillRect(Math.floor(particle.x), Math.floor(particle.y), 1, 1);
		}

		// Step 4: Create sparkle effect by scaling down particle canvas to glow canvas
		// Clear glow canvas first
		this.glowCtx.clearRect(0, 0, this.glowCanvas.width, this.glowCanvas.height);
		
		this.glowCtx.globalCompositeOperation = 'source-over';
		this.glowCtx.drawImage(
			this.canvas,
			0, 0, this.canvas.width, this.canvas.height,
			0, 0, this.glowCanvas.width, this.glowCanvas.height
		);
	}

	private applyTrailEffect(): void {
		// Mimic the AS3 colorTransform effect - just fade, no blur
		// In AS3: colorTransform(.8, .8, .9, .8) reduces colors each frame
		
		// Apply fade effect by drawing a semi-transparent rectangle over the trail canvas
		// This gradually reduces the alpha of existing pixels
		this.trailCtx.globalCompositeOperation = 'destination-out';
		this.trailCtx.fillStyle = `rgba(0, 0, 0, ${1 - 0.95})`; // Remove only 5% alpha per frame (slower fade)
		this.trailCtx.fillRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
		
		// Reset composite operation for drawing particles
		this.trailCtx.globalCompositeOperation = 'source-over';
	}

	private adjustColorAlpha(color: string, alpha: number): string {
		// Convert HSL to HSLA with alpha
		if (color.startsWith('hsl(')) {
			return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
		}
		return color;
	}

	public getStats(): { active: number; pooled: number; fps: number } {
		return {
			active: this.particlePool.getActiveCount(),
			pooled: this.particlePool.getPoolCount(),
			fps: this.currentFPS
		};
	}

	public destroy(): void {
		this.stop();
	}
}
