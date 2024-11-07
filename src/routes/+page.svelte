<script>
	import Taskbar from '$lib/taskbar.svelte';
	import Draggable from '$lib/draggable.svelte';
</script>

<Draggable src="rat-spinning.gif" />
<Draggable src="rat-spinning.gif" />

<Taskbar />

<style>
	:global(body) {
		background: black;
	}
</style>
