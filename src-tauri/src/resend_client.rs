use serde::Serialize;

#[derive(Serialize)]
struct ResendPayload {
    from: String,
    to: Vec<String>,
    subject: String,
    html: String,
}

pub async fn envoyer_alerte_resend(
    api_key: &str,
    destinataires: Vec<String>,
    nom_affaire: &str,
    juridiction: &str,
    acte: &str,
    date_limite: &str,
    jours_restants: i64,
    fondement: &str,
) -> Result<String, String> {
    if api_key.trim().is_empty() || api_key == "re_votre_cle_api_ici" {
        return Err("Clé API Resend non configurée dans les Paramètres.".to_string());
    }
    let client = reqwest::Client::new();
    let payload = ResendPayload {
        from: "LexProcedura <alertes@resend.dev>".to_string(),
        to: destinataires,
        subject: format!("⚠️ URGENT : Délai critique - {}", nom_affaire),
        html: format!("<h2>ALERTE PROCÉDURALE</h2><p><b>Dossier :</b> {}</p><p><b>Juridiction :</b> {}</p><p><b>Acte :</b> {}</p><p><b>Échéance :</b> {} (reste {} j)</p><p><b>Texte :</b> {}</p>", nom_affaire, juridiction, acte, date_limite, jours_restants, fondement),
    };

    let rep = client.post("https://api.resend.com/emails")
        .bearer_auth(api_key)
        .json(&payload)
        .send().await
        .map_err(|e| format!("Erreur réseau : {}", e))?;

    if rep.status().is_success() {
        Ok("E-mail d'alerte transmis avec succès via Resend.".to_string())
    } else {
        Err(format!("Erreur API Resend : {}", rep.text().await.unwrap_or_default()))
    }
}
