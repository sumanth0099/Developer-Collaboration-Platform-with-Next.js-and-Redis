# DevPulse — Real-Time Developer Collaboration Platform

DevPulse is a full-stack real-time developer collaboration and code review platform built with Next.js 14, PostgreSQL, Prisma, Redis, and WebSockets.

The platform allows developers to submit code snippets for peer review, receive live feedback, vote on submissions, track reputation, and monitor contribution activity through a public leaderboard.

This project focuses heavily on scalable backend architecture, server-side rendering, caching strategies, real-time communication, and production-ready Next.js patterns.

---

# Features

## Authentication & Authorization

* GitHub OAuth authentication using NextAuth.js v5
* Credentials-based login system
* Protected dashboard routes with middleware
* Session-based user management

## Developer Submission System

* Create and manage code submissions
* Multiple programming language support
* Difficulty-based categorization
* Tagging system for submissions
* Real-time submission feed

## Peer Review System

* Submit detailed code reviews
* Line-specific review references
* Review resolution workflow
* Duplicate review prevention
* Self-review restriction handling

## Voting & Reputation

* Upvote and downvote submissions
* Dynamic vote toggling system
* Reputation score calculation
* Public leaderboard rankings

## Real-Time Features

* Live review updates using Socket.io/Pusher
* Instant notification delivery
* Real-time unread notification count
* Live review feed updates without refresh

## Performance & Caching

* Redis-based caching layer
* Sliding-window API rate limiting
* Optimized server-side rendering
* Cached leaderboard queries
* Incremental view count tracking

## File Uploads

* Upload code snapshot images
* Image validation and size restrictions
* Cloud storage integration
* Snapshot management system

## Dashboard & Analytics

* Personalized user profiles
* Contribution activity graph
* Submission statistics
* Review analytics
* Reputation tracking

## Testing

* Unit testing with Vitest
* Utility function testing
* API logic validation
* Mocked Prisma test environment

---

# Tech Stack

## Frontend

* Next.js 14 (App Router)
* React
* TypeScript
* Tailwind CSS
* TanStack Query v5

## Backend

* Next.js Route Handlers
* Server Actions
* Prisma ORM
* PostgreSQL
* Upstash Redis

## Authentication

* NextAuth.js v5
* GitHub OAuth

## Real-Time Communication

* Socket.io / Pusher

## Validation & Testing

* Zod
* Vitest

## File Storage

* Vercel Blob / Cloudinary

---

# Folder Structure

```bash
/app
/components
/lib
/hooks
/types
/tests
/prisma
```

---

# Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
DATABASE_URL=

NEXTAUTH_SECRET=
NEXTAUTH_URL=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

BLOB_READ_WRITE_TOKEN=
```

---

# Installation

## Clone the Repository

```bash
git clone <your-repository-url>
cd devpulse
```

## Install Dependencies

```bash
npm install
```

## Setup Database

```bash
npx prisma migrate deploy
```

## Generate Prisma Client

```bash
npx prisma generate
```

## Run Development Server

```bash
npm run dev
```

Application will run at:

```bash
http://localhost:3000
```

---

# How to Try It

## 1. Register or Login

* Login using GitHub OAuth
* Or create an account using credentials

## 2. Create a Submission

* Navigate to the Submit page
* Add title, description, code content, tags, and difficulty level
* Publish the submission

## 3. Review Other Submissions

* Open the review feed
* Select a submission
* Add detailed peer reviews and ratings

## 4. Vote on Submissions

* Upvote or downvote community submissions
* Watch reputation update dynamically

## 5. Experience Real-Time Updates

* Open multiple browser tabs
* Submit reviews from one account
* Receive instant notifications and live updates

## 6. Explore Leaderboard

* Visit leaderboard page
* Track top contributors and reputation rankings

---

# Running Tests

Run all unit tests:

```bash
npx vitest run
```

---

# Build for Production

```bash
npm run build
```

---

# Core Highlights

* Full App Router architecture
* Advanced Server Components usage
* Redis caching strategies
* Real-time WebSocket integration
* Optimistic UI updates
* Server Actions implementation
* Scalable API architecture
* Production-ready folder structure

---