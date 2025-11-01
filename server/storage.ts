import { eq, and, like, or, inArray, desc, asc, sql, count } from "drizzle-orm";
import { db } from "./db";

import {
  apartments,
  employees,
  assignments,
  type Apartment,
  type InsertApartment,
  type Employee,
  type InsertEmployee,
  type Assignment,
  type InsertAssignment,
  type ApartmentWithAssignedEmployees,
  type EmployeeWithAssignedApartments,
} from "@shared/schema";

export interface IStorage {
  // Apartment operations
  getApartments(options?: { sortBy?: string; search?: string }): Promise<ApartmentWithAssignedEmployees[]>;
  getApartment(id: number): Promise<ApartmentWithAssignedEmployees | undefined>;
  createApartment(apartment: InsertApartment, employeeIds?: number[]): Promise<ApartmentWithAssignedEmployees>;
  updateApartment(id: number, apartment: InsertApartment, employeeIds?: number[]): Promise<ApartmentWithAssignedEmployees>;
  deleteApartment(id: number): Promise<void>;

  // Employee operations
  getEmployees(options?: { search?: string }): Promise<EmployeeWithAssignedApartments[]>;
  getEmployee(id: number): Promise<EmployeeWithAssignedApartments | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;

  // Calendar operations
  getApartmentsByMonth(year: number, month: number): Promise<ApartmentWithAssignedEmployees[]>;
  getApartmentsByDate(year: number, month: number, day: number): Promise<ApartmentWithAssignedEmployees[]>;

  // Assignment operations
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  deleteAssignmentsByApartment(apartmentId: number): Promise<void>;

  // Statistics operation
  getStatistics(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // Helper method to fetch employees assigned to an apartment
  private async getEmployeesForApartment(apartmentId: number): Promise<Employee[]> {
    return db
      .select({
        id: employees.id,
        first_name: employees.first_name,
        last_name: employees.last_name,
      })
      .from(employees)
      .innerJoin(assignments, eq(assignments.employee_id, employees.id))
      .where(eq(assignments.apartment_id, apartmentId));
  }

  // Helper method to fetch apartments assigned to an employee
  private async getApartmentsForEmployee(employeeId: number): Promise<Apartment[]> {
    const results = await db
      .select()
      .from(apartments)
      .innerJoin(assignments, eq(assignments.apartment_id, apartments.id))
      .where(eq(assignments.employee_id, employeeId));

    return results.map(result => ({
      id: result.apartments.id,
      name: result.apartments.name,
      cleaning_date: result.apartments.cleaning_date,
      start_time: result.apartments.start_time,
      end_time: result.apartments.end_time,
      status: result.apartments.status,
      payment_status: result.apartments.payment_status,
      notes: result.apartments.notes,
      price: result.apartments.price,
    }));
  }

  async getApartments(options?: { sortBy?: string; search?: string }): Promise<ApartmentWithAssignedEmployees[]> {
    let query = db.select().from(apartments);

    // Apply search if provided
    if (options?.search) {
      const searchTerm = `%${options.search}%`;
      query = query.where(
        or(
          like(apartments.name, searchTerm),
          like(apartments.notes || '', searchTerm),
          like(apartments.status, searchTerm),
          like(apartments.payment_status, searchTerm)
        )
      );
    }

    // Apply sorting if provided
    if (options?.sortBy === 'name') {
      query = query.orderBy(asc(apartments.name));
    } else {
      // Default sort by date (most recent first)
      query = query.orderBy(desc(apartments.cleaning_date));
    }

    const apartmentsList = await query;

    // Fetch employees for each apartment
    const results: ApartmentWithAssignedEmployees[] = [];
    for (const apt of apartmentsList) {
      const employees = await this.getEmployeesForApartment(apt.id);
      results.push({
        ...apt,
        employees,
      });
    }

    return results;
  }

  async getApartment(id: number): Promise<ApartmentWithAssignedEmployees | undefined> {
    const [apartment] = await db
      .select()
      .from(apartments)
      .where(eq(apartments.id, id));

    if (!apartment) return undefined;

    const employees = await this.getEmployeesForApartment(id);

    return {
      ...apartment,
      employees,
    };
  }

  async createApartment(apartment: InsertApartment, employeeIds: number[] = []): Promise<ApartmentWithAssignedEmployees> {
    // Insert apartment
    const [result] = await db
      .insert(apartments)
      .values(apartment)
      .returning();

    // Insert assignments if employeeIds are provided
    for (const employeeId of employeeIds) {
      await this.createAssignment({
        apartment_id: result.id,
        employee_id: employeeId,
      });
    }

    // Fetch the employees for the apartment
    const employees = await this.getEmployeesForApartment(result.id);

    return {
      ...result,
      employees,
    };
  }

  async updateApartment(id: number, apartment: InsertApartment, employeeIds: number[] = []): Promise<ApartmentWithAssignedEmployees> {
    // Update apartment
    await db
      .update(apartments)
      .set(apartment)
      .where(eq(apartments.id, id));

    // Delete existing assignments
    await this.deleteAssignmentsByApartment(id);

    // Insert new assignments
    for (const employeeId of employeeIds) {
      await this.createAssignment({
        apartment_id: id,
        employee_id: employeeId,
      });
    }

    // Fetch the updated apartment with employees
    const updatedApartment = await this.getApartment(id);
    if (!updatedApartment) {
      throw new Error(`Apartment with id ${id} not found after update`);
    }

    return updatedApartment;
  }

  async deleteApartment(id: number): Promise<void> {
    await db
      .delete(apartments)
      .where(eq(apartments.id, id));
  }

  async getEmployees(options?: { search?: string }): Promise<EmployeeWithAssignedApartments[]> {
    let query = db.select().from(employees);

    // Apply search if provided
    if (options?.search) {
      const searchTerm = `%${options.search}%`;
      query = query.where(
        or(
          like(employees.first_name, searchTerm),
          like(employees.last_name, searchTerm)
        )
      );
    }

    // Order by last name
    query = query.orderBy(asc(employees.last_name), asc(employees.first_name));

    const employeesList = await query;

    // Fetch apartments for each employee
    const results: EmployeeWithAssignedApartments[] = [];
    for (const emp of employeesList) {
      const apartments = await this.getApartmentsForEmployee(emp.id);
      results.push({
        ...emp,
        apartments,
      });
    }

    return results;
  }

  async getEmployee(id: number): Promise<EmployeeWithAssignedApartments | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id));

    if (!employee) return undefined;

    const apartments = await this.getApartmentsForEmployee(id);

    return {
      ...employee,
      apartments,
    };
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [result] = await db
      .insert(employees)
      .values(employee)
      .returning();

    return result;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db
      .delete(employees)
      .where(eq(employees.id, id));
  }

  async getApartmentsByMonth(year: number, month: number): Promise<ApartmentWithAssignedEmployees[]> {
    // PostgreSQL date functions to extract month and year from cleaning_date
    const monthStart = `${year}-${month.toString().padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${(month + 1).toString().padStart(2, '0')}-01`;

    const apartmentsList = await db
      .select()
      .from(apartments)
      .where(
        and(
          sql`${apartments.cleaning_date} >= ${monthStart}`,
          sql`${apartments.cleaning_date} < ${nextMonth}`
        )
      )
      .orderBy(asc(apartments.cleaning_date), asc(apartments.start_time));

    // Fetch employees for each apartment
    const results: ApartmentWithAssignedEmployees[] = [];
    for (const apt of apartmentsList) {
      const employees = await this.getEmployeesForApartment(apt.id);
      results.push({
        ...apt,
        employees,
      });
    }

    return results;
  }

  async getApartmentsByDate(year: number, month: number, day: number): Promise<ApartmentWithAssignedEmployees[]> {
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    const apartmentsList = await db
      .select()
      .from(apartments)
      .where(eq(apartments.cleaning_date, date))
      .orderBy(asc(apartments.start_time));

    // Fetch employees for each apartment
    const results: ApartmentWithAssignedEmployees[] = [];
    for (const apt of apartmentsList) {
      const employees = await this.getEmployeesForApartment(apt.id);
      results.push({
        ...apt,
        employees,
      });
    }

    return results;
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [result] = await db
      .insert(assignments)
      .values(assignment)
      .returning();

    return result;
  }

  async deleteAssignmentsByApartment(apartmentId: number): Promise<void> {
    await db
      .delete(assignments)
      .where(eq(assignments.apartment_id, apartmentId));
  }

  // Nuova funzione per le statistiche (semplificata)
  async getStatistics(): Promise<any> {
    // 1. Ordini totali
    const [totalOrdersResult] = await db.select({
      value: count()
    }).from(apartments);
    const totalOrders = totalOrdersResult.value;

    // 2. Top 3 Clienti
    const topEmployeesResult = await db
      .select({
        employee_id: assignments.employee_id,
        first_name: employees.first_name,
        last_name: employees.last_name,
        orderCount: count(assignments.apartment_id)
      })
      .from(assignments)
      .leftJoin(employees, eq(assignments.employee_id, employees.id))
      .groupBy(assignments.employee_id, employees.first_name, employees.last_name)
      .orderBy(desc(sql`count(assignments.apartment_id)`))
      .limit(3);

    const topEmployees = topEmployeesResult.map(emp => ({
      name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      count: Number(emp.orderCount)
    }));

    // 3. Top 3 Giorni più produttivi
    const busiestDaysResult = await db
        .select({
            date: apartments.cleaning_date,
            count: count()
        })
        .from(apartments)
        .groupBy(apartments.cleaning_date)
        .orderBy(desc(count()))
        .limit(3);

    const busiestDays = busiestDaysResult.map(day => ({
        date: day.date,
        count: Number(day.count)
    }));

    return {
      totalOrders,
      topEmployees,
      busiestDays
    };
  }
}

export const storage = new DatabaseStorage();
