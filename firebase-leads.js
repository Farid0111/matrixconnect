/*
 * Envoi des fiches clients (nom, telephone, zone) vers Firebase Firestore.
 *
 * Projet : fahdbot-ace64  —  collection : leads
 * Chaque envoi cree un document :
 *   { nom, tel, zone, mac, user, ip, date, page }
 *
 * Ecriture via l'API REST Firestore : aucune bibliotheque a charger, donc fonctionne
 * depuis la page servie par le routeur (http) comme depuis un fichier local (file://).
 * Si l'ecriture echoue, la fiche est mise en file d'attente dans localStorage
 * (cle wifi_banikoara_pending) et reessayee a la prochaine visite.
 */
(function (global) {
    "use strict";

    var CFG = {
        apiKey: "AIzaSyB_JGNbUFtGG537bpRlggrTtIMjurmuzxc",
        authDomain: "fahdbot-ace64.firebaseapp.com",
        projectId: "fahdbot-ace64",
        appId: "1:887889305859:web:77371550999d335d924936"
    };

    var COLLECTION = "leads";
    var ENDPOINT = "https://firestore.googleapis.com/v1/projects/" + CFG.projectId +
        "/databases/(default)/documents/" + COLLECTION;
    var TIMEOUT = 7000;
    var PENDING_KEY = "wifi_banikoara_pending";

    function docId() {
        if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
        return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    }

    function encode(lead) {
        var fields = {};
        Object.keys(lead).forEach(function (k) {
            var v = lead[k];
            if (v === undefined || v === null || v === "") return;
            if (k === "date") {
                fields.date = { timestampValue: new Date(v).toISOString() };
            } else {
                fields[k] = { stringValue: String(v).slice(0, 500) };
            }
        });
        return { fields: fields };
    }

    function store(lead) {
        try {
            var pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
            pending.push(lead);
            localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
        } catch (e) { }
    }

    function push(lead) {
        var clean = {};
        Object.keys(lead).forEach(function (k) { if (lead[k] !== undefined && lead[k] !== null) clean[k] = lead[k]; });

        if (!global.fetch) {
            store(clean);
            return Promise.resolve({ ok: false, error: "fetch indisponible" });
        }

        var ctrl = global.AbortController ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT) : null;

        var init = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(encode(clean)) };
        if (ctrl) init.signal = ctrl.signal;

        return fetch(ENDPOINT + "?key=" + encodeURIComponent(CFG.apiKey) + "&documentId=" + encodeURIComponent(docId()), init)
            .then(function (res) {
                if (!res.ok) return res.text().then(function (t) { throw new Error(res.status + " " + t); });
                return res.json();
            })
            .then(function (doc) {
                if (timer) clearTimeout(timer);
                var name = doc && doc.name ? doc.name.split("/").pop() : "";
                return { ok: true, id: name };
            })
            .catch(function (err) {
                if (timer) clearTimeout(timer);
                store(clean);
                return { ok: false, error: (err && err.message) || "erreur reseau" };
            });
    }

    function flush() {
        var pending;
        try { pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); } catch (e) { pending = []; }
        if (!pending.length || !global.fetch) return Promise.resolve(0);

        localStorage.removeItem(PENDING_KEY);
        return pending.reduce(function (chain, l) {
            return chain.then(function (count) {
                return push(l).then(function (r) { return count + (r.ok ? 1 : 0); });
            });
        }, Promise.resolve(0));
    }

    global.LeadStore = { push: push, flush: flush, collection: COLLECTION, config: CFG };
})(window);
