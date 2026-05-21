PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_Player" ("id", "name", "createdAt")
SELECT "id", 'Unknown', "createdAt" FROM "Player";

DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
