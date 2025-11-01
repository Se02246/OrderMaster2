import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertApartmentSchema, 
  insertEmployeeSchema, 
  apartmentWithEmployeesSchema 
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // Apartments endpoints
  router.get("/apartments", async (req: Request, res: Response) => {
    try {
      const sortBy = req.query.sortBy as string | undefined;
      const search = req.query.search as string | undefined;
      
      const apartments = await storage.getApartments({ sortBy, search });
      res.json(apartments);
    } catch (error) {
      console.error("Error fetching apartments:", error);
      res.status(500).json({ message: "Error fetching apartments" });
    }
  });

  router.get("/apartments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid apartment ID" });
      }
      
      const apartment = await storage.getApartment(id);
      if (!apartment) {
        return res.status(404).json({ message: "Apartment not found" });
      }
      
      res.json(apartment);
    } catch (error) {
      console.error("Error fetching apartment:", error);
      res.status(500).json({ message: "Error fetching apartment" });
    }
  });

  router.post("/apartments", async (req: Request, res: Response) => {
    try {
      const validationResult = apartmentWithEmployeesSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const { employee_ids, ...apartmentData } = validationResult.data;
      
      const apartment = await storage.createApartment(
        apartmentData, 
        employee_ids || []
      );
      
      res.status(201).json(apartment);
    } catch (error) {
      console.error("Error creating apartment:", error);
      res.status(500).json({ message: "Error creating apartment" });
    }
  });

  router.put("/apartments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid apartment ID" });
      }
      
      const validationResult = apartmentWithEmployeesSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const { employee_ids, ...apartmentData } = validationResult.data;
      
      const apartment = await storage.updateApartment(
        id,
        apartmentData, 
        employee_ids || []
      );
      
      res.json(apartment);
    } catch (error) {
      console.error("Error updating apartment:", error);
      res.status(500).json({ message: "Error updating apartment" });
    }
  });

  router.delete("/apartments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid apartment ID" });
      }
      
      await storage.deleteApartment(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting apartment:", error);
      res.status(500).json({ message: "Error deleting apartment" });
    }
  });

  // Employees endpoints
  router.get("/employees", async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      
      const employees = await storage.getEmployees({ search });
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Error fetching employees" });
    }
  });

  router.get("/employees/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Error fetching employee" });
    }
  });

  router.post("/employees", async (req: Request, res: Response) => {
    try {
      const validationResult = insertEmployeeSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const employee = await storage.createEmployee(validationResult.data);
      
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Error creating employee" });
    }
  });

  router.delete("/employees/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      
      await storage.deleteEmployee(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Error deleting employee" });
    }
  });

  // Calendar endpoints
  router.get("/calendar/:year/:month", async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid year or month" });
      }
      
      const apartments = await storage.getApartmentsByMonth(year, month);
      res.json(apartments);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      res.status(500).json({ message: "Error fetching calendar data" });
    }
  });

  router.get("/calendar/:year/:month/:day", async (req: Request, res: Response) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const day = parseInt(req.params.day);
      
      if (isNaN(year) || isNaN(month) || isNaN(day) || 
          month < 1 || month > 12 || day < 1 || day > 31) {
        return res.status(400).json({ message: "Invalid date" });
      }
      
      const apartments = await storage.getApartmentsByDate(year, month, day);
      res.json(apartments);
    } catch (error) {
      console.error("Error fetching calendar day data:", error);
      res.status(500).json({ message: "Error fetching calendar day data" });
    }
  });

  // Statistics endpoint
  router.get("/statistics", async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Error fetching statistics" });
    }
  });

  // Register the API routes
  app.use("/api", router);

  const httpServer = createServer(app);

  return httpServer;
}
