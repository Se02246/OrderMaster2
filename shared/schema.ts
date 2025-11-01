import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, primaryKey, timestamp, varchar, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Apartments table
export const apartments = pgTable("apartments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cleaning_date: varchar("cleaning_date", { length: 10 }).notNull(), // format 'YYYY-MM-DD'
  start_time: varchar("start_time", { length: 5 }), // format 'HH:MM'
  status: varchar("status", { length: 20, enum: ["Da Fare", "In Corso", "Fatto"] }).notNull().default("Da Fare"),
  payment_status: varchar("payment_status", { length: 20, enum: ["Da Pagare", "Pagato"] }).notNull().default("Da Pagare"),
  notes: text("notes"),
  price: numeric("price", { precision: 10, scale: 2 }), // Added price field
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  first_name: varchar("first_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
});

// Assignments table (bridge table for many-to-many relationship)
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  apartment_id: integer("apartment_id").notNull().references(() => apartments.id, { onDelete: "cascade" }),
  employee_id: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    uniqueIdx: primaryKey({ columns: [table.apartment_id, table.employee_id] }),
  };
});

// Define relations
export const apartmentsRelations = relations(apartments, ({ many }) => ({
  assignments: many(assignments)
}));

export const employeesRelations = relations(employees, ({ many }) => ({
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

// Insert schemas
export const insertApartmentSchema = createInsertSchema(apartments).omit({ id: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true });

// Types
export type Apartment = typeof apartments.$inferSelect;
export type InsertApartment = z.infer<typeof insertApartmentSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

// Extended schemas for API operations
export const apartmentWithEmployeesSchema = z.object({
  ...insertApartmentSchema.shape,
  price: z.union([z.string(), z.number()]).optional().nullable(), // Modifica: Accetta sia stringa che numero
  employee_ids: z.array(z.number()).optional(),
});

export type ApartmentWithEmployees = z.infer<typeof apartmentWithEmployeesSchema>;

// Extended types for API responses
export type ApartmentWithAssignedEmployees = Apartment & {
  employees: Employee[];
};

export type EmployeeWithAssignedApartments = Employee & {
  apartments: Apartment[];
};
