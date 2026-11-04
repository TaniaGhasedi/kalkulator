
// HELPFUL TOOLS - JAVASCRIPT

const get = (id) => document.getElementById(id);


// ===================================
// 1. BYTT MELLOM VERKTØY
// ===================================

const tabs = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".tool-panel");

tabs.forEach(function(tab) {

    tab.addEventListener("click", function() {

        tabs.forEach(function(button) {
            button.classList.remove("active");
        });

        panels.forEach(function(panel) {
            panel.hidden = true;
        });

        tab.classList.add("active");

        const panelId = tab.dataset.panel;
        get(panelId).hidden = false;

    });

});


// ===================================
// 2. OVERSETTER
// ===================================

const fromLanguage = get("from-language");
const toLanguage = get("to-language");
const sourceText = get("source-text");
const translatedText = get("translated-text");
const translationStatus = get("translation-status");


// BYTT SPRÅK

get("swap-btn").addEventListener("click", function() {

    const oldFrom = fromLanguage.value;

    fromLanguage.value = toLanguage.value;
    toLanguage.value = oldFrom;

    const oldText = sourceText.value;

    sourceText.value = translatedText.value;
    translatedText.value = oldText;

    translationStatus.textContent = "";

});


// OVERSETT TEKST

get("translate-btn").addEventListener("click", async function() {

    const text = sourceText.value.trim();

    translatedText.value = "";

    if (!text) {
        translationStatus.textContent =
            "Skriv inn tekst først.";
        return;
    }

    if (fromLanguage.value === toLanguage.value) {
        translationStatus.textContent =
            "Velg to forskjellige språk.";
        return;
    }

    // MyMemory har en grense per forespørsel.
    const bytes = new TextEncoder().encode(text).length;

    if (bytes > 500) {
        translationStatus.textContent =
            "Teksten er for lang for denne oversetteren. " +
            "Bruk Google Oversetter-knappen.";
        return;
    }

    const button = get("translate-btn");
    button.disabled = true;

    translationStatus.textContent = "Oversetter...";

    try {

        const params = new URLSearchParams({
            q: text,
            langpair:
                fromLanguage.value + "|" + toLanguage.value
        });

        const url =
            "https://api.mymemory.translated.net/get?" +
            params.toString();

        const response = await fetch(url);

        const data = await response.json();

        const result = data.responseData?.translatedText;

        if (
            !response.ok ||
            Number(data.responseStatus) !== 200 ||
            !result ||
            /MYMEMORY WARNING/i.test(result)
        ) {
            throw new Error("Oversettelsen mislyktes.");
        }

        translatedText.value = result;

        if (
            (fromLanguage.value === "ckb" ||
             toLanguage.value === "ckb") &&
            result.trim() === text
        ) {
            translationStatus.textContent =
                "Sorani ser ikke ut til å være oversatt. " +
                "Prøv Google Oversetter.";
        } else {
            translationStatus.textContent =
                "Oversettelse fullført ♡";
        }

    } catch (error) {

        translationStatus.textContent =
            "Kunne ikke oversette. " +
            "Prøv Google Oversetter-knappen.";

        console.error(error);

    } finally {

        button.disabled = false;

    }

});


// ÅPNE GOOGLE OVERSETTER

get("google-btn").addEventListener("click", function() {

    const text = sourceText.value.trim();

    if (!text) {
        translationStatus.textContent =
            "Skriv inn tekst først.";
        return;
    }

    const url = new URL("https://translate.google.com/");

    url.searchParams.set("sl", fromLanguage.value);
    url.searchParams.set("tl", toLanguage.value);
    url.searchParams.set("text", text);
    url.searchParams.set("op", "translate");

    window.open(
        url.toString(),
        "_blank",
        "noopener,noreferrer"
    );

});


// KOPIER TEKST

async function copyText(text, statusElement) {

    if (!text.trim()) {
        statusElement.textContent =
            "Ingen tekst å kopiere.";
        return;
    }

    try {

        await navigator.clipboard.writeText(text);

        statusElement.textContent = "Kopiert ♡";

    } catch (error) {

        statusElement.textContent =
            "Kunne ikke kopiere automatisk. " +
            "Bruk Cmd + C eller Ctrl + C.";

    }

}


get("copy-translation").addEventListener("click", function() {

    copyText(
        translatedText.value,
        translationStatus
    );

});


// ===================================
// 3. OPPGAVEPLANLEGGER
// ===================================

const TASK_KEY = "helpful-tools-tasks";

let tasks = [];

try {

    const saved = JSON.parse(
        localStorage.getItem(TASK_KEY) || "[]"
    );

    tasks = Array.isArray(saved) ? saved : [];

} catch (error) {

    get("task-status").textContent =
        "Kunne ikke hente lagrede oppgaver.";

}


// LAGRE OPPGAVER

function saveTasks(newTasks) {

    try {

        localStorage.setItem(
            TASK_KEY,
            JSON.stringify(newTasks)
        );

        tasks = newTasks;

        return true;

    } catch (error) {

        get("task-status").textContent =
            "Lagring er ikke tilgjengelig.";

        return false;
    }

}


// NY OPPGAVE

get("task-form").addEventListener("submit", function(event) {

    event.preventDefault();

    const name = get("task-name").value.trim();

    if (!name) return;

    const task = {
        id: Date.now() + "-" + Math.random(),
        name: name,
        date: get("task-date").value,
        priority: get("task-priority").value,
        completed: false
    };

    if (saveTasks([task, ...tasks])) {

        event.target.reset();

        get("task-status").textContent =
            "Oppgaven er lagret ♡";

        showTasks();
    }

});


// VIS OPPGAVER

function showTasks() {

    const list = get("task-list");
    const filter = get("task-filter").value;

    list.replaceChildren();

    const filtered = tasks.filter(function(task) {

        if (filter === "open") {
            return !task.completed;
        }

        if (filter === "done") {
            return task.completed;
        }

        return true;

    });

    filtered.sort(function(a, b) {
        return Number(a.completed) - Number(b.completed) ||
            (a.date || "9999-12-31").localeCompare(
                b.date || "9999-12-31"
            );
    });

    get("task-count").textContent = tasks.length;

    get("task-empty").hidden = filtered.length > 0;

    filtered.forEach(function(task) {

        const li = document.createElement("li");

        li.className = "task-item";

        if (task.completed) {
            li.classList.add("completed");
        }

        const title = document.createElement("div");
        title.className = "task-name";
        title.textContent = task.name;

        const info = document.createElement("div");
        info.className = "task-info";

        info.textContent =
            task.priority + " prioritet" +
            (task.date ? " · Frist: " + task.date : "");

        const buttons = document.createElement("div");
        buttons.className = "task-buttons";

        // FULLFØR

        const doneBtn = document.createElement("button");

        doneBtn.className = "soft-btn";
        doneBtn.textContent =
            task.completed ? "Angre" : "Ferdig";

        doneBtn.addEventListener("click", function() {

            const updated = tasks.map(function(item) {

                if (item.id === task.id) {
                    return {
                        ...item,
                        completed: !item.completed
                    };
                }

                return item;

            });

            if (saveTasks(updated)) {
                showTasks();
            }

        });


        // SLETT

        const deleteBtn = document.createElement("button");

        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Slett";

        deleteBtn.addEventListener("click", function() {

            if (!confirm("Vil du slette oppgaven?")) {
                return;
            }

            const updated = tasks.filter(function(item) {
                return item.id !== task.id;
            });

            if (saveTasks(updated)) {
                showTasks();
            }

        });

        buttons.append(doneBtn, deleteBtn);

        li.append(title, info, buttons);

        list.appendChild(li);

    });

}


get("task-filter").addEventListener("change", showTasks);

showTasks();


// ===================================
// 4. MAC OG WINDOWS HURTIGTASTER
// ===================================

const shortcuts = {

    mac: [
        ["Kopier", "Cmd + C"],
        ["Lim inn", "Cmd + V"],
        ["Klipp ut", "Cmd + X"],
        ["Angre", "Cmd + Z"],
        ["Lagre", "Cmd + S"],
        ["Marker alt", "Cmd + A"],
        ["Søk i dokument", "Cmd + F"],
        ["Bytt app", "Cmd + Tab"],
        ["Spotlight-søk", "Cmd + Mellomrom"],
        ["Skjermbilde av alt", "Cmd + Shift + 3"],
        ["Skjermbilde av område", "Cmd + Shift + 4"],
        ["Skjermbildeverktøy", "Cmd + Shift + 5"],
        ["Lås skjermen", "Ctrl + Cmd + Q"]
    ],

    windows: [
        ["Kopier", "Ctrl + C"],
        ["Lim inn", "Ctrl + V"],
        ["Klipp ut", "Ctrl + X"],
        ["Angre", "Ctrl + Z"],
        ["Lagre", "Ctrl + S"],
        ["Marker alt", "Ctrl + A"],
        ["Søk i dokument", "Ctrl + F"],
        ["Bytt vindu", "Alt + Tab"],
        ["Åpne Filutforsker", "Win + E"],
        ["Skjermbilde", "Win + Shift + S"],
        ["Vis skrivebord", "Win + D"],
        ["Lås skjermen", "Win + L"],
        ["Fest vindu", "Win + Pil venstre/høyre"]
    ]

};


function showShortcuts() {

    const os = get("shortcut-os").value;

    const search =
        get("shortcut-search").value.toLowerCase().trim();

    const list = get("shortcut-list");

    list.replaceChildren();

    const filtered = shortcuts[os].filter(function(item) {

        return (
            item[0] + " " + item[1]
        ).toLowerCase().includes(search);

    });

    get("shortcut-empty").hidden = filtered.length > 0;

    filtered.forEach(function(item) {

        const li = document.createElement("li");
        li.className = "shortcut-item";

        const name = document.createElement("span");
        name.textContent = item[0];

        const keys = document.createElement("kbd");
        keys.textContent = item[1];

        li.append(name, keys);

        list.appendChild(li);

    });

}


get("shortcut-os").addEventListener("change", showShortcuts);
get("shortcut-search").addEventListener("input", showShortcuts);

showShortcuts();


// ===================================
// 5. TEKSTVERKTØY
// ===================================

const analyzeText = get("analyze-text");


function updateTextStats() {

    const text = analyzeText.value;

    const words = text.trim()
        ? text.trim().split(/\s+/).length
        : 0;

    const characters = [...text].length;

    const minutes = words === 0
        ? 0
        : Math.max(1, Math.ceil(words / 200));

    get("word-count").textContent = words;
    get("character-count").textContent = characters;
    get("reading-time").textContent = minutes;

}


analyzeText.addEventListener("input", updateTextStats);


// RYDD TEKST

get("clean-text").addEventListener("click", function() {

    analyzeText.value = analyzeText.value
        .replace(/[ \t]+/g, " ")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    updateTextStats();

    get("text-status").textContent =
        "Teksten er ryddet ♡";

});


// KOPIER

get("copy-text").addEventListener("click", function() {

    copyText(
        analyzeText.value,
        get("text-status")
    );

});


// TØM

get("clear-text").addEventListener("click", function() {

    analyzeText.value = "";

    updateTextStats();

    get("text-status").textContent = "";

});


// ===================================
// 6. MATTE - PROSENT OG RABATT
// ===================================

function kroner(value) {

    return new Intl.NumberFormat("nb-NO", {
        style: "currency",
        currency: "NOK"
    }).format(value);

}


function formatNumber(value) {

    return new Intl.NumberFormat("nb-NO", {
        maximumFractionDigits: 2
    }).format(value);

}


// RABATT

get("discount-form").addEventListener("submit", function(event) {

    event.preventDefault();

    const price = Number(get("original-price").value);
    const discount = Number(get("discount-rate").value);

    const output = get("discount-result");

    if (
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(discount) ||
        discount < 0 ||
        discount > 100
    ) {
        output.textContent = "Skriv inn gyldige tall.";
        return;
    }

    const saved = price * discount / 100;

    const newPrice = price - saved;

    output.textContent =
        "Ny pris: " + kroner(newPrice) +
        " | Du sparer: " + kroner(saved);

});


// HVOR MANGE PROSENT?

get("percent-form").addEventListener("submit", function(event) {

    event.preventDefault();

    const part = Number(get("part-number").value);
    const whole = Number(get("whole-number").value);

    const output = get("percent-result");

    if (
        !Number.isFinite(part) ||
        part < 0 ||
        !Number.isFinite(whole) ||
        whole <= 0
    ) {
        output.textContent =
            "Det hele må være større enn null.";
        return;
    }

    const percent = part / whole * 100;

    output.textContent =
        formatNumber(part) + " er " +
        formatNumber(percent) + "% av " +
        formatNumber(whole);

});
