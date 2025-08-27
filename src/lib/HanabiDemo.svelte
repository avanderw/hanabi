<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { HanabiEffect } from '$lib/HanabiEffect.js';

	let canvasContainer: HTMLDivElement;
	let particleCanvas: HTMLCanvasElement;
	let glowCanvas: HTMLCanvasElement;
	let trailCanvas: HTMLCanvasElement;
	let backgroundCanvas: HTMLCanvasElement;
	let compositeCanvas: HTMLCanvasElement;
	let hanabiEffect: HanabiEffect;
	
	let showParticlesOnly = false;
	let showGlowOnly = false;
	let showTrailOnly = false;
	let stats = { active: 0, pooled: 0 };
	let isRunning = false;

	const CANVAS_WIDTH = 800;
	const CANVAS_HEIGHT = 600;

	onMount(() => {
		setupCanvases();
		hanabiEffect = new HanabiEffect(particleCanvas, glowCanvas, trailCanvas, 15, 30);
		// Initialize to composite view
		toggleView('composite');
		// Always start animation and auto explode
		hanabiEffect.start();
		isRunning = true;
		updateStats();
		startAutoExplode();
	});

	onDestroy(() => {
		if (hanabiEffect) {
			hanabiEffect.destroy();
		}
		if (autoExplodeInterval) {
			clearInterval(autoExplodeInterval);
		}
	});

	function setupCanvases() {
		// Set canvas sizes
		[particleCanvas, glowCanvas, trailCanvas, backgroundCanvas, compositeCanvas].forEach(canvas => {
			canvas.width = CANVAS_WIDTH;
			canvas.height = CANVAS_HEIGHT;
		});

		// Style background canvas (bottom layer)
		backgroundCanvas.style.position = 'absolute';
		backgroundCanvas.style.top = '0';
		backgroundCanvas.style.left = '0';
		backgroundCanvas.style.zIndex = '0'; // Bottom layer
		
		// Fill background canvas with black
		const bgCtx = backgroundCanvas.getContext('2d');
		if (bgCtx) {
			bgCtx.fillStyle = '#000';
			bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		}

		// Style trail canvas (layer 1 - above background)
		trailCanvas.style.position = 'absolute';
		trailCanvas.style.top = '0';
		trailCanvas.style.left = '0';
		trailCanvas.style.zIndex = '1'; // Trail layer

		// Style glow canvas (layer 2 - above trail)
		glowCanvas.style.position = 'absolute';
		glowCanvas.style.top = '0';
		glowCanvas.style.left = '0';
		glowCanvas.style.zIndex = '2'; // Glow layer
		// Use pixelated rendering to match PixelSnapping.NEVER effect - creates sparkle/aliasing
		glowCanvas.style.imageRendering = 'pixelated';

		// Style particle canvas (top layer)
		particleCanvas.style.position = 'absolute';
		particleCanvas.style.top = '0';
		particleCanvas.style.left = '0';
		particleCanvas.style.zIndex = '3'; // Particles on top

		compositeCanvas.style.position = 'absolute';
		compositeCanvas.style.top = '0';
		compositeCanvas.style.left = '0';
		compositeCanvas.style.zIndex = '4';
	}

	function updateStats() {
		if (hanabiEffect && isRunning) {
			stats = hanabiEffect.getStats();
			setTimeout(updateStats, 100);
		}
	}

	function handleCanvasClick(event: MouseEvent) {
		if (!hanabiEffect) return;
		
		const rect = canvasContainer.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		
		hanabiEffect.explode(x, y);
	}

	function toggleView(mode: 'particles' | 'glow' | 'trail' | 'composite') {
		showParticlesOnly = mode === 'particles';
		showGlowOnly = mode === 'glow';
		showTrailOnly = mode === 'trail';

		// Reset all canvas positioning and transforms
		backgroundCanvas.style.left = '0';
		particleCanvas.style.left = '0';
		glowCanvas.style.left = '0';
		trailCanvas.style.left = '0';
		particleCanvas.style.transform = '';
		glowCanvas.style.transform = 'scale(4)';
		glowCanvas.style.transformOrigin = 'top left';
		trailCanvas.style.transform = '';
		particleCanvas.style.mixBlendMode = 'normal';
		glowCanvas.style.mixBlendMode = 'normal'; // Remove blend modes as requested
		trailCanvas.style.mixBlendMode = 'normal';

		if (showParticlesOnly) {
			// Show background + particles only
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'block';
			glowCanvas.style.display = 'none';
			trailCanvas.style.display = 'none';
			compositeCanvas.style.display = 'none';
			
		} else if (showGlowOnly) {
			// Show background + glow only
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'none';
			glowCanvas.style.display = 'block';
			trailCanvas.style.display = 'none';
			compositeCanvas.style.display = 'none';
			
		} else if (showTrailOnly) {
			// Show background + trail only
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'none';
			glowCanvas.style.display = 'none';
			trailCanvas.style.display = 'block';
			compositeCanvas.style.display = 'none';
			
		} else {
			// Show composite effect - all layers overlaid
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'block';
			glowCanvas.style.display = 'block';
			trailCanvas.style.display = 'block';
			compositeCanvas.style.display = 'none';
			
			// All canvases at same position for compositing
			backgroundCanvas.style.left = '0';
			particleCanvas.style.left = '0';
			glowCanvas.style.left = '0';
			trailCanvas.style.left = '0';
		}
	}

	// Auto-explode for demo purposes
	function autoExplode() {
		if (hanabiEffect && isRunning) {
			const x = Math.random() * CANVAS_WIDTH;
			const y = Math.random() * (CANVAS_HEIGHT * 0.6) + (CANVAS_HEIGHT * 0.2);
			hanabiEffect.explode(x, y);
		}
	}

	let autoExplodeInterval: number;
	
	function startAutoExplode() {
		autoExplodeInterval = setInterval(autoExplode, 1000);
	}
</script>

<!-- Interactive Demo Section First -->
<section>
	<header>
		<h2>Interactive Demo</h2>
		<p><strong>Click anywhere on the canvas to create an explosion!</strong> Auto explosions occur every second.</p>
	</header>

	<div 
		class="canvas-container"
		bind:this={canvasContainer}
		on:click={handleCanvasClick}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Enter' && handleCanvasClick({clientX: CANVAS_WIDTH/2, clientY: CANVAS_HEIGHT/2} as MouseEvent)}
	>
		<canvas bind:this={backgroundCanvas} class="background-canvas"></canvas>
		<canvas bind:this={trailCanvas} class="trail-canvas"></canvas>
		<canvas bind:this={glowCanvas} class="glow-canvas"></canvas>
		<canvas bind:this={particleCanvas} class="particle-canvas"></canvas>
		<canvas bind:this={compositeCanvas} class="composite-canvas"></canvas>
	</div>

	<!-- Controls Grid -->
	<div class="controls-grid">
		<article class="layer-controls">
			<header>
				<h3>Layer Visualization</h3>
			</header>
			<div class="button-group" role="group">
				<button 
					type="button"
					on:click={() => toggleView('composite')} 
					class:active={!showParticlesOnly && !showGlowOnly && !showTrailOnly}
					aria-pressed={!showParticlesOnly && !showGlowOnly && !showTrailOnly}
				>
					Composite Effect
				</button>
				<button 
					type="button"
					on:click={() => toggleView('particles')} 
					class:active={showParticlesOnly}
					aria-pressed={showParticlesOnly}
				>
					Particles Only
				</button>
				<button 
					type="button"
					on:click={() => toggleView('glow')} 
					class:active={showGlowOnly}
					aria-pressed={showGlowOnly}
				>
					Glow Only
				</button>
				<button 
					type="button"
					on:click={() => toggleView('trail')} 
					class:active={showTrailOnly}
					aria-pressed={showTrailOnly}
				>
					Trail Only
				</button>
			</div>
		</article>

		<article class="stats">
			<header>
				<h3>Performance Stats</h3>
			</header>
			<dl>
				<dt>Active Particles</dt>
				<dd>{stats.active}</dd>
				<dt>Pooled Particles</dt>
				<dd>{stats.pooled}</dd>
			</dl>
		</article>
	</div>
</section>

<!-- Documentation Section After Demo -->
<section class="documentation">
	<header>
		<h2>How the Hanabi Sparkle Effect Works</h2>
	</header>
	
	<article>
		<p>
			This fireworks effect uses a <strong>three-layer approach</strong> with trails, particles, and sparkles:
		</p>
		<ol>
			<li><strong>Trail Layer:</strong> Persistent particle trails that blur and fade over time (recreates the original AS3 effect)</li>
			<li><strong>Particle Layer:</strong> Renders sharp, colorful particles at full resolution for the current frame</li>
			<li><strong>Glow Layer:</strong> Copies the particle canvas and scales it DOWN to 1/4 size (pixel loss occurs here!)</li>
			<li><strong>Sparkle Magic:</strong> The glow layer is scaled back UP 4x with pixelated rendering - surviving pixels create the sparkle</li>
		</ol>
		<p>
			The trail layer adds the missing element from the original AS3 version - particles are drawn to a persistent canvas
			that gets blurred and faded each frame, creating beautiful trailing effects behind the particles.
		</p>
		<footer>
			<small><em>Use the controls above to see how each layer contributes to the final effect.</em></small>
		</footer>
	</article>
</section>

<style>
	.canvas-container {
		position: relative;
		width: 800px;
		height: 600px;
		border: 2px solid var(--pico-muted-border-color);
		cursor: crosshair;
		margin: 0 auto 2rem auto;
		border-radius: var(--pico-border-radius);
		overflow: hidden;
		background: #000;
	}

	.controls-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.button-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.button-group button {
		flex: 1;
		min-width: 120px;
	}

	.button-group button.active {
		background-color: var(--pico-primary-background);
		border-color: var(--pico-primary-border);
	}

	.stats dl {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.5rem;
		margin: 0;
	}

	.stats dt {
		font-weight: var(--pico-font-weight);
	}

	.stats dd {
		text-align: right;
		font-family: var(--pico-font-family-monospace);
		margin: 0;
	}

	.documentation {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--pico-muted-border-color);
	}

	.background-canvas, .particle-canvas, .glow-canvas, .trail-canvas, .composite-canvas {
		display: block;
	}

	.glow-canvas {
		/* Scale up the 1/4 size glow canvas to create glow effect */
		transform: scale(4);
		transform-origin: top left;
		/* Use pixelated rendering to create sparkle effect (matches PixelSnapping.NEVER) */
		image-rendering: pixelated;
		opacity: 1;
	}

	/* Responsive design */
	@media (max-width: 900px) {
		.canvas-container {
			width: 100%;
			max-width: 800px;
			height: auto;
			aspect-ratio: 4/3;
		}

		.controls-grid {
			grid-template-columns: 1fr;
		}

		.button-group {
			flex-direction: column;
		}

		.button-group button {
			min-width: auto;
		}
	}

	@media (max-width: 600px) {
		.canvas-container {
			height: 300px;
		}
	}
</style>
