# Divine Bot Documentation

This document tracks the current state of the divine bot and operator notes.

- The bot uses saved state in `scripts/private/state/friend-progress.json`.
- `AUTO_SET_USERNAME=0` is recommended for existing wallets.
- `SAFE_FEE_USTX=4000` currently prevents low-balance wallets from sending txs.
- `IDLE_RETRY_MS` controls idle retry intervals when no eligible actions are available.
- `FRIEND_RESET=1` deletes the stored state file and restarts eligibility tracking.

## Notes

- `u103` means `ERR-ALREADY-SET` in contract logic.
- `429` means rate limiting from the Hiro API; retry later or upgrade API plan.
