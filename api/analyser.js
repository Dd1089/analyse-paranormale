import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Seule la méthode POST est autorisée' });
    }

    // --- Initialisation des clients avec les clés sécurisées de Vercel ---
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const generativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { summaryData, conversationHistory, userQuestion } = req.body;

    // --- Phase de Récupération (RAG) ---
    const textToEmbed = userQuestion || `Analyse ce bilan : ${JSON.stringify(summaryData)}`;
    const embeddingResult = await embeddingModel.embedContent(textToEmbed);
    const queryEmbedding = embeddingResult.embedding.values;

    // On appelle une fonction spéciale dans Supabase pour trouver les documents pertinents
    const { data: documents, error: rpcError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.70, // Seuil de similarité
      match_count: 7,       // Nombre de morceaux de texte pertinents à récupérer
    });

    if (rpcError) throw rpcError;

    const contextText = documents.length > 0 
      ? documents.map(doc => doc.content).join('\n\n---\n\n')
      : "Aucune information pertinente trouvée dans la base de connaissance.";

    // --- Phase de Génération ---
    const prompt = `
      CONTEXTE :
      Tu es un expert en analyse de phénomènes spirituels. Ta base de connaissance est constituée des extraits de documents fournis ci-dessous. Base ton analyse EXCLUSIVEMENT sur ces extraits.

      --- EXTRAITS PERTINENTS DE LA BASE DE CONNAISSANCE ---
      ${contextText}
      --- FIN DES EXTRAITS ---

      HISTORIQUE DE LA CONVERSATION (le cas échéant) :
      ${conversationHistory || "C'est le début de la conversation."}

      DONNÉES BRUTES DU BILAN (pour référence si nécessaire) :
      <span class="math-inline">\{JSON\.stringify\(summaryData, null, 2\)\}
