<script lang="ts">
	let {
		startMenuContainer: topLevelHtmlElement = $bindable()
	}: { startMenuContainer: HTMLElement } = $props();

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

<div class="start-menu" bind:this={topLevelHtmlElement}>
	<div class="user-section">
		<img src="/user-avatar.png" alt="User" class="user-avatar" />
		<span class="user-name">stickerboard 2</span>
	</div>

	<div class="menu-items">
		<div class="left-panel">
			<div class="menu-item">
				<img src="/windows-xp-gif-file.png" alt="Internet" />
				<span>Upload image/gif</span>
			</div>
			<div class="menu-item">
				<img src="/windows-xp-notepad.png" alt="E-mail" />
				<span>Create text block</span>
			</div>
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
			<img src="/logoff.png" alt="Log Off" />
			<span>Log Off</span>
		</div>
		<div class="menu-item">
			<img src="/shutdown.png" alt="Turn Off Computer" />
			<span>Turn Off Computer</span>
		</div>
	</div>
</div>

<style>
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
		cursor: pointer;
		color: black;
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
