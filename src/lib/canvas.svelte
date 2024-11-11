<script lang="ts">
	import Draggable from '$lib/draggable.svelte';
	import type { MediaFormat } from '$lib/types';
	import type { ComponentProps } from 'svelte';
	type DraggablePropTypes = ComponentProps<Draggable>;

	let draggables: DraggablePropTypes[] = $state([
		{
			mediaFormat: 'img',
			src: 'frieren-icegif-5.gif',
			x: 500,
			y: 400,
			z: 0,
			isSelected: false,
			isEditing: false
		},
		{
			mediaFormat: 'img',
			src: 'windows-xp-dialog-funny.webp',
			x: 400,
			y: 100,
			z: 1,
			isSelected: false,
			isEditing: false
		},
		{
			mediaFormat: 'img',
			src: 'rat-spinning.gif',
			x: 0,
			y: 0,
			z: 2,
			isSelected: false,
			isEditing: false
		},
		{
			mediaFormat: 'text',
			src: 'hello world',
			x: 0,
			y: 0,
			z: 3,
			isSelected: false,
			isEditing: false
		}
	]);

	function addDraggable(src: string) {
		const z = getMaxZIndex() + 1;
		draggables.push({
			mediaFormat: 'img',
			src,
			x: 200,
			y: 200,
			z: z,
			isSelected: false,
			isEditing: false
		});
	}

	export function getMaxZIndex(): number {
		return draggables.reduce((acc, d) => Math.max(acc, d.z), -Infinity);
	}

	export function getMinZIndex(): number {
		return draggables.reduce((acc, d) => Math.min(acc, d.z), Infinity);
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
			if (result) addDraggable(result as string);
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

	// $effect(() => {
	// 	$inspect(draggables);
	// });
</script>

<svelte:window on:paste={handlePaste} on:keydown={handleKeyDown} />

{#each draggables as d (d)}
	<Draggable {...d} bind:x={d.x} bind:y={d.y} bind:z={d.z} bind:isSelected={d.isSelected} />
{/each}
