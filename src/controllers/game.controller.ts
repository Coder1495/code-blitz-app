import { GameToken, locations } from '../models/client.game.model';
import { GameService, HandleMoveToken, HandleSubmitCode } from '../services/game.service';
import { GameView } from '../views/game.view';

export class GameController {
  constructor(
    private gameService: GameService,
    private gameView: GameView
    ) {
    // TODO: Study: Are constructor parameters added to 'this' class instance?
    this.gameView.bindSubmitCode(this.handleSubmitCode);

    this.gameService.bindExerciseLoaded((exercise) => {
      this.gameView.initialize(exercise);
    });

    this.gameService.bindRefreshGameplayStats((myStats,opponentStats) => {
      this.gameView.displayGameplayStats(myStats,opponentStats);
    });

    locations.forEach((location)=>{
      this.gameService.bindTokenLocationChanged(
        location, (tokens: GameToken[]) => (
          this.gameView.display(location,tokens) )
      );
    });

    // NOTE: Cannot directly call this.gameService.moveToken()
    // from here because context is NOT properly conveyed
    // to service method.  We MUST call handleMoveToken below.
    this.gameView.bindMoveToken(this.handleMoveToken);   

    // Keep game play stats up-to-date, and frequently refreshed in the view
    setInterval(() => this.gameService.broadcastStats(), 1000);
  }

  private handleMoveToken : HandleMoveToken 
      = (tokenID,direction,codeCursorTokenIndex:number) => {
    if (this.gameService.checkBudget(tokenID))
    {
      let budget = this.gameService.changeBudget(tokenID);
      this.gameView.setBudget(budget);
      this.gameService.moveToken(tokenID,direction,codeCursorTokenIndex);
    }
    else
    {
      this.gameView.overBudget();
    }
  }

  private handleSubmitCode = (elapsedTime: string) => {
    this.gameService.checkCode(elapsedTime)
    .then(res => {
      this.gameView.submitResult(res);
    });
  }
}