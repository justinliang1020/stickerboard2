<script lang="ts">
	let { topLevelHtmlElement = $bindable() }: { topLevelHtmlElement: HTMLElement } = $props();
</script>

<div class="start-menu" bind:this={topLevelHtmlElement}>
	<div class="user-section">
		<img src="/user-avatar.png" alt="User" class="user-avatar" />
		<span class="user-name">User Name</span>
	</div>

	<div class="menu-items">
		<div class="left-panel">
			<div class="menu-item">
				<img src="/internet.png" alt="Internet" />
				<span>Internet</span>
			</div>
			<div class="menu-item">
				<img src="/email.png" alt="E-mail" />
				<span>E-mail</span>
			</div>
			<hr class="menu-separator" />
			<div class="menu-item">
				<img src="/pictures.png" alt="Pictures" />
				<span>Pictures</span>
			</div>
			<div class="menu-item">
				<img src="/music.png" alt="Music" />
				<span>Music</span>
			</div>
			<div class="menu-item">
				<img src="/documents.png" alt="Documents" />
				<span>Documents</span>
			</div>
			<hr class="menu-separator" />
			<div class="menu-item">
				<img src="/control-panel.png" alt="Control Panel" />
				<span>Control Panel</span>
			</div>
		</div>

		<div class="right-panel">
			<div class="menu-item">
				<img src="/programs.png" alt="All Programs" />
				<span>All Programs</span>
				<span class="arrow">▸</span>
			</div>
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
	.start-menu {
		position: fixed;
		bottom: 30px;
		left: 0;
		width: 380px;
		background: white;
		border: 1px solid #003c74;
		border-bottom: none;
		box-shadow: 2px -2px 5px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		padding: 2px;
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
		padding: 6px 0;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 4px 8px;
		cursor: pointer;
		color: black;
		font-family: 'Tahoma', sans-serif;
		font-size: 11px;
	}

	.menu-item:hover {
		background: #2f71cd;
		color: white;
	}

	.menu-item img {
		width: 24px;
		height: 24px;
	}

	.menu-separator {
		margin: 4px 8px;
		border: none;
		border-top: 1px solid #dfdfdf;
	}

	.arrow {
		margin-left: auto;
	}

	.bottom-section {
		background: #d3e5fa;
		border-top: 1px solid #7aa7e7;
		padding: 6px 0;
	}
</style>
