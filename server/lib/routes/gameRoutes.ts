import { GameController } from "../controllers/GameController";

export class GameRoutes { 
    
    public gameController = new GameController();
    
    public routes(app): void {   
        // Game status - post my info (returns opponents info) 
        app.route('/game')
        // POST endpoint
        .post(this.gameController.updateGameStatus);
    }
}