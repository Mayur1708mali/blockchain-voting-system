# Blockchain-Based Secure Online Voting System

A tamper-proof, transparent, blockchain-based voting system built with Next.js, Ethereum smart contracts (Solidity/Hardhat), and PostgreSQL (Prisma ORM).

## Key Features

- **Secure voter registration and login** — Email-based registration with admin approval
- **One person, one vote** — Smart contract enforcement prevents double voting
- **Blockchain-based vote storage** — All votes permanently stored on Ethereum
- **Results hidden until close** — Vote tallies only revealed after election ends
- **Admin dashboard** — Role-based election management (Super Admin, Election Manager, Auditor)
- **Transparent and tamper-proof** — Full audit trail with on-chain verification

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 |
| Auth | NextAuth.js v5 (Credentials) |
| Database | PostgreSQL + Prisma 5 |
| Blockchain | Solidity 0.8.24 + Hardhat 2 + ethers.js v6 |
| Charts | Recharts |
| Validation | Zod |

## Prerequisites

- Node.js v18+
- PostgreSQL database
- npm

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd voting-system
npm install
cd blockchain && npm install && cd ..
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Edit .env.local with your PostgreSQL connection string
```

### 3. Set up the database

```bash
npx prisma db push
npx prisma db seed
```

This creates the tables and seeds a default admin account:
- Email: `admin@voting.com`
- Password: `admin123`

### 4. Start the blockchain (terminal 1)

```bash
npm run blockchain:node
```

### 5. Deploy the smart contract (terminal 2)

```bash
npm run blockchain:compile
npm run blockchain:deploy
```

### 6. Start the app (terminal 2)

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run blockchain:node` | Start local Hardhat blockchain node |
| `npm run blockchain:compile` | Compile Solidity contracts |
| `npm run blockchain:deploy` | Deploy contract to local network |
| `npm run blockchain:test` | Run smart contract tests |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with admin accounts |
| `npm run db:studio` | Open Prisma Studio |

## Default Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@voting.com | admin123 |
| Election Manager | manager@voting.com | manager123 |
| Auditor | auditor@voting.com | auditor123 |

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │  Voter   │  │  Admin   │  │ Results  │  │  Auth  ││
│  │Dashboard │  │Dashboard │  │  Page    │  │ Pages  ││
│  └──────────┘  └──────────┘  └──────────┘  └────────┘│
└────────────────────────────────────────────────────────┘
                          │
┌────────────────────────────────────────────────────────┐
│                  Next.js API Routes                      │
│  ┌──────┐  ┌──────────┐  ┌──────┐  ┌──────────────┐  │
│  │ Auth │  │ Elections │  │ Vote │  │ Audit Trail  │  │
│  └──────┘  └──────────┘  └──────┘  └──────────────┘  │
└────────────────────────────────────────────────────────┘
          │                              │
┌─────────────────┐          ┌───────────────────────┐
│   PostgreSQL    │          │   Ethereum (Hardhat)  │
│   + Prisma      │          │   Smart Contract      │
│                 │          │   - createElection    │
│  Users          │          │   - castVote          │
│  Elections      │          │   - closeElection     │
│  Candidates     │          │   - getResults        │
│  VoterApprovals │          │   - hasVoted          │
└─────────────────┘          └───────────────────────┘
```

## Workflow

1. **Admin creates election** → Saved in DB (DRAFT status)
2. **Admin activates election** → Registered on blockchain (ACTIVE status)
3. **Admin approves voters** → Wallet generated, funded with ETH for gas
4. **Admin assigns voters to elections** → VoterApproval records created
5. **Voter casts vote** → Transaction sent to smart contract via voter's wallet
6. **Admin closes election** → Smart contract closes, results become available
7. **Anyone views results** → Fetched from blockchain, displayed as charts

## Security Features

- Passwords hashed with bcrypt (12 rounds)
- Voter private keys encrypted at rest (AES-256-GCM)
- Role-based access control via middleware
- On-chain one-vote enforcement
- Results hidden until election close (contract-level enforcement)
- Input validation with Zod schemas

## Smart Contract

The `VotingContract.sol` handles:
- Election creation with candidate count and type
- One-vote-per-address enforcement
- Vote storage as on-chain state
- Results access control (only after close)
- Event emission for audit trail

All 18 contract tests pass covering election creation, voting, closing, and results.

## License

MIT
