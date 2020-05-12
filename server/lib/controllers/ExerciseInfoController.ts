import * as mongoose from 'mongoose';
import { ExerciseInfoSchema } from '../models/ExerciseInfoModel';
import { Request, Response } from 'express';
import { Exercise, SubmitSolution, SubmitResponse, SubmitResponseCode } 
  from '../../../src/models/exercise.model';
import { Singleton } from '../utils/singleton';
import { GameplayStats } from '../../../src/models/client.game.model';
  
const singleton = Singleton.getInstance();

mongoose.pluralize(null);

const ExerciseInfo = mongoose.model('ExerciseInfo', ExerciseInfoSchema);

export class ExerciseInfoController
{
  public getExerciseInfo (req: Request, res: Response) {           
    ExerciseInfo.find({}, (err, exercise) => {
      if(err){
        res.send(err);
      }
      res.json(exercise); 
    });
  }

  public compareAnswer = async (req: Request, res: Response) =>
  {
    const submitSolution = req.body as SubmitSolution;
    const myStats = singleton.games[submitSolution.session_id] 
      || {} as GameplayStats;
    let evalError;      

    {
      const { solution_verified, submit_attempts } = myStats;
      // "Debounce" Submit Code - don't re-evaluated if already solved
      if (solution_verified) {
        const response : SubmitResponse = 
          { result: true, code:'correct', evalError, 
            solution_verified, submit_attempts } 
        res.json( response )
        return;      
      }
    }

    // 
    // Capture console.log output into logAnswer.
    // NOTE: DO NOT USE console.log() for troubleshooting while
    // we are overriding its function.  Use console.warn() instead.
    //
    let logAnswer;
    let logBackup = console.log;
    console.log = function() {
      logAnswer = arguments[0];
      logBackup.apply(console, arguments);
    };

    ExerciseInfo.findOne(
        { 'title': submitSolution._title }, 
        (err, exercise : Exercise) => 
    {
      if(err) res.send(err);

      let result : SubmitResponseCode = 'correct'; // default assumption

      // test program against all solutions
      exercise.solutions.forEach(solution => 
      {
        // test while still 'correct'...
        if (result === 'correct')
        {
          logAnswer = undefined;
          // run program
          try { 
            // TODO: Can replace 'eval' with 'Function()()' for improved 
            // performance and safety in production, but we are leaving
            // eval for now for slightly better error messaging if program
            // code blocks are not terminated (We don't get ")" expected, 
            // to close function call).
            eval(
              solution.prologue+' '
              +submitSolution._code+' '
              +solution.epilogue ); 
          }
          catch (e) { 
            result = 'exception'; 
            evalError = e.toString(); 
          }
          // compare output to reference answer
          if (result === 'correct')
            if (logAnswer.toString() !== solution.solutionComparison)
              result = 'incorrect';
        }
      });

      // Restore normal console.log function
      console.log = logBackup;

      // Record results to game stats
      myStats.submit_attempts = (myStats.submit_attempts||0) + 1;
      if (result==='correct')
        myStats.solution_verified = submitSolution.elapsed_time;

      const response : SubmitResponse = 
        { result: result==='correct', code:result, evalError, 
          solution_verified : myStats.solution_verified, 
          submit_attempts : myStats.submit_attempts } 
      res.json( response )
    });
  }
}