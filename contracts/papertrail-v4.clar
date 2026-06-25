;; PaperTrail v4
;; 0.5 STX registration | co-sign 0.25 STX | update 0.1 STX | transfer 0.25 STX

(define-constant CONTRACT-OWNER 'SP138DCBT7MB5PPB7K4X82D7GH3HCDYZPEA69GZWK)

(define-constant REGISTRATION-FEE u500000)
(define-constant COSIGN-FEE u250000)
(define-constant UPDATE-FEE u100000)
(define-constant TRANSFER-FEE u250000)

(define-constant ERR-ALREADY-REGISTERED (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-ALREADY-REVOKED (err u103))
(define-constant ERR-INVALID-CATEGORY (err u104))
(define-constant ERR-NOT-DOCUMENT-OWNER (err u107))
(define-constant ERR-ALREADY-COSIGNED (err u108))
(define-constant ERR-OWNER-CANNOT-COSIGN (err u109))
(define-constant ERR-DOCUMENT-REVOKED (err u110))
(define-constant ERR-CANNOT-TRANSFER-SELF (err u111))

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

(define-map owner-document-count
  { owner: principal }
  { count: uint }
)

(define-map owner-documents
  { owner: principal, index: uint }
  { hash: (buff 32) }
)

(define-map document-cosigners
  { hash: (buff 32), cosigner: principal }
  { signed-at: uint }
)

(define-map document-cosigner-count
  { hash: (buff 32) }
  { count: uint }
)

(define-data-var total-registrations uint u0)
(define-data-var total-unique-owners uint u0)
(define-data-var total-stx-collected uint u0)

(define-private (is-valid-category (category uint))
  (and (>= category u1) (<= category u5))
)

(define-private (increment-owner-count (owner principal))
  (let ((old (default-to u0 (get count (map-get? owner-document-count { owner: owner })))))
    (map-set owner-document-count { owner: owner } { count: (+ old u1) })
    old
  )
)

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
    (map-set owner-documents { owner: tx-sender, index: owner-index } { hash: hash })
    (var-set total-registrations (+ (var-get total-registrations) u1))
    (var-set total-stx-collected (+ (var-get total-stx-collected) REGISTRATION-FEE))
    (if (is-eq owner-index u0)
      (var-set total-unique-owners (+ (var-get total-unique-owners) u1))
      true
    )
    (ok true)
  )
)

(define-public (co-sign-document (hash (buff 32)))
  (let (
    (doc (unwrap! (map-get? documents { hash: hash }) ERR-NOT-FOUND))
    (existing-cosign (map-get? document-cosigners { hash: hash, cosigner: tx-sender }))
    (cosign-count (default-to u0 (get count (map-get? document-cosigner-count { hash: hash }))))
  )
    (asserts! (not (get is-revoked doc)) ERR-DOCUMENT-REVOKED)
    (asserts! (not (is-eq tx-sender (get owner doc))) ERR-OWNER-CANNOT-COSIGN)
    (asserts! (is-none existing-cosign) ERR-ALREADY-COSIGNED)
    (try! (stx-transfer? COSIGN-FEE tx-sender CONTRACT-OWNER))
    (map-set document-cosigners { hash: hash, cosigner: tx-sender } { signed-at: stacks-block-height })
    (map-set document-cosigner-count { hash: hash } { count: (+ cosign-count u1) })
    (var-set total-stx-collected (+ (var-get total-stx-collected) COSIGN-FEE))
    (ok true)
  )
)

(define-public (update-document
  (hash (buff 32))
  (new-title (string-ascii 100))
  (new-category uint)
)
  (let ((doc (unwrap! (map-get? documents { hash: hash }) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get owner doc)) ERR-NOT-DOCUMENT-OWNER)
    (asserts! (not (get is-revoked doc)) ERR-DOCUMENT-REVOKED)
    (asserts! (is-valid-category new-category) ERR-INVALID-CATEGORY)
    (try! (stx-transfer? UPDATE-FEE tx-sender CONTRACT-OWNER))
    (map-set documents { hash: hash } (merge doc { title: new-title, category: new-category }))
    (var-set total-stx-collected (+ (var-get total-stx-collected) UPDATE-FEE))
    (ok true)
  )
)

(define-public (transfer-document
  (hash (buff 32))
  (new-owner principal)
)
  (let (
    (doc (unwrap! (map-get? documents { hash: hash }) ERR-NOT-FOUND))
    (new-owner-idx (increment-owner-count new-owner))
  )
    (asserts! (is-eq tx-sender (get owner doc)) ERR-NOT-DOCUMENT-OWNER)
    (asserts! (not (get is-revoked doc)) ERR-DOCUMENT-REVOKED)
    (asserts! (not (is-eq tx-sender new-owner)) ERR-CANNOT-TRANSFER-SELF)
    (try! (stx-transfer? TRANSFER-FEE tx-sender CONTRACT-OWNER))
    (map-set documents { hash: hash } (merge doc { owner: new-owner }))
    (map-set owner-documents { owner: new-owner, index: new-owner-idx } { hash: hash })
    (if (is-eq new-owner-idx u0)
      (var-set total-unique-owners (+ (var-get total-unique-owners) u1))
      true
    )
    (var-set total-stx-collected (+ (var-get total-stx-collected) TRANSFER-FEE))
    (ok true)
  )
)

(define-public (revoke-document (hash (buff 32)))
  (let ((doc (unwrap! (map-get? documents { hash: hash }) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get owner doc)) ERR-NOT-DOCUMENT-OWNER)
    (asserts! (not (get is-revoked doc)) ERR-ALREADY-REVOKED)
    (map-set documents { hash: hash } (merge doc { is-revoked: true, revoked-at: (some stacks-block-height) }))
    (ok true)
  )
)

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
(define-read-only (get-cosign-fee) COSIGN-FEE)
(define-read-only (get-update-fee) UPDATE-FEE)
(define-read-only (get-transfer-fee) TRANSFER-FEE)
