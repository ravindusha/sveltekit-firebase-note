import type { User } from "firebase/auth";
import { writable } from "svelte/store";

type auth = {
    user: User | null
}

export const authStore = writable<auth>({
    user: null
})