<script lang="ts">
	import Taskbar from '$lib/taskbar.svelte';
	import { onMount } from 'svelte';
	import { segmentation } from './segmentation.svelte';

	type MediaFormat = 'img' | 'gif' | 'text';
	type Draggable = {
		mediaFormat: MediaFormat;
		src: string;
		x: number;
		y: number;
		z: number;
		width: number;
		height: number;
		isSelected: boolean;
		isEditing: boolean;
		isResizing: boolean;
		isDragging: boolean;
		isSegmenting: boolean;
		imgEl: HTMLImageElement | null;
		textAreaEl: HTMLTextAreaElement | null;
		containerEl: HTMLDivElement | null;
		activeCorner: string | null;
	};
	type MouseDownInfo = {
		startX: number;
		startY: number;
		startWidth: number;
		startHeight: number;
	};

	let draggables: Draggable[] = $state([]);
	const minImageSize = 50; // pixels
	let mouseDownInfo: MouseDownInfo = {
		startX: 0,
		startY: 0,
		startWidth: 0,
		startHeight: 0
	};
	let segmentationCanvas: HTMLCanvasElement | undefined = $state();

	// NOTE: must manually set image dimnensions
	addDraggable('img', 'windows-spiral.png', 330, 135, 540, 352);
	addDraggable('gif', 'sphere.gif', 942, 185, 200, 200);
	addDraggable('img', 'spiral-sand.jpg', 25, 159, 350, 285);
	addDraggable(
		'text',
		"we're all just walking eachother home",
		// 'Being with you and not being with you is the only way I have to measure time',
		56,
		284,
		300,
		300
	);

	$effect(() => {
		for (const d of draggables) {
			if (d.imgEl) {
				d.imgEl.onload = function () {
					if (d.imgEl) {
						const maxRatio = 4 / 3;
						const scaleFactor = Math.max(
							(d.imgEl.naturalWidth * maxRatio) / window.innerWidth,
							(d.imgEl.naturalHeight * maxRatio) / window.innerHeight
						);
						d.width = Math.min(d.imgEl.naturalWidth, d.imgEl.naturalWidth / scaleFactor);
						d.height = Math.min(d.imgEl.naturalHeight, d.imgEl.naturalHeight / scaleFactor);
					}
				};
			}
		}
		segmentation.maskCanvas = segmentationCanvas;
	});

	onMount(async () => {
		//TODO: call this in a separate thread to not block the main thread/allow images to be clicked befeore this is loaded
		await segmentation.setup_sam_model();
	});

	// Draggables manipulation functions

	function addDraggable(
		mediaFormat: MediaFormat,
		src: string,
		x: number = 100,
		y: number = 100,
		width: number = 200,
		height: number = 200
	) {
		const z = getMaxZIndex() + 1;
		draggables.push({
			mediaFormat,
			src,
			x,
			y,
			z,
			width,
			height,
			isSelected: false,
			isEditing: false,
			isDragging: false,
			isResizing: false,
			isSegmenting: false,
			imgEl: null,
			textAreaEl: null,
			containerEl: null,
			activeCorner: null
		});
	}

	function getMaxZIndex(): number {
		return Math.max(...draggables.map((d) => d.z), 0);
	}

	function getMinZIndex(): number {
		return Math.min(...draggables.map((d) => d.z), 0);
	}

	function processFileAndAddDraggable(file: File, mediaFormat: MediaFormat) {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e: ProgressEvent<FileReader>) => {
			const result = e.target?.result;
			if (!result) return;
			if (mediaFormat == 'img') {
				addDraggable('img', result as string);
			} else if (mediaFormat == 'gif') {
				addDraggable('gif', result as string);
			}
		};
		reader.readAsDataURL(file);
	}

	function deleteSelectedMedia() {
		draggables = draggables.filter((d) => d.isSelected === false);
	}

	function unselectSelectedMedia() {
		const selectedMedia = draggables.find((d) => d.isSelected);
		if (selectedMedia) {
			selectedMedia.isSelected = false;
		}
	}

	function anyDraggablesAreEditing(): Boolean {
		for (const d of draggables) {
			if (d.isEditing) return true;
		}
		return false;
	}

	// event listener callback functions

	const handlePaste = (event: ClipboardEvent) => {
		const items = event.clipboardData?.items;
		if (!items) return;
		Array.from(items).some((item) => {
			const file = item.getAsFile();
			if (item.type.startsWith('image/gif')) {
				if (file) processFileAndAddDraggable(file, 'gif');
				return;
			} else if (item.type.startsWith('image')) {
				if (file) processFileAndAddDraggable(file, 'img');
				return;
			}

			return false;
		});
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		switch (true) {
			case event.key === 'Backspace' || event.key === 'Delete':
				if (!anyDraggablesAreEditing()) {
					deleteSelectedMedia();
					event.preventDefault();
				}
				break;
			case (event.ctrlKey || event.metaKey) && event.key === 'c':
				// copySelectedImageToClipboard();
				event.preventDefault();
				break;
			case (event.ctrlKey || event.metaKey) && event.key === 'x':
				// copySelectedImageToClipboard();
				// deleteSelectedMedia();
				event.preventDefault();
				break;
			case event.key === 'Escape':
				unselectSelectedMedia();
				event.preventDefault();
				break;
		}
	};

	const handleMouseDownDraggable = (event: MouseEvent, d: Draggable) => {
		const target = event.target as HTMLElement;
		if (target.classList.contains('resize-handle')) {
			d.isDragging = false;
			d.isResizing = true;
			d.activeCorner = target.dataset.corner || null;
			mouseDownInfo.startX = event.clientX;
			mouseDownInfo.startY = event.clientY;
			mouseDownInfo.startWidth = d.width;
			mouseDownInfo.startHeight = d.height;
		} else if (d.isSegmenting) {
			//TODO: isSegmenting code
		} else {
			d.isSelected = true;
			d.isDragging = true;
			mouseDownInfo.startX = event.clientX - d.x;
			mouseDownInfo.startY = event.clientY - d.y;
		}
	};

	const handleMouseMove = (event: MouseEvent) => {
		const d: Draggable | null = draggables.find((d) => d.isSelected) || null;
		if (d === null) {
			return;
		}
		if (d.isDragging) {
			d.x = event.clientX - mouseDownInfo.startX;
			d.y = event.clientY - mouseDownInfo.startY;
		} else if (d.isResizing && d.activeCorner) {
			const dx = event.clientX - mouseDownInfo.startX;
			const dy = event.clientY - mouseDownInfo.startY;
			let ratio: number;
			const originalWidth = d.width;
			const originalHeight = d.height;

			switch (d.activeCorner) {
				case 'nw':
					ratio = Math.sqrt(
						(Math.max(mouseDownInfo.startWidth - dx, 0) / mouseDownInfo.startWidth) *
							(Math.max(mouseDownInfo.startHeight - dy, 0) / mouseDownInfo.startHeight)
					);
					d.width = Math.max(mouseDownInfo.startWidth * ratio, minImageSize);
					d.height = Math.max(mouseDownInfo.startHeight * ratio, minImageSize);
					d.x -= d.width - originalWidth;
					d.y -= d.height - originalHeight;
					break;
				case 'ne':
					ratio = Math.sqrt(
						(Math.max(mouseDownInfo.startWidth + dx, 0) / mouseDownInfo.startWidth) *
							(Math.max(mouseDownInfo.startHeight - dy, 0) / mouseDownInfo.startHeight)
					);
					d.width = Math.max(mouseDownInfo.startWidth * ratio, minImageSize);
					d.height = Math.max(mouseDownInfo.startHeight * ratio, minImageSize);
					d.y -= d.height - originalHeight;
					break;
				case 'sw':
					ratio = Math.sqrt(
						(Math.max(mouseDownInfo.startWidth - dx, 0) / mouseDownInfo.startWidth) *
							(Math.max(mouseDownInfo.startHeight + dy, 0) / mouseDownInfo.startHeight)
					);
					d.width = Math.max(mouseDownInfo.startWidth * ratio, minImageSize);
					d.height = Math.max(mouseDownInfo.startHeight * ratio, minImageSize);
					d.x -= d.width - originalWidth;
					break;
				case 'se':
					ratio = Math.sqrt(
						(Math.max(mouseDownInfo.startWidth + dx, 0) / mouseDownInfo.startWidth) *
							(Math.max(mouseDownInfo.startHeight + dy, 0) / mouseDownInfo.startHeight)
					);
					d.width = Math.max(mouseDownInfo.startWidth * ratio, minImageSize);
					d.height = Math.max(mouseDownInfo.startHeight * ratio, minImageSize);
					break;
			}
		}
	};

	const handleMouseUp = () => {
		// TODO: unsure
		for (const d of draggables) {
			d.isDragging = false;
			d.isResizing = false;
			d.activeCorner = null;
		}
	};

	const handleWindowMouseDown = (event: MouseEvent) => {
		const target = event.target as HTMLElement;
		for (const d of draggables) {
			if (target.closest('.draggable-container') !== d.containerEl) {
				d.isSelected = false;
				d.isSegmenting = false;
			}
		}
	};
</script>

<svelte:window
	on:paste={handlePaste}
	on:keydown={handleKeyDown}
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
	on:mousedown={handleWindowMouseDown}
/>

{#each draggables as d (d)}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="draggable-container"
		class:selected={d.isSelected}
		style="position: absolute; left: {d.x}px; top: {d.y}px; z-index: {d.z}; width: {d.width}px; height: {d.height}px;"
		style:cursor={d.isSegmenting ? 'pointer' : 'grab'}
		onmousedown={(e) => handleMouseDownDraggable(e, d)}
		bind:this={d.containerEl}
	>
		{#if d.mediaFormat === 'img' || d.mediaFormat === 'gif'}
			<img
				src={d.src}
				alt={d.src.substring(0, 50)}
				class="draggable-image"
				draggable="false"
				bind:this={d.imgEl}
			/>
			{#if d.isSegmenting}
				<canvas class="segmentation-canvas" bind:this={segmentationCanvas}></canvas>
				<div
					style="
		width: 100%;
		height: 100%;
		position: absolute;
		left: 0;
		top: 0;
          "
					onmousedown={(e) => segmentation.handleContainerMouseDown(e)}
					onmousemove={(e) => segmentation.handleContainerMouseMove(e)}
				></div>
				{#if segmentation.isEncoding}
					<p style="color: white;">encoding...</p>
				{/if}
			{/if}
		{:else if d.mediaFormat === 'text'}
			<textarea
				name=""
				id=""
				class="text"
				bind:this={d.textAreaEl}
				onfocusin={() => (d.isEditing = true)}
				onfocusout={() => (d.isEditing = false)}>{d.src}</textarea
			>
		{/if}

		{#if d.isSelected}
			<div class="draggable-title-bar">
				{#if d.isSegmenting}
					<button
						onclick={async () => {
							d.isSegmenting = false;
							segmentation.reset();
						}}>cancel</button
					>
					<button>reset</button>
					<button>create</button>
				{:else}
					<button
						style="background-image: url('x-button.png')"
						aria-label="delete"
						onclick={() => {
							deleteSelectedMedia();
						}}
					>
					</button>
					<button
						style="background-image: url('send-to-back.png')"
						aria-label="send-to-back"
						onclick={() => {
							d.z = getMinZIndex() - 1;
						}}
					></button>
					<button
						style="background-image: url('send-to-front.png')"
						aria-label="send-to-front"
						onclick={() => {
							d.z = getMaxZIndex() + 1;
						}}
					></button>
					{#if d.mediaFormat === 'img'}
						<button
							onclick={async () => {
								d.isSegmenting = true;
								await segmentation.encode(d.src);
							}}
						>
							segment
						</button>
					{/if}
				{/if}
			</div>

			<div class="resize-handle nw" data-corner="nw"></div>
			<div class="resize-handle ne" data-corner="ne"></div>
			<div class="resize-handle sw" data-corner="sw"></div>
			<div class="resize-handle se" data-corner="se"></div>
		{/if}
	</div>
{/each}

<Taskbar {addDraggable} {processFileAndAddDraggable} />

<style>
	:global(body) {
		background: black;
		overflow: hidden;
	}

	.draggable-title-bar {
		position: absolute;
		top: -30px;
		left: -3px;
		width: calc(100% - 3px);
		height: 20px;
		border-radius: 5px 5px 0 0;
		padding: 5px 5px;
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
	}

	.draggable-title-bar button {
		float: right;
		height: 100%;
		aspect-ratio: 1 / 1;
		border: none;
		background-size: cover;
		cursor: pointer;
		margin-left: 3px;
	}

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

	.segmentation-canvas {
		width: 100%;
		height: 100%;
		position: absolute;
		left: 0;
		top: 0;
		background-color: rgba(0, 50, 0, 0.15);
	}

	.selected {
		border-color: #172558;
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
