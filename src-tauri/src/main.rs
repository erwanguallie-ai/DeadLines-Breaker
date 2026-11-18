#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cpc_engine;
mod piste_client;
mod resend_client;

use chrono::{Local, NaiveDate};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ParametresApp {
    pub seuil_rouge_jours: i64,
    pub seuil_orange_jours: i64,
    pub resend_api_key: String,
    pub emails_destinataires: Vec<String>,
    pub piste_client_id: String,
    pub piste_client_secret: String,
    pub regime_alsace_moselle: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ActeDossier {
    pub id: String,
    pub nature: String,
    pub date_evenement: String,
    pub type_delai: String,
    pub fondement_cpc: String,
    pub date_echeance_calculee: String,
    pub details_calcul: String,
    pub statut: String,
    pub alerte_envoyee: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Affaire {
    pub id: String,
    pub reference_cabinet: String,
    pub nom_dossier: String,
    pub juridiction: String,
    pub numero_rg: String,
    pub lieu_residence_partie: String,
    pub actes: Vec<ActeDossier>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EntreeHistorique {
    pub id: String,
    pub horodatage: String,
    pub categorie: String,
    pub titre: String,
    pub details: String,
    pub fondement: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DonneesApplication {
    pub parametres: ParametresApp,
    pub affaires: Vec<Affaire>,
    pub historique: Vec<EntreeHistorique>,
}

pub struct AppState {
    pub storage_path: PathBuf,
    pub donnees: Mutex<DonneesApplication>,
}

fn affaires_par_defaut() -> Vec<Affaire> {
    vec![
        Affaire {
            id: "demo-001".to_string(),
            reference_cabinet: "DOS-2026-URG1".to_string(),
            nom_dossier: "SARL BATIPRO c/ Époux DUPONT".to_string(),
            juridiction: "Tribunal Judiciaire de Paris".to_string(),
            numero_rg: "RG 26/01452".to_string(),
            lieu_residence_partie: "FRANCE_METROPOLE".to_string(),
            actes: vec![ActeDossier {
                id: "act-urg-01".to_string(),
                nature: "Signification de jugement au fond".to_string(),
                date_evenement: "2026-10-18".to_string(),
                type_delai: "DELAI_APPEL_CONTENTIEUX".to_string(),
                fondement_cpc: "Art. 538 du CPC".to_string(),
                date_echeance_calculee: "2026-11-18".to_string(),
                details_calcul: "Délai de 1 mois. Dies a quo: 18/10/2026. Échéance au 18/11/2026 (mercredi).".to_string(),
                statut: "EN_COURS".to_string(),
                alerte_envoyee: false,
            }],
        },
        Affaire {
            id: "demo-002".to_string(),
            reference_cabinet: "DOS-2026-SURV2".to_string(),
            nom_dossier: "SCI L'ORANGERIE c/ M. KHALED".to_string(),
            juridiction: "Cour d'appel de Lyon".to_string(),
            numero_rg: "RG 25/08912".to_string(),
            lieu_residence_partie: "FRANCE_METROPOLE".to_string(),
            actes: vec![ActeDossier {
                id: "act-surv-02".to_string(),
                nature: "Déclaration d'appel enregistrée".to_string(),
                date_evenement: "2026-08-22".to_string(),
                type_delai: "DELAI_CONCLUSIONS_APPELANT_908".to_string(),
                fondement_cpc: "Art. 908 du CPC".to_string(),
                date_echeance_calculee: "2026-11-23".to_string(),
                details_calcul: "Délai de 3 mois. Prorogé au lundi 23/11/2026 (Art. 642 CPC).".to_string(),
                statut: "EN_COURS".to_string(),
                alerte_envoyee: false,
            }],
        },
    ]
}

fn obtenir_repertoire_appdata() -> PathBuf {
    let mut dir = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    dir.push("LexProcedura");
    let _ = fs::create_dir_all(&dir);
    dir.push("data.json");
    dir
}

fn initialiser_donnees(inclure_demo: bool) -> DonneesApplication {
    DonneesApplication {
        parametres: ParametresApp {
            seuil_rouge_jours: 3,
            seuil_orange_jours: 7,
            resend_api_key: "re_votre_cle_api_ici".to_string(),
            emails_destinataires: vec![
                "englishlawyerM2@gmail.com".to_string(),
                "Maitrsimonin@gmail.com".to_string(),
            ],
            piste_client_id: "".to_string(),
            piste_client_secret: "".to_string(),
            regime_alsace_moselle: false,
        },
        affaires: if inclure_demo { affaires_par_defaut() } else { Vec::new() },
        historique: vec![
            EntreeHistorique {
                id: "hist-init-01".to_string(),
                horodatage: chrono::Local::now().format("%d/%m/%Y %H:%M").to_string(),
                categorie: "SYSTEME".to_string(),
                titre: "Initialisation du Cockpit LexProcedura".to_string(),
                details: "Activation des moteurs de computation CPC, compétence et prescription.".to_string(),
                fondement: "Droit positif français (COJ, CPC, C. civ.)".to_string(),
            }
        ],
    }
}

// -----------------------------------------------------------------------------
// COMMANDES IPC
// -----------------------------------------------------------------------------

#[tauri::command]
fn charger_donnees(state: State<AppState>) -> DonneesApplication {
    let mut lock = state.donnees.lock().unwrap();
    if state.storage_path.exists() {
        if let Ok(txt) = fs::read_to_string(&state.storage_path) {
            let clean = txt.trim_start_matches('\u{feff}').trim();
            if let Ok(d) = serde_json::from_str::<DonneesApplication>(clean) {
                *lock = d;
            }
        }
    } else {
        let defaut = initialiser_donnees(true);
        let _ = fs::write(&state.storage_path, serde_json::to_string_pretty(&defaut).unwrap());
        *lock = defaut;
    }
    lock.clone()
}

#[tauri::command]
fn creer_affaire(
    reference: String,
    nom: String,
    juridiction: String,
    numero_rg: String,
    residence: String,
    state: State<AppState>,
) -> DonneesApplication {
    let mut lock = state.donnees.lock().unwrap();
    let id_unique = format!("aff-{}", chrono::Utc::now().timestamp_millis());
    let nouvelle = Affaire {
        id: id_unique,
        reference_cabinet: reference.clone(),
        nom_dossier: nom.clone(),
        juridiction,
        numero_rg,
        lieu_residence_partie: residence,
        actes: Vec::new(),
    };
    lock.affaires.push(nouvelle);

    lock.historique.insert(0, EntreeHistorique {
        id: format!("hist-{}", chrono::Utc::now().timestamp_millis()),
        horodatage: chrono::Local::now().format("%d/%m/%Y %H:%M").to_string(),
        categorie: "DOSSIER".to_string(),
        titre: format!("Ouverture du dossier : {}", nom),
        details: format!("Référence interne : {}", reference),
        fondement: "Gestion de cabinet".to_string(),
    });

    let _ = fs::write(&state.storage_path, serde_json::to_string_pretty(&*lock).unwrap());
    lock.clone()
}

#[tauri::command]
fn supprimer_affaire(id_affaire: String, state: State<AppState>) -> DonneesApplication {
    let mut lock = state.donnees.lock().unwrap();
    lock.affaires.retain(|a| a.id != id_affaire);
    let _ = fs::write(&state.storage_path, serde_json::to_string_pretty(&*lock).unwrap());
    lock.clone()
}

#[tauri::command]
fn ajouter_acte_au_dossier(
    id_affaire: String,
    nature: String,
    date_depart: String,
    type_delai: String,
    state: State<AppState>,
) -> Result<DonneesApplication, String> {
    let mut lock = state.donnees.lock().unwrap();
    let alsace = lock.parametres.regime_alsace_moselle;

    let (unite, valeur, fondement) = match type_delai.as_str() {
        "DELAI_APPEL_CONTENTIEUX" => (cpc_engine::UniteDelai::MOIS, 1, "Art. 538 du CPC"),
        "DELAI_APPEL_GRACIEUX" => (cpc_engine::UniteDelai::JOURS, 15, "Art. 538 du CPC"),
        "DELAI_OPPOSITION" => (cpc_engine::UniteDelai::MOIS, 1, "Art. 574 du CPC"),
        "DELAI_POURVOI_CASSATION" => (cpc_engine::UniteDelai::MOIS, 2, "Art. 612 du CPC"),
        "DELAI_CONSTITUTION_AVOCAT_TJ" => (cpc_engine::UniteDelai::JOURS, 15, "Art. 763 du CPC"),
        "DELAI_CONCLUSIONS_APPELANT_908" => (cpc_engine::UniteDelai::MOIS, 3, "Art. 908 du CPC"),
        "DELAI_CONCLUSIONS_INTIME_909" => (cpc_engine::UniteDelai::MOIS, 3, "Art. 909 du CPC"),
        _ => return Err("Type de délai non reconnu".to_string()),
    };

    let affaire = lock.affaires.iter_mut().find(|a| a.id == id_affaire)
        .ok_or_else(|| "Dossier introuvable".to_string())?;

    let residence = match affaire.lieu_residence_partie.as_str() {
        "DOM_TOM" => cpc_engine::LocalisationPartie::DOM_TOM,
        "ETRANGER" => cpc_engine::LocalisationPartie::ETRANGER,
        _ => cpc_engine::LocalisationPartie::FRANCE_METROPOLE,
    };

    let dt = NaiveDate::parse_from_str(&date_depart, "%Y-%m-%d")
        .map_err(|_| "Format de date invalide (AAAA-MM-JJ)".to_string())?;
    let pivot = Local::now().date_naive();

    let calcul = cpc_engine::calculer_echeance_cpc(dt, unite, valeur, residence, alsace, pivot);

    let nouvel_acte = ActeDossier {
        id: format!("act-{}", chrono::Utc::now().timestamp_millis()),
        nature: nature.clone(),
        date_evenement: date_depart,
        type_delai,
        fondement_cpc: fondement.to_string(),
        date_echeance_calculee: calcul.date_echeance_legale.clone(),
        details_calcul: calcul.justification_pas_a_pas.clone(),
        statut: if calcul.est_expire { "EXPIRE".to_string() } else { "EN_COURS".to_string() },
        alerte_envoyee: false,
    };

    affaire.actes.push(nouvel_acte);

    lock.historique.insert(0, EntreeHistorique {
        id: format!("hist-{}", chrono::Utc::now().timestamp_millis()),
        horodatage: chrono::Local::now().format("%d/%m/%Y %H:%M").to_string(),
        categorie: "DELAI_CPC".to_string(),
        titre: format!("Délai calculé : {} ({})", nature, fondement),
        details: format!("Échéance légale fixée au {} | {}", calcul.date_echeance_legale, calcul.justification_pas_a_pas),
        fondement: fondement.to_string(),
    });

    let _ = fs::write(&state.storage_path, serde_json::to_string_pretty(&*lock).unwrap());
    Ok(lock.clone())
}

#[tauri::command]
fn enregistrer_historique(
    categorie: String,
    titre: String,
    details: String,
    fondement: String,
    state: State<AppState>,
) -> DonneesApplication {
    let mut lock = state.donnees.lock().unwrap();
    lock.historique.insert(0, EntreeHistorique {
        id: format!("hist-{}", chrono::Utc::now().timestamp_millis()),
        horodatage: chrono::Local::now().format("%d/%m/%Y %H:%M").to_string(),
        categorie,
        titre,
        details,
        fondement,
    });
    let _ = fs::write(&state.storage_path, serde_json::to_string_pretty(&*lock).unwrap());
    lock.clone()
}

#[tauri::command]
fn vider_historique(state: State<AppState>) -> DonneesApplication {
    let mut lock = state.donnees.lock().unwrap();
    lock.historique.clear();
    let _ = fs::write(&state.storage_path, serde_json::to_string_pretty(&*lock).unwrap());
    lock.clone()
}

#[tauri::command]
fn reinitialiser_base(mode_vierge: bool, state: State<AppState>) -> DonneesApplication {
    let mut lock = state.donnees.lock().unwrap();
    *lock = initialiser_donnees(!mode_vierge);
    let _ = fs::write(&state.storage_path, serde_json::to_string_pretty(&*lock).unwrap());
    lock.clone()
}

#[tauri::command]
fn enregistrer_parametres(nouveaux_parametres: ParametresApp, state: State<AppState>) -> Result<String, String> {
    if nouveaux_parametres.seuil_orange_jours <= nouveaux_parametres.seuil_rouge_jours {
        return Err("Le seuil Orange doit être strictement supérieur au seuil Rouge.".to_string());
    }
    let mut lock = state.donnees.lock().unwrap();
    lock.parametres = nouveaux_parametres;
    let _ = fs::write(&state.storage_path, serde_json::to_string_pretty(&*lock).unwrap());
    Ok("Paramètres sauvegardés avec succès.".to_string())
}

#[tauri::command]
async fn declencher_test_email(state: State<'_, AppState>) -> Result<String, String> {
    let (api_key, emails) = {
        let lock = state.donnees.lock().unwrap();
        (lock.parametres.resend_api_key.clone(), lock.parametres.emails_destinataires.clone())
    };

    resend_client::envoyer_alerte_resend(
        &api_key,
        emails,
        "TEST INTERACTIF COCKPIT",
        "Tribunal Judiciaire de Paris",
        "Test passerelle d'urgence Resend",
        "Immédiate",
        1,
        "Articles 640 et suivants du CPC",
    ).await
}

fn main() {
    let path = obtenir_repertoire_appdata();
    let donnees = initialiser_donnees(true);
    let app_state = AppState { storage_path: path, donnees: Mutex::new(donnees) };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            charger_donnees,
            creer_affaire,
            supprimer_affaire,
            ajouter_acte_au_dossier,
            enregistrer_historique,
            vider_historique,
            reinitialiser_base,
            enregistrer_parametres,
            declencher_test_email
        ])
        .run(tauri::generate_context!())
        .expect("Erreur au lancement de LexProcedura");
}