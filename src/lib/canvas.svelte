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
		autoscale: boolean;
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
	let imageFilter = $state('none');

	let onSelectAudio: HTMLAudioElement;
	let onDeselectAudio: HTMLAudioElement;
	let onNewDraggableAudio: HTMLAudioElement;
	let onDeleteDraggableAudio: HTMLAudioElement;
	let onSegmentAudio: HTMLAudioElement;

	// NOTE: must manually set image dimnensions
	addDraggable('img', 'frieren.webp', 100, 100, 640, 320);

	$effect(() => {
		// NOTE: initial draggables aren't autoscaled since they are server-side-rendered, thus their state is not changed in the effect rune
		for (const d of draggables) {
			if (d.imgEl) {
				d.imgEl.onload = function () {
					if (d.imgEl && d.autoscale) {
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

			// this feels strange
			if (!d.isSegmenting) {
				segmentation.reset_mask();
			}
		}
		segmentation.maskCanvas = segmentationCanvas;
	});

	onMount(async () => {
		// setup audios
		onSelectAudio = new Audio('audio/slap-1.mp3');
		onDeselectAudio = new Audio('audio/thump-1.mp3');
		onNewDraggableAudio = new Audio('audio/drop-1.mp3');
		onDeleteDraggableAudio = new Audio('audio/paper-crumble-1.mp3');
		onSegmentAudio = new Audio('audio/scissors-1.mp3');
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
		height: number = 200,
		autoscale: boolean = true
	) {
		const z = getMaxZIndex() + 1;
		// hack
		if (mediaFormat == 'text') {
			width = 200;
			height = 100;
		}
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
			activeCorner: null,
			autoscale
		});

		if (onNewDraggableAudio) {
			onNewDraggableAudio.play();
		}
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
		onDeleteDraggableAudio.play();
	}

	function deselectDraggable(d: Draggable) {
		d.isSelected = false;
		d.isSegmenting = false;
		onDeselectAudio.play();
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
				const d = draggables.find((d) => d.isSelected);
				if (d) {
					deselectDraggable(d);
				}
				event.preventDefault();
				break;
		}
	};

	const handleWindowPointerMove = (event: MouseEvent | TouchEvent) => {
		const d: Draggable | null = draggables.find((d) => d.isSelected) || null;
		if (d === null) {
			return;
		}

		let clientX;
		let clientY;
		if (event instanceof MouseEvent) {
			clientX = event.clientX;
			clientY = event.clientY;
		} else if (event instanceof TouchEvent) {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
		} else {
			return;
		}

		if (d.isDragging) {
			d.x = clientX - mouseDownInfo.startX;
			d.y = clientY - mouseDownInfo.startY;
		} else if (d.isResizing && d.activeCorner) {
			const dx = clientX - mouseDownInfo.startX;
			const dy = clientY - mouseDownInfo.startY;
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

	const handleWindowPointerUp = () => {
		// TODO: unsure
		for (const d of draggables) {
			d.isDragging = false;
			d.isResizing = false;
			d.activeCorner = null;
		}
	};

	const handleWindowPointerStart = (event: MouseEvent | TouchEvent) => {
		const target = event.target as HTMLElement;
		if (!target.closest('.draggable-container')) {
			const d = draggables.find((d) => d.isSelected);
			if (d) {
				deselectDraggable(d);
			}
		} else {
			let d;
			for (let di of draggables) {
				if (target.closest('.draggable-container') == di.containerEl) {
					d = di;
				}
			}
			if (!d) {
				return;
			}

			let clientX;
			let clientY;
			if (event instanceof MouseEvent) {
				clientX = event.clientX;
				clientY = event.clientY;
			} else if (event instanceof TouchEvent) {
				clientX = event.touches[0].clientX;
				clientY = event.touches[0].clientY;
			} else {
				return;
			}

			if (target.classList.contains('resize-handle')) {
				d.isDragging = false;
				d.isResizing = true;
				d.activeCorner = target.dataset.corner || null;
				mouseDownInfo.startX = clientX;
				mouseDownInfo.startY = clientY;
				mouseDownInfo.startWidth = d.width;
				mouseDownInfo.startHeight = d.height;
			} else {
				const selectedDraggable = draggables.find((d1) => d1.isSelected);
				if (!selectedDraggable) {
					d.isSelected = true;
					onSelectAudio.play();
				} else if (selectedDraggable != d) {
					deselectDraggable(selectedDraggable);
					d.isSelected = true;
					onSelectAudio.play();
				}
				d.isDragging = true;
				mouseDownInfo.startX = clientX - d.x;
				mouseDownInfo.startY = clientY - d.y;
			}
		}
	};
</script>

<svelte:window
	onpaste={handlePaste}
	onkeydown={handleKeyDown}
	onmousemove={handleWindowPointerMove}
	onmouseup={handleWindowPointerUp}
	onmousedown={handleWindowPointerStart}
	ontouchmove={handleWindowPointerMove}
	ontouchend={handleWindowPointerUp}
	ontouchstart={handleWindowPointerStart}
/>

{#each draggables as d (d)}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="draggable-container"
		class:selected={d.isSelected}
		style="position: absolute; left: {d.x}px; top: {d.y}px; z-index: {d.z}; width: {d.width}px; height: {d.height}px;"
		style:cursor={d.isSegmenting ? 'pointer' : 'grab'}
		bind:this={d.containerEl}
	>
		{#if d.mediaFormat === 'img' || d.mediaFormat === 'gif'}
			<img
				src={d.src}
				alt={d.src.substring(0, 50)}
				class="draggable-image"
				draggable="false"
				bind:this={d.imgEl}
				style={`filter: ${imageFilter};`}
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
					oncontextmenu={(e) => e.preventDefault()}
				></div>
				{#if segmentation.isEncoding}
					<p style="color: white;">encoding...</p>
				{/if}
			{/if}
		{:else if d.mediaFormat === 'text'}
			<textarea
				name=""
				id=""
				bind:this={d.textAreaEl}
				onfocusin={() => (d.isEditing = true)}
				onfocusout={() => (d.isEditing = false)}>{d.src}</textarea
			>
		{/if}

		{#if d.isSelected}
			<div class="draggable-title-bar">
				{#if d.isSegmenting}
					<button
						style="background-image: url('windows-xp-icon-go-back.png')"
						aria-label="go-back"
						onclick={async () => {
							d.isSegmenting = false;
							segmentation.reset_mask();
						}}
					></button>
					<button
						style="background-image: url('windows-xp-icon-clear.png')"
						aria-label="clear"
						disabled={!segmentation.isMultiMaskMode}
						onclick={() => segmentation.clearPointsAndMask()}
					></button>
					<button
						style="background-image: url('windows-xp-icon-plus.png')"
						aria-label="create"
						disabled={!segmentation.isMultiMaskMode}
						onclick={async () => {
							const cutoutImage = await segmentation.createCutOut();
							if (!d.imgEl || !cutoutImage) {
								console.error("error: couldn't cutout image");
								return;
							}
							const scaledWidth = (cutoutImage.width * d.width) / d.imgEl.naturalWidth;
							const scaledHeight = (cutoutImage.height * d.height) / d.imgEl.naturalHeight;
							if (cutoutImage) {
								addDraggable('img', cutoutImage.imageUrl, 0, 0, scaledWidth, scaledHeight, false);
							}
						}}
					></button>
				{:else}
					<button
						style="background-image: url('windows-xp-icon-x-button.png')"
						aria-label="delete"
						onclick={() => {
							deleteSelectedMedia();
						}}
					>
					</button>
					<button
						style="background-image: url('windows-xp-icon-send-to-back.png')"
						aria-label="send-to-back"
						onclick={() => {
							d.z = getMinZIndex() - 1;
						}}
					></button>
					<button
						style="background-image: url('windows-xp-icon-send-to-front.png')"
						aria-label="send-to-front"
						onclick={() => {
							d.z = getMaxZIndex() + 1;
						}}
					></button>
					{#if d.mediaFormat === 'img'}
						<button
							style="background-image: url('windows-xp-icon-segment-cut.png');"
							aria-label="segment"
							onclick={async () => {
								d.isSegmenting = true;
								onSegmentAudio.play();
								await segmentation.encode(d.src);
							}}
						>
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

<Taskbar {addDraggable} {processFileAndAddDraggable} bind:imageFilter />

<style>
	:global(body) {
		background: black;
		overflow: hidden;
		overscroll-behavior: none;
	}

	.draggable-title-bar {
		position: absolute;
		top: -28px;
		left: -3px;
		width: max(calc(100% - 25px), 180px);
		height: 28px;
		border-radius: 5px 5px 0 0;
		padding: 2px 25px 2px 5px;

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

	.draggable-title-bar button:hover {
		filter: brightness(150%);
	}

	.draggable-title-bar button:disabled {
		filter: brightness(60%);
		cursor: default;
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

	textarea {
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
		font-weight: bold;
		caret-color: #00ffff;
	}

	@media (max-width: 600px) {
		.resize-handle {
			width: 20px;
			height: 20px;
		}
	}
</style>
