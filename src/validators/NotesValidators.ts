import { body } from "express-validator";
import Note from "../models/Note";

export class NotesValidators {
  static createNote() {
    return [
      body("title", "Title is required").isString().trim(),
      body("content", "Content is required").isString().trim(),
      // body("userId", "User Note ID is required").isMongoId(),
    ];
  }

  static updateNote() {
    return [
      body("noteId", "Valid Note ID is required").isMongoId(),
      body("title", "Title must be a string").optional().isString().trim(),
      body("content", "Content must be a string").optional().isString().trim(),
    ];
  }

  static deleteNote() {
    return [
      body("noteId", "Valid Note ID is required").isMongoId(),
    ];
  }

  static getNotesByDate() {
    return [
      body("date", "Valid date is required").isISO8601(),
    ];
  }
}
