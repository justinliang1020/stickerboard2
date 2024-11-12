<script lang="ts">
	import type { MediaFormat } from '$lib/types';
	let {
		mediaFormat,
		src,
		x = $bindable(0),
		y = $bindable(0),
		z = $bindable(0),
		isSelected = $bindable(false),
		isEditing = $bindable(false),
		modifyZIndex = $bindable('')
	}: {
		mediaFormat: MediaFormat;
		src: string;
		x: number;
		y: number;
		z: number;
		isSelected: boolean;
		isEditing: boolean;
		modifyZIndex: '' | 'sendToFront' | 'sendToBack';
	} = $props();

	let isDragging = $state(false);
	let isResizing = $state(false);
	let imgEl: HTMLImageElement | null = $state(null);
	let textAreaEl: HTMLTextAreaElement | null = $state(null);
	let containerEl: HTMLDivElement;
	let mouseDownStartX: number;
	let mouseDownStartY: number;
	let mouseDownStartWidth: number;
	let mouseDownStartHeight: number;
	let width: number = $state(0);
	let height: number = $state(0);
	let activeCorner: string | null = $state(null);
	const minImageSize = 50; // pixels

	if (mediaFormat == 'text') {
		width = 200;
		height = 200;
	}

	$effect(() => {
		// this fires for images that are pre-loaded
		if (imgEl) {
			width = imgEl.naturalWidth;
			height = imgEl.naturalHeight;
			// this fires for images that are loaded by the user
			imgEl.onload = function () {
				if (imgEl) {
					width = imgEl.naturalWidth;
					height = imgEl.naturalHeight;
				}
			};
		}
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

	function clamp(x: number, y: number) {
		return Math.max(x, y);
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
						(clamp(mouseDownStartWidth - dx, 0) / mouseDownStartWidth) *
							(clamp(mouseDownStartHeight - dy, 0) / mouseDownStartHeight)
					);
					width = clamp(mouseDownStartWidth * ratio, minImageSize);
					height = clamp(mouseDownStartHeight * ratio, minImageSize);
					x -= width - originalWidth;
					y -= height - originalHeight;
					break;
				case 'ne':
					ratio = Math.sqrt(
						(clamp(mouseDownStartWidth + dx, 0) / mouseDownStartWidth) *
							(clamp(mouseDownStartHeight - dy, 0) / mouseDownStartHeight)
					);
					width = clamp(mouseDownStartWidth * ratio, minImageSize);
					height = clamp(mouseDownStartHeight * ratio, minImageSize);
					y -= height - originalHeight;
					break;
				case 'sw':
					ratio = Math.sqrt(
						(clamp(mouseDownStartWidth - dx, 0) / mouseDownStartWidth) *
							(clamp(mouseDownStartHeight + dy, 0) / mouseDownStartHeight)
					);
					width = clamp(mouseDownStartWidth * ratio, minImageSize);
					height = clamp(mouseDownStartHeight * ratio, minImageSize);
					x -= width - originalWidth;
					break;
				case 'se':
					ratio = Math.sqrt(
						(clamp(mouseDownStartWidth + dx, 0) / mouseDownStartWidth) *
							(clamp(mouseDownStartHeight + dy, 0) / mouseDownStartHeight)
					);
					width = clamp(mouseDownStartWidth * ratio, minImageSize);
					height = clamp(mouseDownStartHeight * ratio, minImageSize);
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
	class:selected={isSelected}
	style="position: absolute; left: {x}px; top: {y}px; z-index: {z}; width: {width}px; height: {height}px;"
	style:cursor="grab"
	onmousedown={handleMouseDown}
	bind:this={containerEl}
>
	{#if mediaFormat === 'img'}
		<img
			{src}
			alt={src.substring(0, 50)}
			class="draggable-image"
			draggable="false"
			bind:this={imgEl}
		/>
	{:else if mediaFormat === 'text'}
		<textarea
			name=""
			id=""
			class="text"
			bind:this={textAreaEl}
			onfocusin={() => (isEditing = true)}
			onfocusout={() => (isEditing = false)}>{src}</textarea
		>
	{/if}

	{#if isSelected}
		<!-- TODO: fix not being able to get the min and max z index
              decouple the canvas into another file?
              or could just use a svelte store for global stuff (this might be simpler?)
-->
		<button
			class="send-to-front"
			onclick={() => {
				modifyZIndex = 'sendToFront';
			}}>send to front</button
		>
		<button
			class="send-to-back"
			onclick={() => {
				modifyZIndex = 'sendToBack';
			}}>send to back</button
		>
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
		border: 3px solid transparent;
	}

	.draggable-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.selected {
		border-color: #001397;
	}

	.send-to-front {
		position: absolute;
		top: -30px;
		left: 5px;
	}

	.send-to-back {
		position: absolute;
		top: -30px;
		right: 5px;
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

	.text {
		width: 100%;
		height: 100%;
		margin: 0;

		color: white;
		font-size: 2em; /* Adjust size as needed */
		text-align: center;
		/* Outline effect */
		text-shadow:
			-1px -1px 0 #000,
			1px -1px 0 #000,
			-1px 1px 0 #000,
			1px 1px 0 #000;
		font-family: Tahoma, sans-serif;

		background-color: transparent;
		border: none;
		outline: none;
		resize: none;
		padding: 0;
		/* fix overflow to show without scrollbar */
		overflow: hidden;
		line-height: inherit;
	}
</style>
