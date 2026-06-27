const formProgetto = document.querySelector(".formProgetto")
const inputNome = document.querySelector(".inputNome")
const inputDescrizione = document.querySelector(".inputDescrizione")
const statoProg = document.querySelector(".statoProg")
const listaProgetti = document.querySelector(".listaProgetti")
const btnNuovoProgetto = document.querySelector(".btnNuovoProgetto")

const formRicerca = document.querySelector(".formRicerca")
const inputRicerca = document.querySelector(".inputRicerca")
const statoRicerca = document.querySelector(".statoRicerca")
const risultatiRicerca = document.querySelector(".risultatiRicerca")

const nessunConversazione = document.querySelector(".nessunConversazione")
const vistaProgetto = document.querySelector(".vistaProgetto")
const titoloProgetto = document.querySelector(".titoloProgetto")
const btnNuovaConv = document.querySelector(".btnNuovaConv")
const formConversazione = document.querySelector(".formConversazione")
const inputTopic = document.querySelector(".inputTopic")
const statoConv = document.querySelector(".statoConv")
const filtriConv = document.querySelector(".filtriConv")
const filtroTutte = document.querySelector(".filtroTutte")
const filtroPreferite = document.querySelector(".filtroPreferite")
const filtroArchiviate = document.querySelector(".filtroArchiviate")
const listaConversazioni = document.querySelector(".listaConversazioni")

const vistaConv = document.querySelector(".vistaConv")
const btnTornaProgetto = document.querySelector(".btnTornaProgetto")
const titoloConv = document.querySelector(".titoloConv")
const btnPreferita = document.querySelector(".btnPreferita")
const btnArchivia = document.querySelector(".btnArchivia")
const btnEliminaConv = document.querySelector(".btnEliminaConv")
const listaMessaggi = document.querySelector(".listaMessaggi")
const formMessaggio = document.querySelector(".formMessaggio")
const inputMessaggio = document.querySelector(".inputMessaggio")
const statoMsg = document.querySelector(".statoMsg")
const btnInvia = formMessaggio.querySelector("button[type='submit']")

const sidebar = document.querySelector(".sidebar")
const btnMenu = document.querySelector(".btnMenu")

let progetti = []
let conversazioni = []
let progettoCorrente = null
let convCorrente = null

// doppio click per confermare eliminazione
let convDaEliminare = null
let progDaEliminare = null

let filtroAttivo = "all"

function leggiJson(r) {
  if (r.status === 204) return null
  return r.json().then(dati => {
    if (!r.ok) throw new Error(dati.error || "Richiesta fallita")
    return dati
  })
}

function mostraStato(el, msg, errore) {
  el.textContent = msg
  el.classList.toggle("errore", errore)

  if (!errore) {
    setTimeout(function() {
      if (el.textContent === msg) pulisciStato(el)
    }, 3000)
  }
}

function pulisciStato(el) {
  el.textContent = ""
  el.classList.remove("errore")
}

function codificaQuery(testo) {
  let ris = ""
  for (let i = 0; i < testo.length; i += 1) {
    const c = testo[i]
    if (c === "%") ris += "%25"
    else if (c === " ") ris += "%20"
    else if (c === "&") ris += "%26"
    else if (c === "#") ris += "%23"
    else if (c === "?") ris += "%3F"
    else if (c === "=") ris += "%3D"
    else if (c === "+") ris += "%2B"
    else ris += c
  }
  return ris
}

function mostraInizio() {
  nessunConversazione.hidden = false
  vistaProgetto.hidden = true
  vistaConv.hidden = true
  listaMessaggi.innerHTML = ""
}

function mostraProgetto() {
  nessunConversazione.hidden = true
  vistaProgetto.hidden = false
  vistaConv.hidden = true
  listaMessaggi.innerHTML = ""
}

function mostraConv() {
  nessunConversazione.hidden = true
  vistaProgetto.hidden = true
  vistaConv.hidden = false
}

function caricaProgetti() {
  fetch("/api/projects")
    .then(leggiJson)
    .then(lista => {
      progetti = lista
      disegnaProgetti()
    })
    .catch(err => mostraStato(statoProg, err.message, true))
}

function disegnaProgetti() {
  listaProgetti.innerHTML = ""

  for (const prog of progetti) {
    const elem = document.createElement("li")
    elem.classList.add("elemProgetto")
    elem.classList.toggle("selezionato", progettoCorrente && progettoCorrente.id === prog.id)

    const btn = document.createElement("button")
    btn.classList.add("btnProgetto")
    btn.textContent = prog.name
    btn.addEventListener("click", () => selezionaProgetto(prog))

    const btnElimina = document.createElement("button")
    btnElimina.classList.add("btnEliminaProg")
    btnElimina.classList.toggle("inAttesa", progDaEliminare === prog.id)
    btnElimina.textContent = progDaEliminare === prog.id ? "Confermi?" : "Elimina"
    btnElimina.addEventListener("click", () => eliminaProgetto(prog))

    elem.append(btn, btnElimina)
    listaProgetti.append(elem)
  }
}

function eliminaProgetto(prog) {
  if (progDaEliminare !== prog.id) {
    progDaEliminare = prog.id
    disegnaProgetti()
    return
  }

  progDaEliminare = null

  fetch(`/api/projects/${prog.id}`, { method: "DELETE" })
    .then(leggiJson)
    .then(() => {
      progetti = progetti.filter(p => p.id !== prog.id)

      if (progettoCorrente && progettoCorrente.id === prog.id) {
        progettoCorrente = null
        convCorrente = null
        conversazioni = []
        listaConversazioni.innerHTML = ""
        formConversazione.hidden = true
        filtriConv.hidden = true
        mostraInizio()
      }

      disegnaProgetti()
      risultatiRicerca.innerHTML = ""
      pulisciStato(statoRicerca)
      mostraStato(statoProg, "Progetto eliminato.", false)
    })
    .catch(err => mostraStato(statoProg, err.message, true))
}

function aggiungiProgetto(event) {
  event.preventDefault()
  pulisciStato(statoProg)

  const nome = inputNome.value.trim()
  const descrizione = inputDescrizione.value.trim()

  if (!nome) {
    mostraStato(statoProg, "Inserisci un nome per il progetto.", true)
    return
  }

  fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: nome, description: descrizione })
  })
    .then(leggiJson)
    .then(prog => {
      progetti.push(prog)
      disegnaProgetti()
      inputNome.value = ""
      inputDescrizione.value = ""
      formProgetto.hidden = true
      mostraStato(statoProg, "Progetto creato.", false)
      selezionaProgetto(prog)
    })
    .catch(err => mostraStato(statoProg, err.message, true))
}

function toggleFormProgetto() {
  formProgetto.hidden = !formProgetto.hidden
  pulisciStato(statoProg)
}

function selezionaProgetto(prog) {
  progettoCorrente = prog
  convCorrente = null
  progDaEliminare = null

  disegnaProgetti()

  titoloProgetto.textContent = prog.name
  formConversazione.hidden = true
  filtriConv.hidden = false

  filtroAttivo = "all"
  filtroTutte.classList.add("attivo")
  filtroPreferite.classList.remove("attivo")
  filtroArchiviate.classList.remove("attivo")

  mostraProgetto()
  caricaConversazioni()
}

function caricaConversazioni() {
  if (!progettoCorrente) return

  let qs = ""
  if (filtroAttivo === "favorites") qs = "favorite=true"
  else if (filtroAttivo === "archived") qs = "archivedOnly=true"

  const url = qs
    ? `/api/projects/${progettoCorrente.id}/conversations?${qs}`
    : `/api/projects/${progettoCorrente.id}/conversations`

  fetch(url)
    .then(leggiJson)
    .then(lista => {
      conversazioni = lista
      disegnaConversazioni()
    })
    .catch(err => mostraStato(statoConv, err.message, true))
}

function disegnaConversazioni() {
  listaConversazioni.innerHTML = ""

  for (const conv of conversazioni) {
    const elem = document.createElement("li")
    elem.classList.add("elemConversazione")
    elem.classList.toggle("selezionato", convCorrente && convCorrente.id === conv.id)
    elem.classList.toggle("archiviato", conv.isArchived)

    const btn = document.createElement("button")
    btn.classList.add("btnConversazione")
    btn.textContent = conv.isFavorite ? `★ ${conv.topic}` : conv.topic
    btn.addEventListener("click", () => selezionaConversazione(conv))

    elem.append(btn)
    listaConversazioni.append(elem)
  }
}

function toggleFormConv() {
  formConversazione.hidden = !formConversazione.hidden
  pulisciStato(statoConv)
}

function aggiungiConversazione(event) {
  event.preventDefault()
  pulisciStato(statoConv)

  if (!progettoCorrente) return

  const topic = inputTopic.value.trim()

  if (!topic) {
    mostraStato(statoConv, "Inserisci un topic per la conversazione.", true)
    return
  }

  fetch(`/api/projects/${progettoCorrente.id}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic })
  })
    .then(leggiJson)
    .then(conv => {
      conversazioni.push(conv)
      disegnaConversazioni()
      inputTopic.value = ""
      formConversazione.hidden = true
      mostraStato(statoConv, "Conversazione creata.", false)
      selezionaConversazione(conv)
    })
    .catch(err => mostraStato(statoConv, err.message, true))
}

function cambiaFiltro(filtro) {
  filtroAttivo = filtro
  filtroTutte.classList.toggle("attivo", filtro === "all")
  filtroPreferite.classList.toggle("attivo", filtro === "favorites")
  filtroArchiviate.classList.toggle("attivo", filtro === "archived")
  caricaConversazioni()
}

function selezionaConversazione(conv) {
  convCorrente = conv
  disegnaConversazioni()

  convDaEliminare = null
  btnEliminaConv.textContent = "Elimina"
  btnEliminaConv.classList.remove("inAttesa")

  titoloConv.textContent = conv.topic
  aggiornaPulsanti()

  mostraConv()
  caricaMessaggi()
}

function aggiornaPulsanti() {
  btnPreferita.textContent = convCorrente.isFavorite
    ? "★ Rimuovi dai preferiti"
    : "☆ Aggiungi ai preferiti"
  btnPreferita.classList.toggle("attivo", convCorrente.isFavorite)

  btnArchivia.textContent = convCorrente.isArchived ? "Ripristina" : "Archivia"
}

function togglePreferita() {
  if (!convCorrente) return
  modificaConv({ isFavorite: !convCorrente.isFavorite })
}

function toggleArchiviata() {
  if (!convCorrente) return
  modificaConv({ isArchived: !convCorrente.isArchived })
}

function modificaConv(dati) {
  fetch(`/api/conversations/${convCorrente.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dati)
  })
    .then(leggiJson)
    .then(conv => {
      convCorrente = conv
      aggiornaPulsanti()

      const idx = conversazioni.findIndex(c => c.id === conv.id)
      if (idx !== -1) conversazioni[idx] = conv

      caricaConversazioni()
    })
    .catch(err => mostraStato(statoMsg, err.message, true))
}

function eliminaConversazione() {
  if (!convCorrente) return

  if (convDaEliminare !== convCorrente.id) {
    convDaEliminare = convCorrente.id
    btnEliminaConv.textContent = "Sicuro? Clicca di nuovo"
    btnEliminaConv.classList.add("inAttesa")
    return
  }

  convDaEliminare = null
  btnEliminaConv.textContent = "Elimina"
  btnEliminaConv.classList.remove("inAttesa")

  fetch(`/api/conversations/${convCorrente.id}`, { method: "DELETE" })
    .then(leggiJson)
    .then(() => {
      convCorrente = null
      mostraProgetto()
      caricaConversazioni()
    })
    .catch(err => mostraStato(statoMsg, err.message, true))
}

function caricaMessaggi() {
  if (!convCorrente) return

  fetch(`/api/conversations/${convCorrente.id}/messages`)
    .then(leggiJson)
    .then(messaggi => {
      listaMessaggi.innerHTML = ""
      for (const msg of messaggi) {
        listaMessaggi.append(creaChat(msg))
      }
    })
    .catch(err => mostraStato(statoMsg, err.message, true))
}

function creaChat(msg) {
  const elem = document.createElement("li")
  elem.classList.add("chat")
  elem.classList.add(msg.role === "user" ? "chatUtente" : "chatBot")

  const etichetta = document.createElement("span")
  etichetta.classList.add("etichetta")
  etichetta.textContent = msg.role === "user" ? "Tu" : "ConversAI"

  const p = document.createElement("p")
  p.classList.add("testoMsg")
  p.textContent = msg.content

  elem.append(etichetta, p)
  return elem
}

function inviaMessaggio(event) {
  event.preventDefault()
  pulisciStato(statoMsg)

  if (!convCorrente) return

  const testo = inputMessaggio.value.trim()

  if (!testo) {
    mostraStato(statoMsg, "Scrivi un messaggio prima di inviarlo.", true)
    return
  }

  btnInvia.disabled = true
  mostraStato(statoMsg, "Invio in corso...", false)

  fetch(`/api/conversations/${convCorrente.id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: testo })
  })
    .then(leggiJson)
    .then(dati => {
      listaMessaggi.append(creaChat(dati.msgUtente))
      listaMessaggi.append(creaChat(dati.msgBot))
      inputMessaggio.value = ""
      pulisciStato(statoMsg)
    })
    .catch(err => mostraStato(statoMsg, err.message, true))
    .then(() => {
      btnInvia.disabled = false
    })
}

function avviaRicerca(event) {
  event.preventDefault()
  pulisciStato(statoRicerca)

  const query = inputRicerca.value.trim()

  if (!query) {
    mostraStato(statoRicerca, "Inserisci un termine di ricerca.", true)
    return
  }

  fetch(`/api/search?q=${codificaQuery(query)}`)
    .then(leggiJson)
    .then(ris => {
      inputRicerca.value = ""
      mostraRisultati(ris)
    })
    .catch(err => mostraStato(statoRicerca, err.message, true))
}

function mostraRisultati(ris) {
  risultatiRicerca.innerHTML = ""

  const totale = ris.progetti.length + ris.conversazioni.length + ris.messaggi.length

  if (totale === 0) {
    mostraStato(statoRicerca, "Nessun risultato trovato.", false)
    return
  }

  pulisciStato(statoRicerca)

  for (const r of ris.progetti) {
    const elem = document.createElement("li")
    elem.classList.add("elemRicerca")

    const tipo = document.createElement("span")
    tipo.classList.add("tipoRicerca")
    tipo.textContent = "Progetto"

    const btn = document.createElement("button")
    btn.classList.add("btnRicerca")
    btn.textContent = r.nome

    btn.addEventListener("click", () => apriRisultatoProgetto(r))
    elem.append(tipo, btn)
    risultatiRicerca.append(elem)
  }

  for (const r of ris.conversazioni) {
    const elem = document.createElement("li")
    elem.classList.add("elemRicerca")

    const tipo = document.createElement("span")
    tipo.classList.add("tipoRicerca")
    tipo.textContent = "Conversazione"

    const btn = document.createElement("button")
    btn.classList.add("btnRicerca")
    btn.textContent = `${r.nome} > ${r.topic}`

    btn.addEventListener("click", () => apriRisultatoConv(r))
    elem.append(tipo, btn)
    risultatiRicerca.append(elem)
  }

  for (const r of ris.messaggi) {
    const elem = document.createElement("li")
    elem.classList.add("elemRicerca")

    const tipo = document.createElement("span")
    tipo.classList.add("tipoRicerca")
    tipo.textContent = "Messaggio"

    const btn = document.createElement("button")
    btn.classList.add("btnRicerca")
    btn.textContent = `${r.nome} > ${r.topic}`

    const anteprima = document.createElement("p")
    anteprima.classList.add("anteprimaRic")
    anteprima.textContent = r.testo

    btn.addEventListener("click", () => apriRisultatoConv(r))
    elem.append(tipo, btn, anteprima)
    risultatiRicerca.append(elem)
  }
}

function apriRisultatoProgetto(r) {
  fetch(`/api/projects/${r.projId}`)
    .then(leggiJson)
    .then(prog => selezionaProgetto(prog))
    .catch(err => mostraStato(statoRicerca, err.message, true))
}

function apriRisultatoConv(r) {
  fetch(`/api/projects/${r.projId}`)
    .then(leggiJson)
    .then(prog => {
      selezionaProgetto(prog)
      return fetch(`/api/conversations/${r.convId}`)
    })
    .then(leggiJson)
    .then(conv => selezionaConversazione(conv))
    .catch(err => mostraStato(statoRicerca, err.message, true))
}

function toggleSide() {
  sidebar.classList.toggle("nascosto")
  const chiusa = sidebar.classList.contains("nascosto")
  btnMenu.textContent = chiusa ? "›" : "‹"
}

formProgetto.addEventListener("submit", aggiungiProgetto)
btnNuovoProgetto.addEventListener("click", toggleFormProgetto)
btnNuovaConv.addEventListener("click", toggleFormConv)
formConversazione.addEventListener("submit", aggiungiConversazione)
filtroTutte.addEventListener("click", function() { cambiaFiltro("all") })
filtroPreferite.addEventListener("click", function() { cambiaFiltro("favorites") })
filtroArchiviate.addEventListener("click", function() { cambiaFiltro("archived") })
btnPreferita.addEventListener("click", togglePreferita)
btnArchivia.addEventListener("click", toggleArchiviata)
btnEliminaConv.addEventListener("click", eliminaConversazione)
formMessaggio.addEventListener("submit", inviaMessaggio)
inputMessaggio.addEventListener("keydown", function(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault()
    inviaMessaggio(event)
  }
})
btnTornaProgetto.addEventListener("click", function() { mostraProgetto() })
formRicerca.addEventListener("submit", avviaRicerca)
btnMenu.addEventListener("click", toggleSide)

caricaProgetti()
