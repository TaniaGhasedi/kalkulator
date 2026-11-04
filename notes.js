
import { auth, db } from "./firebase-config.js";

import {
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// HTML-ELEMENTER

const get = id => document.getElementById(id);

const form = get("note-form");
const titleInput = get("note-title");
const categoryInput = get("note-category");
const textInput = get("note-text");
const notesList = get("notes-list");
const searchInput = get("search-notes");
const filterCategory = get("filter-category");
const noteCount = get("note-count");
const emptyMessage = get("empty-message");
const editorHeading = get("editor-heading");
const saveButton = get("save-button");
const cancelButton = get("cancel-edit");

// DATABASE

const notesCollection = collection(db, "sharedNotes");

let notes = [];
let editingId = null;
let currentUser = null;
let connected = false;

// START MED LÅSTE KNAPPER

saveButton.disabled = true;
emptyMessage.textContent = "Kobler til notatene...";

// ANONYM INNLOGGING

onAuthStateChanged(auth, async user => {
    if (user) {
        currentUser = user;
        startNotes();
    } else {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error(error);
            emptyMessage.textContent =
                "Kunne ikke koble til Firebase.";
        }
    }
});

// HENT NOTATER I SANNTID

function startNotes() {
    if (connected) return;
    connected = true;

    onSnapshot(notesCollection, snapshot => {
        notes = snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        saveButton.disabled = false;
        showNotes();

    }, error => {
        console.error(error);
        saveButton.disabled = true;
        emptyMessage.hidden = false;
        emptyMessage.textContent =
            "Kunne ikke hente notatene.";
    });
}

// NULLSTILL SKJEMA

function resetEditor() {
    form.reset();
    categoryInput.value = "Matte";

    editingId = null;
    editorHeading.textContent = "Skriv et nytt notat ♡";
    saveButton.textContent = "Lagre notat ♡";
    cancelButton.hidden = true;
}

// LAGRE ELLER REDIGER

form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser || saveButton.disabled) return;

    const title = titleInput.value.trim();
    const category = categoryInput.value.trim();
    const content = textInput.value.trim();

    if (!title || !category || !content) {
        alert("Fyll ut alle feltene.");
        return;
    }

    if (content.length > 10000) {
        alert("Notatet er for langt (maks 10 000 tegn).");
        return;
    }

    saveButton.disabled = true;

    try {
        if (editingId) {
            const existing = notes.find(
                note => note.id === editingId
            );

            if (!existing ||
                existing.ownerId !== currentUser.uid) {
                throw new Error("Du kan ikke redigere dette notatet.");
            }

            await updateDoc(
                doc(db, "sharedNotes", editingId),
                {
                    title,
                    category,
                    content,
                    updatedAt: Date.now()
                }
            );

        } else {
            await addDoc(notesCollection, {
                title,
                category,
                content,
                ownerId: currentUser.uid,
                updatedAt: Date.now()
            });
        }

        resetEditor();

    } catch (error) {
        console.error(error);
        alert("Kunne ikke lagre: " + error.message);
    } finally {
        saveButton.disabled = false;
    }
});

// REDIGER

function editNote(id) {
    const note = notes.find(item => item.id === id);

    if (!note || note.ownerId !== currentUser?.uid) {
        return;
    }

    editingId = id;

    titleInput.value = note.title;
    categoryInput.value = note.category;
    textInput.value = note.content;

    editorHeading.textContent = "Rediger notatet ♡";
    saveButton.textContent = "Lagre endringer ♡";
    cancelButton.hidden = false;

    titleInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// SLETT

async function deleteNote(id) {
    const note = notes.find(item => item.id === id);

    if (!note || note.ownerId !== currentUser?.uid) {
        return;
    }

    if (!confirm("Vil du slette notatet?")) return;

    try {
        await deleteDoc(doc(db, "sharedNotes", id));

        if (editingId === id) resetEditor();

    } catch (error) {
        console.error(error);
        alert("Kunne ikke slette notatet.");
    }
}

cancelButton.addEventListener("click", resetEditor);

// KATEGORIER

function updateCategories() {
    const selected = filterCategory.value;

    const categories = [
        ...new Set(notes.map(note => note.category))
    ].sort((a, b) => a.localeCompare(b, "nb"));

    filterCategory.replaceChildren();
    filterCategory.add(new Option("Alle kategorier", "all"));

    categories.forEach(category => {
        filterCategory.add(new Option(category, category));
    });

    filterCategory.value = categories.includes(selected)
        ? selected
        : "all";
}

// VIS NOTATER

function showNotes() {
    updateCategories();
    notesList.replaceChildren();

    const search = searchInput.value.toLowerCase().trim();
    const category = filterCategory.value;

    const filtered = notes.filter(note => {
        const matchesSearch = [
            note.title,
            note.category,
            note.content
        ].some(value =>
            value.toLowerCase().includes(search)
        );

        const matchesCategory =
            category === "all" ||
            note.category === category;

        return matchesSearch && matchesCategory;
    }).sort((a, b) => b.updatedAt - a.updatedAt);

    noteCount.textContent = notes.length;

    emptyMessage.hidden = filtered.length > 0;

    emptyMessage.textContent = notes.length === 0
        ? "Ingen felles notater ennå."
        : "Ingen notater matcher søket.";

    filtered.forEach(note => {
        const card = document.createElement("article");
        card.className = "note-card";

        const badge = document.createElement("span");
        badge.className = "note-category";
        badge.textContent = note.category;

        const heading = document.createElement("h4");
        heading.textContent = note.title;

        const content = document.createElement("p");
        content.className = "note-content";
        content.textContent = note.content;

        const date = document.createElement("p");
        date.className = "note-date";
        date.textContent = "Lagret: " +
            new Date(note.updatedAt).toLocaleDateString("nb-NO");

        card.append(badge, heading, content, date);

        // BARE EIEREN KAN ENDRE ELLER SLETTE

        if (note.ownerId === currentUser?.uid) {
            const actions = document.createElement("div");
            actions.className = "note-actions";

            const editButton = document.createElement("button");
            editButton.className = "btn edit-btn";
            editButton.textContent = "Rediger";
            editButton.addEventListener("click", () => {
                editNote(note.id);
            });

            const deleteButton = document.createElement("button");
            deleteButton.className = "btn delete-btn";
            deleteButton.textContent = "Slett";
            deleteButton.addEventListener("click", () => {
                deleteNote(note.id);
            });

            actions.append(editButton, deleteButton);
            card.append(actions);
        }

        notesList.appendChild(card);
    });
}

// SØK OG FILTER

searchInput.addEventListener("input", showNotes);
filterCategory.addEventListener("change", showNotes);
