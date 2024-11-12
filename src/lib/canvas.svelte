<script lang="ts">
	import Taskbar from '$lib/taskbar.svelte';

	type MediaFormat = 'img' | 'text';
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
		imgEl: HTMLImageElement | null;
		textAreaEl: HTMLTextAreaElement | null;
		containerEl: HTMLDivElement | null;
		activeCorner: string | null;
	};

	let draggables: Draggable[] = $state([]);

	// NOTE: must manually set image dimnensions
	addDraggable('img', 'rat-spinning.gif', 0, 0, 200, 200);
	addDraggable('img', 'frieren-icegif-5.gif', 500, 400, 220, 220);
	addDraggable('img', 'windows-xp-dialog-funny.webp', 400, 100, 191, 126); //TODO: find natural width/height
	addDraggable('text', 'hello world', 100, 200);

	export function addDraggable(
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
			imgEl: null,
			textAreaEl: null,
			containerEl: null,
			activeCorner: null
		});
	}

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
	});

	export function getMaxZIndex(): number {
		return Math.max(...draggables.map((d) => d.z), 0);
	}

	export function getMinZIndex(): number {
		return Math.min(...draggables.map((d) => d.z), 0);
	}

	function handlePaste(event: ClipboardEvent) {
		const items = event.clipboardData?.items;
		if (!items) return;
		Array.from(items).some((item) => {
			if (item.type.startsWith('image')) {
				const file = item.getAsFile();
				if (file) processFileAndAddDraggable(file);
				return true;
			}
			return false;
		});
	}

	function processFileAndAddDraggable(file: File) {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e: ProgressEvent<FileReader>) => {
			const result = e.target?.result;
			if (result) addDraggable('img', result as string);
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

	// async function copySelectedImageToClipboard() {
	// 	try {
	// 		const selectedMedia = draggables.find((d) => d.isSelected);
	// 		// Fetch the image data from the URL
	// 		const response = await fetch(selectedMedia.src);
	// 		const blob = await response.blob();
	//
	// 		// Create a ClipboardItem with the image blob
	// 		const item = new ClipboardItem({
	// 			'image/png': blob // You can specify other MIME types if necessary
	// 		});
	//
	// 		// Write the ClipboardItem to the clipboard
	// 		await navigator.clipboard.write([item]);
	//
	// 		console.log('Image copied to clipboard!');
	// 	} catch (error) {
	// 		console.error('Failed to copy image to clipboard: ', error);
	// 	}
	// }
	//
	function handleKeyDown(event: KeyboardEvent) {
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
	}

	const minImageSize = 50; // pixels
	let mouseDownStartX: number;
	let mouseDownStartY: number;
	let mouseDownStartWidth: number;
	let mouseDownStartHeight: number;

	function handleMouseDown(event: MouseEvent, d: Draggable) {
		const target = event.target as HTMLElement;
		if (target.classList.contains('resize-handle')) {
			d.isDragging = false;
			d.isResizing = true;
			d.activeCorner = target.dataset.corner || null;
			mouseDownStartX = event.clientX;
			mouseDownStartY = event.clientY;
			mouseDownStartWidth = d.width;
			mouseDownStartHeight = d.height;
		} else {
			d.isDragging = true;
			mouseDownStartX = event.clientX - d.x;
			mouseDownStartY = event.clientY - d.y;
		}
		d.isSelected = true;
		if (!d.isDragging && !d.isResizing) {
			d.isSelected = !d.isSelected;
		}
	}

	function clamp(x: number, y: number) {
		return Math.max(x, y);
	}

	function handleMouseMove(event: MouseEvent) {
		const d: Draggable | null = draggables.find((d) => d.isSelected) || null;
		if (d === null) {
			return;
		}
		if (d.isDragging) {
			d.x = event.clientX - mouseDownStartX;
			d.y = event.clientY - mouseDownStartY;
		} else if (d.isResizing && d.activeCorner) {
			const dx = event.clientX - mouseDownStartX;
			const dy = event.clientY - mouseDownStartY;
			let ratio: number;
			const originalWidth = d.width;
			const originalHeight = d.height;

			switch (d.activeCorner) {
				case 'nw':
					ratio = Math.sqrt(
						(clamp(mouseDownStartWidth - dx, 0) / mouseDownStartWidth) *
							(clamp(mouseDownStartHeight - dy, 0) / mouseDownStartHeight)
					);
					d.width = clamp(mouseDownStartWidth * ratio, minImageSize);
					d.height = clamp(mouseDownStartHeight * ratio, minImageSize);
					d.x -= d.width - originalWidth;
					d.y -= d.height - originalHeight;
					break;
				case 'ne':
					ratio = Math.sqrt(
						(clamp(mouseDownStartWidth + dx, 0) / mouseDownStartWidth) *
							(clamp(mouseDownStartHeight - dy, 0) / mouseDownStartHeight)
					);
					d.width = clamp(mouseDownStartWidth * ratio, minImageSize);
					d.height = clamp(mouseDownStartHeight * ratio, minImageSize);
					d.y -= d.height - originalHeight;
					break;
				case 'sw':
					ratio = Math.sqrt(
						(clamp(mouseDownStartWidth - dx, 0) / mouseDownStartWidth) *
							(clamp(mouseDownStartHeight + dy, 0) / mouseDownStartHeight)
					);
					d.width = clamp(mouseDownStartWidth * ratio, minImageSize);
					d.height = clamp(mouseDownStartHeight * ratio, minImageSize);
					d.x -= d.width - originalWidth;
					break;
				case 'se':
					ratio = Math.sqrt(
						(clamp(mouseDownStartWidth + dx, 0) / mouseDownStartWidth) *
							(clamp(mouseDownStartHeight + dy, 0) / mouseDownStartHeight)
					);
					d.width = clamp(mouseDownStartWidth * ratio, minImageSize);
					d.height = clamp(mouseDownStartHeight * ratio, minImageSize);
					break;
			}
		}
	}

	function handleMouseUp() {
		// TODO: unsure
		for (const d of draggables) {
			d.isDragging = false;
			d.isResizing = false;
			d.activeCorner = null;
		}
	}

	function handleWindowMouseDown(event: MouseEvent) {
		const target = event.target as HTMLElement;
		for (const d of draggables) {
			if (target.closest('.draggable-container') !== d.containerEl) {
				d.isSelected = false;
			}
		}
	}
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
		style:cursor="grab"
		onmousedown={(e) => handleMouseDown(e, d)}
		bind:this={d.containerEl}
	>
		{#if d.mediaFormat === 'img'}
			<img
				src={d.src}
				alt={d.src.substring(0, 50)}
				class="draggable-image"
				draggable="false"
				bind:this={d.imgEl}
			/>
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
			<button
				class="send-to-front"
				onclick={() => {
					d.z = getMaxZIndex() + 1;
				}}>send to front</button
			>
			<button
				class="send-to-back"
				onclick={() => {
					d.z = getMinZIndex() - 1;
				}}>send to back</button
			>
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
		background: no-repeat fixed url('windows-xp-background.jpg') center / 100% 100%;
		overflow: hidden;
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
