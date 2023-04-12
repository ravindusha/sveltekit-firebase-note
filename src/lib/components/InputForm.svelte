<script lang="ts">
	export let handleFormSubmit: (e: SubmitEvent) => void;
	export let handleEditCancel: Function;
	export let titleText: string;
	export let noteText: string;

	$: disableButtons = !titleText || !noteText;
</script>

<div class="w-full flex flex-col mx-auto pb-2">
	<form on:submit|preventDefault={handleFormSubmit}>
		<div class="flex flex-col items-center justify-center">
			<div class="form-control w-full max-w-lg">
				<label class="label" for="title">
					<span class="label-text">Title</span>
				</label>
				<input
					type="text"
					name="title"
					placeholder="type here..."
					class="input input-bordered w-full max-w-lg"
					bind:value={titleText}
				/>
			</div>
			<div class="form-control w-full max-w-lg">
				<label class="label" for="note">
					<span class="label-text">Note</span>
				</label>
				<textarea
					name="note"
					class="textarea textarea-bordered h-24"
					placeholder="type here..."
					bind:value={noteText}
				/>
			</div>
			<div class="w-full flex justify-end max-w-lg p-2 gap-2">
				<button class="btn btn-active btn-accent px-10" disabled={disableButtons}>Save</button>
				<button
					class="btn btn-active btn-ghost px-10"
					type="button"
					disabled={disableButtons}
					on:click={() => handleEditCancel()}>Cancel</button
				>
			</div>
		</div>
	</form>
</div>
