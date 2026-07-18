# DEcaFI

**Confidential virtual card issuance on Midnight**
Midnight Hackathon · DeFi Track · July 17–19, 2026

## Elevator Pitch

Zero-knowledge virtual cards for confidential DeFi payments. DEcaFI lets you mint a one-time virtual card for any online checkout — spend-limited, time-limited, and cryptographically authorized — without your real card details or spending history ever touching the merchant, the network, or a public ledger.

**One-liner:** Card details that self-destruct after checkout.

## Smart Contract Architecture (Compact)

```
Circuit: mintCard(limit: Uint<64>, expiry: Uint<64>) -> commitment
  - derives a commitment = hash(limit, expiry, secret nullifier seed)
  - writes commitment to public ledger state
  - writes {limit, expiry, seed} to private state

Circuit: spend(proof, amount: Uint<64>) -> approved: Bool
  - verifies commitment exists in public state
  - asserts amount <= limit
  - asserts current_time < expiry
  - asserts nullifier(commitment) not in spent-set
  - on success: adds nullifier to spent-set, returns approved
  - on failure: returns denied, no state mutation of card data
```

## Hackathon Compliance Checklist

- [ ] Public GitHub repo, commit history spans the event window only (no prior work)
- [ ] Contract deployed to Midnight testnet, address published in README
- [ ] Devpost registration and MLH check-in completed, emails matching across platforms
- [ ] Demo video 2 minutes or less, opens with "Hey I'm [name] and this is my demo for the Midnight Hackathon"
- [ ] Video recorded during the event weekend
- [ ] Repo and video kept public post-event
- [ ] Single project submission, not submitted to any other hackathon
- [ ] Team size of 5 or fewer
