<script>
	import Taskbar from '$lib/taskbar.svelte';
	import Draggable from '$lib/draggable.svelte';
</script>

<Draggable src="rat-spinning.gif" />
<Draggable src="frieren-icegif-5.gif" initialX={500} initialY={400} />
<Draggable src="windows-xp-dialog-funny.webp" initialX={200} initialY={350} />

<Taskbar />

<style>
	:global(body) {
		background-image: url('windows-xp-background.jpg');
		background-repeat: no-repeat;
		background-attachment: fixed;
		background-size: 100% 100%;
	}
</style>
