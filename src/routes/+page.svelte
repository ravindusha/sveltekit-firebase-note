<script lang="ts">
	import { firebaseConfig } from '$lib/firebase';
	import { authStore } from '$lib/store/store';
	import { initializeApp } from 'firebase/app';
	import {
		GoogleAuthProvider,
		getAuth,
		type Auth,
		signInWithPopup,
		type Unsubscribe
	} from 'firebase/auth';
	import { onDestroy, onMount } from 'svelte';

	let auth: Auth;
	let unsubscribe: Unsubscribe;

	onMount(() => {
		const app = initializeApp(firebaseConfig);
		auth = getAuth(app);

		unsubscribe = auth.onAuthStateChanged(async (user) => {
			authStore.set({
				user
			});
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			console.log('unsub');

			unsubscribe();
		}
	});

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
	};
</script>

<h1>Hi there</h1>
{#if $authStore?.user}
	<button on:click={handleSignOut}>Sign Out</button>
{:else}
	<button on:click={handleAuth}>Sign in</button>
{/if}
{#if $authStore?.user}
	<h2>Welcome {$authStore.user.displayName}</h2>
{/if}

<pre>{JSON.stringify($authStore?.user, null, 2)}</pre>
