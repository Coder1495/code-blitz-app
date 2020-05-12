import { GameToken, GameTokens, Location, locations, GameplayStats }
  from '../models/client.game.model';
import { Fetch } from '../utils/Fetch';
import { TokenID, ExerciseToken, Exercise, SubmitSolution, SubmitResponse } 
  from '../models/exercise.model';

type Direction = 1 | -1;

export type HandleMoveToken = typeof GameService.prototype.moveToken;
export type HandleSubmitCode = typeof GameService.prototype.checkCode;

type OnTokenArrayChanged = (x : GameToken[]) => (string);

export class GameService {
  private tokens : GameTokens = {};
  private exercise : Exercise;
  private myStats = { budget: 0 } as GameplayStats;
  private opponentStats = {} as GameplayStats;
  private tokenLocationArray : {
    [location:string/*Location*/] : TokenID[]
  } = {};

  private onExerciseLoaded : (exercise: Exercise) => (void);
  private onRefreshGameplayStats 
    : (myStats: GameplayStats, opponentStats: GameplayStats) => (void);
  private onTokenLocationChanged : {
    [location:string/*Location*/] : OnTokenArrayChanged
  } = {};

  constructor(private session_id:string, private challenge_id:string)
  {
    // Initialize my user ("session") id and my opponent's (challenge_id)
    // to be broardcast with my gameplay stats...
    this.myStats.session_id = this.session_id;
    this.myStats.challenge_id = this.challenge_id;
    
    // Initialize location arrays...
    locations.forEach((location)=> {
      this.tokenLocationArray[location] = []; // initialize arrays
    });
    // Read exercise data from server and load it
    Fetch('/exercise') 
      .then(res => res && res.json())
      // quick adjustment to fetch tokens from first exercise...
      .then(res => res) 
      .then( this.loadExercise.bind(this) );
  }

  private loadExercise(exercises:Exercise[])
  {
    //
    // Exercises are chosen based on the sum of the
    // last characters in each users ID.  There are currently
    // two exercises configured from which a semi random
    // selection is made using this formula.  However,
    // the same session_id and challenge_id users will 
    // always get the same exercise challenge.  This is a
    // simple temporary algorithm that supports easy testing.
    // Different pairs of users can be tested in order to 
    // recall from the (currently two) exercises available...
    //
    this.exercise = exercises[ 
      ( this.session_id.charCodeAt(this.session_id.length-1)
      + this.challenge_id.charCodeAt(this.challenge_id.length-1) ) % 2
    ];
    const exerciseTokens:Array<ExerciseToken> = this.exercise.tokens;
    
    this.myStats.budget = this.exercise.availableBudget;
    // One-time load/refresh of view now that we've got the 
    // selected exercise data...
    this.onExerciseLoaded(this.exercise);

    // Load all game tokens to
    // the central game token storage object
    // with a location setting of conveyor...
    this.tokens = exerciseTokens.reduce(
      (result,exerciseToken,index) => {
        result[exerciseToken.id] 
          = { ...exerciseToken, 
              location: 'conveyor'
            }
        return result;
      }, {} as GameTokens
    );
    this.refreshLocationArrays(null);
    this.commit(locations);
  }

  public bindExerciseLoaded(
    callback: (exercise: Exercise) => (void)
  ) {
    this.onExerciseLoaded = callback;
  }

  public bindRefreshGameplayStats(
    callback: (myStats: GameplayStats, opponentStats: GameplayStats) => (void)
  ) {
    this.onRefreshGameplayStats = callback;
  }

  public bindTokenLocationChanged(
    tokenLocation: Location, 
    callback: OnTokenArrayChanged
  ) {
    this.onTokenLocationChanged[tokenLocation] = callback;
    // Trigger view refresh on bind
    this.commit([tokenLocation]);
  }

  private refreshLocationArrays(codeCursorTokenIndex:number) {
    let allIDsToProcess = new Set(Object.keys(this.tokens));

    // Remove any location array entries that have moved
    locations.forEach((location) => {
      // Check existing entries for removal or confirmation
      [...this.tokenLocationArray[location]].forEach( (tokenID,index) => {
        if (this.tokens[tokenID].location===location) {
          // Token is confirmed in proper location, so do nothing 
          // except remove from to-process set
          if (!allIDsToProcess.delete(tokenID))
            // Hopefully the following will never occur,
            // even though our algorithm is 'self healing' in that
            // it guarantees we will be restored to a valid state.
            alert(`Assertion that tokens should be in only one location FAILED for id ${tokenID}!`)
        } else {
          // Token must have moved, so remove from this (obsolete) location
          this.tokenLocationArray[location].splice(index,1);
        }
      });
    });
 
    // Add any unconfirmed IDs to their proper location arrays
    allIDsToProcess.forEach((tokenID) => {
      const location = this.tokens[tokenID].location;
      const localTokenArray = this.tokenLocationArray[location];
      if (location!=='code' || codeCursorTokenIndex===null
          || codeCursorTokenIndex >= localTokenArray.length) // safeguard
        // Move tokens to end of location collection (for now)
        // for conveyor and token bank, and for code-editor 
        // if cursor index is null (default placement at end)...
        localTokenArray.push(tokenID);
      else
        // Inset token to location of cursor if location is code-editor
        // and codeCursorTokenIndex is not null...
        localTokenArray.splice(codeCursorTokenIndex,0,tokenID);
    });
  }

  public moveToken(tokenID : TokenID, direction : Direction, codeCursorTokenIndex:number)
  {
    const oldLocation = this.tokens[tokenID].location;
    let newPos = locations.indexOf(oldLocation) + direction;

    // Check boundaries
    if (newPos < 0 || newPos >= locations.length)
//      alert('Assertion FAILED that tokens not be moved beyond location positions'
//      +` 0, 1, and 2; tried to move token ID ${tokenID} to position #${newPos}`);
      newPos = locations.indexOf(oldLocation) - direction; // help w/ testing...
//    else { ...
      // Boundary checks out OK, proceed to move
      const newLocation = locations[newPos];
      // alert(`tokenID=${tokenID}, direction=${direction}, from=${oldLocation} to ${newLocation}`);
      this.tokens[tokenID].location = newLocation;
      this.refreshLocationArrays(codeCursorTokenIndex);
      this.commit([oldLocation,newLocation]); 
//    } ...
    return;
  }

  checkBudget(tokenID : TokenID)
  {
    var moveToken = true;
    const location = this.tokens[tokenID].location;
    if(location == 'conveyor' && this.myStats.budget < this.tokens[tokenID].cost)
    {
      moveToken = false;
    }
    return moveToken;
  }

  public changeBudget(tokenID : TokenID)
  {
    const location = this.tokens[tokenID].location;
    if(location == 'conveyor')
    {
      this.myStats.budget = 
        Math.round((this.myStats.budget - this.tokens[tokenID].cost)*100)/100;
    }
    return this.myStats.budget
  }

  private commit(locations : Location[]) 
  {
    locations.forEach((location : Location) => {
      const strHtml = this.onTokenLocationChanged[location](
        this.tokenLocationArray[location].map(tokenID=>this.tokens[tokenID])
      );
      if (location==='code') {
        this.myStats.code_html = strHtml;
        // TODO: Following is not 100% accurate yet!!!
        this.myStats.lines_of_code = strHtml.match(/[<]br[>]/g).length - 1;
        this.myStats.tokens_placed = this.tokenLocationArray['code'].length
      }
    });

    this.broadcastStats();

    this.onRefreshGameplayStats(this.myStats, this.opponentStats);  
  }

  public broadcastStats() 
  {
    Fetch('/game', {
      method: 'POST',
      body: JSON.stringify(this.myStats)
    })
    .then( res => res && res.json() )
    .then( res => {
      this.opponentStats = res;
      this.onRefreshGameplayStats(this.myStats, this.opponentStats);  
    });      
  }

  public checkCode(elapsedTime: string)
  { 
    const submitSolution = {} as SubmitSolution;

    submitSolution._title = this.exercise.title;
    submitSolution._code =
      this.tokenLocationArray['code']
        .reduce( (prev, tokenID) => prev += this.tokens[tokenID].token +' ','');
    submitSolution.session_id = this.session_id;
    submitSolution.challenge_id = this.challenge_id;
    submitSolution.elapsed_time = elapsedTime;
        
    return Fetch('/exercise', { 
      method: 'POST',
      body: JSON.stringify(submitSolution)
    })
    .then(res => res && res.json())
    .then( (res:SubmitResponse) => {
      const { solution_verified, submit_attempts } = res;
      this.myStats = { ...this.myStats, solution_verified, submit_attempts }
      return res;
    } );
  }
}