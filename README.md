# SafeNet Blacklist - lokaal draaien

Installatie:
```bash
# zet node en npm klaar
npm install
npm start
```

Open in je browser: http://localhost:3000

Admin:
- Default admin-code: `gKY5u7y62013`
- Je kunt de admin-code aanpassen door environment variable te zetten:
  - Mac/Linux: `ADMIN_CODE=nieuweCode npm start`
  - Windows (PowerShell): `$env:ADMIN_CODE='nieuweCode'; npm start`

Simpelere opslag:
- Meldingen worden opgeslagen in `reports.json`.
- Foto's worden opgeslagen in de map `uploads/`.

Veiligheid & volgende stappen (aanbevelingen):
- Gebruik een echte database (Postgres, MongoDB).
- Voeg validatie en bestandstype-controles toe.
- Voeg hogere permissies/2FA toe voor admin.
- Bescherm uploads tegen malware/virussen.
- Gebruik HTTPS bij publieke hosting.
