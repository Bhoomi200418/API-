import { Router, Request, Response, NextFunction } from "express";
import { NoteController } from "../controllers/NotesController";
import { GlobalMiddleWare } from "../middleware/GlobalMiddleWare";
import { NotesValidators } from "../validators/NotesValidators";

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

class NoteRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }
  
  initializeRoutes() {
    this.router.post(
      "/create",
      GlobalMiddleWare.auth,
      NotesValidators.createNote(),
      GlobalMiddleWare.checkError,
      asyncHandler(NoteController.createNote)
    );
    
    this.router.put(
      "/update/:id",
      GlobalMiddleWare.auth,
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          await NoteController.updateNote(req, res);
        } catch (error) {
          next(error);
        }
      }
    );
    this.router.get(
      "/get/:id",
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          await NoteController.getNote(req, res);
        } catch (error) {
          next(error);
        }
      }
    );
    this.router.get(
      "/all",
      GlobalMiddleWare.auth, // ✅ Ensure authentication is applied
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          await NoteController.getAllNotes(req, res, next); // Pass `next`
        } catch (error) {
          next(error);
        }
      }
    );
    
    this.router.delete(
      "/delete/:id",
      GlobalMiddleWare.auth, 
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          await NoteController.deleteNote(req, res, next);
        } catch (error) {
          next(error);
        }
      }
    );
  }
}
export default new NoteRouter().router;
