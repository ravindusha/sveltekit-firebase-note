<script lang="ts">
	import DeleteIconSvg from '$lib/assets/icons/DeleteIconSvg.svelte';
	import EditIconSvg from '$lib/assets/icons/EditIconSvg.svelte';
	import HeartIconSvg from '$lib/assets/icons/HeartIconSvg.svelte';
	import type { NoteDocument } from '$lib/types';

	export let isEditMode: boolean;
	export let handleEditNote: Function;
	export let handleLikeNote: Function;
	export let removeNote: Function;
	export let note: NoteDocument;
</script>

<div class="card w-96 {note.liked ? 'bg-base-100' : 'bg-base-300'} shadow-none">
	<div class="card-body">
		<div class="card-actions justify-end -mt-5 -mr-5">
			<button
				class="btn btn-square btn-ghost btn-sm"
				on:click={() => handleLikeNote(note)}
				disabled={isEditMode}
			>
				<HeartIconSvg liked={note.liked} />
			</button>
			<button
				class="btn btn-square btn-ghost btn-sm"
				on:click={() => handleEditNote(note)}
				disabled={isEditMode}
			>
				<EditIconSvg />
			</button>
			<button
				class="btn btn-square btn-ghost btn-sm"
				on:click={() => removeNote(note.ref)}
				disabled={isEditMode}
			>
				<DeleteIconSvg />
			</button>
		</div>
		<h2 class="card-title">{note.title}</h2>
		<p>{note.note}</p>
	</div>
</div>
