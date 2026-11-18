let state = {
    parametres: { seuil_rouge_jours: 3, seuil_orange_jours: 7, resend_api_key: "", emails_destinataires: [], regime_alsace_moselle: false },
    affaires: [],
    historique: []
};

let currentFilter = 'ALL';
let currentAffaire = null;

async function invokeTauri(cmd, payload = {}) {
    if (window.__TAURI__) {
        const inv = (window.__TAURI__.core && window.__TAURI__.core.invoke) || window.__TAURI__.invoke;
        if (inv) return await inv(cmd, payload);
    }
    return state;
}

window.addEventListener('DOMContentLoaded', async () => {
    state = await invokeTauri('charger_donnees');
    renderDashboard();
    renderHistory();

    // 1. Navigation Sidebar
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchView(btn.dataset.view);
        };
    });

    // 2. Raccourci Palette Ctrl + K
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            openQuickSearch();
        }
        if (e.key === 'Escape') closeQuickSearch();
    });

    document.getElementById('btn-quick-search-trigger').onclick = openQuickSearch;
    document.getElementById('modal-quick-search').onclick = (e) => {
        if (e.target.id === 'modal-quick-search') closeQuickSearch();
    };

    document.getElementById('palette-input').addEventListener('input', (e) => {
        filterQuickSearch(e.target.value.toLowerCase().trim());
    });

    // 3. Filtres du tableau de bord
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.f;
            renderDashboard();
        };
    });

    // 4. Modales
    const mAff = document.getElementById('modal-affaire');
    const mAct = document.getElementById('modal-acte');
    document.getElementById('btn-top-new-case').onclick = () => mAff.classList.add('active');
    document.getElementById('btn-close-modal-affaire').onclick = () => mAff.classList.remove('active');
    document.getElementById('btn-back-dashboard').onclick = () => switchView('view-dashboard', true);

    document.getElementById('btn-save-affaire').onclick = async () => {
        const nom = document.getElementById('new-nom').value.trim();
        const ref = document.getElementById('new-ref').value.trim();
        const jur = document.getElementById('new-juridiction').value.trim();
        const rg = document.getElementById('new-rg').value.trim();
        const res = document.getElementById('new-residence').value;

        if (!nom) return alert("Veuillez saisir le nom des parties.");
        state = await invokeTauri('creer_affaire', { reference: ref, nom, juridiction: jur, numeroRg: rg, residence: res });
        mAff.classList.remove('active');
        document.getElementById('new-nom').value = '';
        renderDashboard();
        renderHistory();
        switchView('view-dashboard', true);
    };

    document.getElementById('btn-open-modal-acte').onclick = () => {
        document.getElementById('act-date').valueAsDate = new Date();
        mAct.classList.add('active');
    };
    document.getElementById('btn-close-modal-acte').onclick = () => mAct.classList.remove('active');

    document.getElementById('btn-save-acte').onclick = async () => {
        if (!currentAffaire) return;
        const nature = document.getElementById('act-nature').value.trim();
        const dt = document.getElementById('act-date').value;
        const del = document.getElementById('act-delai').value;

        if (!nature || !dt) return alert("Veuillez renseigner la nature et la date.");
        try {
            state = await invokeTauri('ajouter_acte_au_dossier', {
                idAffaire: currentAffaire.id,
                nature,
                dateDepart: dt,
                typeDelai: del
            });
            mAct.classList.remove('active');
            currentAffaire = state.affaires.find(a => a.id === currentAffaire.id);
            openCaseDetails(currentAffaire);
            renderDashboard();
            renderHistory();
        } catch (e) {
            alert("Erreur computation : " + e);
        }
    };

    // 5. Calculateur Express CPC (Art. 640-644)
    document.getElementById('btn-calculer-express').onclick = async () => {
        const dStr = document.getElementById('exp-date').value;
        const t = document.getElementById('exp-type').value;
        const dist = document.getElementById('exp-distance').value;
        if (!dStr) return alert("Indiquez la date du dies a quo.");

        const d = new Date(dStr);
        let fin = new Date(d);
        let justif = "";
        let art = "";

        if (t === 'APPEL_1M' || t === 'OPPO_1M') { fin.setMonth(fin.getMonth() + 1); art = "Art. 538 / 574 CPC"; }
        else if (t === 'APPEL_15J' || t === 'CONST_15J') { fin.setDate(fin.getDate() + 15); art = "Art. 538 / 763 CPC"; }
        else if (t === 'POURVOI_2M') { fin.setMonth(fin.getMonth() + 2); art = "Art. 612 CPC"; }
        else { fin.setMonth(fin.getMonth() + 3); art = "Art. 908 / 909 CPC"; }

        if (dist === 'DOM_TOM') { fin.setMonth(fin.getMonth() + 1); justif += " +1 mois distance (Art. 643 CPC)."; }
        if (dist === 'ETRANGER') { fin.setMonth(fin.getMonth() + 2); justif += " +2 mois distance (Art. 643 CPC)."; }

        // Prorogation samedi/dimanche (Art. 642)
        let proroge = false;
        if (fin.getDay() === 6) { fin.setDate(fin.getDate() + 2); proroge = true; }
        else if (fin.getDay() === 0) { fin.setDate(fin.getDate() + 1); proroge = true; }

        const resBox = document.getElementById('express-result');
        resBox.style.display = 'block';
        resBox.innerHTML = `
            <strong>Échéance légale certifiée :</strong> <span style="color: #b91c1c; font-size: 1rem; font-weight: bold;">${fin.toLocaleDateString('fr-FR')} à 24h00</span><br>
            <strong>Fondement :</strong> ${art} & Articles 640 à 642 du CPC.<br>
            <strong>Computation :</strong> Dies a quo (${d.toLocaleDateString('fr-FR')}) exclu. ${proroge ? 'Échéance initiale tombant un week-end prorogée au lundi suivant.' : 'Échéance en jour ouvrable.'}${justif}
        `;

        await invokeTauri('enregistrer_historique', {
            categorie: 'CALCUL_EXPRESS',
            titre: `Simulation Express : ${art}`,
            details: `Échéance fixée au ${fin.toLocaleDateString('fr-FR')}`,
            fondement: art
        });
        renderHistory();
    };

    // 6. Arbre de Compétence (Module A)
    document.getElementById('btn-analyser-competence').onclick = async () => {
        const mat = document.getElementById('comp-matiere').value;
        const ter = document.getElementById('comp-regle-territoriale').value;
        const ville = document.getElementById('comp-ville').value.trim() || "Ressort compétent";

        let jurNom = "Tribunal Judiciaire (TJ)";
        let jurArt = "Art. L. 211-3 du COJ (Compétence plénière de droit commun)";
        let expl = "";

        if (mat === 'PRUDHOMMES') {
            jurNom = "Conseil de Prud'hommes (CPH)";
            jurArt = "Art. L. 1411-1 du Code du travail (Compétence exclusive)";
            expl = "Litige individuel du travail né de l'exécution ou rupture du contrat.";
        } else if (mat === 'COMMERCIAL') {
            jurNom = "Tribunal de Commerce (TC / TAE)";
            jurArt = "Art. L. 721-3 du Code de commerce (Compétence exclusive)";
            expl = "Actes de commerce ou contestations entre commerçants et banques.";
        } else if (mat.startsWith('JCP')) {
            jurNom = "Juge des Contentieux de la Protection (JCP)";
            jurArt = "Art. L. 213-4-1 à L. 213-4-7 du COJ";
            expl = "Baux d'habitation (loi 1989), crédit consommation ≤ 75 000 € ou demande civile ≤ 10 000 €.";
        }

        let terArt = "Art. 42 du CPC (Domicile du défendeur)";
        if (ter === 'LIVRAISON') terArt = "Art. 46 al. 2 CPC (Lieu de livraison effective de la chose ou d'exécution de la prestation)";
        if (ter === 'DOMMAGE') terArt = "Art. 46 al. 3 CPC (Lieu du fait dommageable ou lieu où le dommage a été subi)";
        if (ter === 'IMMEUBLE') terArt = "Art. 44 CPC (Lieu de situation de l'immeuble - Compétence exclusive)";

        const box = document.getElementById('competence-result');
        box.style.display = 'block';
        box.innerHTML = `
            <strong>Juridiction Compétente :</strong> <span style="color: #1d4ed8; font-weight: bold; font-size: 1rem;">${jurNom} de ${ville}</span><br>
            <strong>Compétence Matérielle :</strong> ${jurArt} (${expl})<br>
            <strong>Compétence Territoriale :</strong> ${terArt}<br>
            <div style="margin-top: 10px;">
                <button class="btn btn-primary" onclick="creerDossierDepuisCompetence('${jurNom} de ${ville}')">Créer un dossier avec cette juridiction</button>
            </div>
        `;

        await invokeTauri('enregistrer_historique', {
            categorie: 'COMPETENCE',
            titre: `Analyse Compétence : ${jurNom}`,
            details: `Juridiction retenue : ${jurNom} de ${ville}`,
            fondement: `${jurArt} / ${terArt}`
        });
        renderHistory();
    };

    // 7. Calculateur de Prescription (Module C)
    document.getElementById('btn-calculer-prescription').onclick = async () => {
        const dStr = document.getElementById('presc-date').value;
        const reg = document.getElementById('presc-regime').value;
        const inc = document.getElementById('presc-incident').value;
        if (!dStr) return alert("Précisez le point de départ.");

        const d = new Date(dStr);
        let fin = new Date(d);
        let art = "";

        if (reg === '5_DROIT_COMMUN') { fin.setFullYear(fin.getFullYear() + 5); art = "Art. 2224 Code civil (Prescription quinquennale)"; }
        else if (reg === '2_CONSO') { fin.setFullYear(fin.getFullYear() + 2); art = "Art. L. 218-2 Code de la consommation (Biennale)"; }
        else if (reg === '10_CORPOREL') { fin.setFullYear(fin.getFullYear() + 10); art = "Art. 2226 Code civil (Dommage corporel)"; }
        else if (reg === '3_SALAIRE' || reg === '3_LOYER') { fin.setFullYear(fin.getFullYear() + 3); art = "Art. L. 3245-1 C. trav. / Art. 7-1 Loi 1989"; }
        else { fin.setFullYear(fin.getFullYear() + 1); art = "Art. L. 1471-1 Code du travail (12 mois)"; }

        let obs = "";
        if (inc === 'CITATION') obs = "<br>⚠️ <strong>Interruption (Art. 2241 C. civ.) :</strong> La citation en justice anéantit le délai écoulé et fait courir un nouveau délai.";
        if (inc === 'MEDIATION') obs = "<br>ℹ️ <strong>Suspension (Art. 2238 C. civ.) :</strong> La médiation suspend le cours. Le délai restant recommence pour au moins 6 mois à compter de la fin du processus.";

        const box = document.getElementById('prescription-result');
        box.style.display = 'block';
        box.innerHTML = `
            <strong>Date limite d'action :</strong> <span style="color: #b91c1c; font-weight: bold; font-size: 1rem;">${fin.toLocaleDateString('fr-FR')}</span><br>
            <strong>Régime Légal :</strong> ${art}.<br>
            <strong>Point de départ retenu :</strong> ${d.toLocaleDateString('fr-FR')} (Consolidation ou jour où les faits étaient connus).${obs}
        `;

        await invokeTauri('enregistrer_historique', {
            categorie: 'PRESCRIPTION',
            titre: `Calcul Prescription : ${art}`,
            details: `Forclusion estimée au ${fin.toLocaleDateString('fr-FR')}`,
            fondement: art
        });
        renderHistory();
    };

    // 8. Historique & Paramètres
    document.getElementById('btn-clear-history').onclick = async () => {
        if (confirm("Supprimer l'historique d'audit ?")) {
            state = await invokeTauri('vider_historique');
            renderHistory();
        }
    };

    document.getElementById('btn-export-audit').onclick = () => {
        let txt = "LEXPROCEDURA - RELEVÉ D'AUDIT ET DILIGENCES PROCÉDURALES\n";
        txt += "Cabinet d'Avocats | Traçabilité RCP\n";
        txt += "=========================================================\n\n";
        state.historique.forEach(h => {
            txt += `[${h.horodatage}] - ${h.categorie} : ${h.titre}\n`;
            txt += `Détails   : ${h.details}\n`;
            txt += `Fondement : ${h.fondement}\n`;
            txt += "---------------------------------------------------------\n";
        });
        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Audit_LexProcedura_${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
    };

    document.getElementById('btn-save-params').onclick = async () => {
        const r = parseInt(document.getElementById('p-rouge').value);
        const o = parseInt(document.getElementById('p-orange').value);
        if (o <= r) return alert("Le seuil Orange doit être strictement supérieur au seuil Rouge.");
        state.parametres.seuil_rouge_jours = r;
        state.parametres.seuil_orange_jours = o;
        state.parametres.regime_alsace_moselle = document.getElementById('p-alsace').checked;
        state.parametres.resend_api_key = document.getElementById('p-resend').value.trim();
        state.parametres.emails_destinataires = document.getElementById('p-emails').value.split(',').map(s => s.trim());
        await invokeTauri('enregistrer_parametres', { nouveauxParametres: state.parametres });
        alert("Paramètres sauvegardés.");
        renderDashboard();
    };

    document.getElementById('btn-base-vierge').onclick = async () => {
        if (confirm("Passer à une base VIERGE (supprime les affaires de démonstration) ?")) {
            state = await invokeTauri('reinitialiser_base', { modeVierge: true });
            renderDashboard();
            renderHistory();
            switchView('view-dashboard', true);
        }
    };

    document.getElementById('btn-restore-demo').onclick = async () => {
        if (confirm("Recharger les dossiers d'exemple ?")) {
            state = await invokeTauri('reinitialiser_base', { modeVierge: false });
            renderDashboard();
            renderHistory();
            switchView('view-dashboard', true);
        }
    };

    document.getElementById('btn-test-email').onclick = async () => {
        const st = document.getElementById('test-status');
        st.textContent = "Transmission...";
        try {
            const res = await invokeTauri('declencher_test_email');
            st.textContent = "✓ " + res;
            st.style.color = "green";
        } catch (e) {
            st.textContent = "✗ " + e;
            st.style.color = "red";
        }
    };
});

window.creerDossierDepuisCompetence = function(juridictionNom) {
    document.getElementById('new-juridiction').value = juridictionNom;
    document.getElementById('modal-affaire').classList.add('active');
};

function switchView(viewId, updateSidebar = false) {
    document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');

    if (updateSidebar) {
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(b => {
            b.classList.toggle('active', b.dataset.view === viewId);
        });
    }
}

function openQuickSearch() {
    const modal = document.getElementById('modal-quick-search');
    modal.classList.add('active');
    const input = document.getElementById('palette-input');
    input.value = '';
    input.focus();
    filterQuickSearch('');
}

function closeQuickSearch() {
    document.getElementById('modal-quick-search').classList.remove('active');
}

function filterQuickSearch(query) {
    const res = document.getElementById('palette-results');
    res.innerHTML = '';

    const actions = [
        { label: "📋 Aller au Tableau de bord", hint: "Affaires & Délais", action: () => switchView('view-dashboard', true) },
        { label: "⏱️ Ouvrir le Calculateur Express CPC", hint: "Art. 640-644", action: () => switchView('view-cpc-express', true) },
        { label: "🏛️ Déterminer la Compétence (TJ/JCP/TC/CPH)", hint: "Module A", action: () => switchView('view-competence', true) },
        { label: "⏳ Calculer la Prescription Civile", hint: "Art. 2224 C. civ.", action: () => switchView('view-prescription', true) },
        { label: "🛡️ Consulter la Checklist Incidents (In limine litis)", hint: "Art. 74 CPC", action: () => switchView('view-incidents', true) },
        { label: "📜 Consulter l'Historique & Journal RCP", hint: "Audit Trail", action: () => switchView('view-historique', true) },
        { label: "➕ Ouvrir un nouveau dossier", hint: "Création affaire", action: () => document.getElementById('modal-affaire').classList.add('active') },
        { label: "⚖️ Art. 538 du CPC (Délai d'appel)", hint: "1 mois contentieux / 15j gracieux", action: () => switchView('view-cpc-express', true) },
        { label: "⚖️ Art. 642 du CPC (Prorogation jour ouvrable)", hint: "Samedi/dimanche/férié", action: () => switchView('view-cpc-express', true) },
        { label: "⚖️ Art. 643 du CPC (Délais de distance)", hint: "+1 mois DOM, +2 mois étranger", action: () => switchView('view-cpc-express', true) },
        { label: "⚖️ Art. 908 du CPC (Conclusions appelant)", hint: "Délai de 3 mois RPVA", action: () => switchView('view-cpc-express', true) },
        { label: "⚖️ Art. 74 du CPC (Exceptions in limine litis)", hint: "Avant toute défense au fond", action: () => switchView('view-incidents', true) }
    ];

    state.affaires.forEach(a => {
        actions.unshift({
            label: `📁 Dossier : ${a.nom_dossier}`,
            hint: `${a.reference_cabinet} | ${a.juridiction}`,
            action: () => openCaseDetails(a)
        });
    });

    const filtered = actions.filter(it => it.label.toLowerCase().includes(query) || it.hint.toLowerCase().includes(query));

    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'palette-item';
        div.innerHTML = `<span>${item.label}</span><small>${item.hint}</small>`;
        div.onclick = () => {
            closeQuickSearch();
            item.action();
        };
        res.appendChild(div);
    });
}

function renderDashboard() {
    const tb = document.getElementById('tbody-cases');
    tb.innerHTML = '';
    const now = new Date();
    now.setHours(0,0,0,0);

    let [cAll, cUrg, cSurv, cNorm, cExp] = [0, 0, 0, 0, 0];

    const processed = state.affaires.map(aff => {
        cAll++;
        let minJ = Infinity;
        let actCrit = null;

        aff.actes.forEach(act => {
            const ech = new Date(act.date_echeance_calculee);
            ech.setHours(0,0,0,0);
            const diff = Math.ceil((ech - now) / 86400000);
            if (diff < minJ) {
                minJ = diff;
                actCrit = act;
            }
        });

        let cat = 'NORM';
        if (!actCrit) { cNorm++; }
        else if (minJ < 0) { cat = 'EXP'; cExp++; }
        else if (minJ <= state.parametres.seuil_rouge_jours) { cat = 'URGENT'; cUrg++; }
        else if (minJ <= state.parametres.seuil_orange_jours) { cat = 'SURV'; cSurv++; }
        else { cNorm++; }

        return { ...aff, minJ, actCrit, cat };
    });

    document.getElementById('cnt-all').textContent = cAll;
    document.getElementById('cnt-urg').textContent = cUrg;
    document.getElementById('cnt-surv').textContent = cSurv;
    document.getElementById('cnt-norm').textContent = cNorm;
    document.getElementById('cnt-exp').textContent = cExp;

    processed.sort((a, b) => a.minJ - b.minJ);

    const filtered = processed.filter(a => currentFilter === 'ALL' || a.cat === currentFilter);

    if (filtered.length === 0) {
        tb.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">Aucun dossier dans cette catégorie.</td></tr>`;
        return;
    }

    filtered.forEach(aff => {
        let badge = `<span class="badge normal">⚪ Normal</span>`;
        let txtRestant = `${aff.minJ === Infinity ? '-' : aff.minJ + ' jours'}`;

        if (aff.cat === 'EXP') {
            badge = `<span class="badge expired">⚫ Forclos</span>`;
            txtRestant = `<b style="color: #475569;">Expiré (${Math.abs(aff.minJ)} j)</b>`;
        } else if (aff.cat === 'URGENT') {
            badge = `<span class="badge red">⚠️ URGENT</span>`;
            txtRestant = `<b style="color: #b91c1c;">${aff.minJ} jour(s)</b>`;
        } else if (aff.cat === 'SURV') {
            badge = `<span class="badge orange">👁 Surveillance</span>`;
            txtRestant = `<b style="color: #c2410c;">${aff.minJ} jours</b>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${badge}</td>
            <td><b>${aff.nom_dossier}</b><br><small style="color: #64748b;">${aff.reference_cabinet}</small></td>
            <td>${aff.juridiction}<br><small style="color: #64748b;">${aff.numero_rg}</small></td>
            <td>${aff.actCrit ? aff.actCrit.nature : '<i>Aucun acte</i>'}<br><small>${aff.actCrit ? aff.actCrit.fondement_cpc : ''}</small></td>
            <td><b>${aff.actCrit ? aff.actCrit.date_echeance_calculee : '-'}</b></td>
            <td>${txtRestant}</td>
            <td style="text-align: center;">
                <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="openCaseById('${aff.id}')">Ouvrir</button>
                <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="deleteCaseById('${aff.id}')">✕</button>
            </td>
        `;
        tb.appendChild(tr);
    });
}

window.openCaseById = function(id) {
    const a = state.affaires.find(it => it.id === id);
    if (a) openCaseDetails(a);
};

window.deleteCaseById = async function(id) {
    if (confirm("Supprimer définitivement ce dossier ?")) {
        state = await invokeTauri('supprimer_affaire', { idAffaire: id });
        renderDashboard();
        renderHistory();
    }
};

function openCaseDetails(aff) {
    currentAffaire = aff;
    document.getElementById('d-nom').textContent = aff.nom_dossier;
    document.getElementById('d-meta').textContent = `Réf: ${aff.reference_cabinet} | ${aff.juridiction} | RG: ${aff.numero_rg} | Résidence: ${aff.lieu_residence_partie}`;

    const timeline = document.getElementById('timeline-container');
    const breakdown = document.getElementById('breakdown-container');
    timeline.innerHTML = '';
    breakdown.innerHTML = '';

    if (!aff.actes || aff.actes.length === 0) {
        timeline.innerHTML = '<p style="color: #94a3b8; font-size: 0.85rem;">Aucun acte. Cliquez sur "+ Ajouter un Acte".</p>';
    } else {
        aff.actes.forEach((act, idx) => {
            const item = document.createElement('div');
            item.className = 'timeline-item' + (idx === 0 ? ' active' : '');
            item.innerHTML = `
                <div style="font-weight: bold;">${act.date_evenement} ➔ ${act.date_echeance_calculee}</div>
                <div><b>${act.nature}</b></div>
                <div style="font-size: 0.72rem; color: #64748b;">${act.fondement_cpc}</div>
            `;
            item.onclick = () => {
                document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                renderBreakdown(act);
            };
            timeline.appendChild(item);
            if (idx === 0) renderBreakdown(act);
        });
    }

    switchView('view-details');
}

function renderBreakdown(act) {
    document.getElementById('breakdown-container').innerHTML = `
        <div class="breakdown-box"><b>Acte Déclencheur</b>${act.nature}</div>
        <div class="breakdown-box"><b>Dies A Quo (Art. 640 CPC)</b>${act.date_evenement} (Jour exclu)</div>
        <div class="breakdown-box"><b>Échéance d'Ordre Public</b><span style="color: #b91c1c; font-weight: bold;">${act.date_echeance_calculee} à 24h00</span></div>
        <div class="breakdown-box"><b>Fondement CPC</b>${act.fondement_cpc}</div>
        <div class="breakdown-box" style="grid-column: 1 / -1;"><b>Détail computationnel certifié :</b>${act.details_calcul}</div>
    `;
}

function renderHistory() {
    const tb = document.getElementById('tbody-history');
    if (!tb) return;
    tb.innerHTML = '';
    if (!state.historique || state.historique.length === 0) {
        tb.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">Aucune opération enregistrée.</td></tr>`;
        return;
    }
    state.historique.forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color: #64748b; font-size: 0.8rem;">${h.horodatage}</td>
            <td><span class="badge normal">${h.categorie}</span></td>
            <td><b>${h.titre}</b></td>
            <td>${h.details}</td>
            <td><small style="color: #64748b;">${h.fondement}</small></td>
        `;
        tb.appendChild(tr);
    });
}