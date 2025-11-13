# Participium

Participium is a web application for citizen participation, allowing citizens to report issues or suggestions to the municipality through an interactive map. Administrators and technical offices can manage these reports.

## How it works

The app is divided into two main parts:

- A React frontend that allows users to view the map, log in, and submit reports
- A Node.js backend with Express that handles authentication, the database, and the API

## Installation

To run the application, you need Node.js installed on your computer.

1. Clone the repository or download the project files.

2. Open a terminal in the project folder.

3. Install dependencies for the client:

   ```
   cd client
   npm install
   ```

4. Install dependencies for the server:

   ```
   cd ../server
   npm install
   ```

5. Start the server:

   ```
   npm run dev
   ```

   This command will reset the database, apply migrations, and seed the database with sample data.

6. In another terminal, start the client:
   ```
   cd ../client
   npm run dev
   ```

Now the app should be accessible at http://localhost:5173 (or the port Vite indicates).

## Test accounts

For testing the application, you can use these test accounts that are already set up in the database:

- **Administrator**: admin@participium.com / adminpass
- **Citizen**: citizen@participium.com / citizenpass
- **Public Relations**: pr@participium.com / prpass
- **Technical Office**: tech@participium.com / techpass

You can find these accounts on the login page of the app.

## Project structure

- `client/`: The React frontend with Vite
- `server/`: The Node.js backend with Express and Prisma
- `shared/`: Shared TypeScript types between client and server
- `docs/`: API documentation with Swagger

## Tests

To run tests:

In the client:

```
cd client
npm test
```

In the server:

```
cd server
npm test
```

## Additional notes

If you have issues with the database, you can reset it with:

```
cd server
npm run db:reset
```

The API is documented with Swagger and accessible at http://localhost:3000/api-docs when the server is running.
