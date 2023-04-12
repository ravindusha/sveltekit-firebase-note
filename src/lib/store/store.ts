import type { NoteDocument, auth } from "$lib/types";
import { writable } from "svelte/store";

export const authStore = writable<auth>({
    user: null
})

export const notesStore = writable<NoteDocument[]>([])