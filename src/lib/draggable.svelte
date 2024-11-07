<script lang="ts">
	let { src }: { src: string } = $props();

	let isDragging = $state(false);
	let isSelected = $state(false);
	let x = $state(0);
	let y = $state(0);
	let startX: number;
	let startY: number;

	function handleMouseDown(event: MouseEvent) {
		isDragging = true;
		isSelected = true;
		startX = event.clientX - x;
		startY = event.clientY - y;
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;

		x = event.clientX - startX;
		y = event.clientY - startY;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleClick(event: MouseEvent) {
		// Prevent deselection when clicking and dragging
		if (!isDragging) {
			isSelected = !isSelected;
		}
	}

	// Handle clicking outside to deselect
	function handleWindowClick(event: MouseEvent) {
		// @ts-ignore
		if (!event.target.closest('.draggable-container')) {
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
	style="position: absolute; left: {x}px; top: {y}px; cursor: move;"
	on:mousedown={handleMouseDown}
	on:click={handleClick}
>
	<img
		{src}
		alt={src}
		class="draggable-image"
		class:selected={isSelected}
		draggable="false"
		width="200"
	/>
</div>

<style>
	.draggable-container {
		display: inline-block;
		user-select: none;
	}

	.draggable-image {
		border: 2px solid transparent;
		transition: border-color 0.2s ease;
	}

	.selected {
		border-color: #3b82f6;
	}
</style>
