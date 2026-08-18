# Blockchain Voting System

A secure, transparent voting system built with Next.js and Ethereum smart contracts. Votes are stored immutably on the blockchain, ensuring tamper-proof elections with verifiable results.

---

## Table of Contents

- [What This Project Does](#what-this-project-does)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Blockchain Setup](#blockchain-setup)
  - [Running the App](#running-the-app)
- [How It Works](#how-it-works)
  - [User Roles](#user-roles)
  - [Election Lifecycle](#election-lifecycle)
  - [Vote Casting Flow](#vote-casting-flow)
  - [Wallet Management](#wallet-management)
- [Pages Overview](#pages-overview)
- [API Reference](#api-reference)
- [Smart Contract](#smart-contract)
- [Database Schema](#database-schema)
- [Default Accounts](#default-accounts)
- [Common Issues](#common-issues)

---

## What This Project Does

This is a full-stack voting application where:

1. **Admins** create elections, add candidates, approve voters, and assign them to elections.
2. **Voters** register, get approved by an admin (which generates a blockchain wallet for them), and cast votes in assigned elections.
3. **Every vote** is recorded on the Ethereum blockchain — no one can tamper with or delete votes.
4. **Results are hidden** until the election closes, then anyone can view them.
5. **Audit trail** — all blockchain events (votes cast, elections created/closed) can be inspected by auditors.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes (Route Handlers) |
| Database | PostgreSQL with Prisma ORM |
| Authentication | NextAuth v5 (Auth.js) with JWT sessions |
| Blockchain | Solidity 0.8.24, Hardhat, ethers.js 6 |
| Validation | Zod |
| Notifications | react-hot-toast |
| Charts | Recharts |

---

## Project Structure

```
blockchain-voting-system/
├── app/                          # Next.js App Router (pages & API routes)
│   ├── (auth)/                   # Auth pages (login, register)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── admin/                    # Admin panel
│   │   ├── page.tsx              # Dashboard with statistics
│   │   ├── layout.tsx            # Sidebar navigation
│   │   ├── elections/            # Election management
│   │   │   ├── page.tsx          # List all elections
│   │   │   ├── new/page.tsx      # Create new election
│   │   │   └── [id]/page.tsx     # Election detail/management
│   │   ├── voters/              # Voter management
│   │   │   ├── page.tsx          # List all voters
│   │   │   └── [id]/page.tsx     # Voter detail page
│   │   └── audit/page.tsx        # Blockchain audit log
│   ├── api/                      # REST API endpoints
│   │   ├── auth/                 # NextAuth handlers + registration
│   │   ├── admin/                # Admin-only endpoints
│   │   ├── vote/                 # Voter endpoints (elections, cast, status)
│   │   ├── elections/            # Public endpoints (results)
│   │   ├── profile/             # User profile endpoint
│   │   └── cron/                 # Scheduled task endpoints
│   ├── vote/                     # Voter-facing pages
│   │   ├── page.tsx              # Voter dashboard (assigned elections)
│   │   ├── [id]/                 # Voting page (candidate selection)
│   │   ├── verify/              # Vote verification page
│   │   └── layout.tsx            # Voter portal header/nav
│   ├── profile/page.tsx          # User profile page
│   ├── elections/[id]/results/   # Public results page
│   ├── pending-approval/         # Waiting screen for unapproved voters
│   └── layout.tsx                # Root layout (fonts, providers)
├── blockchain/                   # Hardhat project (Ethereum contracts)
│   ├── contracts/
│   │   └── VotingContract.sol    # Main voting smart contract
│   ├── scripts/
│   │   └── deploy.js            # Contract deployment script
│   ├── deployments/
│   │   └── localhost.json        # Deployed contract address & ABI
│   └── hardhat.config.js
├── components/                   # Reusable UI components
│   ├── Button.tsx
│   ├── SessionProvider.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   └── LoadingSkeleton.tsx
├── lib/                          # Shared utilities
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Database client singleton
│   ├── blockchain.ts             # Blockchain interaction helpers
│   ├── encryption.ts             # AES-256-GCM encrypt/decrypt
│   ├── validations.ts            # Zod schemas for input validation
│   ├── rate-limit.ts             # In-memory rate limiter
│   ├── env.ts                    # Environment variable validation
│   ├── activate-scheduled-elections.ts  # Auto-activate elections
│   └── close-expired-elections.ts       # Auto-close elections
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seeds default admin accounts
├── middleware.ts                 # Route protection & auth redirects
├── package.json
└── .env.example                  # Required environment variables
```

---

## Getting Started

### Prerequisites

Make sure you have these installed on your machine:

- **Node.js** 18 or higher — [Download](https://nodejs.org/)
- **PostgreSQL** — [Download](https://www.postgresql.org/download/) or use Docker
- **npm** (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Mayur1708mali/blockchain-voting-system.git
cd blockchain-voting-system

# 2. Install dependencies for the Next.js app
npm install

# 3. Install dependencies for the blockchain project
cd blockchain
npm install
cd ..
```

### Environment Variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

Here's what each variable does:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/voting_system` |
| `NEXTAUTH_SECRET` | Random string for signing JWT tokens. Generate with `openssl rand -base64 32` | `a-long-random-string` |
| `NEXTAUTH_URL` | Your app's URL | `http://localhost:3000` |
| `HARDHAT_NETWORK_URL` | Local Ethereum node URL | `http://127.0.0.1:8545` |
| `ADMIN_PRIVATE_KEY` | Private key of the Hardhat account #0 (contract owner). Use the default Hardhat test key for development | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| `WALLET_ENCRYPTION_KEY` | 64 hex characters (32 bytes) for encrypting voter wallet keys. Generate with `openssl rand -hex 32` | `64-character-hex-string` |

> **Important:** The `ADMIN_PRIVATE_KEY` above is Hardhat's default test account. It has 10,000 ETH on the local network. Never use this on a real network.

### PostgreSQL with Docker

If you don't have PostgreSQL installed locally, you can run it with Docker:

```bash
# Pull and start a PostgreSQL container
docker run --name voting-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=voting_system \
  -p 5432:5432 \
  -d postgres:16
```

This starts PostgreSQL on port 5432 with these credentials (matching `.env.example`):
- **User:** postgres
- **Password:** postgres
- **Database:** voting_system

Useful Docker commands:

```bash
# Check if the container is running
docker ps

# Stop the database
docker stop voting-db

# Start it again later
docker start voting-db

# View database logs
docker logs voting-db

# Remove the container entirely (deletes all data)
docker rm -f voting-db
```

If you want data to persist across container recreations, add a volume:

```bash
docker run --name voting-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=voting_system \
  -p 5432:5432 \
  -v voting_pgdata:/var/lib/postgresql/data \
  -d postgres:16
```

Your `DATABASE_URL` in `.env` should be:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/voting_system?schema=public"
```

### Database Setup

```bash
# 1. Create the database tables
npx prisma migrate dev

# 2. Generate the Prisma client
npx prisma generate

# 3. Seed default admin accounts
npx prisma db seed
```

To visually explore your database:

```bash
npx prisma studio
```

### Blockchain Setup

You need a local Ethereum network running for the voting contract:

```bash
# Terminal 1: Start local Hardhat blockchain (keep this running)
npm run blockchain:node

# Terminal 2: Compile and deploy the smart contract
npm run blockchain:compile
npm run blockchain:deploy
```

After deployment, a file `blockchain/deployments/localhost.json` is created containing the contract address and ABI. The app reads this file to interact with the contract.

### Running the App

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How It Works

### User Roles

| Role | What They Can Do |
|------|-----------------|
| **SUPER_ADMIN** | Everything — create elections, manage voters, view audit logs |
| **ELECTION_MANAGER** | Create/manage elections, approve/reject voters, assign voters to elections |
| **AUDITOR** | Read-only access to all admin pages + blockchain audit trail |
| **VOTER** | View assigned elections, cast votes (once approved by admin) |

### Election Lifecycle

```
┌─────────┐      Admin activates       ┌─────────┐      Admin closes        ┌─────────┐
│  DRAFT  │ ─────── or ──────────────► │  ACTIVE │ ─────── or ────────────► │ CLOSED  │
│         │   startDate arrives         │         │   endDate arrives         │         │
└─────────┘   (auto via cron)           └─────────┘   (auto via cron)         └─────────┘
     │                                       │                                      │
     │  Admin creates election               │  Voters can cast votes               │  Results visible
     │  with candidates                      │  (one vote per voter)                │  to everyone
     │                                       │                                      │
```

1. **DRAFT** — Admin creates election with title, description, candidates, start/end dates.
2. **ACTIVE** — Election is deployed to the blockchain. Voters can now cast votes. This happens either when admin clicks "Activate" or automatically when `startDate` arrives.
3. **CLOSED** — No more votes accepted. Results are now publicly viewable from the blockchain.

### Vote Casting Flow

Here's what happens step-by-step when a voter casts their vote:

1. Voter logs in and sees their assigned elections at `/vote`
2. Clicks "Vote Now" on an active election → goes to `/vote/[id]`
3. Selects a candidate and confirms their choice
4. The server:
   - Verifies the voter is authenticated, approved, and assigned to this election
   - Checks they haven't already voted (on-chain check)
   - Decrypts the voter's stored wallet private key
   - Calls `castVote()` on the smart contract using the voter's wallet
5. The blockchain records the vote immutably
6. Voter gets back a transaction hash as proof

### Wallet Management

- When an admin **approves** a voter, the system:
  1. Generates a random Ethereum wallet (address + private key)
  2. Encrypts the private key with AES-256-GCM
  3. Stores the encrypted key in the database
  4. Funds the wallet with 0.1 ETH from the admin wallet (for gas fees)
- When a voter **casts a vote**, the system decrypts their key temporarily to sign the transaction.
- Voter wallets are never exposed — they exist only to sign blockchain transactions.

---

## Pages Overview

### Public Pages
| Path | Description |
|------|-------------|
| `/` | Landing page with Sign In / Register links |
| `/login` | Email + password login |
| `/register` | New voter registration (name, email, PRN, class, password) |
| `/elections/[id]/results` | View election results (only after election closes) |
| `/pending-approval` | Shown to voters who registered but aren't approved yet |

### Voter Pages (requires login + approval)
| Path | Description |
|------|-------------|
| `/vote` | Dashboard showing assigned elections (active + closed) |
| `/vote/[id]` | Voting page — select candidate and cast vote |
| `/vote/verify` | Verify your vote exists on the blockchain |
| `/profile` | View your own details (name, PRN, class, wallet, elections) |

### Admin Pages (requires admin role)
| Path | Description |
|------|-------------|
| `/admin` | Dashboard with stats (total elections, voters, pending approvals) |
| `/admin/elections` | List and manage all elections |
| `/admin/elections/new` | Create a new election with candidates |
| `/admin/elections/[id]` | View/manage a specific election (activate, close) |
| `/admin/voters` | List all voters (filter by pending/approved, approve/reject) |
| `/admin/voters/[id]` | View detailed voter information |
| `/admin/audit` | Blockchain audit log (all on-chain events) |

---

## API Reference

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/api/auth/register` | Register new voter | No |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers (login, session) | No |

### Profile
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/profile` | Get your own profile details | Yes (any role) |

### Admin — Elections
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/admin/elections` | List all elections | Admin |
| POST | `/api/admin/elections` | Create new election | SUPER_ADMIN / ELECTION_MANAGER |
| GET | `/api/admin/elections/[id]` | Get election details | Admin |
| POST | `/api/admin/elections/[id]/activate` | Activate (deploy to blockchain) | SUPER_ADMIN / ELECTION_MANAGER |
| POST | `/api/admin/elections/[id]/close` | Close election | SUPER_ADMIN / ELECTION_MANAGER |

### Admin — Voters
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/admin/voters` | List voters (filter: pending/approved/all) | Admin |
| GET | `/api/admin/voters/[id]` | Get voter details | Admin |
| PATCH | `/api/admin/voters/[id]/approve` | Approve voter (generates wallet) | SUPER_ADMIN / ELECTION_MANAGER |
| PATCH | `/api/admin/voters/[id]/reject` | Reject voter | SUPER_ADMIN / ELECTION_MANAGER |
| POST | `/api/admin/voters/[id]/assign-election` | Assign voter to an election | SUPER_ADMIN / ELECTION_MANAGER |

### Admin — Other
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/admin/stats` | Dashboard statistics | Admin |
| GET | `/api/admin/audit` | Blockchain audit log | SUPER_ADMIN / AUDITOR |

### Voter
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/vote/elections` | Get your assigned elections | Approved Voter |
| GET | `/api/vote/status?electionId=X` | Check if you've voted | Approved Voter |
| POST | `/api/vote/cast` | Cast your vote on blockchain | Approved Voter |

### Public
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/elections/[id]/results` | Get election results (closed only) | No |

### Cron Jobs
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/cron/activate-elections` | Auto-activate elections past startDate | CRON_SECRET header |
| GET | `/api/cron/close-elections` | Auto-close elections past endDate | CRON_SECRET header |

---

## Smart Contract

The `VotingContract.sol` is deployed on a local Hardhat network. It handles:

- **Creating elections** (admin-only) — stores candidate count and election type
- **Casting votes** — one vote per wallet per election, enforced on-chain
- **Closing elections** (admin-only) — stops voting, makes results available
- **Reading results** — only possible after election is closed (results hidden during voting)

Key design decisions:
- Vote counts are stored in a **private mapping** — nobody can read results until the election closes
- The `hasVoted` mapping is **public** — anyone can verify if a specific address voted
- Only the contract **owner** (admin wallet) can create or close elections
- Uses OpenZeppelin's `Ownable` for access control

---

## Database Schema

```
┌──────────────┐       ┌──────────────────┐       ┌───────────────┐
│     User     │       │    Election      │       │   Candidate   │
├──────────────┤       ├──────────────────┤       ├───────────────┤
│ id           │       │ id               │       │ id            │
│ email        │       │ title            │       │ name          │
│ password     │       │ description      │       │ description   │
│ name         │       │ type             │       │ candidateIndex│
│ prn (unique) │       │ status           │       │ electionId ──────┐
│ class        │       │ startDate        │       └───────────────┘  │
│ role         │       │ endDate          │                          │
│ approved     │       │ contractAddress  │◄─────────────────────────┘
│ walletAddress│       │ onChainId        │
│ walletPrivKey│       │ createdById ─────────┐
│ createdAt    │       │ createdAt        │   │
│ updatedAt    │       │ updatedAt        │   │
└──────┬───────┘       └────────┬─────────┘   │
       │                        │              │
       │    ┌───────────────────┘              │
       │    │                                  │
       │    │  ┌─────────────────┐             │
       └────┼──┤ VoterApproval   │             │
            │  ├─────────────────┤             │
            │  │ id              │             │
            │  │ userId ─────────────► User    │
            │  │ electionId ─────────► Election│
            └──┤ approved        │             │
               │ assignedAt      │             │
               └─────────────────┘             │
                                               │
                   User.id ◄───────────────────┘
```

**Roles:** VOTER, SUPER_ADMIN, ELECTION_MANAGER, AUDITOR
**Election Types:** SINGLE_CHOICE, MULTI_CHOICE
**Election Statuses:** DRAFT → ACTIVE → CLOSED

---

## Default Accounts

After running `npx prisma db seed`, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@voting.com | admin123 |
| Election Manager | manager@voting.com | manager123 |
| Auditor | auditor@voting.com | auditor123 |

---

## Available Scripts

```bash
# Next.js
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database (Prisma)
npm run db:migrate       # Run database migrations
npm run db:push          # Push schema changes (no migration file)
npm run db:seed          # Seed default accounts
npm run db:studio        # Open Prisma Studio (visual DB editor)
npm run db:generate      # Regenerate Prisma client

# Blockchain (Hardhat)
npm run blockchain:node     # Start local Ethereum node
npm run blockchain:compile  # Compile Solidity contracts
npm run blockchain:deploy   # Deploy contract to local network
npm run blockchain:test     # Run contract tests
```

---

## Common Issues

### "Contract not deployed" error
The app can't find `blockchain/deployments/localhost.json`. Make sure:
1. The Hardhat node is running (`npm run blockchain:node`)
2. The contract is deployed (`npm run blockchain:deploy`)

### Voter can't cast a vote
Check that:
1. The voter is **approved** (admin must approve after registration)
2. The voter is **assigned** to that specific election
3. The election is **ACTIVE** (not DRAFT or CLOSED)
4. The voter hasn't already voted in that election

### "Insufficient funds" blockchain error
The voter wallet doesn't have enough ETH for gas. This happens if:
- The admin wallet ran out of ETH (restart the Hardhat node to reset)
- The funding step failed during voter approval

### Database connection errors
Make sure PostgreSQL is running and `DATABASE_URL` in `.env` is correct. Test with:
```bash
npx prisma db push
```

### Hardhat node restarted — contract gone
When you restart the Hardhat node, all deployed contracts are wiped. You need to redeploy:
```bash
npm run blockchain:deploy
```
Previously approved voters will have wallets pointing to the old network state. You may need to re-seed the database.

---

## Security Features

- **Passwords** hashed with bcryptjs (12 salt rounds)
- **Voter wallet keys** encrypted with AES-256-GCM at rest
- **Rate limiting** on registration (5/min/IP) and voting (3/min/user)
- **Input validation** with Zod on all API endpoints
- **Role-based access control** enforced in both middleware and API routes
- **On-chain vote integrity** — votes can't be modified once recorded
- **Hidden results** — vote counts are private on-chain until election closes
- **One-person-one-vote** enforced by blockchain's `hasVoted` mapping

---

## License

MIT
