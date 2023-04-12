<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import InputForm from '$lib/components/InputForm.svelte';
	import NotesContainer from '$lib/components/NotesContainer.svelte';
	import { firebaseConfig } from '$lib/firebase';
	import { authStore, notesStore } from '$lib/store/store';
	import type { Note, NoteDocument } from '$lib/types';
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

		notesStore.set(sortNotes(notes));
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
			...(data as Pick<Note, 'title' | 'note'>),
			liked: false,
			authorId: $authStore.user?.uid || ''
		};

		if (isEditMode && editingDocRef) {
			await updateNote(noteToBeSaved, editingDocRef);
			(event.target as HTMLFormElement).reset();
			titleText = '';
			noteText = '';
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

	const handleLikeNote = (doc: NoteDocument) => {
		const { authorId, liked, note, title } = doc;
		const updatedNote = { note, title, authorId, liked };
		updatedNote.liked = !updatedNote.liked;
		updateNote(updatedNote, doc.ref);
	};

	const sortNotes = (docs: NoteDocument[]) => {
		return [...docs].sort((a, b) => Number(b.liked) - Number(a.liked));
	};
</script>

<Header {handleAuth} {handleSignOut} />
{#if $authStore.user}
	<InputForm {handleEditCancel} {handleFormSubmit} {noteText} {titleText} />
{:else}
	<div class="w-full flex justify-center m-10">
		<h2 class="text-xl font-bold">Please Sign in to access notes</h2>
	</div>
{/if}
<NotesContainer {handleEditNote} {isEditMode} {removeNote} {handleLikeNote} />

{#if showToast}
	<div class="toast toast-end">
		<div class="alert alert-success">
			<div>
				<span>{toastMessage}</span>
			</div>
		</div>
	</div>
{/if}
