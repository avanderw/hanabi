<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { HanabiEffect, type PaletteType } from '$lib/HanabiEffect.js';
	// Lucide icons
	import { 
		Layers, 
		Sparkles, 
		Eye, 
		Zap, 
		Flame, 
		Droplets, 
		Heart, 
		Shuffle,
		Play,
		Pause
	} from 'lucide-svelte';

	let canvasContainer: HTMLDivElement;
	let particleCanvas: HTMLCanvasElement;
	let glowCanvas: HTMLCanvasElement;
	let trailCanvas: HTMLCanvasElement;
	let smokeCanvas: HTMLCanvasElement;
	let backgroundCanvas: HTMLCanvasElement;
	let compositeCanvas: HTMLCanvasElement;
	let hanabiEffect: HanabiEffect;
	
	let showParticlesOnly = false;
	let showGlowOnly = false;
	let showTrailOnly = false;
	let showSmokeOnly = false;
	let stats = { active: 0, pooled: 0, smokeActive: 0, smokePooled: 0, fps: 0 };
	let isRunning = false;
	let selectedPalette: PaletteType = 'fire';
	let useRandomPalette = false;

	const CANVAS_WIDTH = 1200;
	const CANVAS_HEIGHT = 800;

	onMount(() => {
		setupCanvases();
		hanabiEffect = new HanabiEffect(particleCanvas, glowCanvas, trailCanvas, smokeCanvas, 15, 30);
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
		[particleCanvas, glowCanvas, trailCanvas, smokeCanvas, backgroundCanvas, compositeCanvas].forEach(canvas => {
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

		// Style smoke canvas (layer 0.5 - above background, below trails)
		smokeCanvas.style.position = 'absolute';
		smokeCanvas.style.top = '0';
		smokeCanvas.style.left = '0';
		smokeCanvas.style.zIndex = '1'; // Smoke layer

		// Style trail canvas (layer 1 - above smoke)
		trailCanvas.style.position = 'absolute';
		trailCanvas.style.top = '0';
		trailCanvas.style.left = '0';
		trailCanvas.style.zIndex = '2'; // Trail layer

		// Style glow canvas (layer 2 - above trail)
		glowCanvas.style.position = 'absolute';
		glowCanvas.style.top = '0';
		glowCanvas.style.left = '0';
		glowCanvas.style.zIndex = '3'; // Glow layer
		// Use pixelated rendering to match PixelSnapping.NEVER effect - creates sparkle/aliasing
		glowCanvas.style.imageRendering = 'pixelated';
		// Let CSS fill the container naturally, scale will be handled by object-fit
		glowCanvas.style.width = '100%';
		glowCanvas.style.height = '100%';

		// Style particle canvas (top layer)
		particleCanvas.style.position = 'absolute';
		particleCanvas.style.top = '0';
		particleCanvas.style.left = '0';
		particleCanvas.style.zIndex = '4'; // Particles on top

		compositeCanvas.style.position = 'absolute';
		compositeCanvas.style.top = '0';
		compositeCanvas.style.left = '0';
		compositeCanvas.style.zIndex = '5';
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
		const clickX = event.clientX - rect.left;
		const clickY = event.clientY - rect.top;
		
		// Convert from visual canvas coordinates to actual canvas resolution
		const scaleX = CANVAS_WIDTH / rect.width;
		const scaleY = CANVAS_HEIGHT / rect.height;
		
		const x = clickX * scaleX;
		const y = clickY * scaleY;
		
		if (useRandomPalette) {
			hanabiEffect.explodeRandom(x, y);
		} else {
			hanabiEffect.explode(x, y, selectedPalette);
		}
	}

	function toggleView(mode: 'particles' | 'glow' | 'trail' | 'smoke' | 'composite') {
		showParticlesOnly = mode === 'particles';
		showGlowOnly = mode === 'glow';
		showTrailOnly = mode === 'trail';
		showSmokeOnly = mode === 'smoke';

		// Reset all canvas positioning and transforms
		backgroundCanvas.style.left = '0';
		particleCanvas.style.left = '0';
		glowCanvas.style.left = '0';
		trailCanvas.style.left = '0';
		smokeCanvas.style.left = '0';
		particleCanvas.style.transform = '';
		glowCanvas.style.transform = '';
		trailCanvas.style.transform = '';
		smokeCanvas.style.transform = '';
		particleCanvas.style.mixBlendMode = 'normal';
		glowCanvas.style.mixBlendMode = 'normal'; // Remove blend modes as requested
		trailCanvas.style.mixBlendMode = 'normal';
		smokeCanvas.style.mixBlendMode = 'normal';

		if (showParticlesOnly) {
			// Show background + particles only
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'block';
			glowCanvas.style.display = 'none';
			trailCanvas.style.display = 'none';
			smokeCanvas.style.display = 'none';
			compositeCanvas.style.display = 'none';
			
		} else if (showGlowOnly) {
			// Show background + glow only
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'none';
			glowCanvas.style.display = 'block';
			trailCanvas.style.display = 'none';
			smokeCanvas.style.display = 'none';
			compositeCanvas.style.display = 'none';
			
		} else if (showTrailOnly) {
			// Show background + trail only
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'none';
			glowCanvas.style.display = 'none';
			trailCanvas.style.display = 'block';
			smokeCanvas.style.display = 'none';
			compositeCanvas.style.display = 'none';
			
		} else if (showSmokeOnly) {
			// Show background + smoke only
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'none';
			glowCanvas.style.display = 'none';
			trailCanvas.style.display = 'none';
			smokeCanvas.style.display = 'block';
			compositeCanvas.style.display = 'none';
			
		} else {
			// Show composite effect - all layers overlaid
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'block';
			glowCanvas.style.display = 'block';
			trailCanvas.style.display = 'block';
			smokeCanvas.style.display = 'block';
			compositeCanvas.style.display = 'none';
			
			// All canvases at same position for compositing
			backgroundCanvas.style.left = '0';
			particleCanvas.style.left = '0';
			glowCanvas.style.left = '0';
			trailCanvas.style.left = '0';
			smokeCanvas.style.left = '0';
		}
	}

	// Auto-explode for demo purposes
	function autoExplode() {
		if (hanabiEffect && isRunning) {
			const x = Math.random() * CANVAS_WIDTH;
			const y = Math.random() * (CANVAS_HEIGHT * 0.6) + (CANVAS_HEIGHT * 0.2);
			
			if (useRandomPalette) {
				hanabiEffect.explodeRandom(x, y);
			} else {
				hanabiEffect.explode(x, y, selectedPalette);
			}
		}
	}

	let autoExplodeInterval: number;
	
	function startAutoExplode() {
		autoExplodeInterval = setInterval(autoExplode, 500);
	}

	function toggleAnimation() {
		if (isRunning) {
			hanabiEffect.stop();
			if (autoExplodeInterval) {
				clearInterval(autoExplodeInterval);
			}
			isRunning = false;
		} else {
			hanabiEffect.start();
			startAutoExplode();
			isRunning = true;
			updateStats();
		}
	}
</script>

<!-- Interactive Demo Section -->
<section>
	<header>
		<h2>Interactive Demo</h2>
		<p><strong>Click anywhere on the canvas to create an explosion!</strong> Auto explosions occur every second. Choose from different color palettes: Fire (reds/yellows), Blue (cool blues/cyans), Purple (violets/magentas), or Random for variety.</p>
	</header>

	<!-- Main demo layout with controls on the left -->
	<div class="demo-layout">
		<!-- Control buttons on the left -->
		<aside class="controls-sidebar">
			<!-- Play/Pause Control -->
			<div class="button-group" role="group">
				<button 
					type="button"
					class={isRunning ? 'secondary' : 'primary'}
					on:click={toggleAnimation}
					aria-label={isRunning ? 'Pause animation' : 'Play animation'}
				>
					{#if isRunning}
						<Pause size={16} />
						Pause
					{:else}
						<Play size={16} />
						Play
					{/if}
				</button>
			</div>

			<hr />

			<div class="button-group" role="group">
				<button 
					type="button"
					class={!showParticlesOnly && !showGlowOnly && !showTrailOnly && !showSmokeOnly ? 'primary' : 'secondary'}
					on:click={() => toggleView('composite')} 
					aria-pressed={!showParticlesOnly && !showGlowOnly && !showTrailOnly && !showSmokeOnly}
				>
					<Layers size={16} />
					Composite Effect
				</button>
				<button 
					type="button"
					class={showParticlesOnly ? 'primary' : 'secondary'}
					on:click={() => toggleView('particles')} 
					aria-pressed={showParticlesOnly}
				>
					<Sparkles size={16} />
					Particles Only
				</button>
				<button 
					type="button"
					class={showGlowOnly ? 'primary' : 'secondary'}
					on:click={() => toggleView('glow')} 
					aria-pressed={showGlowOnly}
				>
					<Eye size={16} />
					Glow Only
				</button>
				<button 
					type="button"
					class={showTrailOnly ? 'primary' : 'secondary'}
					on:click={() => toggleView('trail')} 
					aria-pressed={showTrailOnly}
				>
					<Zap size={16} />
					Trail Only
				</button>
				<button 
					type="button"
					class={showSmokeOnly ? 'primary' : 'secondary'}
					on:click={() => toggleView('smoke')} 
					aria-pressed={showSmokeOnly}
				>
					<Droplets size={16} />
					Smoke Only
				</button>
			</div>

			<hr />

			<div class="palette-controls">
				<h3>Color Palette</h3>
				<div class="button-group" role="group">
					<button 
						type="button"
						class={!useRandomPalette && selectedPalette === 'fire' ? 'primary' : 'secondary'}
						on:click={() => { selectedPalette = 'fire'; useRandomPalette = false; }}
						aria-pressed={!useRandomPalette && selectedPalette === 'fire'}
					>
						<Flame size={16} />
						Fire
					</button>
					<button 
						type="button"
						class={!useRandomPalette && selectedPalette === 'blue' ? 'primary' : 'secondary'}
						on:click={() => { selectedPalette = 'blue'; useRandomPalette = false; }}
						aria-pressed={!useRandomPalette && selectedPalette === 'blue'}
					>
						<Droplets size={16} />
						Blue
					</button>
					<button 
						type="button"
						class={!useRandomPalette && selectedPalette === 'purple' ? 'primary' : 'secondary'}
						on:click={() => { selectedPalette = 'purple'; useRandomPalette = false; }}
						aria-pressed={!useRandomPalette && selectedPalette === 'purple'}
					>
						<Heart size={16} />
						Purple
					</button>
					<button 
						type="button"
						class={useRandomPalette ? 'primary' : 'secondary'}
						on:click={() => { useRandomPalette = true; }}
						aria-pressed={useRandomPalette}
					>
						<Shuffle size={16} />
						Random
					</button>
				</div>
			</div>
		</aside>

		<!-- Canvas container -->
		<div class="canvas-wrapper">
			<div 
				class="canvas-container"
				bind:this={canvasContainer}
				on:click={handleCanvasClick}
				role="button"
				tabindex="0"
				on:keydown={(e) => {
					if (e.key === 'Enter') {
						// Center explosion for keyboard access
						const x = CANVAS_WIDTH / 2;
						const y = CANVAS_HEIGHT / 2;
						
						if (useRandomPalette) {
							hanabiEffect.explodeRandom(x, y);
						} else {
							hanabiEffect.explode(x, y, selectedPalette);
						}
					}
				}}
			>
				<canvas bind:this={backgroundCanvas} class="background-canvas"></canvas>
				<canvas bind:this={smokeCanvas} class="smoke-canvas"></canvas>
				<canvas bind:this={trailCanvas} class="trail-canvas"></canvas>
				<canvas bind:this={glowCanvas} class="glow-canvas"></canvas>
				<canvas bind:this={particleCanvas} class="particle-canvas"></canvas>
				<canvas bind:this={compositeCanvas} class="composite-canvas"></canvas>
			</div>

			<!-- Performance stats as caption/footer -->
			<footer class="stats-caption">
				<dl>
					<dt>FPS:</dt>
					<dd>{stats.fps}</dd>
					<dt>Active Particles:</dt>
					<dd>{stats.active}</dd>
					<dt>Pooled Particles:</dt>
					<dd>{stats.pooled}</dd>
					<dt>Active Smoke:</dt>
					<dd>{stats.smokeActive}</dd>
					<dt>Pooled Smoke:</dt>
					<dd>{stats.smokePooled}</dd>
				</dl>
			</footer>
		</div>
	</div>
</section>

<!-- Documentation Section After Demo -->
<section class="documentation">
	<header>
		<h2>How the Hanabi Sparkle Effect Works</h2>
	</header>
	
	<article>
		<p>
			This fireworks effect uses a <strong>four-layer approach</strong> with smoke, trails, particles, and sparkles:
		</p>
		<ol>
			<li><strong>Smoke Layer:</strong> Soft smoke particles that rise slowly from the explosion center and fade over time</li>
			<li><strong>Trail Layer:</strong> Persistent particle trails that blur and fade over time (recreates the original AS3 effect)</li>
			<li><strong>Particle Layer:</strong> Renders sharp, colorful particles at full resolution for the current frame</li>
			<li><strong>Glow Layer:</strong> Copies the particle canvas and scales it DOWN to 1/4 size (pixel loss occurs here!)</li>
			<li><strong>Sparkle Magic:</strong> The glow layer is scaled back UP 4x with pixelated rendering - surviving pixels create the sparkle</li>
		</ol>
		<p>
			The smoke layer adds a realistic effect where gray smoke particles are generated near the explosion center,
			rise slowly upward, spread horizontally, and fade away gradually. This creates depth and makes the explosions
			feel more realistic by adding the aftermath effect that would occur with real fireworks.
		</p>
		<p>
			The trail layer adds the missing element from the original AS3 version - particles are drawn to a persistent canvas
			that gets blurred and faded each frame, creating beautiful trailing effects behind the particles.
		</p>
	</article>
</section>

<style>
	/* Main layout using CSS Grid instead of Flexbox for better semantic structure */
	.demo-layout {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--pico-spacing);
		margin-bottom: var(--pico-spacing);
	}

	/* Use PicoCSS aside semantic styling */
	.controls-sidebar {
		min-width: 12rem;
	}

	/* Canvas wrapper - let PicoCSS handle most styling */
	.canvas-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--pico-spacing);
	}

	/* Canvas container - minimal custom styling, rely on PicoCSS */
	.canvas-container {
		position: relative;
		width: 100%;
		max-width: 75rem;
		height: auto;
		aspect-ratio: 3/2;
		border: var(--pico-border-width) solid var(--pico-muted-border-color);
		border-radius: var(--pico-border-radius);
		overflow: hidden;
		background: #000;
		cursor: crosshair;
	}

	/* Button group - use PicoCSS grid utilities */
	.button-group {
		display: grid;
		gap: calc(var(--pico-spacing) * 0.5);
	}

	.button-group button {
		justify-self: stretch;
		text-align: left;
		display: flex;
		align-items: center;
		gap: calc(var(--pico-spacing) * 0.5);
	}

	/* Palette controls styling */
	.palette-controls {
		margin-top: var(--pico-spacing);
	}

	.palette-controls h3 {
		margin-bottom: calc(var(--pico-spacing) * 0.5);
		font-size: var(--pico-font-size);
		color: var(--pico-muted-color);
	}

	/* Stats caption - use PicoCSS card styling */
	.stats-caption {
		width: 100%;
		max-width: 75rem;
		padding: calc(var(--pico-spacing) * 0.5) var(--pico-spacing);
		background: var(--pico-card-background-color);
		border: var(--pico-border-width) solid var(--pico-muted-border-color);
		border-radius: var(--pico-border-radius);
		margin: 0;
	}

	.stats-caption dl {
		display: flex;
		gap: calc(var(--pico-spacing) * 1.5);
		margin: 0;
		font-size: var(--pico-font-size);
		align-items: center;
		justify-content: center;
	}

	.stats-caption dt {
		margin: 0;
	}

	.stats-caption dd {
		font-family: var(--pico-font-family-monospace);
		margin: 0;
		font-weight: var(--pico-font-weight);
		color: var(--pico-primary);
	}

	/* Documentation section - use PicoCSS section spacing */
	.documentation {
		margin-top: calc(var(--pico-spacing) * 2);
		padding-top: calc(var(--pico-spacing) * 1.5);
		border-top: var(--pico-border-width) solid var(--pico-muted-border-color);
	}

	/* Canvas layers - make them fill the container */
	.background-canvas, 
	.particle-canvas, 
	.trail-canvas, 
	.smoke-canvas,
	.composite-canvas {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: fill;
	}

	.glow-canvas {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: fill;
		image-rendering: pixelated;
	}

	/* Responsive design using PicoCSS breakpoints and spacing */
	@media (max-width: 992px) {
		.demo-layout {
			grid-template-columns: 1fr;
			gap: var(--pico-spacing);
		}

		.controls-sidebar {
			min-width: auto;
		}

		.button-group {
			grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		}

		.button-group button {
			text-align: center;
			justify-content: center;
		}
	}

	@media (max-width: 768px) {
		.canvas-container {
			aspect-ratio: 4/3;
		}

		.stats-caption {
			width: 100%;
		}

		.stats-caption dl {
			gap: var(--pico-spacing);
			flex-wrap: wrap;
		}
	}

	@media (max-width: 576px) {
		.canvas-container {
			aspect-ratio: 4/3;
		}

		.button-group {
			grid-template-columns: 1fr;
		}

		.stats-caption dl {
			flex-direction: column;
			gap: calc(var(--pico-spacing) * 0.5);
			text-align: center;
		}
	}
</style>
