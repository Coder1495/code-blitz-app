import { Request, Response } from 'express';
import { Singleton } from '../utils/singleton';
import { GameplayStats } from '../../../src/models/client.game.model';

const singleton = Singleton.getInstance();

export class GameController 
{
  public updateGameStatus (req: Request, res: Response)
  {
    const gameStats = req.body as GameplayStats;
   
   //console.log(JSON.stringify(gameStats))

    // Save our latests stats
    let myStats = singleton.games[gameStats.session_id] 
      || {} as GameplayStats;
    singleton.games[gameStats.session_id] = { 
      ...gameStats,
      submit_attempts : myStats.submit_attempts,
      solution_verified : myStats.solution_verified 
    };

    // Return the latest opponent stats
    res.json( singleton.games[gameStats.challenge_id] || {} );
  }
}