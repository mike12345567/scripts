## Couch Download/Upload script

Quick script for Linux based systems, portable binary built with pkg under `couch-dl`

Can be used to extract a single database with:
`./couch-dl --url http://user:pass@localhost:5984 --download database-name file.txt`

Or can be used to upload:
`/couch-dl --url http://user:pass@localhost:5984 --upload database-name file.txt`

The database must exist to download and must not exist to upload.
