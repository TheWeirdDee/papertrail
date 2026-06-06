;; PaperTrail — Document Verification Contract
;; Deployed on: Stacks Mainnet
;;
;; Registers SHA-256 document fingerprints onchain.
;; The document itself never touches this contract — only the hash.
;; Anyone can verify a document for free. Registration costs 0.05 STX.
;;
;; Write functions (cost STX gas + platform fee):
;;   register-document — store hash + metadata, collect 0.05 STX
;;   revoke-document   — mark registration as revoked (owner only)
;;
;; Read functions (free, no gas):
;;   get-document           — full registration data by hash
;;   get-document-count     — total registrations by owner
;;   is-registered          — boolean check
;;   is-revoked             — boolean check

;; ─── Constants ───────────────────────────────────────────────────────────────

(define-constant CONTRACT-OWNER tx-sender)
(define-constant REGISTRATION-FEE u50000)  ;; 0.05 STX in microSTX

;; Error codes
(define-constant ERR-NOT-OWNER (err u100))
(define-constant ERR-ALREADY-REGISTERED (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-ALREADY-REVOKED (err u103))
(define-constant ERR-INVALID-CATEGORY (err u104))
(define-constant ERR-TITLE-TOO-LONG (err u105))
(define-constant ERR-INSUFFICIENT-FEE (err u106))
(define-constant ERR-NOT-DOCUMENT-OWNER (err u107))

;; Document categories
;; 1 = Education (certificates, degrees, transcripts)
;; 2 = Professional (employment letters, contracts)
;; 3 = Financial (receipts, invoices, agreements)
;; 4 = Property (tenancy, land documents)
;; 5 = General (anything else)

;; ─── Data Maps ───────────────────────────────────────────────────────────────

;; Main document registry
;; Key: SHA-256 hash as 32-byte buffer
;; Value: full registration record
(define-map documents
  { hash: (buff 32) }
  {
    owner: principal,
    title: (string-ascii 100),
    category: uint,
    registered-at: uint,        ;; block height
    registered-at-time: uint,   ;; block timestamp (burn-block-time)
    is-revoked: bool,
    revoked-at: (optional uint) ;; block height of revocation
  }
)

;; Track document count per owner for pagination
(define-map owner-document-count
  { owner: principal }
  { count: uint }
)

;; Index: owner → list of hashes (max 200 per owner for now)
;; Used to fetch all documents for a wallet
(define-map owner-documents
  { owner: principal, index: uint }
  { hash: (buff 32) }
)

;; ─── Data Variables ───────────────────────────────────────────────────────────

(define-data-var total-registrations uint u0)
(define-data-var total-unique-owners uint u0)

;; ─── Private Helpers ─────────────────────────────────────────────────────────

(define-private (is-valid-category (category uint))
  (and (>= category u1) (<= category u5))
)

(define-private (increment-owner-count (owner principal))
  (let (
    (current-count (default-to u0 (get count (map-get? owner-document-count { owner: owner }))))
  )
    (map-set owner-document-count
      { owner: owner }
      { count: (+ current-count u1) }
    )
    current-count  ;; return old count (used as index for owner-documents)
  )
)

;; ─── Write Functions ──────────────────────────────────────────────────────────

;; Register a document hash onchain.
;; Caller must pay 0.05 STX registration fee.
;; The hash must be unique — same document cannot be registered twice.
;;
;; @param hash     SHA-256 hash of the document as 32-byte buffer
;; @param title    Human-readable document title (max 100 chars)
;; @param category Document category uint (1-5)
(define-public (register-document
  (hash (buff 32))
  (title (string-ascii 100))
  (category uint)
)
  (let (
    (existing (map-get? documents { hash: hash }))
    (owner-index (increment-owner-count tx-sender))
  )
    ;; Validate: not already registered
    (asserts! (is-none existing) ERR-ALREADY-REGISTERED)

    ;; Validate: category is 1-5
    (asserts! (is-valid-category category) ERR-INVALID-CATEGORY)

    ;; Collect registration fee — transfer 0.05 STX to contract owner
    (try! (stx-transfer? REGISTRATION-FEE tx-sender CONTRACT-OWNER))

    ;; Store the document registration
    (map-set documents
      { hash: hash }
      {
        owner: tx-sender,
        title: title,
        category: category,
        registered-at: block-height,
        registered-at-time: burn-block-time,
        is-revoked: false,
        revoked-at: none
      }
    )

    ;; Add to owner's document index
    (map-set owner-documents
      { owner: tx-sender, index: owner-index }
      { hash: hash }
    )

    ;; Increment global counter
    (var-set total-registrations (+ (var-get total-registrations) u1))

    ;; Increment unique owner count if first registration
    (if (is-eq owner-index u0)
      (var-set total-unique-owners (+ (var-get total-unique-owners) u1))
      true
    )

    (ok true)
  )
)

;; Revoke a document registration.
;; Only the original owner can revoke.
;; Revocation is permanent — cannot be un-revoked.
;; The registration stays onchain — revocation is transparent.
;;
;; @param hash SHA-256 hash of the document to revoke
(define-public (revoke-document (hash (buff 32)))
  (let (
    (doc (unwrap! (map-get? documents { hash: hash }) ERR-NOT-FOUND))
  )
    ;; Only owner can revoke
    (asserts! (is-eq tx-sender (get owner doc)) ERR-NOT-DOCUMENT-OWNER)

    ;; Cannot revoke an already-revoked document
    (asserts! (not (get is-revoked doc)) ERR-ALREADY-REVOKED)

    ;; Update revocation status
    (map-set documents
      { hash: hash }
      (merge doc {
        is-revoked: true,
        revoked-at: (some block-height)
      })
    )

    (ok true)
  )
)

;; ─── Read Functions (free) ────────────────────────────────────────────────────

;; Get full document registration data by hash.
;; Returns none if document is not registered.
;;
;; @param hash SHA-256 hash of the document
(define-read-only (get-document (hash (buff 32)))
  (map-get? documents { hash: hash })
)

;; Simple boolean check — is this hash registered?
;;
;; @param hash SHA-256 hash of the document
(define-read-only (is-registered (hash (buff 32)))
  (is-some (map-get? documents { hash: hash }))
)

;; Simple boolean check — is this registration revoked?
;; Returns false if document is not registered at all.
;;
;; @param hash SHA-256 hash of the document
(define-read-only (is-revoked (hash (buff 32)))
  (match (map-get? documents { hash: hash })
    doc (get is-revoked doc)
    false
  )
)

;; Get total number of documents registered by a wallet.
;;
;; @param owner Stacks principal (wallet address)
(define-read-only (get-document-count (owner principal))
  (default-to u0 (get count (map-get? owner-document-count { owner: owner })))
)

;; Get a document hash from an owner's index.
;; Use with get-document-count to paginate through owner's documents.
;;
;; @param owner Stacks principal
;; @param index Zero-based index (0 to count-1)
(define-read-only (get-owner-document-at (owner principal) (index uint))
  (map-get? owner-documents { owner: owner, index: index })
)

;; Get platform-wide stats.
(define-read-only (get-stats)
  {
    total-registrations: (var-get total-registrations),
    total-unique-owners: (var-get total-unique-owners)
  }
)

;; Get current registration fee in microSTX.
(define-read-only (get-registration-fee)
  REGISTRATION-FEE
)

;; ─── Admin ────────────────────────────────────────────────────────────────────

;; Contract owner can withdraw accumulated fees.
;; Fees are sent directly to CONTRACT-OWNER on each registration,
;; so this function is a safety fallback for any STX sent directly.
(define-public (withdraw-fees)
  (let (
    (balance (stx-get-balance (as-contract tx-sender)))
  )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (if (> balance u0)
      (as-contract (stx-transfer? balance tx-sender CONTRACT-OWNER))
      (ok true)
    )
  )
)

;; ─── DEPLOYMENT NOTES ─────────────────────────────────────────────────────────
;;
;; Network:    Stacks Mainnet
;; Fee:        0.05 STX per registration (50000 microSTX)
;;             Sent directly to CONTRACT-OWNER (tx-sender at deploy time)
;;
;; Deploy with Clarinet:
;;   clarinet deployments apply --mainnet
;;
;; Or with CLI:
;;   stx deploy_contract papertrail ./contracts/papertrail.clar \
;;     --network mainnet --fee 2000
;;
;; After deploy, update these files:
;;   - src/config.ts          (CONTRACT_ADDRESS, CONTRACT_NAME)
;;   - src/lib/stacks.ts      (contract calls reference)
;;   - .env.local             (NEXT_PUBLIC_CONTRACT_ADDRESS)
;;
;; Stacks Explorer verification:
;;   https://explorer.stacks.co/txid/[DEPLOY_TX_ID]?chain=mainnet
;;
;; Category reference for frontend:
;;   1 = Education
;;   2 = Professional
;;   3 = Financial
;;   4 = Property
;;   5 = General
;;
;; Gas model:
;;   Users pay STX gas for write transactions (register, revoke).
;;   This is intentional — STX gas spend is tracked by Talent Protocol
;;   as onchain activity. Do NOT use sponsored transactions.
;;   Read functions (get-document, is-registered, etc.) are always free.
;;
;; Frontend hash generation:
;;   Use Web Crypto API (SHA-256) in the browser.
;;   Convert hex string to 32-byte Uint8Array before passing to contract.
;;   The document file never leaves the user's browser.
;;
;;   Example (TypeScript):
;;   const buffer = await crypto.subtle.digest('SHA-256', fileArrayBuffer)
;;   const hashArray = new Uint8Array(buffer)  // 32 bytes → pass as (buff 32)
;;
;; ─────────────────────────────────────────────────────────────────────────────
