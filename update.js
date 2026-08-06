/* Warframe Tracker — D-Goth | update.js */
// ── Version ──────────────────────────────────────────────────────────────
let APP_VERSION = "0";

function setVersionFromMeta() {
    const meta = document.querySelector('meta[name="version"]') || document.querySelector('meta[property="version"]');
    if (meta && meta.content) {
        APP_VERSION = meta.content;
        const span = document.getElementById("app-version");
        if (span) span.textContent = meta.content;
    }
}

// ── INI helpers ──────────────────────────────────────────────────────────
function exportIniToString() {
    const lines = ["[warframe_tracker]", "# Exported: " + new Date().toISOString(), ""];
    for (const [k, v] of Object.entries(ST)) {
        lines.push(k + "=" + (typeof v === "object" ? JSON.stringify(v) : v));
    }
    return lines.join("\n");
}

function importIniFromString(content) {
    content.split("\n").forEach((line) => {
        line = line.trim();
        if (!line || line.startsWith("#") || line.startsWith("[")) return;
        const idx = line.indexOf("=");
        if (idx < 0) return;
        const k = line.substring(0, idx).trim();
        const v = line.substring(idx + 1).trim();
        try {
            ST[k] = JSON.parse(v);
        } catch {
            const n = parseFloat(v);
            ST[k] = isNaN(n) || v.includes(" ") ? v : n;
        }
    });
    saveAll();
    renderAll();
}

// ── Update check ─────────────────────────────────────────────────────────
async function checkForUpdate() {
    const btn = document.getElementById("update-check-btn");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "⏳ Vérif…";
    }
    try {
        const res = await fetch("version.json?t=" + Date.now());
        if (!res.ok) throw new Error("version.json introuvable (HTTP " + res.status + ")");
        const data = await res.json();

        const parseVer = (str) => parseFloat((str || "0").split(" ")[0]);
        const current = parseVer(APP_VERSION);
        const remote = parseVer(data.version);

        if (remote > current) {
            const msg =
                "🔄 Nouvelle version disponible : " +
                data.version +
                "\n\n" +
                "Changements :\n" +
                (data.changelog || "—") +
                "\n\n" +
                "Vos données seront conservées.\nMettre à jour maintenant ?";
            if (confirm(msg)) performUpdate(data);
        } else if (remote === current) {
            alert("✅ Vous utilisez déjà la version actuelle (" + APP_VERSION + ").");
        } else {
            alert("⚠️ Version locale (" + APP_VERSION + ") plus récente que le serveur (" + data.version + ").\nAucune mise à jour appliquée.");
        }
    } catch (e) {
        console.error("[Update]", e);
        alert(
            "❌ Impossible de vérifier les mises à jour.\n\n" +
                e.message +
                "\n\nVérifiez que version.json est dans le même dossier que le fichier HTML.",
        );
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "🔄 Màj";
        }
    }
}

// ── Mise à jour automatique (sans redirection externe) ────────────────
function performUpdate(data) {
    localStorage.setItem("pending_update_ini", exportIniToString());
    localStorage.setItem("pending_version", data.version);
    window.location.reload(true);
}

// ── Restauration après mise à jour ─────────────────────────────────────
function restoreAfterUpdate() {
    const pendingIni = localStorage.getItem("pending_update_ini");
    if (!pendingIni) return false;
    const newVersion = localStorage.getItem("pending_version") || "?";
    localStorage.removeItem("pending_update_ini");
    localStorage.removeItem("pending_version");
    importIniFromString(pendingIni);
    setTimeout(() => {
        alert("✅ Mise à jour vers la version " + newVersion + " effectuée !\nVos données ont été conservées.");
    }, 300);
    return true;
}