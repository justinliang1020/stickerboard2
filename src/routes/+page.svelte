<script lang="ts">
	import Taskbar from '$lib/taskbar.svelte';
	import Draggable from '$lib/draggable.svelte';
	import type { ComponentProps } from 'svelte';
	type DraggablePropTypes = ComponentProps<Draggable>;

	let draggables: DraggablePropTypes[] = $state([
		{ src: 'frieren-icegif-5.gif', x: 500, y: 400, isSelected: false },
		{
			src: 'windows-xp-dialog-funny.webp',
			x: 400,
			y: 100,
			isSelected: false
		},
		{ src: 'rat-spinning.gif', x: 0, y: 0, isSelected: false }
	]);

	function addDraggable(src: string) {
		draggables.push({ src, x: 200, y: 200, isSelected: false });
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
		draggables = draggables.map((d) => ({ ...d, isSelected: false }));
	}

	function handleKeyDown(event: KeyboardEvent) {
		switch (true) {
			case event.key === 'Backspace' || event.key === 'Delete':
				deleteSelectedMedia();
				event.preventDefault();
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
</script>

<svelte:window on:paste={handlePaste} on:keydown={handleKeyDown} />

{#each draggables as d (d)}
	<Draggable {...d} bind:x={d.x} bind:y={d.y} bind:isSelected={d.isSelected} />
{/each}

<Taskbar />

<style>
	:global(body) {
		background-image: url('windows-xp-background.jpg');
		background-repeat: no-repeat;
		background-attachment: fixed;
		background-size: 100% 100%;
	}
</style>
