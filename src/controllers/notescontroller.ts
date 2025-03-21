import { NextFunction, Request, Response } from 'express';
import { Note } from "../models/Note";


export class NoteController {
  static async createNote(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;
    try {
        console.log("Received Request from Device:", req.body); // ✅ Log request from Flutter

        const { title, content, category } = req.body;
        const userId = user.aud

        const newNote = new Note({ title, content, userId, category });
        const savedNote = await newNote.save();

        console.log("Saved Note in MongoDB:", savedNote); // ✅ Log stored note
        res.status(200).json({ message: "Note created successfully", note: savedNote });
    } catch (e) {
       next(e)
    }
}
  static async updateNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, content, date } = req.body;
      const updatedNote = await Note.findByIdAndUpdate(id, { title, content, date }, { new: true });
      if (!updatedNote) return res.status(404).json({ error: 'Note not found' });
      return res.json({ message: 'Note updated successfully', note: updatedNote });
    } catch (error) {
      console.error('Error updating note:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  static async getNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const note = await Note.findById(id);
      if (!note) return res.status(404).json({ error: 'Note not found' });
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




















