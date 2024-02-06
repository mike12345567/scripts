const fs = require("fs")
const fetch = require("node-fetch")

const commands = ["--download", "--upload"]

function error(msg) {
  console.error(msg)
  process.exit(-1)
}

let command, DB, filename, url
function processArgs() {
  const args = process.argv
  let gettingDb, gettingUrl
  for (let arg of args) {
    if (gettingUrl) {
      gettingUrl = false
      url = arg
    } else if (gettingDb) {
      gettingDb = false
      DB = arg
    } else if (commands.includes(arg)) {
      command = arg
      gettingDb = true
    } else if (arg === "--url") {
      gettingUrl = true
    }
    filename = process.argv[process.argv.length - 1]
  }
}

function usage() {
  const which = command.includes("down") ? "--download" : "--upload"
  console.log(`Usage: couch-dl --url http://user:pass@localhost:5984 ${which} global-db file.txt`)
}

processArgs()
let downloading, uploading
if (command === "--download") {
  downloading = true
} else if (command === "--upload") {
  uploading = true
} else {
  usage()
  error("Incorrect command, must be either --download or --upload")
}
if (!DB) {
  usage()
  error(`Please supply a database name as the parameter to ${command}`)
}
if (!url) {
  usage()
  error("Please supply a URL to connect to")
}
if (!filename) {
  usage()
  error("Please supply a filename as final parameter")
}

async function couchRequest(path, { method, body } = { method: "GET" }) {
  const fullPath = `${url}/${DB}/${path}`
  const opts = {
    method,
    headers: {},
  }
  if (body) {
    opts.body = JSON.stringify(body)
    opts.headers["Content-Type"] = "application/json"
  }
  const response = await fetch(fullPath, opts)
  if (response.status > 300) {
    error(await response.text())
  }
  return await response.json()
}

async function run() {
  if (command === "--download") {
    const data = await couchRequest("_all_docs", {
      method: "POST",
      body: { include_docs: true }
    })
    const docs = data.rows.map(data => data["doc"])
    fs.writeFileSync(filename, docs.map(doc => JSON.stringify(doc)).join("\n"))
    console.log(`${filename} created with ${docs.length} documents.`)
  } else if (command === "--upload") {
    const docs = fs.readFileSync(filename, "utf-8")
      .split("\n")
      .map(doc => {
        const json = JSON.parse(doc)
        // remove any old revisions
        delete json["_rev"]
        return json
      })
    // create the DB
    await couchRequest("", {
      method: "PUT",
    })
    await couchRequest("_bulk_docs", {
      method: "POST",
      body: {
        docs,
      },
    })
    console.log(`${DB} created successfully and ${docs.length} documents uploaded.`)
  }
}

run()
