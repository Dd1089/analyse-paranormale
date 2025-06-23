// On importe la bibliothèque nécessaire pour parler à Gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");

// On configure le client Gemini avec la clé API.
// process.env.GEMINI_API_KEY est une manière sécurisée de stocker la clé.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cette fonction est notre "serveur". Elle sera exécutée à chaque fois
// que le questionnaire enverra des données.
module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Seule la méthode POST est autorisée' });
    }
    
    const summaryData = req.body.summaryData;
    if (!summaryData || summaryData.length === 0) {
        return res.status(400).json({ message: 'Aucune donnée à analyser.' });
    }
    
    // On intègre L'INTÉGRALITÉ de votre guide de diagnostic.
    const diagnosticGuide = `
      I. LES ENTITÉS (26 items)
      I.1. Entités d'Origine Humaine (Âmes et Esprits) (6 items)
      I.1.1. Âmes errantes / Esprits confus
      I.1.2. Esprits liés (à un lieu, objet, personne)
      I.1.3. Fantômes résiduels / Empreintes énergétiques
      I.1.4. Esprits vengeurs / malveillants
      I.1.5. Guides spirituels / Ancêtres protecteurs
      I.1.6. Passeurs d'âmes (Psychopompes)
      I.2. Entités Non-Humaines (Hiérarchies et Natures diverses) (14 items)
      I.2.1. Entités Angéliques et Célestes (3 items) : I.2.1.1. Anges gardiens, I.2.1.2. Archanges, I.2.1.3. Hiérarchies supérieures (Séraphins, Chérubins...)
      I.2.2. Entités Démoniaques et Infernales (3 items) : I.2.2.1. Démons majeurs (hiérarchie infernale), I.2.2.2. Démons mineurs (légions), I.2.2.3. Anges déchus
      I.2.3. Esprits de la Nature / Élémentaux (4 items) : I.2.3.1. Esprits de la Terre (Gnomes, Dryades), I.2.3.2. Esprits de l'Air (Sylphes, Fées), I.2.3.3. Esprits de l'Eau (Ondines, Néréides), I.2.3.4. Esprits du Feu (Salamandres)
      I.2.4. Entités Culturellement Spécifiques (4 items) : I.2.4.1. Djinns (tradition islamique), I.2.4.2. Devas et Asuras (traditions hindouistes), I.2.4.3. Kami et Yōkai (tradition japonaise), I.2.4.4. Loas / Orishas (traditions Vaudou / Santeria)
      I.3. Entités Spécialisées et Conceptuelles (6 items)
      I.3.1. Entités Parasites / Vampiriques
      I.3.2. Incubes et Succubes
      I.3.3. Gardiens de seuils
      I.3.4. Formes-pensées / Égrégores
      I.3.5. Tulpas (forme-pensée individualisée)
      I.3.6. Entités extraterrestres / interdimensionnelles

      II. TYPES DE PHÉNOMÈNES MANIFESTÉS (17 items)
      II.1. Manifestations Sonores (4 items)
      II.1.1. Bruits de pas, coups, grattements (Raps) - produit par : I.1.1, I.1.2, I.1.3, I.1.4, I.2.3.1
      II.1.2. Voix directes, chuchotements, cris - produit par : I.1.1, I.1.4, I.1.5, I.2.2
      II.1.3. Phénomènes Électroniques de Voix (PVE/TCI) - produit par : I.1.1, I.1.2, I.1.5, I.1.4, I.2.2
      II.1.4. Musique ou sons d'origine inexpliquée
      II.2. Manifestations Visuelles (6 items)
      II.2.1. Apparitions (complètes, partielles, vaporeuses) - produit par : presque toutes les entités conscientes
      II.2.2. Ombres noires / Silhouettes périphériques (Shadow People) - produit par : I.1.4, I.2.2, I.3.3
      II.2.3. Lumières anormales, orbes, flashs
      II.2.4. Mouvement d'objets (Télékinésie) - produit par : I.1.4, I.2.2
      II.2.5. Apports / Asports (apparition/disparition d'objets) - produit par : I.1.5, I.1.4, I.2.2
      II.2.6. Écriture directe ou dessins
      II.3. Manifestations Tactiles et Sensorielles (4 items)
      II.3.1. Sensation de contact, de caresse, de poussée - produit par : I.1.5, I.1.4, I.2.2, I.3.2
      II.3.2. Changements brusques de température (points froids/chauds)
      II.3.3. Odeurs inexpliquées (florales, soufrées...) - produit par : I.1.5, I.1.4, I.2.2
      II.3.4. Sensation de toiles d'araignée sur le visage
      II.4. Phénomènes de type Poltergeist (1 item)
      II.4.1. Combinaison intense de phénomènes physiques - produit par : I.2.2, I.1.4
      II.5. Phénomènes Technologiques (2 items)
      II.5.1. Dysfonctionnements inexpliqués d'appareils électroniques - produit par : I.2.2
      II.5.2. Communications via dispositifs éteints - produit par : I.2.2
      II.5.3. La possession - produit par : I.2.2
    `;
    
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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    const result = await model.generateContent(prompt);
    const aiResponse = await result.response;
    const aiText = aiResponse.text();

    res.status(200).json({ analysis: aiText });

  } catch (error) {
    console.error('Erreur dans la fonction API:', error);
    res.status(500).json({ message: "Une erreur est survenue lors de l'analyse par l'IA." });
  }
};
