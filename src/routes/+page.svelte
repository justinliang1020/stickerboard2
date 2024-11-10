<script lang="ts">
	import Taskbar from '$lib/taskbar.svelte';
	import Draggable from '$lib/draggable.svelte';
	import type { ComponentProps } from 'svelte';
	type DraggablePropTypes = ComponentProps<Draggable>;

	let draggables: DraggablePropTypes[] = $state([
		{ src: 'frieren-icegif-5.gif', initialX: 500, initialY: 400, isSelected: false },
		{
			src: 'windows-xp-dialog-funny.webp',
			initialX: 400,
			initialY: 100,
			isSelected: false
		}
	]);
	addDraggable({ src: 'rat-spinning.gif', isSelected: false });

	function addDraggable(draggable: DraggablePropTypes) {
		const defaultInitialX = 200;
		const defaultInitialY = 200;
		draggable.initialX = defaultInitialX;
		draggable.initialY = defaultInitialY;
		draggables.push(draggable);
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
			if (result) addDraggable({ src: result as string, isSelected: false });
		};
		reader.readAsDataURL(file);
	}

	function deleteSelectedMedia() {
		console.log(draggables);
		draggables = draggables.filter((d) => d.isSelected === false);
		console.log(draggables);
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
				// isSelected = false;
				event.preventDefault();
				break;
		}
	}
</script>

<svelte:window on:paste={handlePaste} on:keydown={handleKeyDown} />

{#each draggables as d}
	<Draggable {...d} bind:isSelected={d.isSelected} />
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
