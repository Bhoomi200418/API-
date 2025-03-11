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
    this.router.get("/", GlobalMiddleWare.auth, NotesController.getNotes);
    this.router.get("/date", GlobalMiddleWare.auth, NotesController.getNotesByDate);
  }

  postRoutes() {
    this.router.post("/", NotesValidators.createNote(), GlobalMiddleWare.checkError, GlobalMiddleWare.auth, NotesController.createNote);
  }

  patchRoutes() {
    this.router.patch("/:id", NotesValidators.updateNote(), GlobalMiddleWare.checkError, GlobalMiddleWare.auth, NotesController.updateNote);
  }

  putRoutes() {
    // You can add any necessary PUT routes here
  }

  deleteRoutes() {
    this.router.delete("/:id", GlobalMiddleWare.auth, NotesController.deleteNote);
  }
}

export default new NotesRouter().router;
