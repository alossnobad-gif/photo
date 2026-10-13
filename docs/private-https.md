# Personal login and HTTPS

This deployment uses nginx HTTP Basic authentication for **every** HTTPS path, including photos, downloads, settings, APIs and static files. Production Node listens only on 127.0.0.1; do not add another public reverse proxy without authentication. Inspect other enabled nginx sites for proxies or aliases exposing this app. HTTP redirects to the fixed configured IP and never asks for passwords.

On Ubuntu ECS, install the updated server/index.js and run:

```bash
sudo bash scripts/setup-private-https.sh 123.57.60.66
```

Choose a username and password locally; never post secrets in chat. The password is stored as a bcrypt hash under /etc/nature-photo-security/passwords. Re-running replaces the single account and keeps the existing certificate for the same IP. Basic authentication uses the browser's login prompt rather than an application login page. To end a session close all private browsing windows; browsers may retain credentials in normal windows.

With no domain, the script generates a self-signed IP certificate valid for 365 days. Encryption is enabled but browsers do not automatically trust this certificate. Compare its SHA-256 fingerprint to the terminal output through the already trusted ECS console before accepting it, or install the certificate in your own devices' trust store. Do not blindly accept certificates on other sites. Before expiration renew the certificate and update device trust; this script does not automatically renew certificates. A CA-trusted certificate can replace this once a suitable domain or supported IP certificate issuance method is configured.

Security group: allow TCP 443 for intended users (public access is appropriate only after verifying login protection); TCP 80 only redirects. Do not expose port 3000. Leave SSH access rules intact. This nginx script targets /etc/nginx/sites-available/nature-photo; keep its existing enabled symlink. It makes a timestamped backup in /etc/nature-photo-security. It does not change photographs or .data.

Verify before allowing public access:

- Open https://123.57.60.66 in a private window: login must be required.
- Anonymous requests to /api/library and an existing /photos/... path must return 401.
- After login verify upload, library, settings and delete operations.
- `ss -lntp` must show application port 3000 on 127.0.0.1 only.
- Check `sudo nginx -T` locally for any other proxy/alias exposing this app.

Local validation in Codex checks Node behavior and script syntax. Actual nginx config validation and service restart happen on ECS via the setup script. A browser-trusted public certificate is not provisioned by this script.
