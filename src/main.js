
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

// Chatbot : pour l'instant, il répond toujours la même chose.
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

// Envoie la question au webhook Make (champ "question") et affiche sa réponse.
const WEBHOOK_MAKE = 'https://hook.eu1.make.com/hja941ej4e1l2qkig2w5faynr5ei4lrn'

async function demanderAuBot(question) {
  try {
    const reponse = await fetch(WEBHOOK_MAKE, {
      method: 'POST',
      body: new URLSearchParams({ question }),
    })
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)
    const texte = (await reponse.text()).trim()
    ajouterMessage(lireReponse(texte) || 'Merci, on vous répond bientôt', 'bot')
  } catch (erreur) {
    console.error('Chatbot :', erreur)
    ajouterMessage("Désolé, le service est indisponible pour l'instant.", 'bot')
  }
}

// La réponse peut être du texte simple ou du JSON ({ "reponse": "..." } par exemple).
function lireReponse(texte) {
  try {
    const donnees = JSON.parse(texte)
    if (typeof donnees === 'string') return donnees
    return donnees.reponse ?? donnees.answer ?? donnees.response ?? donnees.message ?? texte
  } catch {
    return texte
  }
}
