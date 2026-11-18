#![allow(dead_code, non_camel_case_types)]
#![allow(non_camel_case_types)]
use chrono::{Datelike, Duration, NaiveDate, Weekday};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UniteDelai { JOURS, MOIS, ANNEES }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LocalisationPartie { FRANCE_METROPOLE, DOM_TOM, ETRANGER }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResultatCalculDelai {
    pub date_declencheur: String,
    pub date_echeance_legale: String,
    pub jours_restants: i64,
    pub est_expire: bool,
    pub dies_a_quo_exclu: String,
    pub prorogation_appliquee: bool,
    pub justification_pas_a_pas: String,
    pub fondement_legal: String,
}

pub fn paques_gregorien(annee: i32) -> NaiveDate {
    let a = annee % 19;
    let b = annee / 100;
    let c = annee % 100;
    let d = b / 4;
    let e = b % 4;
    let f = (b + 8) / 25;
    let g = (b - f + 1) / 3;
    let h = (19 * a + b - d - g + 15) % 30;
    let i = c / 4;
    let k = c % 4;
    let l = (32 + 2 * e + 2 * i - h - k) % 7;
    let m = (a + 11 * h + 22 * l) / 451;
    let mois = (h + l - 7 * m + 114) / 31;
    let jour = ((h + l - 7 * m + 114) % 31) + 1;
    NaiveDate::from_ymd_opt(annee, mois as u32, jour as u32).unwrap()
}

pub fn est_jour_ferie(date: NaiveDate, alsace_moselle: bool) -> bool {
    let (a, m, j) = (date.year(), date.month(), date.day());
    let est_fixe = matches!((m, j), (1, 1) | (5, 1) | (5, 8) | (7, 14) | (8, 15) | (11, 1) | (11, 11) | (12, 25));
    if est_fixe { return true; }

    let paques = paques_gregorien(a);
    if date == paques + Duration::days(1) || date == paques + Duration::days(39) || date == paques + Duration::days(50) {
        return true;
    }
    if alsace_moselle && (date == paques - Duration::days(2) || (m == 12 && j == 26)) {
        return true;
    }
    false
}

pub fn est_chome_642(date: NaiveDate, alsace_moselle: bool) -> bool {
    date.weekday() == Weekday::Sat || date.weekday() == Weekday::Sun || est_jour_ferie(date, alsace_moselle)
}

pub fn ajouter_mois_cpc(date_depart: NaiveDate, nb_mois: u32) -> NaiveDate {
    let mut a = date_depart.year();
    let mut m = date_depart.month() + nb_mois;
    while m > 12 { a += 1; m -= 12; }
    let mut j = date_depart.day();
    while NaiveDate::from_ymd_opt(a, m, j).is_none() { j -= 1; }
    NaiveDate::from_ymd_opt(a, m, j).unwrap()
}

pub fn calculer_echeance_cpc(
    date_depart: NaiveDate,
    unite: UniteDelai,
    valeur: u32,
    partie_domicile: LocalisationPartie,
    alsace_moselle: bool,
    date_pivot: NaiveDate,
) -> ResultatCalculDelai {
    let mut echeance = match unite {
        UniteDelai::JOURS => date_depart + Duration::days(valeur as i64),
        UniteDelai::MOIS => ajouter_mois_cpc(date_depart, valeur),
        UniteDelai::ANNEES => {
            let annee_cible = date_depart.year() + (valeur as i32);
            let mut j = date_depart.day();
            while NaiveDate::from_ymd_opt(annee_cible, date_depart.month(), j).is_none() { j -= 1; }
            NaiveDate::from_ymd_opt(annee_cible, date_depart.month(), j).unwrap()
        }
    };

    let mois_distance = match partie_domicile {
        LocalisationPartie::FRANCE_METROPOLE => 0,
        LocalisationPartie::DOM_TOM => 1,
        LocalisationPartie::ETRANGER => 2,
    };
    if mois_distance > 0 { echeance = ajouter_mois_cpc(echeance, mois_distance); }

    let mut prorogee = false;
    let date_theorique = echeance;
    while est_chome_642(echeance, alsace_moselle) {
        echeance += Duration::days(1);
        prorogee = true;
    }

    let jours_restants = (echeance - date_pivot).num_days();
    let mut justification = format!("Acte du {}. Fin thÃ©orique : {}.", date_depart.format("%d/%m/%Y"), date_theorique.format("%d/%m/%Y"));
    if mois_distance > 0 { justification.push_str(&format!(" +{} mois distance (Art. 643 CPC).", mois_distance)); }
    if prorogee { justification.push_str(&format!(" ProrogÃ© au premier jour ouvrable suivant : {} Ã  24h00 (Art. 642 CPC).", echeance.format("%d/%m/%Y"))); }

    ResultatCalculDelai {
        date_declencheur: date_depart.format("%Y-%m-%d").to_string(),
        date_echeance_legale: echeance.format("%Y-%m-%d").to_string(),
        jours_restants,
        est_expire: jours_restants < 0,
        dies_a_quo_exclu: format!("{} exclu (Art. 640 CPC)", date_depart.format("%d/%m/%Y")),
        prorogation_appliquee: prorogee,
        justification_pas_a_pas: justification,
        fondement_legal: "Art. 640 Ã  643 du CPC".to_string(),
    }
}
