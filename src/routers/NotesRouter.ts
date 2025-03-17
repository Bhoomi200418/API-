import { Router } from "express";
import { NotesValidators } from "../validators/NotesValidators";

import { NotesController } from "../controllers/notescontroller";
import { GlobalMiddleWare } from "../middleware/GlobalMiddleWare";

class NotesRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.getRoutes();
    this.postRoutes();
    this.patchRoutes();
    this.putRoutes();
    this.deleteRoutes();
  }

  getRoutes() {
    this.router.get("/", NotesController.getNotes);
    this.router.get("/date", NotesController.getNotesByDate);
  }

  postRoutes() {
  //   this.router.post("create-note", NotesValidators.createNote(), GlobalMiddleWare.checkError, NotesController.createNote);
  this.router.post(
    "/",  // ✅ Correct path
    GlobalMiddleWare.auth,
    NotesValidators.createNote(),
    GlobalMiddleWare.checkError,
    NotesController.createNote
);

  }

  patchRoutes() {
    this.router.patch("/:id", NotesValidators.updateNote(), GlobalMiddleWare.checkError, NotesController.updateNote);
  }

  putRoutes() {
    // You can add any necessary PUT routes here
  }

  deleteRoutes() {
    this.router.delete("/:id", NotesController.deleteNote);
  }
}

export default new NotesRouter().router;
