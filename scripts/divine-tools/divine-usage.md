# Divine Bot Usage

## Run the bot

```bash
npm run bot
```

## Recommended environment

- `AUTO_SET_USERNAME=0` to avoid `u103` username already set failures.
- `FRIEND_RESET=1` to reset stored bot state and start fresh.
- `IDLE_RETRY_MS=60000` to retry after cooldown windows.

## Debugging

If the bot reports "all wallets drained or in cooldown", check wallet balances and cooldown states.

```bash
npm run divine:balance-check
npm run divine:state-report
```
