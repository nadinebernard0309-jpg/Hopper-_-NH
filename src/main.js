
// Formulaire de contact : enregistre chaque message dans la table Supabase "messages".
// L'URL et la clé "publishable" viennent du fichier .env (voir .env.example).
// Cette clé permet seulement ce que les règles d'accès autorisent
// (ici, ajouter un message, jamais les lire).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_CLE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const contactForm = document.getElementById('contact-form')

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const bouton = contactForm.querySelector('button')
  const donnees = new FormData(contactForm)
  bouton.disabled = true
  try {
    const reponse = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_CLE,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        nom: donnees.get('nom'),
        email: donnees.get('email'),
        message: donnees.get('message'),
      }),
    })
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status} ${await reponse.text()}`)
    contactForm.reset()
    alert('Merci, votre message a bien été envoyé !')
  } catch (erreur) {
    console.error('Formulaire de contact :', erreur)
    alert("Désolé, le message n'a pas pu être envoyé. Réessayez plus tard.")
  } finally {
    bouton.disabled = false
  }
})

// Chatbot : répond grâce à Claude, via la fonction Supabase "chatbot".
const chatBouton = document.getElementById('chat-bouton')
const chatFenetre = document.getElementById('chat-fenetre')
const chatMessages = document.getElementById('chat-messages')
const chatSaisie = document.getElementById('chat-saisie')

chatBouton.addEventListener('click', () => {
  chatFenetre.hidden = !chatFenetre.hidden
  chatBouton.setAttribute('aria-expanded', String(!chatFenetre.hidden))
  if (!chatFenetre.hidden) chatSaisie.focus()
})

function ajouterMessage(texte, auteur) {
  const bulle = document.createElement('div')
  bulle.className = `chat-msg ${auteur}`
  bulle.textContent = texte
  chatMessages.append(bulle)
  chatMessages.scrollTop = chatMessages.scrollHeight
}

document.getElementById('chat-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const texte = chatSaisie.value.trim()
  if (!texte) return
  ajouterMessage(texte, 'moi')
  chatSaisie.value = ''
  demanderAuBot(texte)
})

// Envoie la question à la fonction Supabase "chatbot", qui interroge Claude avec
// la clé API Anthropic gardée côté serveur (jamais dans le site), puis affiche la réponse.
// La clé "anon" sert seulement à passer la vérification de Supabase : elle est publique.
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

async function demanderAuBot(question) {
  const attente = document.createElement('div')
  attente.className = 'chat-msg bot'
  attente.textContent = '…'
  chatMessages.append(attente)
  chatMessages.scrollTop = chatMessages.scrollHeight
  try {
    const reponse = await fetch(`${SUPABASE_URL}/functions/v1/chatbot`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON}`,
        apikey: SUPABASE_ANON,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    })
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status} ${await reponse.text()}`)
    const { reponse: texte } = await reponse.json()
    attente.remove()
    ajouterMessage(texte || 'Merci, on vous répond bientôt', 'bot')
  } catch (erreur) {
    console.error('Chatbot :', erreur)
    attente.remove()
    ajouterMessage("Désolé, le service est indisponible pour l'instant.", 'bot')
  }
}
