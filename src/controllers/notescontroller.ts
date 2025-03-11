import { Request, Response, NextFunction } from "express";
import Note from "../models/Note";

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: { _id: string }; // Ensure this matches your JWT payload
}

export class NotesController {
  // Create a new note
  static async createNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized access" });
        return;
      }

      const { title, content } = req.body;
      if (!title || !content) {
        res.status(400).json({ message: "Title and content are required" });
        return;
      }

      const note = new Note({ userId: req.user._id, title, content });
      await note.save();

      res.status(201).json({ message: "Note created successfully", note });
    } catch (error) {
      next(error);
    }
  }

  // Get all notes for the authenticated user
  static async getNotes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized access" });
        return;
      }

      const notes = await Note.find({ userId: req.user._id });
      res.json(notes);
    } catch (error) {
      next(error);
    }
  }

  // Get notes by date
  static async getNotesByDate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized access" });
        return;
      }

      const { date } = req.body;
      if (!date) {
        res.status(400).json({ message: "Date is required" });
        return;
      }

      const notes = await Note.find({
        userId: req.user._id,
        createdAt: { $gte: new Date(date) },
      });

      res.json(notes);
    } catch (error) {
      next(error);
    }
  }

  // Update a note
  static async updateNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized access" });
        return;
      }

      const { noteId, title, content } = req.body;
      if (!noteId || (!title && !content)) {
        res.status(400).json({ message: "Note ID and at least one field (title/content) are required" });
        return;
      }

      const updatedNote = await Note.findOneAndUpdate(
        { _id: noteId, userId: req.user._id },
        { title, content },
        { new: true }
      );

      if (!updatedNote) {
        res.status(404).json({ message: "Note not found" });
        return;
      }

      res.json({ message: "Note updated successfully", updatedNote });
    } catch (error) {
      next(error);
    }
  }

  // Delete a note
  static async deleteNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized access" });
        return;
      }

      const { noteId } = req.body;
      if (!noteId) {
        res.status(400).json({ message: "Note ID is required" });
        return;
      }

      const deletedNote = await Note.findOneAndDelete({ _id: noteId, userId: req.user._id });

      if (!deletedNote) {
        res.status(404).json({ message: "Note not found" });
        return;
      }

      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
