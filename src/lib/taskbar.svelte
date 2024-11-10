<script lang="ts">
	import { onMount } from 'svelte';
	import Startmenu from './Startmenu.svelte';

	let time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	let isStartMenuOpen = false;
	let startButton: HTMLButtonElement;
	let startMenu: any;

	// Update clock every minute
	onMount(() => {
		const interval = setInterval(() => {
			time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		}, 60000);

		// Close start menu when clicking outside
		const handleClickOutside = (event: any) => {
			if (
				startMenu &&
				!startMenu.contains(event.target) &&
				startButton &&
				!startButton.contains(event.target)
			) {
				isStartMenuOpen = false;
			}
		};

		document.addEventListener('click', handleClickOutside);

		return () => {
			clearInterval(interval);
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function toggleStartMenu() {
		isStartMenuOpen = !isStartMenuOpen;
	}
</script>

<div class="taskbar">
	<button
		class="start-button"
		class:active={isStartMenuOpen}
		on:click={toggleStartMenu}
		bind:this={startButton}
	>
		<img src="" alt="Start" class="start-icon" />
		<span>start</span>
	</button>

	{#if isStartMenuOpen}
		<Startmenu bind:topLevelHtmlElement={startMenu} />
	{/if}

	<div class="system-tray">
		<div class="tray-icons">
			<div class="tray-icon">
				<img src="" alt="Volume" />
			</div>
			<div class="tray-icon">
				<img src="" alt="Network" />
			</div>
			<div class="tray-icon clock">
				{time}
			</div>
		</div>
	</div>
</div>

<style>
	.taskbar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 30px;
		background: linear-gradient(
			to bottom,
			#245edb 0%,
			#2153c2 3%,
			#1941a5 6%,
			#183890 10%,
			#192f72 14%,
			#182863 19%,
			#172558 63%,
			#171f48 81%,
			#171c42 88%,
			#171a3f 91%,
			#171a3f 94%,
			#171839 97%,
			#171839 100%
		);
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 2px;
		border-top: 1px solid #3566ca;
	}

	.start-button {
		height: 28px;
		padding: 1px 4px;
		display: flex;
		align-items: center;
		gap: 4px;
		background: linear-gradient(
			to bottom,
			#378a3c 0%,
			#2f7a33 3%,
			#1f6422 7%,
			#164816 10%,
			#153e14 14%,
			#143b13 19%,
			#133611 63%,
			#123111 81%,
			#112f10 88%,
			#112e10 91%,
			#112e10 94%,
			#102b0f 97%,
			#102b0f 100%
		);
		border: 1px solid #244b23;
		border-radius: 3px;
		color: white;
		text-transform: capitalize;
		font-family: 'Tahoma', sans-serif;
		font-size: 14px;
		cursor: pointer;
	}

	.start-button:hover,
	.start-button.active {
		background: linear-gradient(
			to bottom,
			#3c9641 0%,
			#338737 3%,
			#236d25 7%,
			#184e18 10%,
			#174316 14%,
			#164015 19%,
			#143c12 63%,
			#133512 81%,
			#123311 88%,
			#123211 91%,
			#123211 94%,
			#112e10 97%,
			#112e10 100%
		);
	}

	.start-icon {
		width: 16px;
		height: 16px;
	}

	.system-tray {
		height: 100%;
		display: flex;
		align-items: center;
	}

	.tray-icons {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0 8px;
		height: 100%;
		border-left: 1px solid #1f3766;
	}

	.tray-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 4px;
		height: 100%;
	}

	.tray-icon img {
		width: 16px;
		height: 16px;
	}

	.clock {
		color: white;
		font-family: 'Tahoma', sans-serif;
		font-size: 12px;
		min-width: 50px;
	}
</style>
