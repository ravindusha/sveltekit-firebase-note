import type { User } from "firebase/auth";
import type { DocumentReference } from "firebase/firestore";
import { writable } from "svelte/store";

export type auth = {
    user: User | null
}

export type NoteDocument = {
    title: string;
    note: string;
    ref: DocumentReference;
};

export const authStore = writable<auth>({
    user: null
})

export const notesStore = writable<NoteDocument[]>([])