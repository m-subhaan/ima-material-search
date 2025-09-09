// srv/server.js
const cds = require('@sap/cds')

cds.on('bootstrap', app => {
  const cors = require('cors')
  app.use(cors({
    origin: ["http://localhost:8080", "http://127.0.0.1:8080"],
    credentials: true
  }))
})

module.exports = cds.server
