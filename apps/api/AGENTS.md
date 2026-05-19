## App Structure

```text
apps/api/
|-- src/
    |-- index.ts    # Starts the Express server
    |-- app.ts    # Express app configuration
    |-- routes/    # API routes
    |-- controllers/    # Routes controllers
    |-- services/    # API business logics
    `-- middlewares/    # Middleware files
```

## Tech Stack

- **Framework:** Express 5
- **Language:** TypeScript 6
- **Database:** Prisma 7, SQLite
- **Linting:** Oxlint, Oxfmt
