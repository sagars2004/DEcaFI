# DEcaFI — Zero-Knowledge Virtual Cards for Confidential DeFi Payments

**Confidential virtual card issuance on the Midnight Network**  
*Midnight Hackathon · DeFi Track · July 17–19, 2026*

---

## 1. Elevator Pitch
**"Card details that self-destruct after checkout."**

DEcaFI lets you mint a single-use virtual card for any online checkout—spend-limited, time-limited, and cryptographically authorized—without your real card details, bank information, or transaction history ever touching the merchant, the network, or a public blockchain ledger. 

---

## 2. Project Overview

### The Problem
Every online purchase today forces consumers to make a high-stakes compromise:
* **Exposure**: Checking out on an e-commerce website hands your real credit card number directly to a stranger's database. If they get breached, your financial details end up on the dark web.
* **Trust**: Centralized virtual card tools (like Privacy.com) just relocate the risk. You are forced to hand over your bank login, identity, and full spending history to a centralized fintech company that tracks your habits.
* **Transparency**: Public blockchains remove the middleman but broadcast everything in plain view. Anyone watching the chain can see your balances, transaction history, and purchasing habits.

### The Zero-Knowledge Solution
DEcaFI uses Midnight's zero-knowledge smart contracts to separate **what is provable** from **what is private**:

| Layer | Public (On-Chain) | Private (Off-Chain / User-Held) |
|---|---|---|
| **Data Saved** | Cryptographic card commitment hash, spent card nullifiers, transaction status | Real credit card details, virtual-to-real card mapping, full spending history |
| **Visibility** | Publicly auditable on the blockchain ledger | Confidentially stored in the user's private state database (LevelDB) |

To authorize a payment, the user generates a zero-knowledge proof client-side. The merchant and smart contract verify the proof (confirming that the card exists, is within its spend limit, is unexpired, and hasn't been used) without ever learning the real card number, account balance, or identity. Once used, the card is nullified on-chain, preventing replay attacks or subsequent charges.

---

## 3. Core Features
1. **Wallet Connect**: Integrates with the **Lace Wallet** (Beta) via the **dApp Connector API** to read the user's unshielded address and manage gas/dust tank balances.
2. **Instant Minting**: Users can instantly generate a temporary virtual card (a keycard) with a custom spending limit and an expiration time (defaults to 24 hours).
3. **Mock Merchant Sandbox**: An integrated, self-contained mock merchant checkout page to simulate real-world e-commerce usage.
4. **ZK Spend Verification**: Validates transaction approvals off-chain using the Midnight Proof Server.
5. **Built-in Self-Destruct**: Cards automatically expire immediately upon checkout or after the specified time limit, ensuring the credentials cannot be reused.
6. **On-Chain Governance**: Supports terminating cards on-chain and minting new ones using **tNIGHT** for transaction fees.

---

## 4. Smart Contract Architecture (Compact)

Our smart contract is written in **Compact**, Midnight's TypeScript-based ZK DSL:

```typescript
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

---

## 5. Technical Stack

* **Smart Contract Language**: Compact (v0.16.0)
* **Off-chain SDK**: `@midnight-ntwrk/midnight-js-contracts` & providers (v4.1.1)
* **Frontend Web App**: React, Tailwind CSS, Vite
* **Wallet & Connector**: Lace Wallet (Beta) & `@midnight-ntwrk/dapp-connector-api`
* **Private State Database**: LevelDB (via `midnight-js-level-private-state-provider`)
* **Proof Generation**: Midnight Proof Server (Docker Image `midnightntwrk/proof-server:8.0.3`)
* **Gas & Fee Tokens**: **tNIGHT** and **tDUST**

---

## 6. Setup & Execution Instructions for Judges

Follow these steps to run the application locally and test the zero-knowledge validation flows.

### Prerequisites
* **Node.js**: Version 22.0.0 or higher
* **Docker**: Installed and running (required for the Midnight Proof Server)
* **Lace Wallet Extension**: Installed in your Chrome browser with developer mode enabled, configured for the **Midnight Preprod** network.

---

### Step 1: Install Dependencies
Install dependencies in the root project directory and inside the React frontend directory:
```bash
# In the root folder
npm install

# In the web folder
cd web
npm install
cd ..
```

---

### Step 2: Set Up the Network & Proving Services

#### Option A: Running on the Hosted Preprod Testnet (Recommended)
This is the network the frontend app is configured to use.
1. Make sure your Docker daemon is active.
2. Start the local proving server (which compiles the zero-knowledge proofs):
   ```bash
   npm run proof-server:start
   ```
3. Initialize the contract on the Preprod network. This compiles the Compact contract, spins up the proving container, funds a deployment wallet, and deploys the contract to Preprod:
   ```bash
   npm run setup -- --network preprod
   ```
4. Verify that the deployment succeeded. A file called `.midnight-state.json` will be generated in the root, recording the contract address.

*Note: Ensure your Lace Wallet contains **tNIGHT** and **tDUST** tokens before connecting.*

#### Option B: Running on a Local Development Network (Undeployed)
If you want to run completely locally without testnet networks:
1. Start the local node, indexer, and proof server:
   ```bash
   docker compose up -d
   ```
2. Compile and deploy the contract locally:
   ```bash
   npm run setup -- --network undeployed
   ```
3. Update `web/src/midnight/config.ts` to target `'undeployed'` instead of `'preprod'`, and update the node/indexer ports if needed.

---

### Step 3: Run the Web Application
Start the React frontend development server:
```bash
cd web
npm run dev
```
Open your browser to the URL displayed in the terminal (usually `http://localhost:5173`).

---

## 7. Verification Guide (Judge Walkthrough)

To verify that the zero-knowledge circuits are operating correctly:

### Case 1: Successful Confidential Spend
1. Click **Connect Lace Wallet** in the top-right header and approve the connection in the Lace extension.
2. Under **Virtual Card Terminal** (left-hand pane), set a spend limit of `$100` and click **Generate Keycard**.
3. Confirm the card creation. Once generated, your virtual card details will render, and the **Merchant Sandbox** (right-hand pane) will unlock.
4. In the checkout form, specify a payment amount of `$25` and click **Pay Confidentially**.
5. The application will generate a ZK proof client-side, submit the transaction to the Midnight Network, and confirm **Payment Approved** without exposing card numbers on the public ledger.

### Case 2: Exceeded Spend Limit (Verification Failure)
1. Using the same virtual card or by minting a new one with a `$50` limit, enter a purchase amount of `$75` in the **Merchant Sandbox**.
2. Click **Pay Confidentially**.
3. The proof generator/circuit will fail the limit check constraint and the transaction will be immediately rejected, demonstrating that spending limits are cryptographically enforced off-chain.

### Case 3: Replay / Expiration Prevention (Nullifier Check)
1. Attempt to run a second purchase using the same virtual card from Case 1.
2. Click **Pay Confidentially**.
3. The transaction will fail. Because the card’s nullifier was published to the blockchain ledger during the first checkout, any subsequent spends fail validation, proving that cards are securely single-use.

---

## 8. CLI Alternative (Local Interaction)

If you prefer to interact with the ZK smart contract directly through a command-line interface instead of the React dashboard, you can run the interactive CLI client.

### Run the CLI Client
Ensure your local network and/or docker proof-server is running, then execute:
```bash
npm run cli
```

### Menu Options
The CLI client will sync with the Midnight network, check your local wallet balance, and present the following menu:
1. **Mint a virtual card**: Prompt for a spending limit, automatically set a 24-hour expiry, generate a private nullifier seed, and submit a `mintCard` transaction.
2. **Spend from virtual card**: Prompt for a spend amount and construct/submit a ZK `spend` proof transaction.
3. **View current card (private state)**: Display the local active card details (commitment hash, spend limit, expiry, and secret seed).
4. **Exit**: Exit the CLI client.
