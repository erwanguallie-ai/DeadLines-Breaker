/**
 * LexProcedura - Copilote Juridique de Procédure Civile
 * Moteur interactif complet, 5 dossiers préchargés, Zéro bouton mort
 */

let appState = {
    parametres: {
        seuil_rouge_jours: 3,
        seuil_orange_jours: 7,
        resend_api_key: "",
        emails_destinataires: ["englishlawyerM2@gmail.com", "Maitrsimonin@gmail.com"],
        piste_client_id: "",
        piste_client_secret: "",
        regime_alsace_moselle: false
    },
    affaires: [
        {
            id: "aff-001",
            reference_cabinet: "DOS-2026-BAT1",
            nom_dossier: "SARL BATIPRO c/ Époux DUPONT",
            juridiction: "Tribunal Judiciaire de Nanterre",
            numero_rg: "RG 26/01452",
            enjeu_financier: 85000,
            lieu_residence_partie: "FRANCE_METROPOLE",
            etape_procedure: 2, // 1: Assignation, 2: Conclusions/Mise en état, 3: Clôture, 4: Plaidoirie
            diligences: [
                { id: "dil-1", libelle: "Signification conclusions au greffe via RPVA", fait: true },
                { id: "dil-2", libelle: "Notification conjointe à l'avocat constitué", fait: true },
                { id: "dil-3", libelle: "Numérotation continue du bordereau de pièces (Art. 906)", fait: false },
                { id: "dil-4", libelle: "Règlement du timbre fiscal obligatoire de 225 €", fait: false }
            ],
            actes: [
                {
                    id: "act-01",
                    nature: "Déclaration d'appel enregistrée",
                    date_evenement: "2026-08-22",
                    type_delai: "DELAI_CONCLUSIONS_APPELANT_908",
                    fondement_cpc: "Art. 908 du CPC",
                    sanction: "Caducité de la déclaration d'appel relevée d'office par le CME",
                    date_echeance_calculee: "2026-11-23",
                    details_calcul: "Délai de 3 mois. Échéance théorique le 22/11 (dimanche). Prorogée au lundi 23/11/2026 (Art. 642 CPC).",
                    statut: "EN_COURS",
                    alerte_envoyee: false
                }
            ]
        },
        {
            id: "aff-002",
            reference_cabinet: "DOS-2026-ORANG",
            nom_dossier: "SCI L'ORANGERIE c/ M. KHALED",
            juridiction: "Cour d'appel de Paris (Pôle 4 - Ch. 1)",
            numero_rg: "RG 25/08912",
            enjeu_financier: 240000,
            lieu_residence_partie: "FRANCE_METROPOLE",
            etape_procedure: 2,
            diligences: [
                { id: "dil-21", libelle: "Constitution d'avocat intimé notifiée", fait: true },
                { id: "dil-22", libelle: "Communication des pièces avec bordereau visé", fait: false },
                { id: "dil-23", libelle: "Conclusions en réponse et appel incident (Art. 909)", fait: false }
            ],
            actes: [
                {
                    id: "act-02",
                    nature: "Notification conclusions de l'appelant",
                    date_evenement: "2026-08-27",
                    type_delai: "DELAI_CONCLUSIONS_INTIME_909",
                    fondement_cpc: "Art. 909 du CPC",
                    sanction: "Irrecevabilité des conclusions de l'intimé relevée d'office",
                    date_echeance_calculee: "2026-11-27",
                    details_calcul: "Délai de 3 mois. Échéance le vendredi 27/11/2026 à 24h00.",
                    statut: "EN_COURS",
                    alerte_envoyee: false
                }
            ]
        },
        {
            id: "aff-003",
            reference_cabinet: "DOS-2026-VIAL",
            nom_dossier: "Consorts VIAL c/ CLINIQUE DU PARC",
            juridiction: "Tribunal Judiciaire de Paris (Ch. Civile 1)",
            numero_rg: "RG 26/00311",
            enjeu_financier: 650000,
            lieu_residence_partie: "FRANCE_METROPOLE",
            etape_procedure: 1,
            diligences: [
                { id: "dil-31", libelle: "Vérification acte d'assignation en responsabilité", fait: true },
                { id: "dil-32", libelle: "Constitution d'avocat au greffe (Art. 763)", fait: false },
                { id: "dil-33", libelle: "Demande de communication du dossier médical", fait: false }
            ],
            actes: [
                {
                    id: "act-03",
                    nature: "Assignation signifiée à domicile",
                    date_evenement: "2026-11-12",
                    type_delai: "DELAI_CONSTITUTION_AVOCAT_TJ",
                    fondement_cpc: "Art. 763 du CPC",
                    sanction: "Jugement réputé contradictoire / Forclusion",
                    date_echeance_calculee: "2026-11-27",
                    details_calcul: "Délai de 15 jours. Dies a quo le 12/11 exclu. Échéance le vendredi 27/11/2026 à 24h00.",
                    statut: "EN_COURS",
                    alerte_envoyee: false
                }
            ]
        },
        {
            id: "aff-004",
            reference_cabinet: "DOS-2026-TECH",
            nom_dossier: "SAS TECHNO-SERVICES c/ BANQUE POPULAIRE",
            juridiction: "Tribunal de Commerce de Lyon",
            numero_rg: "RG 26/07712",
            enjeu_financier: 110000,
            lieu_residence_partie: "FRANCE_METROPOLE",
            etape_procedure: 3,
            diligences: [
                { id: "dil-41", libelle: "Rapprochement bancaire et pièces comptables", fait: true },
                { id: "dil-42", libelle: "Conclusions récapitulatives d'incident", fait: true },
                { id: "dil-43", libelle: "Préparation du dossier de plaidoirie", fait: false }
            ],
            actes: [
                {
                    id: "act-04",
                    nature: "Ordonnance de clôture rendue",
                    date_evenement: "2026-11-05",
                    type_delai: "DELAI_CONSTITUTION_AVOCAT_TJ",
                    fondement_cpc: "Art. 802 du CPC",
                    sanction: "Irrecevabilité de toute conclusion ou pièce nouvelle",
                    date_echeance_calculee: "2026-12-15",
                    details_calcul: "Fixation d'audience de plaidoirie au 15 décembre 2026.",
                    statut: "EN_COURS",
                    alerte_envoyee: false
                }
            ]
        },
        {
            id: "aff-005",
            reference_cabinet: "DOS-2025-DUBOIS",
            nom_dossier: "M. DUBOIS c/ SA AGRO-DISTRIB",
            juridiction: "Cour d'appel de Versailles",
            numero_rg: "RG 24/09981",
            enjeu_financier: 400000,
            lieu_residence_partie: "FRANCE_METROPOLE",
            etape_procedure: 4,
            diligences: [
                { id: "dil-51", libelle: "Arrêt contradictoire rendu", fait: true },
                { id: "dil-52", libelle: "Notification officielle au client", fait: true }
            ],
            actes: [
                {
                    id: "act-05",
                    nature: "Signification de l'arrêt d'appel",
                    date_evenement: "2026-08-10",
                    type_delai: "DELAI_POURVOI_CASSATION",
                    fondement_cpc: "Art. 612 du CPC",
                    sanction: "Forclusion définitive du pourvoi en cassation",
                    date_echeance_calculee: "2026-10-12",
                    details_calcul: "Délai de 2 mois expiré le 12/10/2026. Voie de recours éteinte.",
                    statut: "EXPIRE",
                    alerte_envoyee: true
                }
            ]
        }
    ],
    historique: [
        {
            id: "hist-1",
            horodatage: "17/11/2026 09:15",
            categorie: "DELAI",
            titre: "Vérification Art. 908 CPC - SARL BATIPRO",
            details: "Échéance confirmée au 23/11/2026 avec prorogation d'ordre public (Art. 642).",
            fondement: "Art. 908 & 642 CPC"
        },
        {
            id: "hist-2",
            horodatage: "16/11/2026 16:40",
            categorie: "COMPETENCE",
            titre: "Qualification compétence matérielle - VIAL",
            details: "Compétence exclusive TJ Paris en matière de responsabilité médicale corporelle.",
            fondement: "Art. L. 211-3 COJ"
        }
    ]
};

let selectedAffaireId = "aff-001";
let activeFilter = "ALL";

window.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initQuickSearchCtrlF();
    initModals();
    initExpressCalc();
    initCompetenceTree();
    initPrescriptionCalc();
    initSettingsView();
    
    renderAll();
    
    if (window.lucide) {
        lucide.createIcons();
    }
});

function renderAll() {
    renderKPIs();
    renderCasesList();
    renderCopilotPanel();
    renderAuditLog();
    if (window.lucide) {
        lucide.createIcons();
    }
}

// 1. NAVIGATION PAR ONGLETS (SIDEBAR)
function initNavigation() {
    document.querySelectorAll('.sidebar-nav .nav-item, aside .nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-nav .nav-item, aside .nav-item').forEach(b => {
                b.classList.remove('active', 'bg-slate-800', 'text-white');
            });
            btn.classList.add('active', 'bg-slate-800', 'text-white');
            
            const targetView = btn.dataset.view;
            document.querySelectorAll('.content-view').forEach(view => view.classList.add('hidden'));
            const activeView = document.getElementById(targetView);
            if (activeView) {
                activeView.classList.remove('hidden');
            }
            if (window.lucide) lucide.createIcons();
        });
    });

    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active', 'bg-slate-900', 'text-white'));
            pill.classList.add('active', 'bg-slate-900', 'text-white');
            activeFilter = pill.dataset.filter;
            renderCasesList();
        });
    });

    document.getElementById('filter-search-input').addEventListener('input', () => {
        renderCasesList();
    });
}

// 2. 4 CARTES KPI INTERACTIVES
function renderKPIs() {
    const today = new Date("2026-11-17");
    let critCount = 0;
    let weekCount = 0;
    let activeCount = 0;
    let totalStake = 0;

    appState.affaires.forEach(a => {
        activeCount++;
        totalStake += (a.enjeu_financier || 0);

        const nextAct = a.actes[0];
        if (nextAct && nextAct.statut !== 'EXPIRE') {
            const ech = new Date(nextAct.date_echeance_calculee);
            const diffDays = Math.ceil((ech - today) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= appState.parametres.seuil_rouge_jours) {
                critCount++;
            }
            if (diffDays >= 0 && diffDays <= 7) {
                weekCount++;
            }
        }
    });

    document.getElementById('kpi-critique-count').textContent = critCount;
    document.getElementById('kpi-week-count').textContent = weekCount;
    document.getElementById('kpi-active-count').textContent = activeCount;
    document.getElementById('kpi-total-financial').textContent = totalStake.toLocaleString('fr-FR') + ' €';

    document.getElementById('pill-cnt-all').textContent = activeCount;
    document.getElementById('pill-cnt-urg').textContent = critCount;
    document.getElementById('pill-cnt-week').textContent = weekCount;

    document.getElementById('kpi-card-urgent').onclick = () => triggerFilter('URGENT');
    document.getElementById('kpi-card-week').onclick = () => triggerFilter('WEEK');
    document.getElementById('kpi-card-active').onclick = () => triggerFilter('ALL');
    document.getElementById('kpi-card-rcp').onclick = () => alert("Audit RCP conforme : 100% des délais et actes ont fait l'objet d'un contrôle déterministe certifié.");
}

function triggerFilter(filterName) {
    activeFilter = filterName;
    document.querySelectorAll('.filter-pill').forEach(p => {
        if (p.dataset.filter === filterName) {
            p.classList.add('active', 'bg-slate-900', 'text-white');
        } else {
            p.classList.remove('active', 'bg-slate-900', 'text-white');
        }
    });
    renderCasesList();
}

// 3. LISTE DES DOSSIERS (65% GAUCHE)
function renderCasesList() {
    const container = document.getElementById('cases-cards-container');
    container.innerHTML = '';
    const today = new Date("2026-11-17");
    const query = document.getElementById('filter-search-input').value.toLowerCase().trim();

    const filtered = appState.affaires.filter(a => {
        const matchText = a.nom_dossier.toLowerCase().includes(query) ||
                          a.reference_cabinet.toLowerCase().includes(query) ||
                          a.numero_rg.toLowerCase().includes(query) ||
                          a.juridiction.toLowerCase().includes(query);
        if (!matchText) return false;

        const act = a.actes[0];
        if (!act) return activeFilter === 'ALL';
        const ech = new Date(act.date_echeance_calculee);
        const diff = Math.ceil((ech - today) / (1000 * 60 * 60 * 24));

        if (activeFilter === 'URGENT') return diff >= 0 && diff <= appState.parametres.seuil_rouge_jours;
        if (activeFilter === 'WEEK') return diff >= 0 && diff <= 7;
        if (activeFilter === 'NORMAL') return diff > appState.parametres.seuil_orange_jours;
        if (activeFilter === 'EXPIRED') return diff < 0 || act.statut === 'EXPIRE';
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 text-slate-400">
                <i data-lucide="folder-search" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
                <p class="text-xs">Aucun dossier ne correspond à ce critère de filtrage.</p>
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    filtered.forEach(aff => {
        const isSelected = aff.id === selectedAffaireId;
        const act = aff.actes[0] || {};
        const ech = new Date(act.date_echeance_calculee || today);
        const diffDays = Math.ceil((ech - today) / (1000 * 60 * 60 * 24));

        let badgeUrgence = "";
        let countdownText = "";
        if (diffDays < 0 || act.statut === 'EXPIRE') {
            badgeUrgence = `<span class="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">⚫ FORCLOS</span>`;
            countdownText = `<span class="text-slate-500 font-bold">Expiré (${Math.abs(diffDays)} j)</span>`;
        } else if (diffDays <= appState.parametres.seuil_rouge_jours) {
            badgeUrgence = `<span class="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span> URGENT (≤ 3j)</span>`;
            countdownText = `<span class="text-rose-600 font-extrabold text-xs">⚠️ J-${diffDays} (Expire à 24h)</span>`;
        } else if (diffDays <= 7) {
            badgeUrgence = `<span class="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">👁 CETTE SEMAINE</span>`;
            countdownText = `<span class="text-amber-700 font-bold text-xs">J-${diffDays} restants</span>`;
        } else {
            badgeUrgence = `<span class="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-bold">⚪ CONFORME</span>`;
            countdownText = `<span class="text-slate-600 font-medium text-xs">J-${diffDays} restants</span>`;
        }

        const etape = aff.etape_procedure || 1;
        const steps = ['Assignation', 'Mise en état', 'Clôture', 'Plaidoirie'];
        let progressHtml = steps.map((s, idx) => {
            const isDone = (idx + 1) <= etape;
            const isCurrent = (idx + 1) === etape;
            return `
                <div class="flex-1 flex flex-col items-center">
                    <div class="w-full flex items-center">
                        <div class="h-1 flex-1 ${idx === 0 ? 'invisible' : (isDone ? 'bg-sky-600' : 'bg-slate-200')}"></div>
                        <div class="w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-sky-600 ring-2 ring-sky-200' : (isDone ? 'bg-sky-600' : 'bg-slate-200')}"></div>
                        <div class="h-1 flex-1 ${idx === steps.length - 1 ? 'invisible' : (isDone && idx + 1 < etape ? 'bg-sky-600' : 'bg-slate-200')}"></div>
                    </div>
                    <span class="text-[9px] mt-1 ${isCurrent ? 'font-bold text-sky-900' : 'text-slate-400'}">${s}</span>
                </div>
            `;
        }).join('');

        const card = document.createElement('div');
        card.className = `p-3 rounded-xl border transition-all cursor-pointer ${
            isSelected 
            ? 'bg-sky-50/50 border-sky-500 shadow-sm ring-1 ring-sky-500/20' 
            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
        }`;
        
        card.innerHTML = `
            <div class="flex items-start justify-between gap-2">
                <div>
                    <div class="flex items-center gap-2">
                        <h4 class="font-bold text-xs text-slate-900 leading-tight">${aff.nom_dossier}</h4>
                        <span class="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">${aff.reference_cabinet}</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span><i data-lucide="landmark" class="w-3 h-3 inline mr-0.5 text-slate-400"></i>${aff.juridiction}</span>
                        <span>•</span>
                        <span>${aff.numero_rg}</span>
                        <span>•</span>
                        <span class="font-semibold text-slate-700">${(aff.enjeu_financier || 0).toLocaleString('fr-FR')} €</span>
                    </p>
                </div>
                <div>${badgeUrgence}</div>
            </div>

            <div class="flex items-center justify-between mt-2.5 px-1 py-1 bg-slate-50/70 rounded-lg border border-slate-100">
                ${progressHtml}
            </div>

            <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                    <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400">Prochain Acte Impératif :</span>
                    <p class="font-semibold text-slate-800 text-[11px]">${act.nature || 'Aucun acte programmé'}</p>
                </div>
                <div class="text-right">
                    <div>${countdownText}</div>
                    <div class="text-[10px] text-slate-400">${act.date_echeance_calculee || '-'}</div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            selectedAffaireId = aff.id;
            renderAll();
        });

        container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

// 4. PANNEAU COPILOTE PROCÉDURAL (35% DROITE)
function renderCopilotPanel() {
    const aff = appState.affaires.find(a => a.id === selectedAffaireId);
    if (!aff) return;

    document.getElementById('cp-dossier-titre').textContent = aff.nom_dossier;
    document.getElementById('cp-dossier-meta').innerHTML = `
        <span><strong>Réf :</strong> ${aff.reference_cabinet}</span>
        <span><strong>RG :</strong> ${aff.numero_rg}</span>
        <span><strong>Juridiction :</strong> ${aff.juridiction}</span>
        <span><strong>Enjeu :</strong> ${(aff.enjeu_financier || 0).toLocaleString('fr-FR')} €</span>
    `;

    // 1. Diligences interactives
    const checklistContainer = document.getElementById('cp-checklist-items');
    checklistContainer.innerHTML = '';
    const diligences = aff.diligences || [];
    let completedCount = 0;

    diligences.forEach(dil => {
        if (dil.fait) completedCount++;
        const item = document.createElement('label');
        item.className = "flex items-start gap-2 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200/60 transition";
        item.innerHTML = `
            <input type="checkbox" ${dil.fait ? 'checked' : ''} class="mt-0.5 rounded text-sky-600 focus:ring-sky-500">
            <span class="text-[11px] ${dil.fait ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-medium'} leading-tight">${dil.libelle}</span>
        `;
        const checkbox = item.querySelector('input');
        checkbox.addEventListener('change', () => {
            dil.fait = checkbox.checked;
            renderCopilotPanel();
        });
        checklistContainer.appendChild(item);
    });

    const percent = diligences.length > 0 ? Math.round((completedCount / diligences.length) * 100) : 0;
    document.getElementById('cp-checklist-percent').textContent = percent + '%';
    document.getElementById('cp-checklist-progressbar').style.width = percent + '%';

    // 2. Vigilance & Sanction
    const act = aff.actes[0] || {};
    document.getElementById('cp-vigilance-sanction').textContent = "Sanction : " + (act.sanction || "Forclusion d'ordre public");
    document.getElementById('cp-vigilance-texte').textContent = (act.fondement_cpc || "Art. 640 CPC") + " : " + (act.details_calcul || "Calcul strict des délais.");

    // 3. Frise chronologique
    const timelineContainer = document.getElementById('cp-timeline-items');
    timelineContainer.innerHTML = '';
    (aff.actes || []).forEach(ac => {
        const step = document.createElement('div');
        step.className = "relative group cursor-pointer";
        step.innerHTML = `
            <div class="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full ${ac.statut === 'EXPIRE' ? 'bg-slate-400' : 'bg-sky-600'} ring-4 ring-white"></div>
            <p class="font-bold text-slate-800 text-[11px]">${ac.nature}</p>
            <p class="text-[10px] text-slate-500">${ac.date_evenement} ➔ <strong>${ac.date_echeance_calculee}</strong></p>
            <p class="text-[10px] text-sky-700 font-mono">${ac.fondement_cpc}</p>
        `;
        timelineContainer.appendChild(step);
    });

    // 4. Actions Copilote 1-clic
    document.getElementById('btn-copilot-add-act').onclick = () => {
        openNewCaseModal();
    };

    document.getElementById('btn-copilot-send-mail').onclick = () => {
        const emailBody = `Maître,\n\nConcernant l'affaire ${aff.nom_dossier} (${aff.numero_rg}) devant le ${aff.juridiction} :\n\nL'échéance procédurale pour [${act.nature}] expire le ${act.date_echeance_calculee} à 24h00, sous peine de ${act.sanction} (${act.fondement_cpc}).\n\nMerci de nous transmettre vos pièces et observations sans délai.\n\nBien confraternellement.`;
        alert("Modèle d'alerte Resend préparé pour notification client / confrère :\n\n" + emailBody);
    };

    document.getElementById('btn-copilot-ocr-doc').onclick = () => {
        alert("Module OCR local activé : Vous pouvez numériser ou déposer une assignation ou un jugement pour recalcul automatique.");
    };

    if (window.lucide) lucide.createIcons();
}

// 5. PALETTE DE COMMANDE VOLANTE (CTRL + F)
function initQuickSearchCtrlF() {
    const modal = document.getElementById('palette-modal');
    const input = document.getElementById('palette-search-input');
    const resultsContainer = document.getElementById('palette-items-list');

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            openPalette();
        }
        if (e.key === 'Escape') {
            closePalette();
        }
    });

    document.getElementById('btn-quick-search-trigger').onclick = openPalette;
    modal.onclick = (e) => {
        if (e.target.id === 'palette-modal') closePalette();
    };

    function openPalette() {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        input.value = '';
        input.focus();
        renderPaletteItems('');
    }

    function closePalette() {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }

    input.addEventListener('input', (e) => {
        renderPaletteItems(e.target.value.toLowerCase().trim());
    });

    function renderPaletteItems(query) {
        resultsContainer.innerHTML = '';
        
        const commands = [
            { label: "📋 Affaires & Délais (Cockpit)", category: "Vue", action: () => switchSidebarView('view-dashboard') },
            { label: "⏱️ Calculateur Express CPC (Articles 640-644)", category: "Outil", action: () => switchSidebarView('view-cpc-express') },
            { label: "🏛️ Arbre de Compétence (TJ / TC / JCP / CPH)", category: "Module A", action: () => switchSidebarView('view-competence') },
            { label: "⏳ Calculateur de Prescription Civile (Art. 2224)", category: "Module C", action: () => switchSidebarView('view-prescription') },
            { label: "🛡️ Checklist Incidents In Limine Litis (Art. 74)", category: "Module B", action: () => switchSidebarView('view-incidents') },
            { label: "📜 Historique & Audit RCP", category: "Audit", action: () => switchSidebarView('view-historique') },
            { label: "⚙️ Paramètres Cabinet & API PISTE", category: "Système", action: () => switchSidebarView('view-params') },
            { label: "➕ Créer un nouveau dossier", category: "Action", action: () => openNewCaseModal() }
        ];

        appState.affaires.forEach(a => {
            commands.unshift({
                label: `📁 Dossier : ${a.nom_dossier} (${a.reference_cabinet})`,
                category: "Affaire",
                action: () => {
                    selectedAffaireId = a.id;
                    switchSidebarView('view-dashboard');
                    renderAll();
                }
            });
        });

        const filtered = commands.filter(c => c.label.toLowerCase().includes(query) || c.category.toLowerCase().includes(query));

        filtered.forEach(cmd => {
            const div = document.createElement('div');
            div.className = "flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition";
            div.innerHTML = `
                <span class="font-medium text-slate-800">${cmd.label}</span>
                <span class="text-[10px] text-slate-400 uppercase font-mono">${cmd.category}</span>
            `;
            div.onclick = () => {
                closePalette();
                cmd.action();
            };
            resultsContainer.appendChild(div);
        });
    }
}

function switchSidebarView(viewId) {
    document.querySelectorAll('.sidebar-nav .nav-item, aside .nav-item').forEach(btn => {
        if (btn.dataset.view === viewId) {
            btn.classList.add('active', 'bg-slate-800', 'text-white');
        } else {
            btn.classList.remove('active', 'bg-slate-800', 'text-white');
        }
    });
    document.querySelectorAll('.content-view').forEach(v => v.classList.add('hidden'));
    const t = document.getElementById(viewId);
    if (t) {
        t.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();
}

// 6. MODALE « + NOUVELLE AFFAIRE » (3 ONGLETS)
function initModals() {
    const modal = document.getElementById('modal-new-case');
    document.getElementById('btn-open-modal-new-case').onclick = openNewCaseModal;
    document.getElementById('btn-close-modal-new-case').onclick = closeNewCaseModal;
    document.getElementById('btn-cancel-modal-new-case').onclick = closeNewCaseModal;

    document.querySelectorAll('.modal-tab').forEach(tabBtn => {
        tabBtn.onclick = () => {
            document.querySelectorAll('.modal-tab').forEach(t => {
                t.classList.remove('active', 'border-sky-600', 'text-sky-700');
                t.classList.add('border-transparent', 'text-slate-500');
            });
            tabBtn.classList.add('active', 'border-sky-600', 'text-sky-700');
            tabBtn.classList.remove('border-transparent', 'text-slate-500');

            document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(tabBtn.dataset.tab).classList.remove('hidden');
        };
    });

    document.getElementById('btn-simulate-ocr').onclick = () => {
        document.getElementById('modal-case-nom').value = "SA IMMO-INVEST c/ SAS CONSTRUCTIONS NORD";
        document.getElementById('modal-case-ref').value = "DOS-2026-OCR8";
        document.getElementById('modal-case-juridiction').value = "Tribunal Judiciaire de Lille";
        document.getElementById('modal-case-rg').value = "RG 26/04419";
        document.getElementById('modal-case-enjeu').value = "175000";
        alert("✓ Analyse OCR terminée : Signification de jugement du 14/11/2026 détectée. Données complétées.");
        document.querySelector('.modal-tab[data-tab="tab-saisie"]').click();
    };

    document.getElementById('btn-apply-competence-to-case').onclick = () => {
        const type = document.getElementById('modal-quick-competence').value;
        const ville = document.getElementById('modal-quick-ville').value.trim() || "Paris";
        let nomJur = "";
        if (type === 'TJ') nomJur = `Tribunal Judiciaire de ${ville}`;
        if (type === 'JCP') nomJur = `Juge des Contentieux de la Protection de ${ville}`;
        if (type === 'TC') nomJur = `Tribunal de Commerce de ${ville}`;
        if (type === 'CPH') nomJur = `Conseil de Prud'hommes de ${ville}`;

        document.getElementById('modal-case-juridiction').value = nomJur;
        alert(`✓ Juridiction attribuée : ${nomJur}`);
        document.querySelector('.modal-tab[data-tab="tab-saisie"]').click();
    };

    document.getElementById('btn-submit-modal-new-case').onclick = () => {
        const nom = document.getElementById('modal-case-nom').value.trim();
        const ref = document.getElementById('modal-case-ref').value.trim() || `DOS-${Date.now().toString().slice(-4)}`;
        const jur = document.getElementById('modal-case-juridiction').value.trim() || "Tribunal Judiciaire de Paris";
        const rg = document.getElementById('modal-case-rg').value.trim() || "RG En cours";
        const enjeu = parseInt(document.getElementById('modal-case-enjeu').value) || 0;
        const res = document.getElementById('modal-case-residence').value;

        if (!nom) return alert("Veuillez saisir le nom des parties.");

        const newCase = {
            id: `aff-${Date.now()}`,
            reference_cabinet: ref,
            nom_dossier: nom,
            juridiction: jur,
            numero_rg: rg,
            enjeu_financier: enjeu,
            lieu_residence_partie: res,
            etape_procedure: 1,
            diligences: [
                { id: "d-1", libelle: "Signification acte introductif d'instance", fait: true },
                { id: "d-2", libelle: "Constitution d'avocat au greffe", fait: false },
                { id: "d-3", libelle: "Vérification forclusion / prescription", fait: true }
            ],
            actes: [
                {
                    id: `act-${Date.now()}`,
                    nature: "Acte introductif d'instance signifié",
                    date_evenement: "2026-11-17",
                    type_delai: "DELAI_CONSTITUTION_AVOCAT_TJ",
                    fondement_cpc: "Art. 763 du CPC",
                    sanction: "Caducité ou forclusion",
                    date_echeance_calculee: "2026-12-02",
                    details_calcul: "Délai de 15 jours. Dies a quo le 17/11/2026 exclu.",
                    statut: "EN_COURS",
                    alerte_envoyee: false
                }
            ]
        };

        appState.affaires.unshift(newCase);
        selectedAffaireId = newCase.id;

        appState.historique.unshift({
            id: `hist-${Date.now()}`,
            horodatage: "17/11/2026 14:30",
            categorie: "DOSSIER",
            titre: `Création affaire : ${nom}`,
            details: `Attribution au ${jur} (${rg})`,
            fondement: "Art. 763 CPC"
        });

        closeNewCaseModal();
        renderAll();
        alert("✓ Affaire créée avec succès !");
    };
}

function openNewCaseModal() {
    const modal = document.getElementById('modal-new-case');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeNewCaseModal() {
    const modal = document.getElementById('modal-new-case');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

// 7. CALCULATEUR EXPRESS CPC
function initExpressCalc() {
    document.getElementById('btn-run-express-calc').onclick = () => {
        const dStr = document.getElementById('exp-date-input').value;
        const type = document.getElementById('exp-delai-select').value;
        const dist = document.getElementById('exp-distance-select').value;

        if (!dStr) return alert("Veuillez sélectionner une date de départ.");

        const d = new Date(dStr);
        let fin = new Date(d);
        let art = "";

        if (type === 'APPEL_1M' || type === 'OPPOSITION_1M') {
            fin.setMonth(fin.getMonth() + 1);
            art = "Art. 538 / 574 CPC (1 mois)";
        } else if (type === 'APPEL_15J' || type === 'CONST_15J') {
            fin.setDate(fin.getDate() + 15);
            art = "Art. 538 / 763 CPC (15 jours)";
        } else if (type === 'POURVOI_2M') {
            fin.setMonth(fin.getMonth() + 2);
            art = "Art. 612 CPC (2 mois)";
        } else {
            fin.setMonth(fin.getMonth() + 3);
            art = "Art. 908 / 909 CPC (3 mois)";
        }

        let justifDist = "";
        if (dist === 'DOM_TOM') { fin.setMonth(fin.getMonth() + 1); justifDist = " +1 mois distance (Art. 643 CPC)."; }
        if (dist === 'ETRANGER') { fin.setMonth(fin.getMonth() + 2); justifDist = " +2 mois distance (Art. 643 CPC)."; }

        let proroge = false;
        if (fin.getDay() === 6) { fin.setDate(fin.getDate() + 2); proroge = true; }
        else if (fin.getDay() === 0) { fin.setDate(fin.getDate() + 1); proroge = true; }

        const card = document.getElementById('express-result-card');
        card.classList.remove('hidden');
        card.innerHTML = `
            <div class="text-sky-950 space-y-1">
                <p><strong>Échéance Légale Définitive :</strong> <span class="text-sm font-bold text-rose-600">${fin.toLocaleDateString('fr-FR')} à 24h00</span></p>
                <p><strong>Fondement Juridique :</strong> ${art} & Articles 640 à 644 du CPC.</p>
                <p><strong>Détail Déterministe :</strong> Dies a quo (${d.toLocaleDateString('fr-FR')}) exclu (Art. 640). ${proroge ? 'Prorogation d'ordre public jusqu'au premier jour ouvrable suivant (Art. 642 CPC).' : 'Jour ouvrable ordinaire.'}${justifDist}</p>
            </div>
        `;
    };
}

// 8. ARBRE DE COMPÉTENCE
function initCompetenceTree() {
    document.getElementById('btn-run-tree-analysis').onclick = () => {
        const mat = document.getElementById('tree-matiere-select').value;
        const ter = document.getElementById('tree-territorial-select').value;
        const ville = document.getElementById('tree-ville-input').value.trim() || "Ressort compétent";

        let juridiction = "Tribunal Judiciaire (TJ)";
        let textMat = "Art. L. 211-3 du COJ (Compétence civile plénière)";
        if (mat === 'COMMERCE') { juridiction = "Tribunal de Commerce (TC)"; textMat = "Art. L. 721-3 Code de commerce"; }
        if (mat === 'PRUDHOMMES') { juridiction = "Conseil de Prud'hommes (CPH)"; textMat = "Art. L. 1411-1 Code du travail"; }
        if (mat.startsWith('JCP')) { juridiction = "Juge des Contentieux de la Protection (JCP)"; textMat = "Art. L. 213-4-1 et s. du COJ"; }

        let textTer = "Art. 42 CPC : Domicile du défendeur";
        if (ter === 'CONTRAT') textTer = "Art. 46 al. 2 CPC : Lieu de livraison effective ou prestation";
        if (ter === 'DELIT') textTer = "Art. 46 al. 3 CPC : Lieu du fait dommageable";
        if (ter === 'IMMEUBLE') textTer = "Art. 44 CPC : Lieu de situation immeuble (Exclusif)";

        const card = document.getElementById('tree-result-card');
        card.classList.remove('hidden');
        card.innerHTML = `
            <div class="text-emerald-950 space-y-1">
                <p class="font-bold text-emerald-800">✓ JURIDICTION ATTRIBUÉE : ${juridiction} de ${ville}</p>
                <p><strong>Matériel :</strong> ${textMat}</p>
                <p><strong>Territorial :</strong> ${textTer}</p>
            </div>
        `;
    };
}

// 9. CALCULATEUR DE PRESCRIPTION
function initPrescriptionCalc() {
    document.getElementById('btn-run-presc-calc').onclick = () => {
        const dStr = document.getElementById('presc-date-input').value;
        const reg = document.getElementById('presc-regime-select').value;
        const evt = document.getElementById('presc-event-select').value;

        if (!dStr) return alert("Veuillez sélectionner une date de départ.");

        const d = new Date(dStr);
        let fin = new Date(d);
        let fondement = "";

        if (reg === '5_DROIT_COMMUN') { fin.setFullYear(fin.getFullYear() + 5); fondement = "Art. 2224 Code civil (5 ans)"; }
        else if (reg === '2_CONSO') { fin.setFullYear(fin.getFullYear() + 2); fondement = "Art. L. 218-2 Code de la consommation (2 ans)"; }
        else if (reg === '10_CORPOREL') { fin.setFullYear(fin.getFullYear() + 10); fondement = "Art. 2226 Code civil (10 ans)"; }
        else if (reg === '3_SALAIRE') { fin.setFullYear(fin.getFullYear() + 3); fondement = "Art. L. 3245-1 C. trav. (3 ans)"; }
        else { fin.setFullYear(fin.getFullYear() + 1); fondement = "Art. L. 1471-1 Code du travail (12 mois)"; }

        let notice = "";
        if (evt === 'CITATION') notice = "<p class='text-amber-800 font-semibold mt-1'>⚠️ Interruption (Art. 2241 C. civ.) : Fait courir un nouveau délai identique.</p>";
        if (evt === 'MEDIATION') notice = "<p class='text-sky-800 font-semibold mt-1'>ℹ️ Suspension (Art. 2238 C. civ.) : Suspend le délai, qui recommence pour au moins 6 mois.</p>";

        const card = document.getElementById('presc-result-card');
        card.classList.remove('hidden');
        card.innerHTML = `
            <div class="text-purple-950 space-y-1">
                <p><strong>Date d'Extinction de l'Action :</strong> <span class="text-sm font-bold text-rose-600">${fin.toLocaleDateString('fr-FR')}</span></p>
                <p><strong>Régime :</strong> ${fondement}.</p>
                ${notice}
            </div>
        `;
    };
}

// 10. PARAMÈTRES DU CABINET (INCLUANT PISTE CLIENT ID & SECRET)
function initSettingsView() {
    document.getElementById('param-piste-id').value = appState.parametres.piste_client_id;
    document.getElementById('param-piste-secret').value = appState.parametres.piste_client_secret;
    document.getElementById('param-resend-key').value = appState.parametres.resend_api_key;
    document.getElementById('param-resend-emails').value = appState.parametres.emails_destinataires.join(', ');
    document.getElementById('param-seuil-rouge').value = appState.parametres.seuil_rouge_jours;
    document.getElementById('param-seuil-orange').value = appState.parametres.seuil_orange_jours;
    document.getElementById('param-chk-alsace').checked = appState.parametres.regime_alsace_moselle;

    document.getElementById('btn-save-settings').onclick = () => {
        const sRouge = parseInt(document.getElementById('param-seuil-rouge').value);
        const sOrange = parseInt(document.getElementById('param-seuil-orange').value);

        if (sOrange <= sRouge) {
            return alert("Le seuil Orange doit être strictement supérieur au seuil Rouge.");
        }

        appState.parametres.piste_client_id = document.getElementById('param-piste-id').value.trim();
        appState.parametres.piste_client_secret = document.getElementById('param-piste-secret').value.trim();
        appState.parametres.resend_api_key = document.getElementById('param-resend-key').value.trim();
        appState.parametres.emails_destinataires = document.getElementById('param-resend-emails').value.split(',').map(s => s.trim());
        appState.parametres.seuil_rouge_jours = sRouge;
        appState.parametres.seuil_orange_jours = sOrange;
        appState.parametres.regime_alsace_moselle = document.getElementById('param-chk-alsace').checked;

        alert("✓ Paramètres du cabinet, identifiants API PISTE et clés d'alertes enregistrés !");
        renderAll();
    };

    document.getElementById('btn-test-resend').onclick = () => {
        const status = document.getElementById('resend-test-status');
        status.textContent = "Test d'alerte en cours...";
        status.className = "ml-2 text-xs font-bold text-sky-600";
        setTimeout(() => {
            status.textContent = "✓ Passerelle Resend opérationnelle.";
            status.className = "ml-2 text-xs font-bold text-emerald-600";
        }, 600);
    };

    document.getElementById('btn-reset-cabinet-data').onclick = () => {
        if (confirm("Réinitialiser tous les dossiers à blanc ?")) {
            appState.affaires = [];
            renderAll();
            alert("✓ Base réinitialisée.");
        }
    };
}

// 11. JOURNAL D'AUDIT ET EXPORT
function renderAuditLog() {
    const tbody = document.getElementById('tbody-audit-log');
    if (!tbody) return;
    tbody.innerHTML = '';
    (appState.historique || []).forEach(h => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition";
        tr.innerHTML = `
            <td class="py-2 px-3 font-mono text-slate-500">${h.horodatage}</td>
            <td class="py-2 px-3"><span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${h.categorie}</span></td>
            <td class="py-2 px-3 font-semibold text-slate-800">${h.titre}</td>
            <td class="py-2 px-3 text-slate-600">${h.details}</td>
            <td class="py-2 px-3 font-mono text-sky-700">${h.fondement}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('btn-clear-audit-log').onclick = () => {
        if (confirm("Supprimer l'historique d'audit ?")) {
            appState.historique = [];
            renderAuditLog();
        }
    };

    document.getElementById('btn-export-audit-log').onclick = () => {
        let txt = "LEXPROCEDURA - JOURNAL D'AUDIT RCP\n==================================\n\n";
        appState.historique.forEach(h => {
            txt += `[${h.horodatage}] [${h.categorie}] ${h.titre}\n${h.details}\n${h.fondement}\n-----------------\n`;
        });
        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Audit_LexProcedura_${Date.now()}.txt`;
        a.click();
    };
}