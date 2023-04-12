<script lang="ts">
	import { notesStore } from '$lib/store/store';
	import Note from './Note.svelte';

	export let isEditMode: boolean;
	export let handleEditNote: Function;
	export let removeNote: Function;
	export let handleLikeNote: Function;
</script>

<div class="w-auto flex-1 flex flex-wrap overflow-y-auto p-5 gap-5 bg-base-200">
	{#each $notesStore as note (note.ref.id)}
		<Note {handleEditNote} {isEditMode} {note} {removeNote} {handleLikeNote} />
	{/each}
</div>
