
// Formulaire de contact : pour l'instant, il n'enregistre rien.
// (Lundi, on le reliera à une base de données Supabase.)
document.getElementById('contact-form').addEventListener('submit', (e) => {
  e.preventDefault()
  alert("Ce formulaire n'enregistre rien pour l'instant.")
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
