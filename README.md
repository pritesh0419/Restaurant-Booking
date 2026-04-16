# Restaurant Booking Backend

This project is a TypeScript and Express backend for a restaurant reservation platform. It is organized using clean architecture with separate domain, application, infrastructure, and presentation layers.

## Features

- Customer registration and login with JWT authentication
- Guest reservations and registered user reservations
- Reservation cancellation for authenticated users
- Admin approval, decline, and edit flows
- Reservation analytics and reporting endpoint
- MongoDB infrastructure with an in-memory fallback for local development and tests
- Winston-based logging

## Project Structure

- `src/domain`: Entities and repository contracts
- `src\application`: Use cases and application services
- `src\infrastructure`: Database, repository implementations, auth, and logging
- `src\presentation`: Express routes and middleware
- `src\tests`: Automated tests

## Getting Started

1. Copy `.env.example` to `.env`
2. Set `USE_IN_MEMORY=true` to run without MongoDB, or provide `MONGO_URI`
3. Run `npm run dev`

## Testing

- `npm test`
- `npm run test:coverage`
