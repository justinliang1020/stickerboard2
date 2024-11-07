<script lang="ts">
	let { src }: { src: string } = $props();

	let isDragging = $state(false);
	let isResizing = $state(false);
	let isSelected = $state(false);
	let x = $state(0);
	let y = $state(0);
	let imageSizeRatio = $state(1);
	let imgEl: HTMLImageElement;
	let startX: number;
	let startY: number;
	let naturalWidth: number = $state(0);
	let naturalHeight: number = $state(0);
	let activeCorner: string | null = $state(null);

	$effect(() => {
		naturalWidth = imgEl.naturalWidth;
		naturalHeight = imgEl.naturalHeight;
	});

	function handleMouseDown(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target.classList.contains('resize-handle')) {
			isDragging = false;
			isResizing = true;
			activeCorner = target.dataset.corner || null;
			startX = event.clientX;
			startY = event.clientY;
		} else {
			isDragging = true;
			startX = event.clientX - x;
			startY = event.clientY - y;
		}
		isSelected = true;
		if (!isDragging && !isResizing) {
			isSelected = !isSelected;
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (isDragging) {
			x = event.clientX - startX;
			y = event.clientY - startY;
		} else if (isResizing && activeCorner) {
			const dx = event.clientX - startX;
			const dy = event.clientY - startY;

			switch (activeCorner) {
				// case 'nw':
				// 	width = Math.max(50, startWidth - dx);
				// 	height = Math.max(50, startHeight - dy);
				// 	x = startX + dx + (startWidth - width);
				// 	y = startY + dy + (startHeight - height);
				// 	break;
				// case 'ne':
				// 	width = Math.max(50, startWidth + dx);
				// 	height = Math.max(50, startHeight - dy);
				// 	y = startY + dy + (startHeight - height);
				// 	break;
				// case 'sw':
				// 	width = Math.max(50, startWidth - dx);
				// 	height = Math.max(50, startHeight + dy);
				// 	x = startX + dx + (startWidth - width);
				// 	break;
				case 'se':
					imageSizeRatio =
						((naturalWidth + dx) / naturalWidth) * ((naturalHeight + dy) / naturalHeight);
					break;
			}
		}
	}

	function handleMouseUp() {
		isDragging = false;
		isResizing = false;
		activeCorner = null;
	}

	function handleClick(event: MouseEvent) {
		if (!isDragging && !isResizing) {
			isSelected = !isSelected;
		}
	}

	function handleWindowClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.draggable-container')) {
			isSelected = false;
		}
	}
</script>

<svelte:window
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
	on:click={handleWindowClick}
/>

<div
	class="draggable-container"
	style="position: absolute; left: {x}px; top: {y}px; width: {naturalWidth *
		imageSizeRatio}px; height: {naturalHeight * imageSizeRatio}px;"
	on:mousedown={handleMouseDown}
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
		border-color: #3b82f6;
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
