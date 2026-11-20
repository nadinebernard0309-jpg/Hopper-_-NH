
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
  setTimeout(() => ajouterMessage('Merci, on vous répond bientôt', 'bot'), 400)
})
