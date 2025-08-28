<script lang="ts">
	import { onMount } from 'svelte';
	import '@picocss/pico';
	import { HomeIcon, Github, ChartNoAxesCombinedIcon, Sun, Moon } from 'lucide-svelte';

	let { children } = $props();
	
	// Theme management
	let isDarkMode = $state(false);
	let themeButton;
	
	// Reactive tooltip text using Svelte 5 runes
	const tooltipText = $derived(isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		const html = document.documentElement;
		
		if (isDarkMode) {
			html.setAttribute('data-theme', 'dark');
			localStorage.setItem('theme', 'dark');
		} else {
			html.setAttribute('data-theme', 'light');
			localStorage.setItem('theme', 'light');
		}
	}

	function handleThemeToggle(event) {
		event.preventDefault();
		toggleTheme();
		
		// Force tooltip to hide by triggering mouse leave
		const target = event.target.closest('a');
		target.blur();
		
		// Dispatch mouseleave event to force tooltip hide
		target.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
	}

	function initializeTheme() {
		const savedTheme = localStorage.getItem('theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		
		isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
		
		const html = document.documentElement;
		html.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
	}

	onMount(() => {
		initializeTheme();
	});
</script>

<svelte:head>
	<link rel="icon" href="https://avanderw.co.za/favicon.ico" />
	<title>Hanabi - Fireworks</title>
	<meta name="description" content="Port of an interactive demo from old actionscript days animating a fireworks explosion." />
</svelte:head>

<header class="container">
	<div style="display: flex; justify-content: space-between; align-items: center;">
		<nav aria-label="breadcrumb">
			<ul>
				<li>
					<a href="/"><HomeIcon /></a>
				</li>
			</ul>
		</nav>
		<nav>
			<ul>
				<li>
					<a
						bind:this={themeButton}
						href="#"
						on:click={handleThemeToggle}
						data-tooltip={tooltipText}
						data-placement="bottom"
					>
						{#if isDarkMode}
							<Sun />
						{:else}
							<Moon />
						{/if}
					</a>
				</li>
				<li>
					<a
						href="https://github.com/avanderw/hanabi"
						data-tooltip="View source on GitHub"
						data-placement="bottom"><Github /></a
					>
				</li>
				<li>
					<a
						href="https://tracking.avanderw.co.za/avanderw.co.za"
						data-tooltip="View analytics"
						data-placement="bottom"><ChartNoAxesCombinedIcon /></a
					>
				</li>
			</ul>
		</nav>
	</div>
</header>

{@render children?.()}
