;; PaperTrail v2 — Document Verification Contract
;; Stacks Mainnet
;;
;; Changes from v1:
;;   - Registration fee raised to 0.5 STX
;;   - co-sign-document   : cosigner pays 0.25 STX to add their signature
;;   - update-document    : owner pays 0.1 STX to update title / category
;;   - transfer-document  : owner pays 0.25 STX to transfer ownership
;;   - total-stx-collected tracks cumulative STX through the contract
;;
;; Paid write functions:
;;   register-document   0.5  STX  (first-time, unique hash)
;;   co-sign-document    0.25 STX  (cosigner, once per hash per principal)
;;   update-document     0.1  STX  (owner only, not revoked)
;;   transfer-document   0.25 STX  (owner only, not revoked, different principal)
;;   revoke-document     free       (owner only, permanent)
;;
;; Read functions (free, no gas):
;;   get-document, is-registered, is-revoked,
;;   get-document-count, get-owner-document-at,
;;   get-cosigner-count, is-cosigner, get-cosigner-signed-at,
;;   get-stats,
;;   get-registration-fee, get-cosign-fee, get-update-fee, get-transfer-fee

;; ─── Constants ────────────────────────────────────────────────────────────────

(define-constant CONTRACT-OWNER tx-sender)

(define-constant REGISTRATION-FEE u500000)  ;; 0.5  STX
(define-constant COSIGN-FEE       u250000)  ;; 0.25 STX
(define-constant UPDATE-FEE       u100000)  ;; 0.1  STX
(define-constant TRANSFER-FEE     u250000)  ;; 0.25 STX

;; Error codes
(define-constant ERR-ALREADY-REGISTERED   (err u101))
(define-constant ERR-NOT-FOUND            (err u102))
(define-constant ERR-ALREADY-REVOKED      (err u103))
(define-constant ERR-INVALID-CATEGORY     (err u104))
(define-constant ERR-NOT-DOCUMENT-OWNER   (err u107))
(define-constant ERR-ALREADY-COSIGNED     (err u108))
(define-constant ERR-OWNER-CANNOT-COSIGN  (err u109))
(define-constant ERR-DOCUMENT-REVOKED     (err u110))
(define-constant ERR-CANNOT-TRANSFER-SELF (err u111))

;; Categories: 1=Education 2=Professional 3=Financial 4=Property 5=General

;; ─── Data Maps ────────────────────────────────────────────────────────────────

;; Main document registry — keyed by SHA-256 hash (32-byte buffer)
(define-map documents
  { hash: (buff 32) }
  {
    owner:         principal,
    title:         (string-ascii 100),
    category:      uint,
    registered-at: uint,
    is-revoked:    bool,
    revoked-at:    (optional uint)
  }
)

;; Per-owner document count (used as insertion index)
(define-map owner-document-count
  { owner: principal }
  { count: uint }
)

;; Sequential index: owner → hash
(define-map owner-documents
  { owner: principal, index: uint }
  { hash: (buff 32) }
)

;; Co-signer registry: one entry per (hash, cosigner) pair
(define-map document-cosigners
  { hash: (buff 32), cosigner: principal }
  { signed-at: uint }
)

;; Running count of co-signers per document
(define-map document-cosigner-count
  { hash: (buff 32) }
  { count: uint }
)

;; ─── Data Variables ───────────────────────────────────────────────────────────

(define-data-var total-registrations  uint u0)
(define-data-var total-unique-owners  uint u0)
(define-data-var total-stx-collected  uint u0)

;; ─── Private Helpers ─────────────────────────────────────────────────────────

(define-private (is-valid-category (category uint))
  (and (>= category u1) (<= category u5))
)

;; Increments owner's document count and returns the OLD count (used as index).
(define-private (increment-owner-count (owner principal))
  (let (
    (old (default-to u0 (get count (map-get? owner-document-count { owner: owner }))))
  )
    (map-set owner-document-count { owner: owner } { count: (+ old u1) })
    old
  )
)

;; ─── Write Functions ──────────────────────────────────────────────────────────

;; Register a document hash on-chain. Caller pays 0.5 STX.
;; Hash must be unique — same document cannot be registered twice.
(define-public (register-document
  (hash      (buff 32))
  (title     (string-ascii 100))
  (category  uint)
)
  (let (
    (existing    (map-get? documents { hash: hash }))
    (owner-index (increment-owner-count tx-sender))
  )
    (asserts! (is-none existing)              ERR-ALREADY-REGISTERED)
    (asserts! (is-valid-category category)    ERR-INVALID-CATEGORY)

    (try! (stx-transfer? REGISTRATION-FEE tx-sender CONTRACT-OWNER))

    (map-set documents
      { hash: hash }
      {
        owner:         tx-sender,
        title:         title,
        category:      category,
        registered-at: stacks-block-height,
        is-revoked:    false,
        revoked-at:    none
      }
    )

    (map-set owner-documents
      { owner: tx-sender, index: owner-index }
      { hash: hash }
    )

    (var-set total-registrations (+ (var-get total-registrations) u1))
    (var-set total-stx-collected (+ (var-get total-stx-collected) REGISTRATION-FEE))

    (if (is-eq owner-index u0)
      (var-set total-unique-owners (+ (var-get total-unique-owners) u1))
      true
    )

    (ok true)
  )
)

;; Add a co-signature to an existing document. Cosigner pays 0.25 STX.
;; Owner cannot co-sign their own document. Each principal can sign once.
(define-public (co-sign-document (hash (buff 32)))
  (let (
    (doc              (unwrap! (map-get? documents { hash: hash }) ERR-NOT-FOUND))
    (existing-cosign  (map-get? document-cosigners { hash: hash, cosigner: tx-sender }))
    (cosign-count     (default-to u0 (get count (map-get? document-cosigner-count { hash: hash }))))
  )
    (asserts! (not (get is-revoked doc))                            ERR-DOCUMENT-REVOKED)
    (asserts! (not (is-eq tx-sender (get owner doc)))               ERR-OWNER-CANNOT-COSIGN)
    (asserts! (is-none existing-cosign)                             ERR-ALREADY-COSIGNED)

    (try! (stx-transfer? COSIGN-FEE tx-sender CONTRACT-OWNER))

    (map-set document-cosigners
      { hash: hash, cosigner: tx-sender }
      { signed-at: stacks-block-height }
    )
    (map-set document-cosigner-count
      { hash: hash }
      { count: (+ cosign-count u1) }
    )

    (var-set total-stx-collected (+ (var-get total-stx-collected) COSIGN-FEE))

    (ok true)
  )
)

;; Update a document's title and/or category. Owner pays 0.1 STX.
;; Cannot update a revoked document.
(define-public (update-document
  (hash         (buff 32))
  (new-title    (string-ascii 100))
  (new-category uint)
)
  (let (
    (doc (unwrap! (map-get? documents { hash: hash }) ERR-NOT-FOUND))
  )
    (asserts! (is-eq tx-sender (get owner doc))     ERR-NOT-DOCUMENT-OWNER)
    (asserts! (not (get is-revoked doc))            ERR-DOCUMENT-REVOKED)
    (asserts! (is-valid-category new-category)      ERR-INVALID-CATEGORY)

    (try! (stx-transfer? UPDATE-FEE tx-sender CONTRACT-OWNER))

    (map-set documents
      { hash: hash }
      (merge doc { title: new-title, category: new-category })
    )

    (var-set total-stx-collected (+ (var-get total-stx-collected) UPDATE-FEE))

    (ok true)
  )
)

;; Transfer document ownership to a new principal. Current owner pays 0.25 STX.
;; Cannot transfer to self or transfer a revoked document.
(define-public (transfer-document
  (hash      (buff 32))
  (new-owner principal)
)
  (let (
    (doc           (unwrap! (map-get? documents { hash: hash }) ERR-NOT-FOUND))
    (new-owner-idx (increment-owner-count new-owner))
  )
    (asserts! (is-eq tx-sender (get owner doc))     ERR-NOT-DOCUMENT-OWNER)
    (asserts! (not (get is-revoked doc))            ERR-DOCUMENT-REVOKED)
    (asserts! (not (is-eq tx-sender new-owner))     ERR-CANNOT-TRANSFER-SELF)

    (try! (stx-transfer? TRANSFER-FEE tx-sender CONTRACT-OWNER))

    (map-set documents
      { hash: hash }
      (merge doc { owner: new-owner })
    )

    ;; Index the document under the new owner's history
    (map-set owner-documents
      { owner: new-owner, index: new-owner-idx }
      { hash: hash }
    )

    ;; Count new-owner as unique if this is their first indexed document
    (if (is-eq new-owner-idx u0)
      (var-set total-unique-owners (+ (var-get total-unique-owners) u1))
      true
    )

    (var-set total-stx-collected (+ (var-get total-stx-collected) TRANSFER-FEE))

    (ok true)
  )
)

;; Revoke a document. Owner only. Free. Permanent and irreversible.
(define-public (revoke-document (hash (buff 32)))
  (let (
    (doc (unwrap! (map-get? documents { hash: hash }) ERR-NOT-FOUND))
  )
    (asserts! (is-eq tx-sender (get owner doc))     ERR-NOT-DOCUMENT-OWNER)
    (asserts! (not (get is-revoked doc))            ERR-ALREADY-REVOKED)

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

;; ─── Read Functions (free, no gas) ───────────────────────────────────────────

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

(define-read-only (get-cosigner-count (hash (buff 32)))
  (default-to u0 (get count (map-get? document-cosigner-count { hash: hash })))
)

(define-read-only (is-cosigner (hash (buff 32)) (cosigner principal))
  (is-some (map-get? document-cosigners { hash: hash, cosigner: cosigner }))
)

(define-read-only (get-cosigner-signed-at (hash (buff 32)) (cosigner principal))
  (map-get? document-cosigners { hash: hash, cosigner: cosigner })
)

(define-read-only (get-stats)
  {
    total-registrations: (var-get total-registrations),
    total-unique-owners: (var-get total-unique-owners),
    total-stx-collected: (var-get total-stx-collected)
  }
)

(define-read-only (get-registration-fee) REGISTRATION-FEE)
(define-read-only (get-cosign-fee)       COSIGN-FEE)
(define-read-only (get-update-fee)       UPDATE-FEE)
(define-read-only (get-transfer-fee)     TRANSFER-FEE)
