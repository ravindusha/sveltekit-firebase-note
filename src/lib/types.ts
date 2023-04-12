import type { User } from "firebase/auth";
import type { DocumentReference } from "firebase/firestore";

export type Note = {
    title: string;
    note: string;
    authorId: string;
    liked: boolean;
};

export type auth = {
    user: User | null
}

export type NoteDocument = Note & {
    ref: DocumentReference;
};