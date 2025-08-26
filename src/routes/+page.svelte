<script lang="ts">
	import HanabiDemo from '$lib/HanabiDemo.svelte';
</script>

<svelte:head>
	<title>Hanabi Fireworks - HTML5 Particle Effect</title>
	<meta name="description" content="Interactive fireworks particle effect converted from Flash ActionScript to HTML5" />
</svelte:head>

<main>
	<h1>🎆 Hanabi Fireworks Effect</h1>
	<p>An HTML5 conversion of the Flash ActionScript hanabi (fireworks) particle system</p>
	
	<HanabiDemo />
</main>

<style>
	main {
		padding: 20px;
		max-width: 1200px;
		margin: 0 auto;
	}
	
	h1 {
		text-align: center;
		color: #333;
		margin-bottom: 10px;
	}
	
	p {
		text-align: center;
		color: #666;
		margin-bottom: 30px;
	}
</style>
