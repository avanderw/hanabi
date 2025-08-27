 <script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { HanabiEffect } from '$lib/HanabiEffect.js';

	let canvasContainer: HTMLDivElement;
	let particleCanvas: HTMLCanvasElement;
	let glowCanvas: HTMLCanvasElement;
	let backgroundCanvas: HTMLCanvasElement;
	let compositeCanvas: HTMLCanvasElement;
	let hanabiEffect: HanabiEffect;
	
	let showLayers = false;
	let showParticlesOnly = false;
	let showGlowOnly = false;
	let glowBlendMode = 'lighter'; // lighter is closest to ActionScript's BlendMode.ADD
	let stats = { active: 0, pooled: 0 };
	let isRunning = false;

	// Update glow blend mode when changed
	$: if (glowCanvas && glowBlendMode) {
		// Only apply blend mode in composite view
		if (!showLayers && !showParticlesOnly && !showGlowOnly) {
			glowCanvas.style.mixBlendMode = glowBlendMode;
		}
	}

	const CANVAS_WIDTH = 800;
	const CANVAS_HEIGHT = 600;

	onMount(() => {
		setupCanvases();
		hanabiEffect = new HanabiEffect(particleCanvas, glowCanvas, 15, 30);
		// Initialize to composite view
		toggleView('composite');
		startAnimation();
	});

	onDestroy(() => {
		if (hanabiEffect) {
			hanabiEffect.destroy();
		}
	});

	function setupCanvases() {
		// Set canvas sizes
		[particleCanvas, glowCanvas, backgroundCanvas, compositeCanvas].forEach(canvas => {
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

		// Style glow canvas (middle layer)
		glowCanvas.style.position = 'absolute';
		glowCanvas.style.top = '0';
		glowCanvas.style.left = '0';
		glowCanvas.style.zIndex = '1'; // Glow layer
		// Use pixelated rendering to match PixelSnapping.NEVER effect - creates sparkle/aliasing
		glowCanvas.style.imageRendering = 'pixelated';

		// Style particle canvas (top layer)
		particleCanvas.style.position = 'absolute';
		particleCanvas.style.top = '0';
		particleCanvas.style.left = '0';
		particleCanvas.style.zIndex = '2'; // Particles on top

		compositeCanvas.style.position = 'absolute';
		compositeCanvas.style.top = '0';
		compositeCanvas.style.left = '0';
		compositeCanvas.style.zIndex = '3';
	}

	function startAnimation() {
		if (hanabiEffect && !isRunning) {
			hanabiEffect.start();
			isRunning = true;
			updateStats();
		}
	}

	function stopAnimation() {
		if (hanabiEffect && isRunning) {
			hanabiEffect.stop();
			isRunning = false;
		}
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

	function toggleView(mode: 'layers' | 'particles' | 'glow' | 'composite') {
		showLayers = mode === 'layers';
		showParticlesOnly = mode === 'particles';
		showGlowOnly = mode === 'glow';

		// Reset all canvas positioning and transforms
		backgroundCanvas.style.left = '0';
		particleCanvas.style.left = '0';
		glowCanvas.style.left = '0';
		particleCanvas.style.transform = '';
		glowCanvas.style.transform = 'scale(4)';
		glowCanvas.style.transformOrigin = 'top left';
		particleCanvas.style.mixBlendMode = 'normal';
		glowCanvas.style.mixBlendMode = glowBlendMode;

		if (showLayers) {
			// Show individual layers side by side
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'block';
			glowCanvas.style.display = 'block';
			compositeCanvas.style.display = 'none';
			
			// Position side by side - show background, particles, then glow
			backgroundCanvas.style.left = '0';
			particleCanvas.style.left = `${CANVAS_WIDTH + 20}px`;
			glowCanvas.style.left = `${(CANVAS_WIDTH + 20) * 2}px`;
			
			// Disable blend mode for side by side view
			glowCanvas.style.mixBlendMode = 'normal';
			
		} else if (showParticlesOnly) {
			// Show background + particles only
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'block';
			glowCanvas.style.display = 'none';
			compositeCanvas.style.display = 'none';
			
		} else if (showGlowOnly) {
			// Show background + glow only
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'none';
			glowCanvas.style.display = 'block';
			compositeCanvas.style.display = 'none';
			glowCanvas.style.mixBlendMode = 'normal'; // Don't blend with just background
			
		} else {
			// Show composite effect - all layers overlaid
			backgroundCanvas.style.display = 'block';
			particleCanvas.style.display = 'block';
			glowCanvas.style.display = 'block';
			compositeCanvas.style.display = 'none';
			
			// All canvases at same position for compositing
			backgroundCanvas.style.left = '0';
			particleCanvas.style.left = '0';
			glowCanvas.style.left = '0';
			
			// Enable blend mode for composite effect
			glowCanvas.style.mixBlendMode = glowBlendMode;
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
		autoExplodeInterval = setInterval(autoExplode, 2000);
	}

	function stopAutoExplode() {
		if (autoExplodeInterval) {
			clearInterval(autoExplodeInterval);
		}
	}
</script>

<div class="hanabi-demo">
	<div class="controls">
		<div class="control-group">
			<h3>Animation Controls</h3>
			<button on:click={startAnimation} disabled={isRunning}>Start Animation</button>
			<button on:click={stopAnimation} disabled={!isRunning}>Stop Animation</button>
			<button on:click={startAutoExplode}>Auto Explode</button>
			<button on:click={stopAutoExplode}>Stop Auto</button>
		</div>

		<div class="control-group">
			<h3>Layer Visualization</h3>
			<button on:click={() => toggleView('composite')} class:active={!showLayers && !showParticlesOnly && !showGlowOnly}>
				Composite Effect
			</button>
			<button on:click={() => toggleView('particles')} class:active={showParticlesOnly}>
				Particles Only
			</button>
			<button on:click={() => toggleView('glow')} class:active={showGlowOnly}>
				Glow Only
			</button>
			<button on:click={() => toggleView('layers')} class:active={showLayers}>
				Side by Side
			</button>
		</div>

		<div class="control-group">
			<h3>Glow Blend Mode</h3>
			<button on:click={() => glowBlendMode = 'lighter'} class:active={glowBlendMode === 'lighter'}>
				Lighter (ADD)
			</button>
			<button on:click={() => glowBlendMode = 'screen'} class:active={glowBlendMode === 'screen'}>
				Screen
			</button>
			<button on:click={() => glowBlendMode = 'plus-lighter'} class:active={glowBlendMode === 'plus-lighter'}>
				Plus Lighter
			</button>
		</div>

		<div class="stats">
			<h3>Performance Stats</h3>
			<p>Active Particles: {stats.active}</p>
			<p>Pooled Particles: {stats.pooled}</p>
		</div>
	</div>

	<div class="explanation">
		<h3>How the Hanabi Sparkle Effect Works</h3>
		<p>
			This fireworks effect uses a <strong>two-layer approach</strong> with pixel loss to create the sparkle:
		</p>
		<ol>
			<li><strong>Particle Layer:</strong> Renders sharp, colorful particles at full resolution</li>
			<li><strong>Glow Layer:</strong> Copies the particle canvas and scales it DOWN to 1/4 size (pixel loss occurs here!)</li>
			<li><strong>Sparkle Magic:</strong> The glow layer is scaled back UP 4x with pixelated rendering - surviving pixels create the sparkle</li>
		</ol>
		<p>
			The key insight is that <strong>scaling down loses/merges pixels randomly</strong>, so only some particles contribute to the glow.
			When scaled back up with pixelated rendering (PixelSnapping.NEVER), these surviving pixels create the characteristic sparkle effect.
		</p>
		<p><strong>Click anywhere on the canvas to create an explosion!</strong></p>
		<p><em>Use the controls above to see how each layer contributes to the final effect.</em></p>
	</div>

	<div 
		class="canvas-container" 
		class:side-by-side={showLayers}
		bind:this={canvasContainer}
		on:click={handleCanvasClick}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Enter' && handleCanvasClick({clientX: CANVAS_WIDTH/2, clientY: CANVAS_HEIGHT/2} as MouseEvent)}
	>
		<canvas bind:this={backgroundCanvas} class="background-canvas"></canvas>
		<canvas bind:this={glowCanvas} class="glow-canvas"></canvas>
		<canvas bind:this={particleCanvas} class="particle-canvas"></canvas>
		<canvas bind:this={compositeCanvas} class="composite-canvas"></canvas>
		
		{#if showLayers}
			<div class="layer-labels">
				<div class="label background-label">Background</div>
				<div class="label particles-label">Particles</div>
				<div class="label glow-label">Glow</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.hanabi-demo {
		font-family: Arial, sans-serif;
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	.controls {
		display: flex;
		gap: 20px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}

	.control-group {
		background: #f5f5f5;
		padding: 15px;
		border-radius: 8px;
		min-width: 200px;
	}

	.control-group h3 {
		margin: 0 0 10px 0;
		font-size: 14px;
		color: #333;
	}

	button {
		background: #4CAF50;
		border: none;
		color: white;
		padding: 8px 16px;
		text-align: center;
		text-decoration: none;
		display: inline-block;
		font-size: 12px;
		margin: 2px;
		cursor: pointer;
		border-radius: 4px;
		transition: background-color 0.3s;
	}

	button:hover {
		background: #45a049;
	}

	button:disabled {
		background: #cccccc;
		cursor: not-allowed;
	}

	button.active {
		background: #2196F3;
	}

	button.active:hover {
		background: #1976D2;
	}

	.stats {
		background: #e8f4f8;
		padding: 15px;
		border-radius: 8px;
		min-width: 150px;
	}

	.stats p {
		margin: 5px 0;
		font-size: 12px;
	}

	.explanation {
		background: #fff3cd;
		padding: 20px;
		border-radius: 8px;
		margin-bottom: 20px;
		border-left: 4px solid #ffc107;
	}

	.explanation h3 {
		margin-top: 0;
		color: #856404;
	}

	.explanation p, .explanation ol {
		color: #856404;
		line-height: 1.5;
	}

	.canvas-container {
		position: relative;
		width: 800px;
		height: 600px;
		border: 2px solid #333;
		cursor: crosshair;
		margin: 0 auto;
		border-radius: 8px;
		overflow: hidden;
	}

	.canvas-container.side-by-side {
		width: 2460px; /* 800 + 20 + 800 + 20 + 800 + 20 for 3 canvases */
	}

	.background-canvas, .particle-canvas, .glow-canvas, .composite-canvas {
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

	.layer-labels {
		position: absolute;
		top: 10px;
		left: 0;
		width: 100%;
		display: flex;
		pointer-events: none;
	}

	.label {
		color: white;
		background: rgba(0, 0, 0, 0.7);
		padding: 5px 10px;
		border-radius: 4px;
		font-size: 14px;
		font-weight: bold;
	}

	.background-label {
		margin-left: 10px;
	}

	.particles-label {
		margin-left: calc(800px + 30px);
	}

	.glow-label {
		margin-left: calc((800px + 20px) * 2 + 10px);
	}

	@media (max-width: 900px) {
		.canvas-container {
			width: 100%;
			height: 450px;
			transform: scale(0.9);
			transform-origin: top center;
		}

		.canvas-container.side-by-side {
			width: 100%;
			overflow-x: auto;
		}

		.controls {
			flex-direction: column;
		}
	}
</style>
