<script lang="ts">
	import Taskbar from '$lib/taskbar.svelte';
	import Canvas from '$lib/canvas.svelte';
</script>

<Canvas />
<Taskbar />

<style>
	:global(body) {
		background: no-repeat fixed url('windows-xp-background.jpg') center / 100% 100%;
	}
</style>
