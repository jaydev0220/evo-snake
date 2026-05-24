# EvoSnake

EvoSnake is a browser-based snake game with a separate API and shared workspace types. The frontend is built with Vue 3 and Vite, the backend uses Express, and leaderboard data is persisted through Prisma with PostgreSQL.

Gameplay goes beyond a basic snake loop. Different apples modify speed, length, collision behavior, or score flow, and the game includes live event systems such as Bonus Chain, Gold Rush, and Ice Age that temporarily change board rules and scoring pressure.
