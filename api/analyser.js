// On importe la bibliothèque nécessaire pour parler à Gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");

// On configure le client Gemini avec la clé API.
// process.env.GEMINI_API_KEY est une manière sécurisée de stocker la clé.
// Nous la configurerons sur Vercel, jamais directement dans le code.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cette fonction est notre "serveur". Elle sera exécutée à chaque fois
// que le questionnaire enverra des données.
module.exports = async (req, res) => {
  try {
    // On s'assure que la requête est de type POST (envoi de données)
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Seule la méthode POST est autorisée' });
    }
    
    // 1. On récupère les données du bilan envoyées par le questionnaire
    const summaryData = req.body.summaryData;
    if (!summaryData || summaryData.length === 0) {
        return res.status(400).json({ message: 'Aucune donnée à analyser.' });
    }
    
    // 2. On intègre votre guide de diagnostic
    const diagnosticGuide = `
    I. LES ENTITÉS
    I.1. Entités d'Origine Humaine: I.1.1. Âmes errantes, I.1.2. Esprits liés, I.1.3. Fantômes résiduels, I.1.4. Esprits vengeurs, I.1.5. Guides spirituels, I.1.6. Passeurs d'âmes.
    I.2. Entités Non-Humaines: I.2.1. Entités Angéliques, I.2.2. Entités Démoniaques, I.2.3. Esprits de la Nature, I.2.4. Entités Culturellement Spécifiques.
    I.3. Entités Spécialisées: I.3.1. Entités Parasites, I.3.2. Incubes et Succubes, I.3.3. Gardiens de seuils, I.3.4. Formes-pensées, I.3.5. Tulpas, I.3.6. Entités extraterrestres.
    II. TYPES DE PHÉNOMÈNES MANIFESTÉS
    II.1. Manifestations Sonores: II.1.1. Bruits de pas (produit par I.1.1, I.1.2, I.1.3, I.1.4, I.2.3.1), II.1.2. Voix (produit par I.1.1, I.1.4, I.1.5, I.2.2), II.1.3. PVE/TCI (produit par I.1.1, I.1.2, I.1.5, I.1.4, I.2.2).
    II.2. Manifestations Visuelles: II.2.1. Apparitions (produit par presque toutes les entités conscientes), II.2.2. Ombres noires (produit par I.1.4, I.2.2, I.3.3), II.2.4. Mouvement d'objets (produit par I.1.4, I.2.2), II.2.5. Apports/Asports (produit par I.1.5, I.1.4, I.2.2).
    II.3. Manifestations Tactiles: II.3.1. Contact (produit par I.1.5, I.1.4, I.2.2, I.3.2), II.3.3. Odeurs (produit par I.1.5, I.1.4, I.2.2).
    II.4. Poltergeist: Combinaison intense (produit par I.1.4, I.2.2).
    II.5. Phénomènes Technologiques: Dysfonctionnements (produit par I.2.2), Communications via dispositifs éteints (produit par I.2.2).
    II.6. Phénomènes de possession (produit par I.2.2).
    `;
    
    // 3. On construit le "Master Prompt" pour Gemini
    const prompt = `
    CONTEXTE :
    Tu es un expert en analyse de phénomènes spirituels. Ton unique source de connaissance est le "Guide de diagnostic des phénomènes invisibles" fourni ci-dessous. Tu ne dois PAS utiliser d'autres connaissances. Ton analyse doit se baser EXCLUSIVEMENT sur la mise en correspondance des phénomènes rapportés avec les entités décrites dans ce guide.

    --- GUIDE DE DIAGNOSTIC ---
    ${diagnosticGuide}
    --- FIN DU GUIDE ---

    TÂCHE :
    Analyse les données du questionnaire d'un utilisateur, qui sont fournies ci-dessous au format JSON. Pour CHAQUE phénomène rapporté, identifie l'entité la plus probable à son origine en te basant sur le guide. Explique la motivation probable de cette entité en une phrase courte. Termine par une synthèse globale sur la nature de l'activité en 2 ou 3 phrases. Rédige ta réponse dans un format HTML simple avec des titres <h4> pour chaque phénomène et un titre <h4> pour la synthèse.

    --- DONNÉES DU QUESTIONNAIRE ---
    ${JSON.stringify(summaryData, null, 2)}
    `;

    // 4. On envoie la requête à Gemini et on attend sa réponse
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    const result = await model.generateContent(prompt);
    const aiResponse = await result.response;
    const aiText = aiResponse.text();

    // 5. On renvoie la réponse de l'IA au questionnaire
    res.status(200).json({ analysis: aiText });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Une erreur est survenue lors de l'analyse par l'IA." });
  }
};