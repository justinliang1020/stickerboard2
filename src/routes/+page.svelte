<script lang="ts">
	import Taskbar from '$lib/taskbar.svelte';
	import Draggable from '$lib/draggable.svelte';
	import type { ComponentProps } from 'svelte';
	type DraggablePropTypes = ComponentProps<Draggable>;

	let draggables: DraggablePropTypes[] = $state([
		{ src: 'frieren-icegif-5.gif', initialX: 500, initialY: 400 },
		{
			src: 'windows-xp-dialog-funny.webp',
			initialX: 400,
			initialY: 100
		}
	]);

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
			if (result) addDraggable({ src: result as string });
		};
		reader.readAsDataURL(file);
	}

	addDraggable({ src: 'rat-spinning.gif' });
</script>

<svelte:window on:paste={handlePaste} />

{#each draggables as d}
	<Draggable {...d} />
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
