# ConversAI

Progetto per il corso di Applicazioni Web (A.A. 2025/26).

Un'app web per gestire conversazioni con un assistente simulato. Le conversazioni sono organizzate in progetti, ognuno con i suoi topic.

## Tecnologie usate

- HTML, CSS, JavaScript vanilla (nessun framework)
- Node.js + Express per il backend
- SQLite con il pacchetto `sqlite3`

## Come avviare

1. Installare le dipendenze:
   ```bash
   npm install
   ```
2. Avviare il server:
   ```bash
   npm start
   ```
3. Aprire il browser su `http://localhost:3000`

Il database viene creato automaticamente al primo avvio. Per ripartire da zero basta eliminare `data/app.sqlite` e riavviare.

## Struttura

```
├── data/               (database SQLite)
├── public/
│   ├── index.html
│   ├── style.css
│   └── client.js
├── database.js         (query SQLite)
├── server.js           (API REST + rispostaBot)
└── package.json
```

## API

| Metodo | Path | Descrizione |
|---|---|---|
| GET | `/api/projects` | Lista progetti |
| POST | `/api/projects` | Crea progetto |
| GET | `/api/projects/:id` | Dettaglio progetto |
| PATCH | `/api/projects/:id` | Modifica progetto |
| DELETE | `/api/projects/:id` | Elimina progetto |
| GET | `/api/projects/:id/conversations` | Lista conversazioni |
| POST | `/api/projects/:id/conversations` | Crea conversazione |
| GET | `/api/conversations/:id` | Dettaglio conversazione |
| PATCH | `/api/conversations/:id` | Modifica conversazione |
| DELETE | `/api/conversations/:id` | Elimina conversazione |
| GET | `/api/conversations/:id/messages` | Lista messaggi |
| POST | `/api/conversations/:id/messages` | Invia messaggio |
| GET | `/api/search?q=...` | Ricerca globale |

## Note

- La ricerca (`cerca` in `database.js`) carica tutte le righe in memoria e le filtra in JavaScript con `cercaStringa`, un confronto carattere per carattere.
- La risposta del bot è generata da `rispostaBot` in `server.js` con ricerca di parole chiave.
- L'eliminazione di progetti e conversazioni richiede un doppio click per confermare.
- I messaggi hanno `role` uguale a `"user"` o `"bot"`.
