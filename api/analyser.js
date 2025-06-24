import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Seule la méthode POST est autorisée' });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const generativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { summaryData, conversationHistory, userQuestion } = req.body;

    const textToEmbed = userQuestion || `Analyse ce bilan : ${JSON.stringify(summaryData)}`;
    const embeddingResult = await embeddingModel.embedContent(textToEmbed);
    const queryEmbedding = embeddingResult.embedding.values;

    const { data: documents, error: rpcError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.70,
      match_count: 7,
    });

    if (rpcError) throw rpcError;

    const contextText = documents.length > 0 
      ? documents.map(doc => doc.content).join('\n\n---\n\n')
      : "Aucune information pertinente trouvée dans la base de connaissance.";
    
    const prompt = `
      CONTEXTE :
      Tu es un expert en analyse de phénomènes spirituels. Ta base de connaissance est constituée des extraits de documents fournis ci-dessous. Base ton analyse EXCLUSIVEMENT sur ces extraits.

      --- EXTRAITS PERTINENTS DE LA BASE DE CONNAISSANCE ---
      ${contextText}
      --- FIN DES EXTRAITS ---
      
      HISTORIQUE DE LA CONVERSATION (le cas échéant) :
      ${conversationHistory ? JSON.stringify(conversationHistory) : "C'est le début de la conversation."}

      DONNÉES BRUTES DU BILAN (pour référence si nécessaire) :
      ${JSON.stringify(summaryData, null, 2)}

      TÂCHE :
      Réponds à la question de l'utilisateur ("${userQuestion || "Fournis une analyse initiale détaillée du bilan ci-dessus."}") de manière claire, structurée et bienveillante, en te basant sur les extraits de la base de connaissance. Si les extraits ne contiennent pas la réponse, indique que la base de connaissance ne fournit pas d'information sur ce sujet précis. Rédige ta réponse en HTML simple (paragraphes <p>, listes <ul><li>, titres <h4>).
    `;

    const result = await generativeModel.generateContent(prompt);
    const aiResponse = await result.response;
    const aiText = aiResponse.text();

    res.status(200).json({ analysis: aiText });

  } catch (error) {
    console.error('Erreur dans la fonction API:', error);
    res.status(500).json({ message: "Une erreur est survenue lors de l'analyse par l'IA.", details: error.message });
  }
}
