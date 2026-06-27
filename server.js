const express = require("express")
const database = require("./database")

const app = express()
const port = 3000

app.use(express.json())
app.use(express.static("public"))

function rispostaBot(testo, topic) {
  if (/ciao|Ciao|buongiorno|Buongiorno|buonasera|Buonasera|salve|Salve/.test(testo)) {
    return `Ciao! Come posso aiutarti oggi?`
  }
  if (/grazie|Grazie/.test(testo)) {
    return `Di nulla, figurati! Se hai altri dubbi o curiosità su "${topic}", sono sempre a tua disposizione.`
  }
  if (/\?/.test(testo)) {
    return `Ottima domanda! Riguardo a "${topic}", per rispondere in modo completo al tuo dubbio ("${testo}"), ti proporrei un esempio pratico che è sempre utile per capire meglio!`
  }
  if (/riassun|Riassun|sintesi|Sintesi|summary|Summary/.test(testo)) {
    return `Certo, ti faccio subito una sintesi! Il centro del tuo messaggio è "${testo}".`
  }
  if (/spiega|Spiega|explain|Explain|perch|Perch/.test(testo)) {
    return `Ti spiego volentieri. Nel contesto di "${topic}", la questione che hai sollevato ("${testo}") è molto interessante.`
  }
  if (/esempio|Esempio|example|Example/.test(testo)) {
    return `Un esempio pratico aiuta sempre!`
  }
  return `Ho letto il tuo messaggio ("${testo}") in merito a "${topic}", dimmi che aspetto in particolare vorresti approfondire!`
}

app.get("/api/projects", (req, res) => {
  database.tuttiProgetti((err, progetti) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    res.status(200).json(progetti)
  })
})

app.post("/api/projects", (req, res) => {
  if (typeof req.body.name !== "string" || req.body.name.trim().length === 0) {
    return res.status(400).json({ error: "Nome del progetto obbligatorio" })
  }

  const nome = req.body.name.trim()
  const descrizione = typeof req.body.description === "string" ? req.body.description.trim() : ""

  database.creaProgetto(nome, descrizione, (err, prog) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    res.status(201).location(`/api/projects/${prog.id}`).json(prog)
  })
})

app.get("/api/projects/:projectId", (req, res) => {
  const id = Number(req.params.projectId)

  database.progettoPerId(id, (err, prog) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    if (!prog) return res.status(404).json({ error: "Progetto non trovato" })
    res.status(200).json(prog)
  })
})

app.patch("/api/projects/:projectId", (req, res) => {
  const id = Number(req.params.projectId)

  if (typeof req.body.name !== "string" || req.body.name.trim().length === 0) {
    return res.status(400).json({ error: "Nome del progetto obbligatorio" })
  }

  const nome = req.body.name.trim()
  const descrizione = typeof req.body.description === "string" ? req.body.description.trim() : ""

  database.aggiornaProgetto(id, { name: nome, description: descrizione }, (err, prog) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    if (!prog) return res.status(404).json({ error: "Progetto non trovato" })
    res.status(200).json(prog)
  })
})

app.delete("/api/projects/:projectId", (req, res) => {
  const id = Number(req.params.projectId)

  database.eliminaProgetto(id, (err, eliminato) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    if (!eliminato) return res.status(404).json({ error: "Progetto non trovato" })
    res.status(204).end()
  })
})

app.get("/api/projects/:projectId/conversations", (req, res) => {
  const id = Number(req.params.projectId)
  const filtri = {
    soloPreferiti: req.query.favorite === "true",
    conArchiviate: req.query.includeArchived === "true",
    soloArchiviate: req.query.archivedOnly === "true"
  }

  database.progettoPerId(id, (err, prog) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    if (!prog) return res.status(404).json({ error: "Progetto non trovato" })

    database.convProgetto(id, filtri, (err2, conversazioni) => {
      if (err2) {
        console.error(err2)
        return res.status(500).json({ error: "Errore database" })
      }
      res.status(200).json(conversazioni)
    })
  })
})

app.post("/api/projects/:projectId/conversations", (req, res) => {
  const id = Number(req.params.projectId)

  if (typeof req.body.topic !== "string" || req.body.topic.trim().length === 0) {
    return res.status(400).json({ error: "Topic obbligatorio" })
  }

  const topic = req.body.topic.trim()

  database.progettoPerId(id, (err, prog) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    if (!prog) return res.status(404).json({ error: "Progetto non trovato" })

    database.creaConversazione(id, topic, (err2, conv) => {
      if (err2) {
        console.error(err2)
        return res.status(500).json({ error: "Errore database" })
      }
      res.status(201).location(`/api/conversations/${conv.id}`).json(conv)
    })
  })
})

app.get("/api/conversations/:conversationId", (req, res) => {
  const id = Number(req.params.conversationId)

  database.conversazionePerId(id, (err, conv) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    if (!conv) return res.status(404).json({ error: "Conversazione non trovata" })
    res.status(200).json(conv)
  })
})

app.patch("/api/conversations/:conversationId", (req, res) => {
  const id = Number(req.params.conversationId)
  const campi = {}

  if (req.body.topic !== undefined) {
    if (typeof req.body.topic !== "string" || req.body.topic.trim().length === 0) {
      return res.status(400).json({ error: "Il topic non può essere vuoto" })
    }
    campi.topic = req.body.topic.trim()
  }

  if (req.body.isFavorite !== undefined) campi.isFavorite = Boolean(req.body.isFavorite)
  if (req.body.isArchived !== undefined) campi.isArchived = Boolean(req.body.isArchived)

  database.aggiornaConversazione(id, campi, (err, conv) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    if (!conv) return res.status(404).json({ error: "Conversazione non trovata" })
    res.status(200).json(conv)
  })
})

app.delete("/api/conversations/:conversationId", (req, res) => {
  const id = Number(req.params.conversationId)

  database.eliminaConversazione(id, (err, eliminato) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    if (!eliminato) return res.status(404).json({ error: "Conversazione non trovata" })
    res.status(204).end()
  })
})

app.get("/api/conversations/:conversationId/messages", (req, res) => {
  const id = Number(req.params.conversationId)

  database.conversazionePerId(id, (err, conv) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    if (!conv) return res.status(404).json({ error: "Conversazione non trovata" })

    database.messaggiConv(id, (err2, messaggi) => {
      if (err2) {
        console.error(err2)
        return res.status(500).json({ error: "Errore database" })
      }
      res.status(200).json(messaggi)
    })
  })
})

app.post("/api/conversations/:conversationId/messages", (req, res) => {
  const id = Number(req.params.conversationId)

  if (typeof req.body.content !== "string" || req.body.content.trim().length === 0) {
    return res.status(400).json({ error: "Il messaggio non può essere vuoto" })
  }

  const testo = req.body.content.trim()

  database.conversazionePerId(id, (err, conv) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    if (!conv) return res.status(404).json({ error: "Conversazione non trovata" })

    database.creaMessaggio(id, "user", testo, (err2, msgUtente) => {
      if (err2) {
        console.error(err2)
        return res.status(500).json({ error: "Errore database" })
      }

      const testoBot = rispostaBot(testo, conv.topic)

      database.creaMessaggio(id, "bot", testoBot, (err3, msgBot) => {
        if (err3) {
          console.error(err3)
          return res.status(500).json({ error: "Errore database" })
        }

        database.aggiornaTimestamp(id, () => {
          res.status(201).json({ msgUtente, msgBot })
        })
      })
    })
  })
})

app.get("/api/search", (req, res) => {
  const q = req.query.q

  if (typeof q !== "string" || q.trim().length === 0) {
    return res.status(400).json({ error: "Parametro q obbligatorio" })
  }

  database.cerca(q.trim(), (err, risultati) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Errore database" })
    }
    res.status(200).json(risultati)
  })
})

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Risorsa non trovata" })
})

app.listen(port, () => {
  console.log(`ConversAI server listening at http://localhost:${port}`)
})
