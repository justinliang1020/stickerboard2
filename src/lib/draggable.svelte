<script lang="ts">
	let {
		src,
		initialX = 0,
		initialY = 0
	}: { src: string; initialX?: number; initialY?: number } = $props();

	let isDragging = $state(false);
	let isResizing = $state(false);
	let isSelected = $state(false);
	let x = $state(initialX);
	let y = $state(initialY);
	let imgEl: HTMLImageElement;
	let containerEl: HTMLDivElement;
	let mouseDownStartX: number;
	let mouseDownStartY: number;
	let mouseDownStartWidth: number;
	let mouseDownStartHeight: number;
	let width: number = $state(0);
	let height: number = $state(0);
	let activeCorner: string | null = $state(null);

	$effect(() => {
		width = imgEl.naturalWidth;
		height = imgEl.naturalHeight;
	});

	function handleMouseDown(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target.classList.contains('resize-handle')) {
			isDragging = false;
			isResizing = true;
			activeCorner = target.dataset.corner || null;
			mouseDownStartX = event.clientX;
			mouseDownStartY = event.clientY;
			mouseDownStartWidth = width;
			mouseDownStartHeight = height;
		} else {
			isDragging = true;
			mouseDownStartX = event.clientX - x;
			mouseDownStartY = event.clientY - y;
		}
		isSelected = true;
		if (!isDragging && !isResizing) {
			isSelected = !isSelected;
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (isDragging) {
			x = event.clientX - mouseDownStartX;
			y = event.clientY - mouseDownStartY;
		} else if (isResizing && activeCorner) {
			const dx = event.clientX - mouseDownStartX;
			const dy = event.clientY - mouseDownStartY;
			let ratio: number;
			const originalWidth = width;
			const originalHeight = height;

			switch (activeCorner) {
				case 'nw':
					ratio = Math.sqrt(
						((mouseDownStartWidth - dx) / mouseDownStartWidth) *
							((mouseDownStartHeight - dy) / mouseDownStartHeight)
					);
					width = mouseDownStartWidth * ratio;
					height = mouseDownStartHeight * ratio;
					x -= width - originalWidth;
					y -= height - originalHeight;
					break;
				case 'ne':
					ratio = Math.sqrt(
						((mouseDownStartWidth + dx) / mouseDownStartWidth) *
							((mouseDownStartHeight - dy) / mouseDownStartHeight)
					);
					width = mouseDownStartWidth * ratio;
					height = mouseDownStartHeight * ratio;
					y -= height - originalHeight;
					break;
				case 'sw':
					ratio = Math.sqrt(
						((mouseDownStartWidth - dx) / mouseDownStartWidth) *
							((mouseDownStartHeight + dy) / mouseDownStartHeight)
					);
					width = mouseDownStartWidth * ratio;
					height = mouseDownStartHeight * ratio;
					x -= width - originalWidth;
					break;
				case 'se':
					ratio = Math.sqrt(
						((mouseDownStartWidth + dx) / mouseDownStartWidth) *
							((mouseDownStartHeight + dy) / mouseDownStartHeight)
					);
					width = mouseDownStartWidth * ratio;
					height = mouseDownStartHeight * ratio;
					break;
			}
		}
	}

	function handleMouseUp() {
		isDragging = false;
		isResizing = false;
		activeCorner = null;
	}

	function handleWindowMouseDown(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target.closest('.draggable-container') !== containerEl) {
			isSelected = false;
		}
	}
</script>

<svelte:window
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
	on:mousedown={handleWindowMouseDown}
/>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="draggable-container"
	style="position: absolute; left: {x}px; top: {y}px; width: {width}px; height: {height}px;"
	onmousedown={handleMouseDown}
	bind:this={containerEl}
>
	<img
		{src}
		alt={src}
		class="draggable-image"
		class:selected={isSelected}
		draggable="false"
		bind:this={imgEl}
	/>

	{#if isSelected}
		<div class="resize-handle nw" data-corner="nw"></div>
		<div class="resize-handle ne" data-corner="ne"></div>
		<div class="resize-handle sw" data-corner="sw"></div>
		<div class="resize-handle se" data-corner="se"></div>
	{/if}
</div>

<style>
	.draggable-container {
		display: inline-block;
		user-select: none;
		position: relative;
	}

	.draggable-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border: 2px solid transparent;
	}

	.selected {
		border-color: #001397;
	}

	.resize-handle {
		position: absolute;
		width: 10px;
		height: 10px;
		background: white;
		border: 2px solid #3b82f6;
		border-radius: 50%;
	}

	.nw {
		top: -5px;
		left: -5px;
		cursor: nw-resize;
	}

	.ne {
		top: -5px;
		right: -5px;
		cursor: ne-resize;
	}

	.sw {
		bottom: -5px;
		left: -5px;
		cursor: sw-resize;
	}

	.se {
		bottom: -5px;
		right: -5px;
		cursor: se-resize;
	}
</style>
