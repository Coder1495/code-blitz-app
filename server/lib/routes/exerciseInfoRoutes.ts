import {Request, Response, NextFunction} from "express";
import { ExerciseInfoController } from "../controllers/ExerciseInfoController";

export class ExerciseInfoRoutes { 
    
    public exerciseInfoController = new ExerciseInfoController();
    
    public routes(app): void {   

        // Exercises 
        app.route('/exercise')
        .get((req: Request, res: Response, next: NextFunction) => {
            // middleware
            console.log(`Request from: ${req.originalUrl}`);
            console.log(`Request type: ${req.method}`);  
            next(); // seems to be required          
        }, this.exerciseInfoController.getExerciseInfo)
        .post(this.exerciseInfoController.compareAnswer);
    }
}