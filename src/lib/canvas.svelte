<script lang="ts">
	import Draggable from '$lib/draggable.svelte';
	import type { MediaFormat } from '$lib/types';
	import type { ComponentProps } from 'svelte';
	import Taskbar from '$lib/taskbar.svelte';
	type DraggablePropTypes = ComponentProps<Draggable>;

	let draggables: DraggablePropTypes[] = $state([]);

	addDraggable('img', 'rat-spinning.gif');
	addDraggable('img', 'frieren-icegif-5.gif', 500, 400);
	addDraggable('img', 'windows-xp-dialog-funny.webp', 400, 100);
	addDraggable('text', 'hello world', 100, 200);

	function addDraggable(mediaFormat: MediaFormat, src: string, x: number = 200, y: number = 200) {
		const z = getMaxZIndex() + 1;
		draggables.push({
			mediaFormat,
			src,
			x,
			y,
			z: z,
			isSelected: false,
			isEditing: false,
			modifyZIndex: ''
		});
	}

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
				if (!anyDraggablesAreEditing) {
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

	$effect(() => {
		// uncomment for debugging
		// $inspect(draggables);

		draggables.map((d) => {
			switch (d.modifyZIndex) {
				case 'sendToBack':
					d.z = getMinZIndex() - 1;
					d.modifyZIndex = '';
					break;
				case 'sendToFront':
					d.z = getMaxZIndex() + 1;
					d.modifyZIndex = '';
					break;
			}
		});
	});
</script>

<svelte:window on:paste={handlePaste} on:keydown={handleKeyDown} />

{#each draggables as d (d)}
	<Draggable
		mediaFormat={d.mediaFormat}
		src={d.src}
		bind:x={d.x}
		bind:y={d.y}
		bind:z={d.z}
		bind:isSelected={d.isSelected}
		bind:isEditing={d.isEditing}
		bind:modifyZIndex={d.modifyZIndex}
	/>
{/each}

<Taskbar />

<style>
	:global(body) {
		background: no-repeat fixed url('windows-xp-background.jpg') center / 100% 100%;
	}
</style>
