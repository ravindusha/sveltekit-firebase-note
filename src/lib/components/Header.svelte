<script lang="ts">
	import SignInIconSvg from '$lib/assets/icons/SignInIconSvg.svelte';
	import SignOutIconSvg from '$lib/assets/icons/SignOutIconSvg.svelte';
	import { authStore } from '$lib/store/store';

	export let handleSignOut: Function;
	export let handleAuth: Function;
</script>

<div class="navbar bg-base-100 shadow-md">
	<div class="flex-1">
		<h1 class="p-2 normal-case text-xl select-none">Take Notes</h1>
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
			<button class="btn gap-2" on:click={() => handleSignOut()}>
				<SignOutIconSvg />
				Sign Out
			</button>
		{:else}
			<button class="btn gap-2" on:click={() => handleAuth()}>
				<SignInIconSvg />
				Sign In
			</button>
		{/if}
	</div>
</div>
