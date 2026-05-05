# Encrypted Reflections

## Threat model
Optional reflections may include sensitive personal health details. The goal is to let a client keep those notes private even when support storage is enabled.

## Design
- Reflections are **off by default**.
- When enabled, the browser derives a key from the user's client secret code and a per-user salt using **scrypt**.
- The browser encrypts the reflection with **AES-GCM** before sending it to the server.
- The server stores only ciphertext and metadata.
- The server does not receive the client secret code and cannot decrypt the reflection.

## Stored metadata
For each encrypted reflection, the server stores:
- ciphertext
- KDF metadata
- salt
- IV

## Important caveats
- There is no secret recovery flow.
- If the client secret is lost, the reflection cannot be decrypted.
- This protects stored reflections, not content already exposed outside the browser.
