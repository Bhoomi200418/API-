import { NextFunction, Request, Response } from "express";
import { Note } from "../models/Note";
import { validationResult } from "express-validator";
import { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: JwtPayload & { sub?: string }; // ✅ Ensure it has `sub`
}

export class NoteController {
  static async createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
  
      // Extract userId from authenticated user
      const userId = (req as any).user?.id;
      console.log("User Id: ", userId);
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
  
      // Get note data from request body
      const { title, content,category, date } = req.body;
  
      // Create new note
      const newNote = new Note({ title, content, category, userId, date });
      await newNote.save();
  
      res.status(201).json({ message: "Note created successfully", note: newNote });
    } catch (error) {
      console.error("Error creating note:", error);
      next(error); // Ensure the error is properly passed to Express error handling
    }
  }
  
  

  static async updateNote(req: Request, res: Response) {
    try {
      console.log("Received request body:", req.body);
      console.log("Received request params:", req.params);
  
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Missing note ID in request parameters" });
      }
  
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized: No user found" });
      }
  
      const note = await Note.findById(id);
      if (!note) return res.status(404).json({ error: "Note not found" });
  
      // if (note.userId.toString() !== user.id) {
      //   return res.status(403).json({ error: "Access denied: Unauthorized user" });
      // }
  
      const { title, content, category, date } = req.body;
      const updatedNote = await Note.findByIdAndUpdate(
        id,
        { title, content, category, date },
        { new: true }
      );
  
      return res.json({ message: "Note updated successfully", note: updatedNote });
    } catch (error) {
      console.error("❌ Error updating note:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  

  static async getNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user; // Get logged-in user

      const note = await Note.findById(id);
      if (!note) return res.status(404).json({ error: "Note not found" });

      // Ensure only the owner can access it
      if (note.userId.toString() !== user.id) {
        return res.status(403).json({ error: "Access denied: Unauthorized user" });
      }

      return res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

static async getAllNotes(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    console.log("Request User in Controller:", req.user);
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const userId = req.user.sub; 
    const notes = await Note.find({ userId });

    return res.status(200).json({ success: true, notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    next(error);
  }
}

  
static async deleteNote(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("Received delete request. Params:", req.params);

    const noteId = req.params.id;
    if (!noteId) {
      return res.status(400).json({ error: "Note ID is required" });
    }

    console.log("Deleting Note with ID:", noteId);
    const deletedNote = await Note.findByIdAndDelete(noteId);

    if (!deletedNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    return res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    next(error); // ✅ Ensure `next` is called in case of error
  }
}


}
