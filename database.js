const sqlite3 = require("sqlite3").verbose()
const db = new sqlite3.Database("data/app.sqlite")

db.run(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL,
    topic TEXT NOT NULL,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`)

function toProgetto(riga) {
  return {
    id: riga.id,
    name: riga.name,
    description: riga.description,
    createdAt: riga.created_at,
    updatedAt: riga.updated_at
  }
}

function toConversazione(riga) {
  return {
    id: riga.id,
    projectId: riga.project_id,
    topic: riga.topic,
    isFavorite: Boolean(riga.is_favorite),
    isArchived: Boolean(riga.is_archived),
    createdAt: riga.created_at,
    updatedAt: riga.updated_at
  }
}

function toMessaggio(riga) {
  return {
    id: riga.id,
    conversationId: riga.conversation_id,
    role: riga.role,
    content: riga.content,
    createdAt: riga.created_at
  }
}

function tuttiProgetti(callback) {
  db.all(
    "SELECT id, name, description, created_at, updated_at FROM projects ORDER BY created_at DESC",
    (err, righe) => {
      if (err) return callback(err)
      callback(null, righe.map(toProgetto))
    }
  )
}

function progettoPerId(id, callback) {
  db.get(
    "SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ?",
    [id],
    (err, riga) => {
      if (err) return callback(err)
      callback(null, riga ? toProgetto(riga) : null)
    }
  )
}

function creaProgetto(nome, descrizione, callback) {
  const ora = new Date().toISOString()
  db.run(
    "INSERT INTO projects (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)",
    [nome, descrizione, ora, ora],
    function (err) {
      if (err) return callback(err)
      callback(null, { id: this.lastID, name: nome, description: descrizione, createdAt: ora, updatedAt: ora })
    }
  )
}

function aggiornaProgetto(id, campi, callback) {
  const ora = new Date().toISOString()

  progettoPerId(id, (err, prog) => {
    if (err) return callback(err)
    if (!prog) return callback(null, null)

    db.run(
      "UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?",
      [campi.name, campi.description, ora, id],
      err2 => {
        if (err2) return callback(err2)
        progettoPerId(id, callback)
      }
    )
  })
}

function cancellaMessaggi(idConv, callback) {
  db.run(
    "DELETE FROM messages WHERE conversation_id = ?",
    [idConv],
    err => callback(err || null)
  )
}

function eliminaConvEMsg(idProg, lista, callback) {
  let rimanenti = lista.length
  let fallito = false

  if (rimanenti === 0) return cancellaConvProgetto(idProg, callback)

  for (const conv of lista) {
    cancellaMessaggi(conv.id, err => {
      if (fallito) return
      if (err) {
        fallito = true
        return callback(err)
      }
      rimanenti -= 1
      if (rimanenti === 0) cancellaConvProgetto(idProg, callback)
    })
  }
}

function cancellaConvProgetto(idProg, callback) {
  db.run(
    "DELETE FROM conversations WHERE project_id = ?",
    [idProg],
    err => callback(err || null)
  )
}

function eliminaProgetto(id, callback) {
  progettoPerId(id, (err, prog) => {
    if (err) return callback(err)
    if (!prog) return callback(null, false)

    convProgetto(id, { soloPreferiti: false, conArchiviate: true, soloArchiviate: false }, (err2, lista) => {
      if (err2) return callback(err2)

      eliminaConvEMsg(id, lista, err3 => {
        if (err3) return callback(err3)

        db.run(
          "DELETE FROM projects WHERE id = ?",
          [id],
          err4 => {
            if (err4) return callback(err4)
            callback(null, true)
          }
        )
      })
    })
  })
}

function convProgetto(id, filtri, callback) {
  let sql = `
    SELECT id, project_id, topic, is_favorite, is_archived, created_at, updated_at
    FROM conversations
    WHERE project_id = ?
  `
  const params = [id]

  if (filtri.soloPreferiti) sql += " AND is_favorite = 1"

  if (filtri.soloArchiviate) {
    sql += " AND is_archived = 1"
  } else if (!filtri.conArchiviate) {
    sql += " AND is_archived = 0"
  }

  sql += " ORDER BY updated_at DESC"

  db.all(sql, params, (err, righe) => {
    if (err) return callback(err)
    callback(null, righe.map(toConversazione))
  })
}

function conversazionePerId(id, callback) {
  db.get(
    "SELECT id, project_id, topic, is_favorite, is_archived, created_at, updated_at FROM conversations WHERE id = ?",
    [id],
    (err, riga) => {
      if (err) return callback(err)
      callback(null, riga ? toConversazione(riga) : null)
    }
  )
}

function creaConversazione(idProg, topic, callback) {
  const ora = new Date().toISOString()
  db.run(
    "INSERT INTO conversations (project_id, topic, is_favorite, is_archived, created_at, updated_at) VALUES (?, ?, 0, 0, ?, ?)",
    [idProg, topic, ora, ora],
    function (err) {
      if (err) return callback(err)
      callback(null, {
        id: this.lastID,
        projectId: idProg,
        topic,
        isFavorite: false,
        isArchived: false,
        createdAt: ora,
        updatedAt: ora
      })
    }
  )
}

function aggiornaConversazione(id, campi, callback) {
  const ora = new Date().toISOString()

  conversazionePerId(id, (err, conv) => {
    if (err) return callback(err)
    if (!conv) return callback(null, null)

    const topic = campi.topic !== undefined ? campi.topic : conv.topic
    const isFavorite = campi.isFavorite !== undefined ? campi.isFavorite : conv.isFavorite
    const isArchived = campi.isArchived !== undefined ? campi.isArchived : conv.isArchived

    db.run(
      "UPDATE conversations SET topic = ?, is_favorite = ?, is_archived = ?, updated_at = ? WHERE id = ?",
      [topic, isFavorite ? 1 : 0, isArchived ? 1 : 0, ora, id],
      err2 => {
        if (err2) return callback(err2)
        conversazionePerId(id, callback)
      }
    )
  })
}

function eliminaConversazione(id, callback) {
  conversazionePerId(id, (err, conv) => {
    if (err) return callback(err)
    if (!conv) return callback(null, false)

    cancellaMessaggi(id, err2 => {
      if (err2) return callback(err2)

      db.run(
        "DELETE FROM conversations WHERE id = ?",
        [id],
        err3 => {
          if (err3) return callback(err3)
          callback(null, true)
        }
      )
    })
  })
}

function tutteConversazioni(callback) {
  db.all(
    "SELECT id, project_id, topic, is_favorite, is_archived, created_at, updated_at FROM conversations",
    (err, righe) => {
      if (err) return callback(err)
      callback(null, righe.map(toConversazione))
    }
  )
}

function messaggiConv(id, callback) {
  db.all(
    "SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC",
    [id],
    (err, righe) => {
      if (err) return callback(err)
      callback(null, righe.map(toMessaggio))
    }
  )
}

function creaMessaggio(idConv, ruolo, testo, callback) {
  const ora = new Date().toISOString()
  db.run(
    "INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)",
    [idConv, ruolo, testo, ora],
    function (err) {
      if (err) return callback(err)
      callback(null, { id: this.lastID, conversationId: idConv, role: ruolo, content: testo, createdAt: ora })
    }
  )
}

function aggiornaTimestamp(id, callback) {
  const ora = new Date().toISOString()
  db.run(
    "UPDATE conversations SET updated_at = ? WHERE id = ?",
    [ora, id],
    err => callback(err || null)
  )
}

function tuttiMessaggi(callback) {
  db.all(
    "SELECT id, conversation_id, role, content, created_at FROM messages",
    (err, righe) => {
      if (err) return callback(err)
      callback(null, righe.map(toMessaggio))
    }
  )
}

function cercaStringa(testo, query) {
  if (query.length === 0) return true

  for (let i = 0; i <= testo.length - query.length; i += 1) {
    let trovato = true

    for (let j = 0; j < query.length; j += 1) {
      if (testo[i + j] !== query[j]) {
        trovato = false
      }
    }

    if (trovato) return true
  }

  return false
}

function cerca(query, callback) {
  tuttiProgetti((err, progetti) => {
    if (err) return callback(err)

    tutteConversazioni((err2, conversazioni) => {
      if (err2) return callback(err2)

      tuttiMessaggi((err3, messaggi) => {
        if (err3) return callback(err3)

        const rProj = []
        const rConv = []
        const rMsg = []

        for (const prog of progetti) {
          const descr = prog.description || ""
          if (cercaStringa(prog.name, query) || cercaStringa(descr, query)) {
            rProj.push({
              projId: prog.id,
              nome: prog.name,
              descrizione: prog.description
            })
          }
        }

        for (const conv of conversazioni) {
          if (cercaStringa(conv.topic, query)) {
            const prog = progetti.find(p => p.id === conv.projectId)
            if (prog) {
              rConv.push({
                convId: conv.id,
                topic: conv.topic,
                projId: prog.id,
                nome: prog.name
              })
            }
          }
        }

        for (const msg of messaggi) {
          if (cercaStringa(msg.content, query)) {
            const conv = conversazioni.find(c => c.id === msg.conversationId)
            if (conv) {
              const prog = progetti.find(p => p.id === conv.projectId)
              if (prog) {
                rMsg.push({
                  msgId: msg.id,
                  testo: msg.content,
                  ruolo: msg.role,
                  convId: conv.id,
                  topic: conv.topic,
                  projId: prog.id,
                  nome: prog.name
                })
              }
            }
          }
        }

        callback(null, { progetti: rProj, conversazioni: rConv, messaggi: rMsg })
      })
    })
  })
}

module.exports = {
  tuttiProgetti,
  progettoPerId,
  creaProgetto,
  aggiornaProgetto,
  eliminaProgetto,
  convProgetto,
  conversazionePerId,
  creaConversazione,
  aggiornaConversazione,
  eliminaConversazione,
  messaggiConv,
  creaMessaggio,
  aggiornaTimestamp,
  cerca
}
