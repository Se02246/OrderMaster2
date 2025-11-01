import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, primaryKey, timestamp, varchar, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// --- Tabelle (Nessuna modifica) ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashed_password: text("hashed_password").notNull(),
});
export const apartments = pgTable("apartments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cleaning_date: varchar("cleaning_date", { length: 10 }).notNull(), // format 'YYYY-MM-DD'
  start_time: varchar("start_time", { length: 5 }), // format 'HH:MM'
  status: varchar("status", { length: 20, enum: ["Da Fare", "In Corso", "Fatto"] }).notNull().default("Da Fare"),
  payment_status: varchar("payment_status", { length: 20, enum: ["Da Pagare", "Pagato"] }).notNull().default("Da Pagare"),
  notes: text("notes"),
  price: numeric("price", { precision: 10, scale: 2 }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  first_name: varchar("first_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  apartment_id: integer("apartment_id").notNull().references(() => apartments.id, { onDelete: "cascade" }),
  employee_id: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    uniqueIdx: primaryKey({ columns: [table.apartment_id, table.employee_id] }),
  };
});
// --- Relazioni (Nessuna modifica) ---
export const usersRelations = relations(users, ({ many }) => ({
  apartments: many(apartments),
  employees: many(employees),
}));
export const apartmentsRelations = relations(apartments, ({ one, many }) => ({
  user: one(users, {
    fields: [apartments.user_id],
    references: [users.id],
  }),
  assignments: many(assignments)
}));
export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.user_id],
    references: [users.id],
  }),
  assignments: many(assignments)
}));
export const assignmentsRelations = relations(assignments, ({ one }) => ({
  apartment: one(apartments, {
    fields: [assignments.apartment_id],
    references: [apartments.id]
  }),
  employee: one(employees, {
    fields: [assignments.employee_id],
    references: [employees.id]
  })
}));

// --- Schemi di Inserimento (Nessuna modifica) ---
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertApartmentSchema = createInsertSchema(apartments).omit({ id: true, user_id: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, user_id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true });

// --- Tipi (Nessuna modifica) ---
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Apartment = typeof apartments.$inferSelect;
export type InsertApartment = z.infer<typeof insertApartmentSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

// --- Schemi Estesi (QUI C'È LA MODIFICA) ---
export const apartmentWithEmployeesSchema = z.object({
  ...insertApartmentSchema.shape,
  price: z.union([z.string(), z.number()]).optional().nullable(),
  
  // === INIZIO MODIFICA ===
  // Torniamo a uno schema semplice e pulito. 
  // Ci aspettiamo un array di numeri. Punto.
  // Il lavoro di conversione sarà fatto al 100% nel componente del form.
  employee_ids: z.array(
    z.number({ invalid_type_error: "ID cliente deve essere un numero." })
     .min(1, "ID cliente non valido.")
  ).optional(),
  // === FINE MODIFICA ===
});

export type ApartmentWithEmployees = z.infer<typeof apartmentWithEmployeesSchema>;

// --- Tipi Estesi (Nessuna modifica) ---
export type ApartmentWithAssignedEmployees = Apartment & {
  employees: Employee[];
};
export type EmployeeWithAssignedApartments = Employee & {
  apartments: Apartment[];
};
export type SafeUser = Omit<User, "hashed_password">;
