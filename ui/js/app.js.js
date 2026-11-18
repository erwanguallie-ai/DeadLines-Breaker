// LexProcedura - Orchestrateur Frontend & Appels IPC Tauri

let appData = {
    parametres: {
        seuil_rouge_jours: 3,
        seuil_orange_jours: 7,
        resend_api_key: "",
        emails_destinataires: ["englishlawyerM2@gmail.com", "Maitrsimonin@gmail.com"],
        piste_client_id: "",
        piste_client_secret: "",
        regime_alsace_moselle: false
    },
    affaires: []
};

let currentFilter = 'ALL';
let affaireSelectionnee = null;

// Initialisation au chargement
window.addEventListener('DOMContentLoaded', async () => {
    configurerNavigation();
    await chargerDonnees();
    calculerEtRendreDashboard();
});

// Appels IPC Tauri (avec fallback local si exécuté hors binaire Tauri en développement)
async function invoquerTauri(commande, argumentsPayload = {}) {
    if (window.__TAURI__ && window.__TAURI__.core) {
        return await window.__TAURI__.core.invoke(commande, argumentsPayload);
    } else {
        console.warn(`Invocation Tauri simulée [${commande}]`, argumentsPayload);
        if (commande === 'charger_donnees') {
            const resp = await fetch('data/affaires_demo.json');
            const json = await resp.json();
            return { parametres: appData.parametres, affaires: json.affaires };
        }
        return "Succès (Mode Simulation)";
    }
}

async function chargerDonnees() {
    try {
        const donnees = await invoquerTauri('charger_donnees');
        if (donnees) {
            appData = donnees;
        }
    } catch (err) {
        console.error("Échec de chargement des données :", err);
    }
}

function configurerNavigation() {
    const vDashboard = document.getElementById('view-dashboard');
    const vDetails = document.getElementById('view-details');
    const vParams = document.getElementById('view-parametres');

    const btnNavDash = document.getElementById('btn-nav-dashboard');
    const btnNavParams = document.getElementById('btn-nav-parametres');
    const btnBack = document.getElementById('btn-back-dashboard');

    const switchView = (activeView, activeBtn) => {
        [vDashboard, vDetails, vParams].forEach(v => v.classList.remove('active'));
        [btnNavDash, btnNavParams].forEach(b => b.classList.remove('active'));
        activeView.classList.add('active');
        if (activeBtn) activeBtn.classList.add('active');
    };

    btnNavDash.addEventListener('click', () => switchView(vDashboard, btnNavDash));
    btnNavParams.addEventListener('click', () => {
        remplirFormulaireParametres();
        switchView(vParams, btnNavParams);
    });
    btnBack.addEventListener('click', () => switchView(vDashboard, btnNavDash));

    // Filtres du tableau de bord
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            calculerEtRendreDashboard();
        });
    });

    // Enregistrement des paramètres avec contrôle strict
    document.getElementById('btn-sauvegarder-params').addEventListener('click', async () => {
        const sRouge = parseInt(document.getElementById('input-seuil-rouge').value, 10);
        const sOrange = parseInt(document.getElementById('input-seuil-orange').value, 10);

        // Contrôle de cohérence impératif
        if (sOrange <= sRouge) {
            alert("ERREUR BLOQUANTE : Le seuil Orange (surveillance) doit être strictement supérieur au seuil Rouge (urgence critique).");
            return;
        }

        appData.parametres.seuil_rouge_jours = sRouge;
        appData.parametres.seuil_orange_jours = sOrange;
        appData.parametres.resend_api_key = document.getElementById('input-resend-key').value;
        appData.parametres.emails_destinataires = document.getElementById('input-emails-dest').value.split(',').map(s => s.trim());
        appData.parametres.piste_client_id = document.getElementById('input-piste-id').value;
        appData.parametres.piste_client_secret = document.getElementById('input-piste-secret').value;
        appData.parametres.regime_alsace_moselle = document.getElementById('chk-alsace-moselle').checked;

        try {
            await invoquerTauri('enregistrer_parametres', { nouveauxParametres: appData.parametres });
            alert("Réglages enregistrés.");
            switchView(vDashboard, btnNavDash);
            calculerEtRendreDashboard();
        } catch (e) {
            alert("Erreur : " + e);
        }
    });

    // Test Resend
    document.getElementById('btn-tester-email').addEventListener('click', async () => {
        const statusSpan = document.getElementById('test-email-status');
        statusSpan.textContent = "Transmission de test en cours...";
        try {
            const res = await invoquerTauri('declencher_test_email');
            statusSpan.style.color = "green";
            statusSpan.textContent = "✓ " + res;
        } catch (err) {
            statusSpan.style.color = "red";
            statusSpan.textContent = "✗ " + err;
        }
    });
}

function calculerEtRendreDashboard() {
    const tbody = document.getElementById('cases-tbody');
    tbody.innerHTML = '';

    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    let countUrgent = 0, countSurv = 0, countNorm = 0, countExp = 0;

    // Calcul des jours restants et détermination de l'échéance la plus critique
    const affairesTraitees = appData.affaires.map(aff => {
        let acteCritique = null;
        let minJours = Infinity;

        aff.actes.forEach(acte => {
            const dateEcheance = new Date(acte.date_echeance_calculee);
            dateEcheance.setHours(0, 0, 0, 0);
            const diffJours = Math.ceil((dateEcheance - aujourdhui) / (1000 * 60 * 60 * 24));

            if (diffJours < minJours) {
                minJours = diffJours;
                acteCritique = { ...acte, joursRestants: diffJours };
            }
        });

        let urgenceCategorie = 'NORMAL';
        if (!acteCritique || minJours < 0) {
            urgenceCategorie = 'EXPIRED';
            countExp++;
        } else if (minJours <= appData.parametres.seuil_rouge_jours) {
            urgenceCategorie = 'URGENT';
            countUrgent++;
        } else if (minJours <= appData.parametres.seuil_orange_jours) {
            urgenceCategorie = 'SURVEILLANCE';
            countSurv++;
        } else {
            countNorm++;
        }

        return {
            ...aff,
            acteCritique,
            minJours,
            urgenceCategorie
        };
    });

    // Mise à jour des compteurs
    document.getElementById('count-all').textContent = affairesTraitees.length;
    document.getElementById('count-urgent').textContent = countUrgent;
    document.getElementById('count-surv').textContent = countSurv;
    document.getElementById('count-norm').textContent = countNorm;
    document.getElementById('count-exp').textContent = countExp;

    // Tri automatique : de l'échéance la plus courte à la plus lointaine
    affairesTraitees.sort((a, b) => a.minJours - b.minJours);

    // Filtrage actif
    const affairesFiltrees = affairesTraitees.filter(a => {
        if (currentFilter === 'ALL') return true;
        return a.urgenceCategorie === currentFilter;
    });

    affairesFiltrees.forEach(aff => {
        const tr = document.createElement('tr');
        tr.className = 'case-row';

        let badgeHtml = '';
        let tempsRestantTxt = '';

        if (aff.urgenceCategorie === 'EXPIRED') {
            badgeHtml = `<span class="badge-urg expired">⛔ Forclos / Expiré</span>`;
            tempsRestantTxt = `<span style="color: var(--expired-gray); font-weight: bold;">Délai dépassé (${Math.abs(aff.minJours)} j)</span>`;
        } else if (aff.urgenceCategorie === 'URGENT') {
            badgeHtml = `<span class="badge-urg red">⚠️ URGENT (≤ ${appData.parametres.seuil_rouge_jours}j)</span>`;
            tempsRestantTxt = `<span style="color: var(--urgent-red); font-weight: bold;">Expire dans ${aff.minJours} jour(s)</span>`;
        } else if (aff.urgenceCategorie === 'SURVEILLANCE') {
            badgeHtml = `<span class="badge-urg orange">👁 À SURVEILLER</span>`;
            tempsRestantTxt = `<span style="color: var(--watch-orange); font-weight: bold;">Reste ${aff.minJours} jours</span>`;
        } else {
            badgeHtml = `<span class="badge-urg normal">⚪ Conforme</span>`;
            tempsRestantTxt = `<span>${aff.minJours} jours</span>`;
        }

        tr.innerHTML = `
            <td>${badgeHtml}</td>
            <td><strong>${aff.nom_dossier}</strong><br><small style="color: #64748b;">Réf: ${aff.reference_cabinet}</small></td>
            <td>${aff.juridiction}<br><small style="color: #64748b;">${aff.numero_rg}</small></td>
            <td>${aff.acteCritique ? aff.acteCritique.nature : 'Aucun acte'}<br><small>${aff.acteCritique ? aff.acteCritique.fondement_cpc : ''}</small></td>
            <td><strong>${aff.acteCritique ? aff.acteCritique.date_echeance_calculee : '-'}</strong></td>
            <td>${tempsRestantTxt}</td>
            <td><button class="btn btn-secondary" onclick="ouvrirDossier('${aff.id}')">Consulter</button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.ouvrirDossier = function(affaireId) {
    const aff = appData.affaires.find(a => a.id === affaireId);
    if (!aff) return;

    affaireSelectionnee = aff;
    document.getElementById('detail-dossier-titre').textContent = aff.nom_dossier;
    document.getElementById('detail-dossier-meta').textContent = `Réf: ${aff.reference_cabinet} | ${aff.juridiction} | N° RG: ${aff.numero_rg}`;

    rendreFriseChronologique(aff);

    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
    document.getElementById('view-details').classList.add('active');
};

function rendreFriseChronologique(aff) {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';

    aff.actes.forEach((acte, index) => {
        const node = document.createElement('div');
        node.className = 'timeline-node active-node';
        node.innerHTML = `
            <div class="node-date">${acte.date_evenement} ➔ ${acte.date_echeance_calculee}</div>
            <div class="node-title"><strong>${acte.nature}</strong></div>
            <div class="node-cpc">${acte.fondement_cpc}</div>
        `;
        node.addEventListener('click', () => afficherDetailCalcul(acte, aff));
        container.appendChild(node);

        if (index === 0) afficherDetailCalcul(acte, aff);
    });
}

function afficherDetailCalcul(acte, aff) {
    const content = document.getElementById('calculation-content');
    content.innerHTML = `
        <div class="breakdown-item">
            <h4>Acte Notifié</h4>
            <p>${acte.nature}</p>
        </div>
        <div class="breakdown-item">
            <h4>Dies a quo (Art. 640 CPC)</h4>
            <p>${acte.date_evenement} (Ne compte pas)</p>
        </div>
        <div class="breakdown-item">
            <h4>Échéance d'Ordre Public</h4>
            <p style="color: var(--urgent-red);">${acte.date_echeance_calculee} à 24h00</p>
        </div>
        <div class="breakdown-item">
            <h4>Fondement Procédural</h4>
            <p>${acte.fondement_cpc}</p>
        </div>
        <div class="breakdown-item" style="grid-column: 1 / -1;">
            <h4>Explication détaillée de la computation</h4>
            <p style="font-weight: normal; font-size: 0.85rem;">${acte.details_calcul}</p>
        </div>
    `;
}

function remplirFormulaireParametres() {
    document.getElementById('input-seuil-rouge').value = appData.parametres.seuil_rouge_jours;
    document.getElementById('input-seuil-orange').value = appData.parametres.seuil_orange_jours;
    document.getElementById('input-resend-key').value = appData.parametres.resend_api_key;
    document.getElementById('input-emails-dest').value = appData.parametres.emails_destinataires.join(', ');
    document.getElementById('input-piste-id').value = appData.parametres.piste_client_id;
    document.getElementById('input-piste-secret').value = appData.parametres.piste_client_secret;
    document.getElementById('chk-alsace-moselle').checked = appData.parametres.regime_alsace_moselle;
}