;; PaperTrail - Document Verification Contract
;; Deployed on: Stacks Mainnet
;;
;; Registers SHA-256 document fingerprints onchain.
;; The document itself never touches this contract - only the hash.
;; Anyone can verify a document for free. Registration costs 0.05 STX.
;;
;; Write functions (cost STX gas + platform fee):
;;   register-document - store hash + metadata, collect 0.05 STX
;;   revoke-document   - mark registration as revoked (owner only)
;;
;; Read functions (free, no gas):
;;   get-document       - full registration data by hash
;;   get-document-count - total registrations by owner
;;   is-registered      - boolean check
;;   is-revoked         - boolean check

;; --- Constants ---

(define-constant CONTRACT-OWNER tx-sender)
(define-constant REGISTRATION-FEE u50000) ;; 0.05 STX in microSTX

;; Error codes
(define-constant ERR-ALREADY-REGISTERED (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-ALREADY-REVOKED (err u103))
(define-constant ERR-INVALID-CATEGORY (err u104))
(define-constant ERR-NOT-DOCUMENT-OWNER (err u107))

;; Document categories
;; 1 = Education (certificates, degrees, transcripts)
;; 2 = Professional (employment letters, contracts)
;; 3 = Financial (receipts, invoices, agreements)
;; 4 = Property (tenancy, land documents)
;; 5 = General (anything else)

;; --- Data Maps ---

;; Main document registry
;; Key: SHA-256 hash as 32-byte buffer
(define-map documents
  { hash: (buff 32) }
  {
    owner: principal,
    title: (string-ascii 100),
    category: uint,
    registered-at: uint,
    is-revoked: bool,
    revoked-at: (optional uint)
  }
)

;; Track document count per owner for pagination
(define-map owner-document-count
  { owner: principal }
  { count: uint }
)

;; Index: owner -> list of hashes (max 200 per owner)
(define-map owner-documents
  { owner: principal, index: uint }
  { hash: (buff 32) }
)

;; --- Data Variables ---

(define-data-var total-registrations uint u0)
(define-data-var total-unique-owners uint u0)

;; --- Private Helpers ---

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
    current-count
  )
)

;; --- Write Functions ---

;; Register a document hash onchain.
;; Caller must pay 0.05 STX registration fee.
;; The hash must be unique - same document cannot be registered twice.
(define-public (register-document
  (hash (buff 32))
  (title (string-ascii 100))
  (category uint)
)
  (let (
    (existing (map-get? documents { hash: hash }))
    (owner-index (increment-owner-count tx-sender))
  )
    (asserts! (is-none existing) ERR-ALREADY-REGISTERED)
    (asserts! (is-valid-category category) ERR-INVALID-CATEGORY)

    (try! (stx-transfer? REGISTRATION-FEE tx-sender CONTRACT-OWNER))

    (map-set documents
      { hash: hash }
      {
        owner: tx-sender,
        title: title,
        category: category,
        registered-at: stacks-block-height,
        is-revoked: false,
        revoked-at: none
      }
    )

    (map-set owner-documents
      { owner: tx-sender, index: owner-index }
      { hash: hash }
    )

    (var-set total-registrations (+ (var-get total-registrations) u1))

    (if (is-eq owner-index u0)
      (var-set total-unique-owners (+ (var-get total-unique-owners) u1))
      true
    )

    (ok true)
  )
)

;; Revoke a document registration.
;; Only the original owner can revoke. Revocation is permanent.
(define-public (revoke-document (hash (buff 32)))
  (let (
    (doc (unwrap! (map-get? documents { hash: hash }) ERR-NOT-FOUND))
  )
    (asserts! (is-eq tx-sender (get owner doc)) ERR-NOT-DOCUMENT-OWNER)
    (asserts! (not (get is-revoked doc)) ERR-ALREADY-REVOKED)

    (map-set documents
      { hash: hash }
      (merge doc {
        is-revoked: true,
        revoked-at: (some stacks-block-height)
      })
    )

    (ok true)
  )
)

;; --- Read Functions (free) ---

(define-read-only (get-document (hash (buff 32)))
  (map-get? documents { hash: hash })
)

(define-read-only (is-registered (hash (buff 32)))
  (is-some (map-get? documents { hash: hash }))
)

(define-read-only (is-revoked (hash (buff 32)))
  (match (map-get? documents { hash: hash })
    doc (get is-revoked doc)
    false
  )
)

(define-read-only (get-document-count (owner principal))
  (default-to u0 (get count (map-get? owner-document-count { owner: owner })))
)

(define-read-only (get-owner-document-at (owner principal) (index uint))
  (map-get? owner-documents { owner: owner, index: index })
)

(define-read-only (get-stats)
  {
    total-registrations: (var-get total-registrations),
    total-unique-owners: (var-get total-unique-owners)
  }
)

(define-read-only (get-registration-fee)
  REGISTRATION-FEE
)

