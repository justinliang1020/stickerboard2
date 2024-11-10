<script lang="ts">
	import Taskbar from '$lib/taskbar.svelte';
	import Draggable from '$lib/draggable.svelte';

	type Media = {
		src: string;
		initialX?: number;
		initialY?: number;
	};

	let medias: Media[] = $state([
		{ src: 'frieren-icegif-5.gif', initialX: 500, initialY: 400 },
		{
			src: 'windows-xp-dialog-funny.webp',
			initialX: 400,
			initialY: 100
		}
	]);

	function addMedia(media: Media) {
		const defaultInitialX = 200;
		const defaultInitialY = 200;
		media.initialX = defaultInitialX;
		media.initialY = defaultInitialY;
		medias.push(media);
	}

	addMedia({ src: 'rat-spinning.gif' });
</script>

{#each medias as m}
	<Draggable {...m} />
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
