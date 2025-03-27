import { NextFunction, Request, Response } from 'express';
import { Note } from "../models/Note";


export class NoteController {
  static async createNote(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      if (!(req as any).user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { title, content } = req.body;
      const note = new Note({
        title,
        content,
        userId: (req as any).user.id, // ✅ Now TypeScript recognizes req.user
      });

      await note.save();
      return res.status(201).json({ message: "Note created successfully", note });
    } catch (error) {
      next(error);
    }
  }


  static async updateNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, content, category, date } = req.body;
      const updatedNote = await Note.findByIdAndUpdate(id, { title, content, category, date}, { new: true });
      if (!updatedNote) return res.status(404).json({ error: 'Note not found' });
      return res.json({ message: 'Note updated successfully', note: updatedNote });
    } catch (error) {
      console.error('Error updating note:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  static async getNote(req: Request, res: Response) {
    const user = (req as any).user; // Extract user from request
    try {
        const { id } = req.params;
        console.log("Fetching Note ID:", id); // Debugging log

        // Fetch note by ID
        const note = await Note.findById(id);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Ensure the note belongs to the logged-in user
        if (note.userId.toString() !== user.id) {
            return res.status(403).json({ error: 'Access denied: Unauthorized user' });
        }

        return res.json(note);
    } catch (error) {
        console.error('Error fetching note:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

  static async getAllNotes(req: Request, res: Response) {
    try {
      const notes = await Note.find();
      return res.json(notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  static async deleteNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const note = await Note.findByIdAndDelete(id);
      if (!note) return res.status(404).json({ error: 'Note not found' });
      return res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Error deleting note:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}




















