<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">NestJS Authentication API</h1>

<p align="center">
  A robust and secure authentication service built with <a href="http://nestjs.com/" target="blank">NestJS</a>, featuring JWT-based authentication, refresh token rotation, and MongoDB integration.
</p>

## Description

This repository contains a starter project for a NestJS-based authentication API. It provides a solid foundation for building secure and scalable server-side applications with a complete authentication flow.

### Features

-   **User Authentication**: Signup, login, and logout.
-   **JWT Strategy**: Secure access and refresh tokens.
-   **Refresh Token Rotation**: Enhanced security by rotating refresh tokens on each use.
-   **MongoDB Integration**: User and token data stored in MongoDB.
-   **Configuration Management**: Centralized configuration management.
-   **Logging**: Comprehensive logging with Winston.

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18 or later)
-   [npm](https://www.npmjs.com/)
-   [MongoDB](https://www.mongodb.com/try/download/community)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/mariamdawa/auth.api
    cd auth-api
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env` file in the root of the project and add the following environment variables.

```env
# Application
PORT=3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/auth-api

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

## Running the Application

```bash
# Development
$ npm run start

# Watch mode
$ npm run start:dev

# Production mode
$ npm run start:prod
```

The application will be running on `http://localhost:3000`.

## Running Tests

```bash
# Unit tests
$ npm run test

# End-to-end tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov
```

## API Endpoints

### Authentication

-   `POST /auth/signup`: Register a new user.
-   `POST /auth/login`: Log in a user and receive access and refresh tokens.
-   `POST /auth/logout`: Log out a user and invalidate the access token.
-   `POST /auth/refresh`: Obtain a new access token using a refresh token.

### Protected Routes

-   `GET /auth/profile`: Get the profile of the currently authenticated user. Requires a valid access token.

## License

This project is [MIT licensed](LICENSE).
