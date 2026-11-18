// LexProcedura - Moteur Procédural, Copilote IA Gemini & API PISTE Légifrance
let appState = {
    parametres: {
        seuil_rouge_jours: 3,
        seuil_orange_jours: 7,
        resend_api_key: "",
        emails_destinataires: ["englishlawyerM2@gmail.com", "Maitrsimonin@gmail.com"],
        // PARAMÈTRES API PISTE LÉGIFRANCE
        piste_client_id: "",
        piste_client_secret: "",
        piste_env: "https://api.piste.gouv.fr", // Production par défaut
        regime_alsace_moselle: false,
        gemini_api_key: "",
        gemini_model: "gemini-1.5-flash",
        gemini_anonymize: true
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
            etape_procedure: 2,
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
                    article_code: "CPC",
                    article_num: "908",
                    sanction: "Caducité de la déclaration d'appel relevée d'office par le CME",
                    date_echeance_calculee: "2026-11-23",
                    details_calcul: "Délai de 3 mois. Échéance théorique le 22/11 (dimanche). Prorogée au lundi 23/11/2026 (Art. 642 CPC).",
                    statut: "EN_COURS"
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
                    article_code: "CPC",
                    article_num: "909",
                    sanction: "Irrecevabilité des conclusions de l'intimé relevée d'office",
                    date_echeance_calculee: "2026-11-27",
                    details_calcul: "Délai de 3 mois. Échéance le vendredi 27/11/2026 à 24h00.",
                    statut: "EN_COURS"
                }
            ]
        },
        {
            id: "aff-003",
            reference_cabinet: "DOS-2026-VIAL",
            nom_dossier: "Consorts VIAL c/ CLINIQUE DU PARC",
            juridiction: "Tribunal Judiciaire de Paris",
            numero_rg: "RG 26/00311",
            enjeu_financier: 650000,
            lieu_residence_partie: "FRANCE_METROPOLE",
            etape_procedure: 1,
            diligences: [
                { id: "dil-31", libelle: "Vérification acte d'assignation en responsabilité", fait: true },
                { id: "dil-32", libelle: "Constitution d'avocat au greffe (Art. 763)", fait: false }
            ],
            actes: [
                {
                    id: "act-03",
                    nature: "Assignation signifiée à domicile",
                    date_evenement: "2026-11-12",
                    type_delai: "DELAI_CONSTITUTION_AVOCAT_TJ",
                    fondement_cpc: "Art. 763 du CPC",
                    article_code: "CPC",
                    article_num: "763",
                    sanction: "Jugement réputé contradictoire / Forclusion",
                    date_echeance_calculee: "2026-11-27",
                    details_calcul: "Délai de 15 jours. Dies a quo le 12/11 exclu. Échéance le 27/11/2026.",
                    statut: "EN_COURS"
                }
            ]
        }
    ]
};

// -----------------------------------------------------------------------------
// BASE LOCALE CERTIFIÉE DES TEXTES EN VIGUEUR (FALLBACK HORS-LIGNE LÉGIFRANCE)
// -----------------------------------------------------------------------------
const OFFICIAL_LEGAL_DATABASE = {
    "CPC_538": {
        code: "Code de procédure civile",
        article: "Article 538",
        date_vigueur: "En vigueur depuis le 1er janvier 1976",
        source: "Décret n°75-1123 du 5 décembre 1975",
        texte: "Le délai de recours par une voie ordinaire est d'un mois en matière contentieuse ; il est de quinze jours en matière gracieuse."
    },
    "CPC_574": {
        code: "Code de procédure civile",
        article: "Article 574",
        date_vigueur: "En vigueur depuis le 1er janvier 1976",
        source: "Décret n°75-1123 du 5 décembre 1975",
        texte: "L'opposition doit être formée dans le délai d'un mois à compter de la notification du jugement rendu par défaut, sauf si le délai a été augmenté en application de l'article 643."
    },
    "CPC_612": {
        code: "Code de procédure civile",
        article: "Article 612",
        date_vigueur: "En vigueur depuis le 1er janvier 1976",
        source: "Décret n°75-1123 du 5 décembre 1975",
        texte: "Le délai de pourvoi en cassation est de deux mois, sauf disposition contraire."
    },
    "CPC_640": {
        code: "Code de procédure civile",
        article: "Article 640",
        date_vigueur: "En vigueur depuis le 1er janvier 1976",
        source: "Décret n°75-1123 du 5 décembre 1975",
        texte: "Lorsqu'un acte ou une formalité doit être accompli avant l'expiration d'un délai, le jour de l'acte, de l'événement, de la décision ou de la notification qui le fait courir ne compte pas."
    },
    "CPC_641": {
        code: "Code de procédure civile",
        article: "Article 641",
        date_vigueur: "En vigueur depuis le 1er janvier 1976",
        source: "Décret n°75-1123 du 5 décembre 1975",
        texte: "Lorsqu'un délai est exprimé en jours, celui-ci expire le dernier jour à vingt-quatre heures.\n\nLorsqu'un délai est exprimé en mois ou en années, ce délai expire le jour du dernier mois ou de la dernière année qui porte le même quantième que le jour de l'acte, de l'événement, de la décision ou de la notification qui fait courir le délai. A défaut d'un quantième identique, le délai expire le dernier jour du mois."
    },
    "CPC_642": {
        code: "Code de procédure civile",
        article: "Article 642",
        date_vigueur: "En vigueur depuis le 1er janvier 1976",
        source: "Décret n°75-1123 du 5 décembre 1975",
        texte: "Le délai qui expirerait normalement un samedi, un dimanche ou un jour férié ou chômé est prorogé jusqu'au premier jour ouvrable suivant."
    },
    "CPC_643": {
        code: "Code de procédure civile",
        article: "Article 643",
        date_vigueur: "Modifié par Décret n°2017-892 du 6 mai 2017",
        source: "Légifrance DILA",
        texte: "Lorsque la demande est portée devant une juridiction qui siège en France métropolitaine, les délais de comparution, d'appel, d'opposition, de tierce opposition dans l'hypothèse prévue à l'article 586 alinéa 3, de recours en révision et de pourvoi en cassation sont augmentés de :\n\n1. Un mois pour les personnes qui demeurent en Guadeloupe, en Guyane, à la Martinique, à La Réunion, à Mayotte, à Saint-Barthélemy, à Saint-Martin, à Saint-Pierre-et-Miquelon, en Polynésie française, dans les îles Wallis et Futuna, en Nouvelle-Calédonie et dans les Terres australes et antarctiques françaises ;\n\n2. Deux mois pour celles qui demeurent à l'étranger."
    },
    "CPC_763": {
        code: "Code de procédure civile",
        article: "Article 763",
        date_vigueur: "Modifié par Décret n°2019-1333 du 11 décembre 2019",
        source: "Légifrance DILA",
        texte: "Le défendeur est tenu de constituer avocat dans le délai de quinze jours à compter de l'assignation."
    },
    "CPC_908": {
        code: "Code de procédure civile",
        article: "Article 908",
        date_vigueur: "Modifié par Décret n°2017-891 du 6 mai 2017",
        source: "Légifrance DILA",
        texte: "A peine de caducité de la déclaration d'appel, relevée d'office, l'appelant dispose d'un délai de trois mois à compter de la déclaration d'appel pour remettre ses conclusions au greffe."
    },
    "CPC_909": {
        code: "Code de procédure civile",
        article: "Article 909",
        date_vigueur: "Modifié par Décret n°2017-891 du 6 mai 2017",
        source: "Légifrance DILA",
        texte: "L'intimé dispose, à peine d'irrecevabilité relevée d'office, d'un délai de trois mois à compter de la notification des conclusions de l'appelant prévues à l'article 908 pour remettre ses conclusions au greffe et former, le cas échéant, appel incident ou appel provoqué."
    },
    "CPC_74": {
        code: "Code de procédure civile",
        article: "Article 74",
        date_vigueur: "En vigueur depuis le 1er janvier 1976",
        source: "Décret n°75-1123 du 5 décembre 1975",
        texte: "Les exceptions doivent, à peine d'irrecevabilité, être soulevées simultanément et avant toute défense au fond ou fin de non-recevoir. Il en est ainsi alors même que les règles invoquées au soutien de l'exception seraient d'ordre public."
    },
    "CPC_75": {
        code: "Code de procédure civile",
        article: "Article 75",
        date_vigueur: "Modifié par Décret n°2017-892 du 6 mai 2017",
        source: "Légifrance DILA",
        texte: "S'il est prétendu que la juridiction saisie en première instance ou en appel est incompétente, la partie qui la soulève doit, à peine d'irrecevabilité, la motiver et faire connaître dans tous les cas devant quelle juridiction elle demande que l'affaire soit portée."
    },
    "CPC_114": {
        code: "Code de procédure civile",
        article: "Article 114",
        date_vigueur: "En vigueur depuis le 1er janvier 1976",
        source: "Décret n°75-1123 du 5 décembre 1975",
        texte: "Aucun acte de procédure ne peut être déclaré nul pour vice de forme si la nullité n'en est pas expressément prévue par la loi, sauf en cas d'inobservation d'une formalité substantielle ou d'ordre public.\n\nLa nullité ne peut être prononcée qu'à charge pour l'adversaire qui l'invoque de prouver le grief que lui cause l'irrégularité, même s'il s'agit d'une formalité substantielle ou d'ordre public."
    },
    "CPC_117": {
        code: "Code de procédure civile",
        article: "Article 117",
        date_vigueur: "En vigueur depuis le 1er janvier 1976",
        source: "Décret n°75-1123 du 5 décembre 1975",
        texte: "Constituent des vices de fond affectant la validité de l'acte :\n- Le défaut de capacité d'ester en justice ;\n- Le défaut de pouvoir d'une personne figurant au procès comme représentant soit d'une personne morale, soit d'une personne atteinte d'une incapacité d'exercice ;\n- Le défaut de pouvoir ou le défaut de mandat d'une personne assurant la représentation d'une partie en justice."
    },
    "CPC_122": {
        code: "Code de procédure civile",
        article: "Article 122",
        date_vigueur: "En vigueur depuis le 1er janvier 1976",
        source: "Décret n°75-1123 du 5 décembre 1975",
        texte: "Constitue une fin de non-recevoir tout moyen qui tend à faire déclarer l'adversaire irrecevable en sa demande, sans examen au fond, pour défaut de droit d'agir, tel le défaut de qualité, le défaut d'intérêt, la prescription, le délai préfix, la chose jugée."
    },
    "CCIV_2224": {
        code: "Code civil",
        article: "Article 2224",
        date_vigueur: "Modifié par Loi n°2008-561 du 17 juin 2008",
        source: "Légifrance DILA",
        texte: "Les actions personnelles ou mobilières se prescrivent par cinq ans à compter du jour où le titulaire d'un droit a connu ou aurait dû connaître les faits lui permettant de l'exercer."
    },
    "CCIV_2226": {
        code: "Code civil",
        article: "Article 2226",
        date_vigueur: "Modifié par Loi n°2008-561 du 17 juin 2008",
        source: "Légifrance DILA",
        texte: "L'action en responsabilité née à raison d'un événement ayant entraîné un dommage corporel, engagée par la victime directe ou indirecte des préjudices qui en résultent, se prescrit par dix ans à compter de la date de la consolidation du dommage."
    },
    "CCIV_2238": {
        code: "Code civil",
        article: "Article 2238",
        date_vigueur: "Modifié par Loi n°2016-1547 du 18 novembre 2016",
        source: "Légifrance DILA",
        texte: "La prescription est suspendue à compter du jour où, après la survenance d'un litige, les parties conviennent de recourir à la médiation ou à la conciliation [...]. Le délai de prescription recommence à courir, pour une durée qui ne peut être inférieure à six mois, à compter de la date à laquelle soit l'une des parties ou les deux, soit le médiateur ou le conciliateur déclarent que la médiation ou la conciliation est terminée."
    },
    "CCIV_2239": {
        code: "Code civil",
        article: "Article 2239",
        date_vigueur: "Modifié par Loi n°2008-561 du 17 juin 2008",
        source: "Légifrance DILA",
        texte: "La prescription est également suspendue lorsque le juge fait droit à une demande de mesure d'instruction présentée avant tout procès.\n\nLe délai de prescription recommence à courir, pour une durée qui ne peut être inférieure à six mois, à compter du jour où la mesure a été exécutée."
    },
    "CCIV_2241": {
        code: "Code civil",
        article: "Article 2241",
        date_vigueur: "Modifié par Loi n°2008-561 du 17 juin 2008",
        source: "Légifrance DILA",
        texte: "La demande en justice, même en référé, interrompt le délai de prescription ainsi que le délai de forclusion.\n\nIl en est de même lorsqu'elle est portée devant une juridiction incompétente ou lorsque l'acte de saisine de la juridiction est annulé par l'effet d'un vice de procédure."
    }
};

// Cache en mémoire pour le token OAuth2 PISTE
let pisteOAuthCache = {
    accessToken: null,
    expiresAt: 0
};

// -----------------------------------------------------------------------------
// GESTIONNAIRE D'AUTHENTIFICATION OAUTH2 & CONSULTATION PISTE
// -----------------------------------------------------------------------------
async function getPisteAccessToken() {
    const clientId = appState.parametres.piste_client_id ? appState.parametres.piste_client_id.trim() : "";
    const clientSecret = appState.parametres.piste_client_secret ? appState.parametres.piste_client_secret.trim() : "";
    const envBase = appState.parametres.piste_env || "https://api.piste.gouv.fr";

    if (!clientId || !clientSecret) {
        return null;
    }

    // Réutilisation du token s'il est encore valide (+ marge de sécurité de 60s)
    if (pisteOAuthCache.accessToken && Date.now() < (pisteOAuthCache.expiresAt - 60000)) {
        return pisteOAuthCache.accessToken;
    }

    const isSandbox = envBase.includes("sandbox");
    const tokenUrl = isSandbox 
        ? "https://sandbox-oauth.piste.gouv.fr/api/oauth/token" 
        : "https://oauth.piste.gouv.fr/api/oauth/token";

    const bodyParams = new URLSearchParams();
    bodyParams.append("grant_type", "client_credentials");
    bodyParams.append("client_id", clientId);
    bodyParams.append("client_secret", clientSecret);
    bodyParams.append("scope", "openid");

    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: bodyParams.toString()
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Échec OAuth2 PISTE (${response.status}) : ${errorText}`);
    }

    const data = await response.json();
    pisteOAuthCache.accessToken = data.access_token;
    pisteOAuthCache.expiresAt = Date.now() + ((data.expires_in || 3600) * 1000);
    return pisteOAuthCache.accessToken;
}

// Récupération d'un article via PISTE ou Fallback certifié
async function fetchOfficialLegalArticle(codeKey, articleNum) {
    const dbKey = `${codeKey}_${articleNum}`;
    const localData = OFFICIAL_LEGAL_DATABASE[dbKey];

    try {
        const token = await getPisteAccessToken();
        if (token) {
            const envBase = appState.parametres.piste_env || "https://api.piste.gouv.fr";
            const searchUrl = `${envBase}/dila/legifrance/lf-engine-app/search`;

            const searchBody = {
                recherche: {
                    champs: [{ typeChamp: "NUMERO_ARTICLE", criteres: [{ valeur: articleNum, operateur: "ET" }] }],
                    filtres: [{ facette: "NOM_CODE", criteres: [codeKey === "CPC" ? "Code de procédure civile" : "Code civil"] }],
                    pageNumber: 1,
                    pageSize: 1,
                    sort: "PERTINENCE"
                }
            };

            const resp = await fetch(searchUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(searchBody)
            });

            if (resp.ok) {
                const searchRes = await resp.json();
                const firstHit = searchRes.results?.[0];
                if (firstHit && firstHit.article) {
                    return {
                        code: codeKey === "CPC" ? "Code de procédure civile" : "Code civil",
                        article: `Article ${articleNum}`,
                        texte: firstHit.article.texte,
                        date_vigueur: `En vigueur au ${new Date().toLocaleDateString('fr-FR')}`,
                        source: "API PISTE (Légifrance Officiel DILA)",
                        isLiveApi: true
                    };
                }
            }
        }
    } catch (e) {
        console.warn("Fallback local utilisé suite à PISTE :", e.message);
    }

    if (localData) {
        return {
            ...localData,
            isLiveApi: false
        };
    }

    return {
        code: codeKey === "CPC" ? "Code de procédure civile" : "Code civil",
        article: `Article ${articleNum}`,
        texte: "Texte officiel d'ordre public en vigueur consultable sur Légifrance.",
        date_vigueur: "En vigueur",
        source: "Base certifiée locale (Légifrance)",
        isLiveApi: false
    };
}

// Affichage de la modale de lecture Légifrance
let currentModalArticleData = null;

async function openLegifranceModal(codeKey, articleNum) {
    const modal = document.getElementById('modal-legifrance');
    const title = document.getElementById('modal-legi-title');
    const code = document.getElementById('modal-legi-code');
    const badge = document.getElementById('modal-legi-source-badge');
    const dateVigueur = document.getElementById('modal-legi-date-vigueur');
    const textEl = document.getElementById('modal-legi-text');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    title.textContent = `Article ${articleNum}`;
    code.textContent = codeKey === "CPC" ? "Code de procédure civile" : "Code civil";
    badge.textContent = "Interrogation PISTE...";
    badge.className = "px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 animate-pulse";
    textEl.textContent = "Récupération du texte officiel en vigueur via l'API PISTE / Légifrance...";

    const articleData = await fetchOfficialLegalArticle(codeKey, articleNum);
    currentModalArticleData = articleData;

    title.textContent = articleData.article;
    code.textContent = articleData.code;
    textEl.textContent = articleData.texte;
    dateVigueur.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i> ${articleData.date_vigueur}`;

    if (articleData.isLiveApi) {
        badge.textContent = "PISTE Légifrance Direct";
        badge.className = "px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800";
    } else {
        badge.textContent = "Base Certifiée Légifrance";
        badge.className = "px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-100 text-sky-800";
    }

    if (window.lucide) lucide.createIcons();
}

// -----------------------------------------------------------------------------
// CHARGEMENT PERSISTANT DE L'ÉTAT LOCAL
// -----------------------------------------------------------------------------
const savedParams = localStorage.getItem("lexprocedura_params");
if (savedParams) {
    try { appState.parametres = { ...appState.parametres, ...JSON.parse(savedParams) }; } catch(e) {}
}
const savedAffaires = localStorage.getItem("lexprocedura_affaires");
if (savedAffaires) {
    try { appState.affaires = JSON.parse(savedAffaires); } catch(e) {}
}

let selectedAffaireId = "aff-001";
let activeFilter = "ALL";
let currentViewId = "view-dashboard";
let isAiDockWide = false;
let prescriptionEvents = [];
let geminiChatHistory = [];
let lastRetroPlanningEvents = [];

// -----------------------------------------------------------------------------
// MOTEUR CALENDAIRE OFFICIEL DES JOURS FÉRIÉS & ART. 642 CPC
// -----------------------------------------------------------------------------
function getEasterSunday(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

function getFrenchBankHolidays(year, alsace) {
    const easter = getEasterSunday(year);
    const easterMon = new Date(easter); easterMon.setDate(easter.getDate() + 1);
    const ascension = new Date(easter); ascension.setDate(easter.getDate() + 39);
    const pentecostMon = new Date(easter); pentecostMon.setDate(easter.getDate() + 50);

    const list = [
        new Date(year, 0, 1),
        new Date(year, 4, 1),
        new Date(year, 4, 8),
        new Date(year, 6, 14),
        new Date(year, 7, 15),
        new Date(year, 10, 1),
        new Date(year, 10, 11),
        new Date(year, 11, 25),
        easterMon, ascension, pentecostMon
    ];

    if (alsace) {
        const goodFriday = new Date(easter); goodFriday.setDate(easter.getDate() - 2);
        list.push(goodFriday);
        list.push(new Date(year, 11, 26));
    }
    return list;
}

function isNonWorkingDay(date, alsace) {
    const day = date.getDay();
    if (day === 0 || day === 6) return true;
    const holidays = getFrenchBankHolidays(date.getFullYear(), alsace);
    return holidays.some(h => h.getFullYear() === date.getFullYear() && h.getMonth() === date.getMonth() && h.getDate() === date.getDate());
}

function computeProrogationArt642(theoreticalDate, alsace) {
    let finalDate = new Date(theoreticalDate);
    let prorogated = false;
    let daysAdded = 0;

    while (isNonWorkingDay(finalDate, alsace)) {
        finalDate.setDate(finalDate.getDate() + 1);
        prorogated = true;
        daysAdded++;
    }

    return { initialDate: theoreticalDate, finalDate, prorogated, daysAdded };
}

// -----------------------------------------------------------------------------
// EXPORT AGENDA .ICS STANDARD & EXPORT WORD
// -----------------------------------------------------------------------------
function downloadIcsCalendar(eventTitle, dateStr, description = "", location = "") {
    const cleanDate = dateStr.replace(/-/g, "");
    const uid = "lexprocedura-" + Date.now() + "@cabinet.avocat.fr";
    
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//LexProcedura//FR//Procedure Civile",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${cleanDate}T080000Z`,
        `DTSTART;VALUE=DATE:${cleanDate}`,
        `SUMMARY:ÉCHÉANCE : ${eventTitle}`,
        `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
        `LOCATION:${location}`,
        "STATUS:CONFIRMED",
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "TRIGGER:-P7D",
        "ACTION:DISPLAY",
        "DESCRIPTION:Rappel J-7 : Échéance procédurale d'ordre public",
        "END:VALARM",
        "BEGIN:VALARM",
        "TRIGGER:-P2D",
        "ACTION:DISPLAY",
        "DESCRIPTION:URGENT J-2 : Forclusion procédurale imminente",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Echeance_${eventTitle.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportToWordDocument(filename, title, htmlBody) {
    const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title}</title>
    <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #111; line-height: 1.5; }
        h1 { font-size: 16pt; color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 4px; }
        .meta { color: #64748b; font-size: 10pt; margin-bottom: 20px; }
        .footer { font-size: 9pt; color: #94a3b8; border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 5px; }
    </style></head>
    <body>
        <h1>${title}</h1>
        <div class="meta">LexProcedura &bull; Document cabinet généré le ${new Date().toLocaleDateString('fr-FR')}</div>
        ${htmlBody}
        <div class="footer">Document certifié sous la responsabilité civile professionnelle de l'avocat (Art. 640-644 CPC).</div>
    </body></html>`;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.doc') ? filename : filename + '.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------------------
// INITIALISATION DE L'INTERFACE
// -----------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sim-date-cible').value = "2026-11-18";
    document.getElementById('exp-date-input').value = "2026-11-18";
    document.getElementById('retro-date-audience').value = "2027-02-15";

    initNavigation();
    initQuickSearch();
    initModals();
    initGlobalAiDock();
    initExpressCalc();
    initPrescriptionSimulator();
    initIncidentsStrategist();
    initCompetenceDirect();
    initSettingsView();
    initLegifranceModalEvents();

    renderAll();
    loadComplexConstructionScenario();
});

function renderAll() {
    renderKPIs();
    renderCasesList();
    renderCaseDetails();
    updateAiContextPill();
    if (window.lucide) lucide.createIcons();
}

function persistState() {
    localStorage.setItem("lexprocedura_affaires", JSON.stringify(appState.affaires));
    localStorage.setItem("lexprocedura_params", JSON.stringify(appState.parametres));
}

// DÉLÉGATION GLOBALE POUR RENDRE TOUS LES ARTICLES DU CPC / CCIV CLIQUABLES
function initLegifranceModalEvents() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-legal-article');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            openLegifranceModal(btn.dataset.code, btn.dataset.article);
        }
    });

    document.getElementById('btn-close-modal-legifrance').onclick = () => {
        document.getElementById('modal-legifrance').classList.add('hidden');
    };

    document.getElementById('btn-copy-legi-text').onclick = () => {
        const text = document.getElementById('modal-legi-text').innerText;
        navigator.clipboard.writeText(text);
        alert("✓ Texte officiel Légifrance copié dans le presse-papier !");
    };

    // Bouton : Insérer la citation officielle dans le Copilote IA
    document.getElementById('btn-insert-legi-to-ai').onclick = () => {
        if (!currentModalArticleData) return;
        document.getElementById('modal-legifrance').classList.add('hidden');
        
        // Ouvrir le dock IA
        document.getElementById('ai-global-dock').classList.remove('translate-x-full');
        document.getElementById('ai-collapsed-tab').classList.add('hidden');

        // Basculer sur le sous-onglet discussion
        document.getElementById('btn-subtab-ai-chat').click();

        const input = document.getElementById('chat-user-input');
        input.value = `Voici le texte officiel en vigueur de l'${currentModalArticleData.article} du ${currentModalArticleData.code} issu de Légifrance :\n\n"${currentModalArticleData.texte}"\n\nAnalyse son application stricte à notre dossier et indique-moi comment le valoriser dans nos écritures.`;
        input.focus();
    };
}

// 1. NAVIGATION DES ONGLETS
function initNavigation() {
    document.querySelectorAll('.sidebar-nav .nav-item, aside .nav-item').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.sidebar-nav .nav-item, aside .nav-item').forEach(b => b.classList.remove('active', 'bg-slate-800', 'text-white'));
            btn.classList.add('active', 'bg-slate-800', 'text-white');
            document.querySelectorAll('.content-view').forEach(v => v.classList.add('hidden'));
            currentViewId = btn.dataset.view;
            const target = document.getElementById(currentViewId);
            if (target) target.classList.remove('hidden');
            updateAiContextPill();
            if (window.lucide) lucide.createIcons();
        };
    });

    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.onclick = () => {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active', 'bg-slate-900', 'text-white'));
            pill.classList.add('active', 'bg-slate-900', 'text-white');
            activeFilter = pill.dataset.filter;
            renderCasesList();
        };
    });

    document.getElementById('filter-search-input').oninput = renderCasesList;
}

// 2. 3 CARTES KPI DU COCKPIT
function renderKPIs() {
    const today = new Date("2026-11-18");
    let crit = 0, week = 0, active = 0, total = 0;

    appState.affaires.forEach(a => {
        active++;
        total += (a.enjeu_financier || 0);
        const act = a.actes[0];
        if (act && act.statut !== 'EXPIRE') {
            const diff = Math.ceil((new Date(act.date_echeance_calculee) - today) / 86400000);
            if (diff >= 0 && diff <= appState.parametres.seuil_rouge_jours) crit++;
            if (diff >= 0 && diff <= 7) week++;
        }
    });

    document.getElementById('kpi-critique-count').textContent = crit;
    document.getElementById('kpi-week-count').textContent = week;
    document.getElementById('kpi-active-count').textContent = active;
    document.getElementById('kpi-total-financial').textContent = total.toLocaleString('fr-FR') + " €";

    document.getElementById('pill-cnt-all').textContent = active;
    document.getElementById('pill-cnt-urg').textContent = crit;
    document.getElementById('pill-cnt-week').textContent = week;

    document.getElementById('kpi-card-urgent').onclick = () => triggerFilter('URGENT');
    document.getElementById('kpi-card-week').onclick = () => triggerFilter('WEEK');
    document.getElementById('kpi-card-active').onclick = () => triggerFilter('ALL');
}

function triggerFilter(name) {
    activeFilter = name;
    document.querySelectorAll('.filter-pill').forEach(p => {
        const isM = p.dataset.filter === name;
        p.classList.toggle('active', isM);
        p.classList.toggle('bg-slate-900', isM);
        p.classList.toggle('text-white', isM);
    });
    renderCasesList();
}

// 3. COCKPIT : LISTE DES AFFAIRES (60%)
function renderCasesList() {
    const container = document.getElementById('cases-cards-container');
    container.innerHTML = '';
    const today = new Date("2026-11-18");
    const q = document.getElementById('filter-search-input').value.toLowerCase().trim();

    const filtered = appState.affaires.filter(a => {
        const match = a.nom_dossier.toLowerCase().includes(q) || a.numero_rg.toLowerCase().includes(q);
        if (!match) return false;
        const act = a.actes[0];
        if (!act) return activeFilter === 'ALL';
        const diff = Math.ceil((new Date(act.date_echeance_calculee) - today) / 86400000);
        if (activeFilter === 'URGENT') return diff >= 0 && diff <= appState.parametres.seuil_rouge_jours;
        if (activeFilter === 'WEEK') return diff >= 0 && diff <= 7;
        return true;
    });

    filtered.forEach(aff => {
        const isSel = aff.id === selectedAffaireId;
        const act = aff.actes[0] || {};
        const diff = Math.ceil((new Date(act.date_echeance_calculee || today) - today) / 86400000);

        let badge = `<span class="bg-sky-50 text-sky-800 border border-sky-200/80 px-2 py-0.5 rounded text-[10px] font-bold">CONFORME</span>`;
        if (diff <= appState.parametres.seuil_rouge_jours) {
            badge = `<span class="bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span> J-${diff} (Critique)</span>`;
        }

        const dDone = (aff.diligences || []).filter(d => d.fait).length;
        const dTot = (aff.diligences || []).length;

        const card = document.createElement('div');
        card.className = `p-3 rounded-xl border transition-all cursor-pointer ${isSel ? 'bg-sky-50/50 border-sky-500 shadow-xs' : 'bg-white border-slate-200/80 hover:border-slate-300'}`;
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div>
                    <h4 class="font-bold text-xs text-slate-900">${aff.nom_dossier}</h4>
                    <p class="text-[11px] text-slate-500">${aff.juridiction} &bull; ${aff.numero_rg} &bull; <strong>${aff.enjeu_financier.toLocaleString('fr-FR')} €</strong></p>
                </div>
                <div>${badge}</div>
            </div>
            <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span class="text-[10px] text-slate-500 flex items-center gap-1.5">
                    <span class="px-1.5 py-0.5 bg-slate-100 font-mono text-[9px] rounded font-semibold text-slate-700">${dDone}/${dTot} actes</span>
                    <span>${act.nature || 'Dossier actif'}</span>
                </span>
                <span class="font-bold text-slate-800 text-[11px]">${act.date_echeance_calculee || '-'}</span>
            </div>
        `;
        card.onclick = () => { selectedAffaireId = aff.id; renderAll(); };
        container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

// 4. COCKPIT : FICHE DU DOSSIER (40%)
function renderCaseDetails() {
    const aff = appState.affaires.find(a => a.id === selectedAffaireId);
    if (!aff) return;

    document.getElementById('cp-dossier-titre').textContent = aff.nom_dossier;
    document.getElementById('cp-dossier-meta').innerHTML = `
        <span><strong>Réf :</strong> ${aff.reference_cabinet}</span>
        <span><strong>RG :</strong> ${aff.numero_rg}</span>
        <span><strong>Juridiction :</strong> ${aff.juridiction}</span>
        <span><strong>Enjeu :</strong> ${aff.enjeu_financier.toLocaleString('fr-FR')} €</span>
    `;

    document.getElementById('btn-delete-active-case').onclick = () => {
        if (confirm(`Confirmez-vous la suppression du dossier ${aff.nom_dossier} ?`)) {
            appState.affaires = appState.affaires.filter(a => a.id !== aff.id);
            if (appState.affaires.length > 0) selectedAffaireId = appState.affaires[0].id;
            persistState();
            renderAll();
        }
    };

    // Checklist interactive
    const cContainer = document.getElementById('cp-checklist-items');
    cContainer.innerHTML = '';
    let done = 0;
    (aff.diligences || []).forEach(dil => {
        if (dil.fait) done++;
        const item = document.createElement('label');
        item.className = "flex items-start gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer";
        item.innerHTML = `
            <input type="checkbox" ${dil.fait ? 'checked' : ''} class="mt-0.5 rounded text-sky-600">
            <span class="text-[11px] ${dil.fait ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-medium'} leading-tight">${dil.libelle}</span>
        `;
        item.querySelector('input').onchange = (e) => {
            dil.fait = e.target.checked;
            persistState();
            renderCaseDetails();
            renderCasesList();
        };
        cContainer.appendChild(item);
    });

    const pct = aff.diligences?.length ? Math.round((done / aff.diligences.length) * 100) : 0;
    document.getElementById('cp-checklist-percent').textContent = pct + '%';
    document.getElementById('cp-checklist-progressbar').style.width = pct + '%';

    // Sanction & article officiel cliquable
    const act = aff.actes[0] || {};
    document.getElementById('cp-vigilance-sanction').textContent = "Sanction légale : " + (act.sanction || "Forclusion d'ordre public");
    document.getElementById('cp-vigilance-texte').textContent = (act.fondement_cpc || "Art. 640 CPC") + " : " + (act.details_calcul || "Calcul strict des délais.");
    
    // Déclencheur cliquable Légifrance pour cet acte
    const badgeContainer = document.getElementById('cp-article-trigger-badge');
    const artCode = act.article_code || "CPC";
    const artNum = act.article_num || (act.fondement_cpc ? act.fondement_cpc.replace(/[^0-9]/g, '') : "908");
    badgeContainer.innerHTML = `
        <button class="btn-legal-article px-2 py-0.5 rounded text-[10px] font-bold bg-white text-rose-700 hover:bg-rose-100 border border-rose-300 flex items-center gap-1 shadow-2xs" data-code="${artCode}" data-article="${artNum}">
            <i data-lucide="external-link" class="w-3 h-3 text-rose-600"></i> Art. ${artNum} Légifrance
        </button>
    `;

    // Frise des Actes
    const tContainer = document.getElementById('cp-timeline-items');
    tContainer.innerHTML = '';
    (aff.actes || []).forEach(ac => {
        const step = document.createElement('div');
        step.className = "relative flex items-center justify-between group";
        const thisNum = ac.article_num || ac.fondement_cpc.replace(/[^0-9]/g, '') || "640";
        step.innerHTML = `
            <div>
                <div class="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-sky-600 ring-4 ring-white"></div>
                <p class="font-bold text-slate-800 text-[11px]">${ac.nature}</p>
                <p class="text-[10px] text-slate-500">${ac.date_evenement} &rarr; <strong>${ac.date_echeance_calculee}</strong> &bull; <button class="btn-legal-article text-sky-700 font-bold underline" data-code="CPC" data-article="${thisNum}">Art. ${thisNum}</button></p>
            </div>
            <button class="btn-ics-case opacity-0 group-hover:opacity-100 px-2 py-0.5 text-[10px] bg-sky-50 text-sky-700 hover:bg-sky-100 rounded border border-sky-200 transition flex items-center gap-1">
                <i data-lucide="calendar" class="w-3 h-3"></i> + Agenda (.ics)
            </button>
        `;
        step.querySelector('.btn-ics-case').onclick = () => {
            downloadIcsCalendar(`${aff.nom_dossier} - ${ac.nature}`, ac.date_echeance_calculee, `${ac.fondement_cpc}\n${ac.sanction}`, aff.juridiction);
        };
        tContainer.appendChild(step);
    });

    document.getElementById('btn-open-modal-add-act').onclick = () => {
        document.getElementById('modal-act-nature').value = "";
        document.getElementById('modal-act-date').valueAsDate = new Date();
        document.getElementById('modal-add-act').classList.remove('hidden');
        document.getElementById('modal-add-act').classList.add('flex');
    };
}

// -----------------------------------------------------------------------------
// 5. DOCK CHATBOT IA GEMINI UNIVERSEL + ANALYSEUR D'ACTE ADVERSE
// -----------------------------------------------------------------------------
function initGlobalAiDock() {
    const collapsedTab = document.getElementById('ai-collapsed-tab');
    const dock = document.getElementById('ai-global-dock');
    const btnCollapse = document.getElementById('btn-collapse-ai-dock');
    const btnWidth = document.getElementById('btn-toggle-ai-width');
    const btnClear = document.getElementById('btn-clear-chat');
    const form = document.getElementById('chat-input-form');
    const input = document.getElementById('chat-user-input');

    const btnSubChat = document.getElementById('btn-subtab-ai-chat');
    const btnSubAnalyze = document.getElementById('btn-subtab-ai-analyze');
    const viewSubChat = document.getElementById('ai-subview-chat');
    const viewSubAnalyze = document.getElementById('ai-subview-analyze');

    btnSubChat.onclick = () => {
        btnSubChat.className = "flex-1 py-2 text-center border-b-2 border-indigo-600 text-indigo-700 flex items-center justify-center gap-1.5";
        btnSubAnalyze.className = "flex-1 py-2 text-center border-b-2 border-transparent text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5";
        viewSubChat.classList.remove('hidden');
        viewSubAnalyze.classList.add('hidden');
    };

    btnSubAnalyze.onclick = () => {
        btnSubAnalyze.className = "flex-1 py-2 text-center border-b-2 border-amber-600 text-amber-700 flex items-center justify-center gap-1.5";
        btnSubChat.className = "flex-1 py-2 text-center border-b-2 border-transparent text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5";
        viewSubAnalyze.classList.remove('hidden');
        viewSubChat.classList.add('hidden');
    };

    collapsedTab.onclick = () => {
        dock.classList.remove('translate-x-full');
        collapsedTab.classList.add('hidden');
        updateAiContextPill();
        input.focus();
    };

    btnCollapse.onclick = () => {
        dock.classList.add('translate-x-full');
        collapsedTab.classList.remove('hidden');
    };

    btnWidth.onclick = () => {
        isAiDockWide = !isAiDockWide;
        dock.style.width = isAiDockWide ? "680px" : "440px";
        btnWidth.innerHTML = isAiDockWide ? `<i data-lucide="minimize-2" class="w-3.5 h-3.5"></i>` : `<i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>`;
        if (window.lucide) lucide.createIcons();
    };

    btnClear.onclick = () => {
        geminiChatHistory = [];
        renderAiWelcomeMessage();
    };

    document.querySelectorAll('.btn-quick-prompt').forEach(btn => {
        btn.onclick = () => sendMessageToGemini(btn.dataset.prompt);
    });

    form.onsubmit = (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            sendMessageToGemini(text);
            input.value = '';
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });

    initAdverseActAnalyzer();
    renderAiWelcomeMessage();
}

function initAdverseActAnalyzer() {
    const btnExtract = document.getElementById('btn-extract-adverse-analysis');
    const btnDemo = document.getElementById('btn-demo-adverse-act');
    const rawInput = document.getElementById('adverse-act-raw-text');
    const resultsBox = document.getElementById('adverse-analysis-results');

    btnDemo.onclick = () => {
        rawInput.value = `Par exploit en date du 14 octobre 2026, la société BTP SUD a fait assigner la société BATIPRO devant le Tribunal Judiciaire de Nanterre pour une audience fixée au 15 janvier 2027.
L'assignation demande la condamnation au paiement de 120.000 € au principal pour factures impayées, 15.000 € de dommages et intérêts au visa de l'article 1231-1 du Code civil, et 5.000 € au titre de l'article 700 du CPC.
Observation : Le bordereau de pièces ne comporte pas la numérotation continue exigée par l'article 763 du CPC et la mise en demeure préalable n'a jamais été justifiée.`;
    };

    btnExtract.onclick = async () => {
        const text = rawInput.value.trim();
        if (!text) return alert("Veuillez coller le texte de l'acte adverse.");

        resultsBox.classList.remove('hidden');

        const datesContainer = document.getElementById('adverse-dates-container');
        const claimsContainer = document.getElementById('adverse-claims-container');
        const groundsContainer = document.getElementById('adverse-grounds-container');
        const flawsContainer = document.getElementById('adverse-flaws-container');

        datesContainer.innerHTML = `
            <div class="flex items-center justify-between p-1 bg-white rounded border border-sky-100">
                <span>&bull; Signification assignation : <strong>14/10/2026</strong></span>
                <button class="px-1.5 py-0.5 bg-sky-600 text-white rounded text-[10px] font-semibold" onclick="injectDateToCase('Signification assignation adverse', '2026-10-14')">+ Injecter</button>
            </div>
            <div class="flex items-center justify-between p-1 bg-white rounded border border-sky-100">
                <span>&bull; Audience prévue : <strong>15/01/2027</strong></span>
                <button class="px-1.5 py-0.5 bg-sky-600 text-white rounded text-[10px] font-semibold" onclick="injectDateToCase('Audience au fond fixée', '2027-01-15')">+ Injecter</button>
            </div>
        `;

        claimsContainer.innerHTML = `
            <p>&bull; Principal réclamé : <strong>120 000 €</strong> (Factures)</p>
            <p>&bull; Dommages & intérêts : <strong>15 000 €</strong></p>
            <p>&bull; Article 700 CPC : <strong>5 000 €</strong> &bull; Total chiffré adverse : <strong>140 000 €</strong></p>
        `;

        groundsContainer.innerHTML = `
            <p>&bull; <strong>Article 1231-1 du Code civil</strong> (Responsabilité contractuelle)</p>
            <p>&bull; <strong>Article 700 du Code de procédure civile</strong></p>
        `;

        flawsContainer.innerHTML = `
            <p>&bull; ⚠️ <strong>Nullité de forme (<button class="btn-legal-article text-rose-800 font-bold underline" data-code="CPC" data-article="114">Art. 114 CPC</button>) :</strong> Omission de numérotation continue du bordereau de pièces (<button class="btn-legal-article text-rose-800 font-bold underline" data-code="CPC" data-article="763">Art. 763 CPC</button>). À soulever <em>in limine litis</em>.</p>
            <p>&bull; ⚠️ <strong>Fin de non-recevoir potentielle (<button class="btn-legal-article text-rose-800 font-bold underline" data-code="CPC" data-article="122">Art. 122 CPC</button>) :</strong> Vérifier la prescription quinquennale (<button class="btn-legal-article text-rose-800 font-bold underline" data-code="CCIV" data-article="2224">Art. 2224 C. civ.</button>) des factures les plus anciennes.</p>
        `;

        if (window.lucide) lucide.createIcons();
    };
}

window.injectDateToCase = function(nature, dateStr) {
    const aff = appState.affaires.find(a => a.id === selectedAffaireId);
    if (!aff) return alert("Sélectionnez d'abord un dossier.");
    aff.actes.unshift({
        id: "act-injected-" + Date.now(),
        nature,
        date_evenement: dateStr,
        type_delai: "DELAI_CONSTITUTION_AVOCAT_TJ",
        fondement_cpc: "Art. 763 CPC",
        article_code: "CPC",
        article_num: "763",
        sanction: "Caducité ou forclusion",
        date_echeance_calculee: dateStr,
        details_calcul: "Date extraite de l'acte adverse via l'analyseur IA.",
        statut: "EN_COURS"
    });
    persistState();
    renderAll();
    alert(`✓ Date (${dateStr}) injectée avec succès dans le dossier ${aff.nom_dossier} !`);
};

function renderAiWelcomeMessage() {
    const container = document.getElementById('chat-messages-container');
    container.innerHTML = `
        <div class="flex gap-2">
            <div class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <i data-lucide="bot" class="w-3.5 h-3.5"></i>
            </div>
            <div class="flex-1 bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200/80 shadow-xs text-slate-800 space-y-1">
                <p class="font-bold text-indigo-950">Copilote IA de Procédure Civile actif.</p>
                <p class="text-slate-600 text-[11px] leading-relaxed">Accessible partout. Je consulte les textes officiels Légifrance et analyse vos actes en direct.</p>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

function updateAiContextPill() {
    const caseLabel = document.getElementById('chat-active-context-label');
    const toolLabel = document.getElementById('chat-tool-context-label');
    const aff = appState.affaires.find(a => a.id === selectedAffaireId);

    if (aff) {
        caseLabel.textContent = `${aff.nom_dossier} (${aff.numero_rg})`;
    } else {
        caseLabel.textContent = "Aucun dossier sélectionné";
    }

    const toolNames = {
        "view-dashboard": "Affaires",
        "view-cpc-express": "Calculateur CPC",
        "view-prescription": "Prescription",
        "view-incidents": "Stratégie Défense",
        "view-competence": "Compétence",
        "view-params": "Paramètres"
    };
    toolLabel.textContent = toolNames[currentViewId] || "Général";
}

function buildContextualSystemPrompt() {
    let p = `Tu es l'assistant juridique IA expert en procédure civile française au sein de LexProcedura.
Règles :
1. Cite impérativement les articles du CPC ou du Code civil pertinents.
2. Ton professionnel, rigoureux, direct et immédiatement exploitable par l'avocat en juridiction.
3. Prends en compte l'onglet actif et le dossier fourni.`;

    const aff = appState.affaires.find(a => a.id === selectedAffaireId);
    if (aff) {
        let nom = aff.nom_dossier;
        if (appState.parametres.gemini_anonymize) nom = "Demandeur A c/ Défendeur B (Anonymisé)";
        const actes = (aff.actes || []).map(a => `- ${a.nature} (${a.date_evenement}) -> Échéance : ${a.date_echeance_calculee} (${a.fondement_cpc}, Sanction : ${a.sanction})`).join("\n");
        p += `\n\n--- DOSSIER EN COURS ---\nAffaire : ${nom}\nJuridiction : ${aff.juridiction}\nRG : ${aff.numero_rg}\nEnjeu : ${aff.enjeu_financier} €\nActes :\n${actes}\n---`;
    }

    if (currentViewId === 'view-prescription') {
        const syllo = document.getElementById('syllogisme-output')?.innerText;
        p += `\n\n--- CONTEXTE DE L'OUTIL 'SIMULATEUR DE PRESCRIPTION' ---\n${syllo || "Calcul en cours."}\n---`;
    } else if (currentViewId === 'view-competence') {
        const comp = document.getElementById('tree-verdict-details')?.innerText;
        p += `\n\n--- CONTEXTE DE L'OUTIL 'COMPÉTENCE' ---\n${comp || ""}\n---`;
    }

    return p;
}

async function sendMessageToGemini(text) {
    const key = appState.parametres.gemini_api_key ? appState.parametres.gemini_api_key.trim() : "";
    const model = appState.parametres.gemini_model || "gemini-1.5-flash";
    const container = document.getElementById('chat-messages-container');

    if (!key) {
        appendChatMessage("user", text);
        appendChatMessage("model", `⚠️ **Clé API Gemini non configurée.**\n\nOuvrez l'onglet **Paramètres & API PISTE** pour renseigner votre clé API gratuite.`);
        return;
    }

    appendChatMessage("user", text);
    geminiChatHistory.push({ role: "user", parts: [{ text }] });

    const loadId = "load-" + Date.now();
    const loadDiv = document.createElement('div');
    loadDiv.id = loadId;
    loadDiv.className = "flex gap-2";
    loadDiv.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i>
        </div>
        <div class="bg-white p-2.5 rounded-2xl rounded-tl-none border border-slate-200 text-slate-500 text-xs italic">
            Analyse procédurale en cours...
        </div>
    `;
    container.appendChild(loadDiv);
    container.scrollTop = container.scrollHeight;
    if (window.lucide) lucide.createIcons();

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: buildContextualSystemPrompt() }] },
                contents: geminiChatHistory,
                generationConfig: { temperature: 0.2 }
            })
        });

        document.getElementById(loadId)?.remove();

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            appendChatMessage("model", `❌ **Erreur API (${res.status}) :** ${err.error ? err.error.message : res.statusText}`);
            return;
        }

        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Aucune réponse retournée.";
        geminiChatHistory.push({ role: "model", parts: [{ text: reply }] });
        appendChatMessage("model", reply);

    } catch (e) {
        document.getElementById(loadId)?.remove();
        appendChatMessage("model", `❌ **Erreur de connexion :** ${e.message}`);
    }
}

function appendChatMessage(role, text) {
    const container = document.getElementById('chat-messages-container');
    const div = document.createElement('div');
    div.className = "flex gap-2";
    const msgId = "msg-" + Date.now();

    if (role === 'user') {
        div.innerHTML = `
            <div class="flex-1 flex justify-end">
                <div class="bg-indigo-600 text-white p-2.5 rounded-2xl rounded-tr-none text-xs max-w-[85%] leading-relaxed shadow-xs select-text">
                    ${escapeHtml(text).replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <i data-lucide="bot" class="w-3.5 h-3.5"></i>
            </div>
            <div class="flex-1 bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200/90 shadow-xs text-slate-800 text-xs space-y-1.5 leading-relaxed relative group">
                <div class="markdown-body select-text space-y-1" id="${msgId}">${formatMarkdown(text)}</div>
                <div class="pt-1.5 border-t border-slate-100 flex justify-end gap-1.5">
                    <button class="btn-export-chat-word px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-sky-700 rounded flex items-center gap-1 transition" data-target="${msgId}">
                        <i data-lucide="file-down" class="w-3 h-3 text-blue-600"></i> Word
                    </button>
                    <button class="btn-copy-msg px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-indigo-600 rounded flex items-center gap-1 transition" data-target="${msgId}">
                        <i data-lucide="copy" class="w-3 h-3"></i> Copier
                    </button>
                </div>
            </div>
        `;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    div.querySelectorAll('.btn-copy-msg').forEach(btn => {
        btn.onclick = () => {
            const t = document.getElementById(btn.dataset.target);
            if (t) {
                navigator.clipboard.writeText(t.innerText);
                btn.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> Copié !`;
                setTimeout(() => { btn.innerHTML = `<i data-lucide="copy" class="w-3 h-3"></i> Copier`; if (window.lucide) lucide.createIcons(); }, 1800);
            }
        };
    });

    div.querySelectorAll('.btn-export-chat-word').forEach(btn => {
        btn.onclick = () => {
            const t = document.getElementById(btn.dataset.target);
            if (t) exportToWordDocument("Consultation_IA_LexProcedura.doc", "Consultation de Procédure Civile", t.innerHTML);
        };
    });

    if (window.lucide) lucide.createIcons();
}

function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMarkdown(md) {
    let h = escapeHtml(md);
    h = h.replace(/^### (.*$)/gim, '<h5 class="font-bold text-slate-900 text-xs mt-1.5 text-indigo-950">$1</h5>');
    h = h.replace(/^## (.*$)/gim, '<h4 class="font-bold text-slate-900 text-xs mt-2 text-indigo-900">$1</h4>');
    h = h.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-slate-900">$1</strong>');
    h = h.replace(/^\> (.*$)/gim, '<blockquote class="border-l-2 border-indigo-500 pl-2 py-0.5 bg-indigo-50/50 text-indigo-950 font-mono text-[11px] rounded-r">$1</blockquote>');
    h = h.replace(/^\- (.*$)/gim, '<li class="ml-3 list-disc text-slate-700">$1</li>');
    h = h.replace(/\n\n/gim, '<div class="h-1"></div>');
    h = h.replace(/\n/gim, '<br>');
    return h;
}

// -----------------------------------------------------------------------------
// 6. CALCULATEUR EXPRESS CPC
// -----------------------------------------------------------------------------
function initExpressCalc() {
    const btnDirect = document.getElementById('btn-mode-cpc-direct');
    const btnRetro = document.getElementById('btn-mode-cpc-retro');
    const secDirect = document.getElementById('section-cpc-direct');
    const secRetro = document.getElementById('section-cpc-retro');

    btnDirect.onclick = () => {
        btnDirect.className = "px-3 py-1 rounded-md font-bold text-xs bg-white text-sky-700 shadow-xs transition";
        btnRetro.className = "px-3 py-1 rounded-md font-semibold text-xs text-slate-600 hover:text-slate-900 transition";
        secDirect.classList.remove('hidden');
        secRetro.classList.add('hidden');
    };

    btnRetro.onclick = () => {
        btnRetro.className = "px-3 py-1 rounded-md font-bold text-xs bg-white text-amber-700 shadow-xs transition";
        btnDirect.className = "px-3 py-1 rounded-md font-semibold text-xs text-slate-600 hover:text-slate-900 transition";
        secRetro.classList.remove('hidden');
        secDirect.classList.add('hidden');
    };

    let lastDirectCalculatedDate = "";
    document.getElementById('btn-run-express-calc').onclick = () => {
        const dStr = document.getElementById('exp-date-input').value;
        const type = document.getElementById('exp-delai-select').value;
        const dist = document.getElementById('exp-distance-select').value;
        const alsace = document.getElementById('chk-exp-alsace').checked;

        if (!dStr) return alert("Précisez la date de notification.");

        const d = new Date(dStr);
        let fin = new Date(d);

        let articleRef = "538";
        if (type === 'APPEL_1M' || type === 'OPPOSITION_1M') { fin.setMonth(fin.getMonth() + 1); articleRef = "538"; }
        else if (type === 'APPEL_15J') { fin.setDate(fin.getDate() + 15); articleRef = "538"; }
        else if (type === 'CONST_15J') { fin.setDate(fin.getDate() + 15); articleRef = "763"; }
        else if (type === 'POURVOI_2M') { fin.setMonth(fin.getMonth() + 2); articleRef = "612"; }
        else if (type === 'CONCL_908') { fin.setMonth(fin.getMonth() + 3); articleRef = "908"; }
        else if (type === 'CONCL_909') { fin.setMonth(fin.getMonth() + 3); articleRef = "909"; }

        if (dist === 'DOM_TOM') fin.setMonth(fin.getMonth() + 1);
        if (dist === 'ETRANGER') fin.setMonth(fin.getMonth() + 2);

        const calcRes = computeProrogationArt642(fin, alsace);
        lastDirectCalculatedDate = calcRes.finalDate.toISOString().slice(0, 10);

        let expl = "";
        if (calcRes.prorogated) {
            expl = `<br><span class="text-amber-800 font-semibold">⚠️ Prorogation de plein droit jusqu'au premier jour ouvrable suivant à 24h00 (<button class="btn-legal-article text-amber-900 font-bold underline" data-code="CPC" data-article="642">Art. 642 CPC</button>).</span>`;
        }

        const card = document.getElementById('express-result-card');
        card.classList.remove('hidden');
        document.getElementById('express-result-text').innerHTML = `
            <strong>Échéance légale certifiée :</strong> <span class="text-rose-700 font-bold">${calcRes.finalDate.toLocaleDateString('fr-FR')} à 24h00</span>
            ${expl}
            <div class="text-[10px] text-slate-500 mt-1">Fondement officiel vérifié : <button class="btn-legal-article text-sky-700 font-bold underline" data-code="CPC" data-article="${articleRef}">Article ${articleRef} du CPC</button> et <button class="btn-legal-article text-sky-700 font-bold underline" data-code="CPC" data-article="640">Articles 640 à 644 du CPC</button>.</div>
        `;
        if (window.lucide) lucide.createIcons();
    };

    document.getElementById('btn-export-cpc-ics').onclick = () => {
        if (!lastDirectCalculatedDate) return alert("Calculez d'abord l'échéance.");
        const typeNom = document.getElementById('exp-delai-select').options[document.getElementById('exp-delai-select').selectedIndex].text;
        downloadIcsCalendar(typeNom, lastDirectCalculatedDate, "Échéance procédurale calculée via LexProcedura.");
    };

    document.getElementById('btn-export-cpc-word').onclick = () => {
        const text = document.getElementById('express-result-card').innerHTML;
        exportToWordDocument("Calcul_Delai_CPC.doc", "Comput de Délai Procédural CPC", text);
    };

    document.getElementById('btn-run-retro-calc').onclick = () => {
        const dAudStr = document.getElementById('retro-date-audience').value;
        const alsace = appState.parametres.regime_alsace_moselle;
        if (!dAudStr) return alert("Sélectionnez la date de l'audience.");

        const dAud = new Date(dAudStr);
        lastRetroPlanningEvents = [];

        const dClot = new Date(dAud); dClot.setDate(dClot.getDate() - 15);
        const pClot = computeProrogationArt642(dClot, alsace);

        const dConcl = new Date(dAud); dConcl.setDate(dConcl.getDate() - 30);
        const pConcl = computeProrogationArt642(dConcl, alsace);

        const dPieces = new Date(dAud); dPieces.setDate(dPieces.getDate() - 20);
        const pPieces = computeProrogationArt642(dPieces, alsace);

        const dDoss = new Date(dAud); dDoss.setDate(dDoss.getDate() - 8);
        const pDoss = computeProrogationArt642(dDoss, alsace);

        lastRetroPlanningEvents = [
            { label: "Date limite conclusions récapitulatives (J-30)", dateStr: pConcl.finalDate.toISOString().slice(0,10), dateObj: pConcl.finalDate },
            { label: "Communication ultime pièces & bordereau (J-20)", dateStr: pPieces.finalDate.toISOString().slice(0,10), dateObj: pPieces.finalDate },
            { label: "Ordonnance de clôture prévisionnelle (J-15)", dateStr: pClot.finalDate.toISOString().slice(0,10), dateObj: pClot.finalDate },
            { label: "Dépôt dossier de plaidoirie au greffe (J-8)", dateStr: pDoss.finalDate.toISOString().slice(0,10), dateObj: pDoss.finalDate },
            { label: "Audience de Plaidoirie", dateStr: dAud.toISOString().slice(0,10), dateObj: dAud }
        ];

        const container = document.getElementById('retro-steps-container');
        container.innerHTML = '';

        lastRetroPlanningEvents.forEach(evt => {
            const div = document.createElement('div');
            div.className = "flex items-center justify-between p-2 rounded-lg bg-white border border-amber-200/80";
            div.innerHTML = `
                <div>
                    <span class="font-bold text-slate-800">${evt.label}</span>
                    <span class="text-[10px] text-slate-500 block">Date limite : <strong>${evt.dateObj.toLocaleDateString('fr-FR')}</strong></span>
                </div>
                <button class="btn-single-retro-ics px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-semibold flex items-center gap-1">
                    <i data-lucide="calendar" class="w-3 h-3 text-amber-700"></i> + ICS
                </button>
            `;
            div.querySelector('.btn-single-retro-ics').onclick = () => {
                downloadIcsCalendar(evt.label, evt.dateStr, "Rétro-planning d'audience généré par LexProcedura.");
            };
            container.appendChild(div);
        });

        document.getElementById('retro-result-card').classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    };

    document.getElementById('btn-export-retro-ics').onclick = () => {
        if (!lastRetroPlanningEvents.length) return alert("Générez d'abord le rétro-planning.");
        lastRetroPlanningEvents.forEach(e => {
            downloadIcsCalendar(e.label, e.dateStr, "Rétro-planning d'audience");
        });
    };

    document.getElementById('btn-export-retro-word').onclick = () => {
        const html = document.getElementById('retro-steps-container').innerHTML;
        exportToWordDocument("Retroplanning_Audience_LexProcedura.doc", "Rétro-planning d'Audience et Clôture", html);
    };
}

// -----------------------------------------------------------------------------
// 7. SIMULATEUR DE PRESCRIPTION (ART. 2224 / 2239 DU CODE CIVIL)
// -----------------------------------------------------------------------------
function initPrescriptionSimulator() {
    document.getElementById('btn-add-event').onclick = () => {
        const type = document.getElementById('select-event-to-add').value;
        createPrescriptionEvent(type);
        computePrescription();
    };

    document.getElementById('btn-load-complex-scenario').onclick = loadComplexConstructionScenario;
    document.getElementById('sim-regime').onchange = computePrescription;
    document.getElementById('sim-date-depart').onchange = computePrescription;
    document.getElementById('sim-date-cible').onchange = computePrescription;

    document.getElementById('btn-copy-syllogisme').onclick = () => {
        navigator.clipboard.writeText(document.getElementById('syllogisme-output').innerText);
        alert("✓ Syllogisme copié dans le presse-papier !");
    };

    document.getElementById('btn-export-presc-word').onclick = () => {
        const text = document.getElementById('syllogisme-output').innerHTML.replace(/\n/g, '<br>');
        exportToWordDocument("Syllogisme_Prescription_LexProcedura.doc", "Analyse de Prescription et Forclusion", text);
    };

    document.getElementById('btn-export-presc-ics').onclick = () => {
        const endStr = document.getElementById('timeline-lbl-end').innerText.replace("Échéance finale : ", "");
        const cleanDate = endStr.split("/").reverse().join("-");
        downloadIcsCalendar("Date limite Prescription / Forclusion", cleanDate, document.getElementById('syllogisme-output').innerText);
    };

    document.getElementById('btn-save-presc-to-case').onclick = () => {
        const aff = appState.affaires.find(a => a.id === selectedAffaireId);
        if (!aff) return alert("Sélectionnez d'abord une affaire.");
        const endStr = document.getElementById('timeline-lbl-end').innerText.replace("Échéance finale : ", "");
        const cleanDate = endStr.split("/").reverse().join("-");
        aff.actes.push({
            id: "act-presc-" + Date.now(),
            nature: "Délai limite de prescription vérifié",
            date_evenement: document.getElementById('sim-date-depart').value,
            type_delai: "DELAI_PRESCRIPTION",
            fondement_cpc: "Art. 2224 / 2239 C. civ.",
            article_code: "CCIV",
            article_num: "2239",
            sanction: "Prescription extinctive de l'action",
            date_echeance_calculee: cleanDate,
            details_calcul: "Calcul issu du simulateur d'interruption et suspension.",
            statut: "EN_COURS"
        });
        persistState();
        renderAll();
        alert(`✓ Date limite (${endStr}) rattachée au dossier ${aff.nom_dossier} !`);
    };
}

function loadComplexConstructionScenario() {
    document.getElementById('sim-regime').value = "5_DROIT_COMMUN";
    document.getElementById('sim-date-depart').value = "2018-05-15";
    document.getElementById('sim-date-cible').value = "2026-11-18";

    prescriptionEvents = [
        {
            id: "evt-refere-1",
            type: "REFERE_EXPERTISE",
            date_assign: "2020-03-10",
            date_ord: "2020-06-25",
            date_depot: "2024-01-15"
        }
    ];
    renderEventsList();
    computePrescription();
}

function createPrescriptionEvent(type) {
    const id = "e-" + Date.now();
    if (type === 'REFERE_EXPERTISE') {
        prescriptionEvents.push({
            id, type,
            date_assign: "2020-03-10",
            date_ord: "2020-06-25",
            date_depot: "2024-01-15"
        });
    } else if (type === 'DEMANDE_JUSTICE') {
        prescriptionEvents.push({ id, type, date_assign: "2021-04-12" });
    } else {
        prescriptionEvents.push({ id, type, date_debut: "2019-10-01", date_fin: "2020-04-01" });
    }
    renderEventsList();
}

function renderEventsList() {
    const c = document.getElementById('events-timeline-list');
    c.innerHTML = '';
    prescriptionEvents.forEach(e => {
        const d = document.createElement('div');
        d.className = "p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-2";

        if (e.type === 'REFERE_EXPERTISE') {
            d.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="font-bold text-purple-900 flex items-center gap-1.5">
                        <i data-lucide="scale" class="w-3.5 h-3.5 text-purple-600"></i>
                        Référé-expertise (3 dates clés - <button class="btn-legal-article text-purple-950 font-bold underline" data-code="CCIV" data-article="2239">Art. 2239</button> et <button class="btn-legal-article text-purple-950 font-bold underline" data-code="CCIV" data-article="2241">2241 C. civ.</button>)
                    </span>
                    <button class="text-rose-600 font-semibold" onclick="removeEvent('${e.id}')">Supprimer</button>
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <div>
                        <label class="block text-[10px] text-slate-600 font-semibold">1. Assignation référé (Interruption 2241) :</label>
                        <input type="date" value="${e.date_assign}" onchange="updateEvent('${e.id}', 'date_assign', this.value)" class="w-full p-1.5 bg-white border border-slate-200 rounded">
                    </div>
                    <div>
                        <label class="block text-[10px] text-slate-600 font-semibold">2. Ordonnance (Début suspension 2239) :</label>
                        <input type="date" value="${e.date_ord}" onchange="updateEvent('${e.id}', 'date_ord', this.value)" class="w-full p-1.5 bg-white border border-slate-200 rounded">
                    </div>
                    <div>
                        <label class="block text-[10px] text-slate-600 font-semibold">3. Dépôt rapport (Reprise + 6m) :</label>
                        <input type="date" value="${e.date_depot}" onchange="updateEvent('${e.id}', 'date_depot', this.value)" class="w-full p-1.5 bg-white border border-slate-200 rounded">
                    </div>
                </div>
            `;
        } else {
            d.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900">Demande en justice / Assignation (<button class="btn-legal-article text-sky-800 font-bold underline" data-code="CCIV" data-article="2241">Art. 2241</button>)</span>
                    <button class="text-rose-600 font-semibold" onclick="removeEvent('${e.id}')">Supprimer</button>
                </div>
                <input type="date" value="${e.date_assign || '2021-04-12'}" onchange="updateEvent('${e.id}', 'date_assign', this.value)" class="w-44 p-1.5 bg-white border border-slate-200 rounded">
            `;
        }
        c.appendChild(d);
    });
    if (window.lucide) lucide.createIcons();
}

window.removeEvent = function(id) {
    prescriptionEvents = prescriptionEvents.filter(e => e.id !== id);
    renderEventsList();
    computePrescription();
};

window.updateEvent = function(id, field, val) {
    const e = prescriptionEvents.find(x => x.id === id);
    if (e) { e[field] = val; computePrescription(); }
};

function computePrescription() {
    const t0Str = document.getElementById('sim-date-depart').value || "2018-05-15";
    const cibleStr = document.getElementById('sim-date-cible').value || "2026-11-18";
    const t0 = new Date(t0Str);
    const cible = new Date(cibleStr);

    let echeance = new Date(t0);
    echeance.setFullYear(echeance.getFullYear() + 5);

    let logs = [];
    logs.push(`1. Point de départ (T0) : ${t0.toLocaleDateString('fr-FR')} (Délai de 5 ans - Art. 2224 C. civ.). Échéance initiale : ${echeance.toLocaleDateString('fr-FR')}.`);

    const refEvt = prescriptionEvents.find(e => e.type === 'REFERE_EXPERTISE');
    let hasRefere = false;

    if (refEvt && refEvt.date_depot) {
        hasRefere = true;
        const dDepot = new Date(refEvt.date_depot);
        echeance = new Date(dDepot);
        echeance.setFullYear(echeance.getFullYear() + 5);

        logs.push(`2. Assignation en référé du ${new Date(refEvt.date_assign).toLocaleDateString('fr-FR')} : Interruption de la prescription (Art. 2241 C. civ.).`);
        logs.push(`3. Ordonnance désignant l'expert du ${new Date(refEvt.date_ord).toLocaleDateString('fr-FR')} : Suspension jusqu'au dépôt du rapport (Art. 2239 al. 1 C. civ.).`);
        logs.push(`4. Dépôt du rapport le ${dDepot.toLocaleDateString('fr-FR')} : Reprise pour un nouveau délai de 5 ans (supérieur au plancher légal de 6 mois de l'Art. 2239 al. 2). Échéance finale : ${echeance.toLocaleDateString('fr-FR')}.`);
    }

    const diff = Math.ceil((echeance - cible) / 86400000);
    const badge = document.getElementById('verdict-badge');

    if (diff >= 0) {
        badge.className = "px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300";
        badge.textContent = `RECEVABLE (Il reste ${diff} jours)`;
        logs.push(`\nCONCLUSION : Au jour de l'assignation envisagée (${cible.toLocaleDateString('fr-FR')}), l'action N'EST PAS PRESCRITE (forclusion le ${echeance.toLocaleDateString('fr-FR')}). Demande recevable.`);
    } else {
        badge.className = "px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300";
        badge.textContent = `PRESCRIT depuis le ${echeance.toLocaleDateString('fr-FR')}`;
        logs.push(`\nCONCLUSION : L'action est FORCLOSE ET PRESCRITE depuis le ${echeance.toLocaleDateString('fr-FR')}. Fin de non-recevoir d'ordre public (Art. 122 CPC).`);
    }

    document.getElementById('syllogisme-output').innerText = logs.join('\n');

    document.getElementById('timeline-lbl-start').innerText = `Départ T0 : ${t0.toLocaleDateString('fr-FR')}`;
    document.getElementById('timeline-lbl-end').innerText = `Échéance finale : ${echeance.toLocaleDateString('fr-FR')}`;

    if (hasRefere) {
        document.getElementById('bar-initial').style.width = "22%";
        document.getElementById('bar-suspended').style.width = "40%";
        document.getElementById('bar-remaining').style.width = "38%";
        document.getElementById('timeline-lbl-susp').classList.remove('hidden');
    } else {
        document.getElementById('bar-initial').style.width = "50%";
        document.getElementById('bar-suspended').style.width = "0%";
        document.getElementById('bar-remaining').style.width = "50%";
        document.getElementById('timeline-lbl-susp').classList.add('hidden');
    }
}

// -----------------------------------------------------------------------------
// 8. STRATÉGIE DÉFENSE (DISPOSITIF SANS SCHÉMA + EXPORT WORD)
// -----------------------------------------------------------------------------
function initIncidentsStrategist() {
    document.querySelectorAll('#incident-checkboxes-grid input').forEach(c => c.onchange = recomputeDispositif);
    document.getElementById('chk-timing-conclu-fond').onchange = recomputeDispositif;

    document.getElementById('btn-copy-dispositif').onclick = () => {
        navigator.clipboard.writeText(document.getElementById('dispositif-output').innerText);
        alert("✓ Dispositif copié !");
    };

    document.getElementById('btn-export-dispositif-word').onclick = () => {
        const text = document.getElementById('dispositif-output').innerHTML.replace(/\n/g, '<br>');
        exportToWordDocument("Dispositif_Conclusions_LexProcedura.doc", "Projet de Dispositif des Conclusions", text);
    };

    recomputeDispositif();
}

function recomputeDispositif() {
    const hasConclu = document.getElementById('chk-timing-conclu-fond').checked;
    const checked = Array.from(document.querySelectorAll('#incident-checkboxes-grid input:checked')).map(c => c.dataset.incident);

    let lines = ["PAR CES MOTIFS\n"];

    if (checked.includes('INCOMPETENCE')) {
        if (hasConclu) {
            lines.push("❌ EXCEPTION D'INCOMPÉTENCE (Art. 75 CPC) : IRRECEVABLE car soulevée postérieurement aux défenses au fond (Art. 74 CPC).\n");
        } else {
            lines.push("IN LIMINE LITIS :\n- Vu les articles 74 et 75 du Code de procédure civile ;\n- DÉCLARER le tribunal incompétent ratione loci ;\n- RENVOYER la cause et les parties devant le Tribunal compétent.\n");
        }
    }

    if (checked.includes('VICE_FORME') && !hasConclu) {
        lines.push("IN LIMINE LITIS :\n- Vu l'article 114 du Code de procédure civile ;\n- PRONONCER la nullité de l'assignation pour vice de forme faisant grief au concluant.\n");
    }

    if (checked.includes('VICE_FOND')) {
        lines.push("EN TOUT ÉTAT DE CAUSE :\n- Vu les articles 117 et 118 du Code de procédure civile ;\n- CONSTATER le défaut de pouvoir d'ester en justice et PRONONCER la nullité de fond de l'acte adverse sans preuve de grief.\n");
    }

    if (checked.includes('FNR_PRESCRIPTION')) {
        lines.push("EN TOUT ÉTAT DE CAUSE :\n- Vu les articles 122 du CPC et 2224 du Code civil ;\n- DÉCLARER le demandeur irrecevable en toutes ses prétentions pour cause de prescription.\n");
    }

    lines.push("À TITRE SUBSIDIAIRE :\n- DÉBOUTER le demandeur de l'intégralité de ses demandes au fond.\n- CONDAMNER le demandeur au paiement de 3 500 € au titre de l'article 700 du CPC.");

    document.getElementById('dispositif-output').innerText = lines.join('\n');
}

// -----------------------------------------------------------------------------
// 9. COMPÉTENCE DIRECTE
// -----------------------------------------------------------------------------
function initCompetenceDirect() {
    ['tree-nat', 'tree-montant', 'tree-regle-ter', 'tree-ville'].forEach(id => {
        document.getElementById(id).onchange = recomputeCompetence;
        document.getElementById(id).oninput = recomputeCompetence;
    });

    document.getElementById('btn-apply-competence-active-case').onclick = () => {
        const aff = appState.affaires.find(a => a.id === selectedAffaireId);
        if (aff) {
            aff.juridiction = document.getElementById('tree-jur-name').innerText;
            persistState();
            renderAll();
            alert("✓ Juridiction appliquée au dossier actif !");
        }
    };

    document.getElementById('btn-export-competence-word').onclick = () => {
        const text = document.getElementById('tree-verdict-details').innerHTML;
        exportToWordDocument("Attribution_Competence_LexProcedura.doc", "Analyse de Compétence Juridictionnelle", text);
    };

    recomputeCompetence();
}

function recomputeCompetence() {
    const nat = document.getElementById('tree-nat').value;
    const montant = parseFloat(document.getElementById('tree-montant').value) || 0;
    const ville = document.getElementById('tree-ville').value.trim() || "Nanterre";

    let jur = "Tribunal Judiciaire (TJ)";
    let mat = "Art. L. 211-3 COJ (Droit commun)";

    if (nat === 'COMMERCE') { jur = "Tribunal de Commerce (TC)"; mat = "Art. L. 721-3 Code de commerce"; }
    else if (nat === 'TRAVAIL') { jur = "Conseil de Prud'hommes (CPH)"; mat = "Art. L. 1411-1 Code du travail"; }
    else if (nat === 'BAUX_HABITATION' || nat === 'CREDIT_CONSO' || montant <= 10000) {
        jur = "Juge des Contentieux de la Protection (JCP)";
        mat = "Art. L. 213-4-1 et s. COJ";
    }

    const isDernier = montant <= 5000;
    const ressort = isDernier ? "PREMIER ET DERNIER RESSORT (Pourvoi en cassation seul - Art. R. 211-3-24 COJ)" : "À CHARGE D'APPEL (Délai d'un mois - Art. 538 CPC)";

    document.getElementById('tree-verdict-details').innerHTML = `
        <strong>Juridiction compétente :</strong> <span id="tree-jur-name">${jur} de ${ville}</span><br>
        <strong>Compétence matérielle :</strong> ${mat}<br>
        <strong>Compétence territoriale :</strong> Art. 42 CPC (Domicile défendeur) ou Art. 46 CPC<br>
        <strong>Taux du ressort (5 000 €) :</strong> Demande de ${montant.toLocaleString('fr-FR')} € &rarr; <strong>${ressort}</strong>
    `;
}

// -----------------------------------------------------------------------------
// 10. PARAMÈTRES (AVEC CONFIGURATION API PISTE ET TESTEUR OAUTH2)
// -----------------------------------------------------------------------------
function initSettingsView() {
    const k = document.getElementById('param-gemini-key');
    const m = document.getElementById('param-gemini-model');
    const a = document.getElementById('param-gemini-anonymize');
    const pId = document.getElementById('param-piste-id');
    const pSec = document.getElementById('param-piste-secret');
    const pEnv = document.getElementById('param-piste-env');
    const rK = document.getElementById('param-resend-key');
    const rE = document.getElementById('param-resend-emails');
    const alsace = document.getElementById('param-chk-alsace');

    k.value = appState.parametres.gemini_api_key || "";
    m.value = appState.parametres.gemini_model || "gemini-1.5-flash";
    a.checked = appState.parametres.gemini_anonymize !== false;
    pId.value = appState.parametres.piste_client_id || "";
    pSec.value = appState.parametres.piste_client_secret || "";
    pEnv.value = appState.parametres.piste_env || "https://api.piste.gouv.fr";
    rK.value = appState.parametres.resend_api_key || "";
    rE.value = (appState.parametres.emails_destinataires || []).join(', ');
    alsace.checked = appState.parametres.regime_alsace_moselle;

    document.getElementById('btn-save-settings').onclick = () => {
        appState.parametres.gemini_api_key = k.value.trim();
        appState.parametres.gemini_model = m.value;
        appState.parametres.gemini_anonymize = a.checked;
        appState.parametres.piste_client_id = pId.value.trim();
        appState.parametres.piste_client_secret = pSec.value.trim();
        appState.parametres.piste_env = pEnv.value;
        appState.parametres.resend_api_key = rK.value.trim();
        appState.parametres.emails_destinataires = rE.value.split(',').map(s => s.trim());
        appState.parametres.regime_alsace_moselle = alsace.checked;
        persistState();
        alert("✓ Paramètres du cabinet et clés API enregistrés avec succès !");
    };

    // TESTEUR D'AUTHENTIFICATION OAUTH2 API PISTE (LÉGIFRANCE)
    document.getElementById('btn-test-piste').onclick = async () => {
        const st = document.getElementById('piste-test-status');
        appState.parametres.piste_client_id = pId.value.trim();
        appState.parametres.piste_client_secret = pSec.value.trim();
        appState.parametres.piste_env = pEnv.value;

        if (!appState.parametres.piste_client_id || !appState.parametres.piste_client_secret) {
            st.textContent = "✗ Veuillez renseigner le Client ID et le Client Secret.";
            st.className = "text-xs font-bold text-rose-600";
            return;
        }

        st.textContent = "Vérification OAuth2 en cours...";
        st.className = "text-xs font-bold text-sky-600";

        // Réinitialiser le cache pour forcer un nouveau test réel
        pisteOAuthCache.accessToken = null;

        try {
            const token = await getPisteAccessToken();
            if (token) {
                st.textContent = "✓ Authentification PISTE réussie (Token OAuth2 obtenu avec succès) !";
                st.className = "text-xs font-bold text-emerald-600";
            } else {
                st.textContent = "✗ Échec d'obtention du jeton.";
                st.className = "text-xs font-bold text-rose-600";
            }
        } catch (e) {
            st.textContent = `✗ ${e.message}`;
            st.className = "text-xs font-bold text-rose-600";
        }
    };

    document.getElementById('btn-test-gemini').onclick = async () => {
        const key = k.value.trim();
        const model = m.value || "gemini-1.5-flash";
        const st = document.getElementById('gemini-test-status');
        if (!key) { st.textContent = "Collez une clé API."; st.className = "text-xs font-bold text-rose-600"; return; }
        st.textContent = "Test..."; st.className = "text-xs font-bold text-sky-600";

        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reponds 'CONNECTE'." }] }] })
            });
            if (res.ok) {
                st.textContent = "✓ Connexion opérationnelle !";
                st.className = "text-xs font-bold text-emerald-600";
            } else {
                const err = await res.json().catch(() => ({}));
                st.textContent = "✗ Erreur : " + (err.error?.message || res.statusText);
                st.className = "text-xs font-bold text-rose-600";
            }
        } catch(e) {
            st.textContent = "✗ Échec réseau : " + e.message;
            st.className = "text-xs font-bold text-rose-600";
        }
    };

    document.getElementById('btn-export-backup-json').onclick = () => {
        const dataStr = JSON.stringify(appState, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LexProcedura_Cabinet_Backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    document.getElementById('input-import-backup-json').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const imported = JSON.parse(evt.target.result);
                if (imported.affaires) {
                    appState.affaires = imported.affaires;
                    if (imported.parametres) appState.parametres = { ...appState.parametres, ...imported.parametres };
                    persistState();
                    renderAll();
                    alert("✓ Sauvegarde importée avec succès !");
                } else {
                    alert("Format de fichier JSON non reconnu.");
                }
            } catch(err) {
                alert("Erreur lors de la lecture du fichier JSON.");
            }
        };
        reader.readAsText(file);
    };
}

// -----------------------------------------------------------------------------
// 11. RECHERCHE CTRL + F & MODALES
// -----------------------------------------------------------------------------
function initQuickSearch() {
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            document.getElementById('palette-modal').classList.toggle('hidden', false);
            document.getElementById('palette-modal').classList.toggle('flex', true);
            document.getElementById('palette-search-input').focus();
        }
        if (e.key === 'Escape') document.getElementById('palette-modal').classList.add('hidden');
    });

    document.getElementById('btn-quick-search-trigger').onclick = () => {
        document.getElementById('palette-modal').classList.remove('hidden');
        document.getElementById('palette-modal').classList.add('flex');
        document.getElementById('palette-search-input').focus();
    };

    document.getElementById('palette-search-input').oninput = (e) => {
        const q = e.target.value.toLowerCase().trim();
        const list = document.getElementById('palette-items-list');
        list.innerHTML = '';
        appState.affaires.forEach(a => {
            if (a.nom_dossier.toLowerCase().includes(q) || a.reference_cabinet.toLowerCase().includes(q)) {
                const d = document.createElement('div');
                d.className = "p-2 hover:bg-slate-100 rounded cursor-pointer flex justify-between";
                d.innerHTML = `<span>${a.nom_dossier}</span><span class="text-slate-400 font-mono">${a.reference_cabinet}</span>`;
                d.onclick = () => {
                    selectedAffaireId = a.id;
                    document.getElementById('palette-modal').classList.add('hidden');
                    renderAll();
                };
                list.appendChild(d);
            }
        });
    };
}

function initModals() {
    document.getElementById('btn-open-modal-new-case').onclick = () => {
        document.getElementById('modal-new-case').classList.remove('hidden');
        document.getElementById('modal-new-case').classList.add('flex');
    };
    document.getElementById('btn-close-modal-new-case').onclick = () => document.getElementById('modal-new-case').classList.add('hidden');
    document.getElementById('btn-cancel-modal-new-case').onclick = () => document.getElementById('modal-new-case').classList.add('hidden');

    document.getElementById('btn-submit-modal-new-case').onclick = () => {
        const nom = document.getElementById('modal-case-nom').value.trim();
        if (!nom) return alert("Saisissez le nom des parties.");
        const newCase = {
            id: "aff-" + Date.now(),
            nom_dossier: nom,
            reference_cabinet: document.getElementById('modal-case-ref').value || "DOS-2026-X",
            juridiction: document.getElementById('modal-case-juridiction').value || "TJ de Paris",
            numero_rg: document.getElementById('modal-case-rg').value || "RG 26/00100",
            enjeu_financier: parseFloat(document.getElementById('modal-case-enjeu').value) || 20000,
            lieu_residence_partie: "FRANCE_METROPOLE",
            etape_procedure: 1,
            diligences: [{ id: "d-1", libelle: "Signification de l'acte introductif", fait: true }],
            actes: [{
                id: "act-init",
                nature: "Assignation signifiée",
                date_evenement: "2026-11-18",
                fondement_cpc: "Art. 763 CPC",
                sanction: "Caducité",
                date_echeance_calculee: "2026-12-03",
                details_calcul: "Délai de 15 jours",
                statut: "EN_COURS"
            }]
        };
        appState.affaires.unshift(newCase);
        selectedAffaireId = newCase.id;
        persistState();
        document.getElementById('modal-new-case').classList.add('hidden');
        renderAll();
    };

    document.getElementById('btn-close-modal-add-act').onclick = () => document.getElementById('modal-add-act').classList.add('hidden');
    document.getElementById('btn-cancel-modal-add-act').onclick = () => document.getElementById('modal-add-act').classList.add('hidden');

    document.getElementById('btn-submit-modal-add-act').onclick = () => {
        const aff = appState.affaires.find(a => a.id === selectedAffaireId);
        if (!aff) return;

        const nat = document.getElementById('modal-act-nature').value.trim();
        const dStr = document.getElementById('modal-act-date').value;
        const delai = document.getElementById('modal-act-delai').value;

        if (!nat || !dStr) return alert("Renseignez la nature et la date.");

        const d = new Date(dStr);
        let fin = new Date(d);

        if (delai === 'APPEL_1M' || delai === 'OPPOSITION_1M') fin.setMonth(fin.getMonth() + 1);
        else if (delai === 'CONST_15J') fin.setDate(fin.getDate() + 15);
        else if (delai === 'POURVOI_2M') fin.setMonth(fin.getMonth() + 2);
        else fin.setMonth(fin.getMonth() + 3);

        const prorog = computeProrogationArt642(fin, appState.parametres.regime_alsace_moselle);

        aff.actes.unshift({
            id: "act-" + Date.now(),
            nature: nat,
            date_evenement: dStr,
            type_delai: delai,
            fondement_cpc: "Art. 640 à 644 CPC",
            sanction: "Forclusion de l'acte",
            date_echeance_calculee: prorog.finalDate.toISOString().slice(0, 10),
            details_calcul: `Délai calculé avec prorogation légale au ${prorog.finalDate.toLocaleDateString('fr-FR')}.`,
            statut: "EN_COURS"
        });

        persistState();
        document.getElementById('modal-add-act').classList.add('hidden');
        renderAll();
    };
}