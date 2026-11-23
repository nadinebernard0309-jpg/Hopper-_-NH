// Fonction Supabase "chatbot" : reçoit { question } depuis le site,
// interroge Claude avec la clé ANTHROPIC_API_KEY (secret Supabase, jamais dans le site)
// et renvoie { reponse }.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const QUESTION_MAX = 1000; // caractères, pour limiter les abus et le coût

const SYSTEM = `Tu es l'assistant du site de Hopper, un atelier de réparation de vélos à Paris.
Réponds en français, en 2 à 4 phrases, sur un ton chaleureux et simple.

Ce que tu sais de Hopper (n'invente rien d'autre : ni prix, ni service, ni horaire) :
- La plupart des vélos sont réparés en 48 h.
- Révision complète (réglages, freins et vitesses) : 49 €.
- Réparation de crevaison en 30 minutes : 15 €.
- Location de vélos de ville à la journée : 20 €.
- Ouvert du mardi au samedi, de 9 h à 19 h. Fermé le dimanche et le lundi.
- Adresse : 12 rue des Rayons, 75011 Paris.
- Pour prendre rendez-vous, le visiteur utilise le formulaire de contact en bas de la page.

Si on te demande quelque chose que tu ne sais pas, dis-le et propose le formulaire de contact.
Si la question n'a rien à voir avec Hopper ou les vélos, ramène poliment la conversation à l'atelier.`;

// Créé à la première question, pour que la fonction démarre même si la clé n'est pas encore configurée.
let client: Anthropic | null = null;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erreur: "Méthode non autorisée" }, 405);

  let question = "";
  try {
    question = String((await req.json()).question ?? "").trim();
  } catch {
    return json({ erreur: "Requête invalide" }, 400);
  }
  if (!question) return json({ erreur: "Question vide" }, 400);
  if (question.length > QUESTION_MAX) {
    return json({ reponse: "Votre message est un peu long : pouvez-vous le raccourcir ?" });
  }

  if (!Deno.env.get("ANTHROPIC_API_KEY")) {
    console.error("Secret ANTHROPIC_API_KEY manquant dans Supabase");
    return json({ erreur: "Service indisponible" }, 503);
  }

  try {
    client ??= new Anthropic(); // lit ANTHROPIC_API_KEY dans les secrets Supabase
    const message = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content: question }],
    });

    if (message.stop_reason === "refusal") {
      return json({ reponse: "Je ne peux pas répondre à cette question. Pour toute demande, utilisez le formulaire de contact." });
    }

    const texte = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("")
      .trim();

    return json({ reponse: texte || "Merci, on vous répond bientôt" });
  } catch (erreur) {
    if (erreur instanceof Anthropic.AuthenticationError) {
      console.error("Clé ANTHROPIC_API_KEY absente ou invalide");
    } else if (erreur instanceof Anthropic.RateLimitError) {
      console.error("Limite de requêtes Anthropic atteinte");
    } else if (erreur instanceof Anthropic.APIError) {
      console.error(`Erreur API Anthropic ${erreur.status}:`, erreur.message);
    } else {
      console.error("Erreur inattendue :", erreur);
    }
    return json({ erreur: "Service indisponible" }, 502);
  }
});
