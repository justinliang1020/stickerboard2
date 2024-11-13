<script lang="ts">
	import { onMount } from 'svelte';
	let {
		addDraggable,
		processFileAndAddDraggable
	}: { addDraggable: Function; processFileAndAddDraggable: Function } = $props();

	let time = $state(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
	let isStartMenuOpen = $state(false);
	let startMenuContainer: HTMLElement | null = $state(null);
	let startButton: HTMLButtonElement;
	let uploadImageGifInput: HTMLInputElement | null = $state(null);

	onMount(() => {
		const interval = setInterval(() => {
			time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		}, 60000);

		return () => {
			clearInterval(interval);
		};
	});

	const handleClickOutside = (event: MouseEvent) => {
		if (
			startMenuContainer &&
			!startMenuContainer.contains(event.target as Node) &&
			!startButton.contains(event.target as Node)
		) {
			isStartMenuOpen = false;
		}
	};

	const toggleStartMenu = () => {
		isStartMenuOpen = !isStartMenuOpen;
	};

	type ColorBackground = {
		bgType: 'color';
		color: string;
	};

	type ImageBackground = {
		bgType: 'image';
		src: string;
	};

	type Background = ColorBackground | ImageBackground;

	//TODO: make background not increase size of entire start menu when adding items
	const backgrounds: Background[] = $state([
		{ bgType: 'color', color: 'white' },
		{ bgType: 'color', color: 'black' },
		{ bgType: 'image', src: 'windows-xp-background.jpg' }
	]);

	function setBackground(b: Background) {
		switch (b.bgType) {
			case 'color':
				document.body.style.background = b.color;
				return;
			case 'image':
				document.body.style.background = `no-repeat fixed url(${b.src}) center / 100% 100%`;
				return;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="taskbar">
	<div style="display: flex; flex-direction: row;">
		<input
			type="file"
			accept="image/*"
			hidden
			bind:this={uploadImageGifInput}
			onchange={() => {
				for (let f of uploadImageGifInput!.files!) {
					processFileAndAddDraggable(f);
				}
			}}
		/>
		<button
			class="start-button"
			class:active={isStartMenuOpen}
			onclick={toggleStartMenu}
			bind:this={startButton}
		>
			<span>🖼️ Background</span>
		</button>

		<button
			class="application-button"
			onclick={() => {
				uploadImageGifInput!.click();
			}}
		>
			<img src="/windows-xp-gif-file.png" alt="Internet" />
			<span>Upload Image/Gif</span>
		</button>

		<button
			class="application-button"
			onclick={() => {
				addDraggable('text', 'edit this text!', 0, 0, 200, 200);
			}}
		>
			<img src="/windows-xp-notepad.png" alt="E-mail" />
			<span>Create Text Block</span>
		</button>
	</div>

	<div class="system-tray">
		<div class="tray-icons">
			<div class="tray-icon">
				<span>🔈</span>
			</div>
			<div class="tray-icon clock">
				{time}
			</div>
		</div>
	</div>
</div>

{#if isStartMenuOpen}
	<div class="start-menu" bind:this={startMenuContainer}>
		<div class="user-section">
			<img src="/user-avatar.png" alt="User" class="user-avatar" />
			<span class="user-name">stickerboard 2</span>
		</div>

		<div class="menu-items">
			<div class="left-panel">
				<input
					type="file"
					accept="image/*"
					hidden
					bind:this={uploadImageGifInput}
					onchange={() => {
						for (let f of uploadImageGifInput!.files!) {
							processFileAndAddDraggable(f);
						}
					}}
				/>
				<button
					class="menu-item"
					onclick={() => {
						uploadImageGifInput!.click();
					}}
				>
					<img src="/windows-xp-gif-file.png" alt="Internet" />
					<span>Upload image/gif</span>
				</button>
				<button
					class="menu-item"
					onclick={() => {
						addDraggable('text', 'edit this text!');
					}}
				>
					<img src="/windows-xp-notepad.png" alt="E-mail" />
					<span>Create text block</span>
				</button>
				<hr class="menu-separator" />
				<div class="menu-item">
					<img src="/documents.png" alt="Documents" />
					<span>Documents</span>
				</div>
			</div>

			<div class="right-panel">
				<h2>background</h2>
				{#each backgrounds as b}
					<button type="button" class="background-item" onclick={() => setBackground(b)}>
						{#if b.bgType == 'color'}
							<div style="background-color: {b.color}; width:100%; height: 100%;"></div>
						{:else if b.bgType == 'image'}
							<img src={b.src} alt="" style="width: 100%; height: 100%" />
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<div class="bottom-section">
			<div class="menu-item">
				<img src="/shutdown.png" alt="Turn Off Computer" />
				<span>Help</span>
			</div>
		</div>
	</div>
{/if}

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
		z-index: 999999;
	}

	.start-button {
		height: 28px;
		margin-right: 10px;
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

	.application-button {
		height: 28px;
		width: 180px;
		gap: 6px;
		border: 1px solid #244b23;
		border-radius: 3px;
		font-family: 'Tahoma', sans-serif;
		font-size: 14px;
		cursor: pointer;
		background-color: #3a80f4;
		color: white;
		text-align: left;
		display: flex;
		flex-direction: row;
		align-items: center;

		transition:
			background-color 0.2s,
			box-shadow 0.2s,
			border-color 0.2s;
	}

	.application-button:hover {
		background-color: #5fa9f7; /* Lighter blue on hover */
		border-color: #0b5394; /* Darker blue border to simulate depth */
		box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3); /* Subtle shadow for 3D effect */
	}

	.application-button img {
		max-width: 100%;
		max-height: 100%;
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

	.clock {
		color: white;
		font-family: 'Tahoma', sans-serif;
		font-size: 12px;
		min-width: 50px;
	}

	h2 {
		margin: 0.2em;
	}
	.start-menu {
		position: fixed;
		bottom: 30px;
		left: 0;
		width: 400px;
		background: white;
		border: 1px solid #003c74;
		border-bottom: none;
		box-shadow: 2px -2px 5px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		padding: 2px;
		font-family: 'Tahoma', sans-serif;
		font-size: 11px;
		z-index: 999999;
	}

	.user-section {
		background: #225edc;
		padding: 8px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.user-avatar {
		width: 48px;
		height: 48px;
		border: 1px solid white;
	}

	.user-name {
		color: white;
		font-family: 'Tahoma', sans-serif;
		font-size: 14px;
		font-weight: bold;
	}

	.menu-items {
		display: flex;
		min-height: 300px;
	}

	.left-panel {
		flex: 2;
		background: white;
		padding: 6px 0;
	}

	.right-panel {
		flex: 1;
		background: #d3e5fa;
		border-left: 1px solid #7aa7e7;
		padding: 6px 2px;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 4px 8px;
		color: black;
		background: transparent;
		border: 0;
		width: 100%;
	}

	.menu-item:hover {
		background: #2f71cd;
		color: white;
	}

	.menu-item img {
		width: 40px;
		height: 40px;
	}

	.menu-separator {
		margin: 4px 8px;
		border: none;
		border-top: 1px solid #dfdfdf;
	}

	.bottom-section {
		background: #d3e5fa;
		border-top: 1px solid #7aa7e7;
		padding: 6px 0;
	}

	.background-item {
		width: 100%;
		height: 100px;
		padding: 0;
	}
</style>
