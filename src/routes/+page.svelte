<script lang="ts">
	import { firebaseConfig } from '$lib/firebase';
	import { authStore, notesStore, type NoteDocument } from '$lib/store/store';
	import { initializeApp } from 'firebase/app';
	import {
		GoogleAuthProvider,
		getAuth,
		signInWithPopup,
		type Auth,
		type Unsubscribe
	} from 'firebase/auth';
	import {
		DocumentReference,
		Firestore,
		addDoc,
		collection,
		deleteDoc,
		getDocs,
		getFirestore,
		query,
		updateDoc,
		where
	} from 'firebase/firestore';
	import { onDestroy, onMount } from 'svelte';

	let auth: Auth;
	let unsubscribe: Unsubscribe;
	let db: Firestore;

	let isEditMode = false;
	let editingDocRef: DocumentReference | null = null;

	let titleText = '';
	let noteText = '';

	type Note = {
		title: string;
		note: string;
		authorId: string;
	};

	onMount(async () => {
		const app = initializeApp(firebaseConfig);
		auth = getAuth(app);
		db = getFirestore(app);

		unsubscribe = auth.onAuthStateChanged(async (user) => {
			authStore.set({
				user
			});
		});

		fetchAndUpdateData();
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	const fetchAndUpdateData = async () => {
		if (!auth || !db) return;

		let notes: NoteDocument[] = [];

		try {
			const q = query(
				collection(db, 'notes'),
				where('authorId', '==', auth.currentUser?.uid || '')
			);
			const querySnapshot = await getDocs(q);
			querySnapshot.forEach((doc) => {
				notes.push({
					...(doc.data() as Note),
					ref: doc.ref
				});
			});
		} catch (e) {
			console.error(e);
		}
		notesStore.set(notes);
	};

	const provider = new GoogleAuthProvider();

	const handleAuth = () => {
		signInWithPopup(auth, provider)
			.then((result) => {
				// This gives you a Google Access Token. You can use it to access the Google API.
				const credential = GoogleAuthProvider.credentialFromResult(result);
				const token = credential?.accessToken;
				// The signed-in user info.
				const user = result.user;
				// IdP data available using getAdditionalUserInfo(result)
				// ...

				authStore.set({
					user
				});
			})
			.catch((error) => {
				// Handle Errors here.
				const errorCode = error.code;
				const errorMessage = error.message;

				console.error(errorCode, errorMessage);
				// The email of the user's account used.
				const email = error.customData.email;
				// The AuthCredential type that was used.
				const credential = GoogleAuthProvider.credentialFromError(error);
				// ...
			});
	};

	const handleSignOut = async () => {
		await auth.signOut();
		notesStore.set([]);
	};

	const handleFormSubmit = async (event: SubmitEvent) => {
		const formData = new FormData(event.target as HTMLFormElement);
		const data = Object.fromEntries(formData);

		if (!data.title || !data.note) return;

		const noteToBeSaved = {
			...(data as Note),
			authorId: $authStore.user?.uid || ''
		};

		if (isEditMode && editingDocRef) {
			await updateNote(noteToBeSaved, editingDocRef);
			(event.target as HTMLFormElement).reset();
		} else {
			try {
				await saveNote(noteToBeSaved);
				(event.target as HTMLFormElement).reset();
				fetchAndUpdateData();
			} catch (e) {
				//
			}
		}
	};

	const saveNote = async (noteData: Note) => {
		try {
			await addDoc(collection(db, 'notes'), {
				...noteData
			});
			showToastMessage('Note saved');
			return;
		} catch (e) {
			console.error('Error adding document: ', e);
			throw e;
		}
	};
	const updateNote = async (noteData: Note, docRef: DocumentReference) => {
		if (!docRef) return;
		try {
			await updateDoc(docRef, {
				...noteData
			});
			showToastMessage('Note updated');
			handleNoteUpdateSuccess();
			return;
		} catch (e) {
			console.error('Error updating document: ', e);
			throw e;
		}
	};

	let toastMessage = '';
	let showToast = false;
	let toastMessageDuration = 2000;

	const showToastMessage = (message: string) => {
		toastMessage = message;
		showToast = true;
		hideToastMessage(toastMessageDuration);
	};

	const hideToastMessage = (duration: number) => {
		setTimeout(() => {
			showToast = false;
			toastMessage = '';
		}, duration);
	};

	const removeNote = async (documentRef: DocumentReference) => {
		await deleteDoc(documentRef);
		showToastMessage('Note deleted');
		fetchAndUpdateData();
	};

	authStore.subscribe((data) => {
		data.user && fetchAndUpdateData();
	});

	const handleEditNote = (doc: NoteDocument) => {
		isEditMode = true;
		editingDocRef = doc.ref;
		titleText = doc.title;
		noteText = doc.note;
	};

	const handleEditCancel = () => {
		isEditMode = false;
		editingDocRef = null;
		noteText = '';
		titleText = '';
	};

	const handleNoteUpdateSuccess = () => {
		isEditMode = false;
		editingDocRef = null;
		fetchAndUpdateData();
	};
</script>

<div class="navbar bg-base-100 shadow-md">
	<div class="flex-1">
		<a class="btn btn-ghost normal-case text-xl">Take Notes</a>
	</div>
	<div class="nav-end gap-2">
		{#if $authStore?.user}
			<div class="tooltip tooltip-bottom" data-tip={$authStore.user.displayName || ''}>
				<div class="avatar">
					<div class="w-10 rounded-full">
						<img src={$authStore.user?.photoURL} referrerpolicy="no-referrer" alt="avatar" />
					</div>
				</div>
			</div>
			<button class="btn gap-2" on:click={handleSignOut}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
					/>
				</svg>
				Sign Out
			</button>
		{:else}
			<button class="btn gap-2" on:click={handleAuth}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
					/>
				</svg>
				Sign In
			</button>
		{/if}
	</div>
</div>
{#if $authStore.user}
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
					<button class="btn btn-active btn-ghost px-10" type="button" on:click={handleEditCancel}
						>Cancel</button
					>
					<button class="btn btn-active btn-accent px-10">Save</button>
				</div>
			</div>
		</form>
	</div>
{:else}
	<div class="w-full flex justify-center m-10">
		<h2 class="text-xl font-bold">Please Sign in to access notes</h2>
	</div>
{/if}
<div class="w-auto flex-1 flex flex-wrap overflow-y-auto p-5 gap-5 bg-base-200">
	{#each $notesStore as note}
		<div class="card w-96 bg-base-300 shadow-none">
			<div class="card-body">
				<div class="card-actions justify-end -mt-5 -mr-5">
					<button
						class="btn btn-square btn-ghost btn-sm"
						on:click={() => handleEditNote(note)}
						disabled={isEditMode}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-5 h-5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
							/>
						</svg>
					</button>
					<button
						class="btn btn-square btn-ghost btn-sm"
						on:click={() => removeNote(note.ref)}
						disabled={isEditMode}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-5 h-5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
							/>
						</svg>
					</button>
				</div>
				<h2 class="card-title">{note.title}</h2>
				<p>{note.note}</p>
			</div>
		</div>
	{/each}
</div>

{#if showToast}
	<div class="toast toast-end">
		<div class="alert alert-success">
			<div>
				<span>{toastMessage}</span>
			</div>
		</div>
	</div>
{/if}
