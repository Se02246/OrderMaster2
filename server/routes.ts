import { Hono } from "hono";
import { z } from "zod"; // === IMPORTA ZOD ===
import { eq, and, desc, sql, like } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  apartments, 
  employees, 
  assignments, 
  insertApartmentSchema, 
  apartmentWithEmployeesSchema,
  insertEmployeeSchema,
} from "../shared/schema";
import { protect } from "./middleware";
import { zValidator } from '@hono/zod-validator'

// ... (tutto il codice delle altre rotte rimane invariato) ...

export const userRoutes = new Hono()
  .use(protect) // Assicura che solo gli utenti loggati possano cambiare tema
  
  // === INIZIO NUOVA ROTTA ===
  .put(
    "/theme",
    // Validazione: ci aspettiamo un oggetto { color: "stringa" }
    zValidator("json", z.object({
      color: z.string().max(50), 
    })),
    async (c) => {
      const { color } = c.req.valid("json");
      const userId = c.get("userId"); // Otteniamo l'ID dall'autenticazione

      try {
        const [updatedUser] = await db
          .update(users)
          .set({ theme_color: color })
          .where(eq(users.id, userId))
          .returning();

        if (!updatedUser) {
          return c.json({ error: "Utente non trovato" }, 404);
        }
        
        // Rimuoviamo la password prima di restituire l'utente
        const { hashed_password, ...safeUser } = updatedUser;
        return c.json(safeUser);
        
      } catch (error: any) {
        return c.json({ error: "Errore durante l'aggiornamento del tema", details: error.message }, 500);
      }
    }
  )
  // === FINE NUOVA ROTTA ===
  
  // Rotta esistente per /me
  .get("/me", async (c) => {
    // ... (questa rotta rimane invariata) ...
  });
  
// ... (tutto il resto del file rimane invariato) ...
