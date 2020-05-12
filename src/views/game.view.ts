import { html } from './game.view.html';
import { GameToken, Location, locations, GameplayStats } 
  from '../models/client.game.model';
import { HandleMoveToken } from '../services/game.service';
import { TokenOrMarkup, codeTokensFormatter } 
  from './game.view.format.logic';
import { Exercise, SubmitResponse } from '../models/exercise.model';

export const newlineMarkup = '<br/>';
export const cursorPlaceholderMarkup = '|';
const indentMarkup = '&nbsp;&nbsp;&nbsp;&nbsp;|';

export class GameView 
{
  private app: HTMLElement;
  private dynamicStyles : HTMLStyleElement;
  private divCodeEditor : HTMLDivElement;
  private divOpponentEditor: HTMLDivElement;
  private animateConveyor : AnimateConveyor;
  private winnerDetected = false;

  private ulTokens : {
    [location:string/*Location*/] : HTMLUListElement
  } = {};

  // Default to 'null' insertion point, which will flag our
  // service to insert new code-editor tokens at the end (last)...
  private codeCursorTokenIndex : number = null; 

  private formattedCodeTokens : TokenOrMarkup[];

  private timer;
  private modal;

  constructor() {
    this.app = document.getElementById('root');

    this.app.innerHTML = html; 

    this.dynamicStyles = 
      document.getElementById('dynamic-styles') as HTMLStyleElement;
    this.divCodeEditor = 
      document.getElementById('code-editor') as HTMLDivElement;
    this.divOpponentEditor = 
      document.getElementById('opponent-editor') as HTMLDivElement;
    this.modal = document.getElementById("myModal");

    console.log(this.dynamicStyles.innerText)
    console.log(this.divCodeEditor.innerHTML)
    console.log(this.divOpponentEditor.innerHTML = 'CONNECTING . . . ')

    locations.forEach((location)=>{
      this.ulTokens[location] 
        = document.getElementById(
          location.replace(' ','_') // (spaces not valid in HTML IDs)
        ) as HTMLUListElement;
    })

    // Animate conveyor
    this.animateConveyor = new AnimateConveyor(this.ulTokens['conveyor'], 0);
    this.bindSpeedVCRbuttons(); 
    
    this.timer = this.initializeTimer();
    this.initializePopup();
  }

  private bindSpeedVCRbuttons() 
  {
    var currentSpeed = 10;
    var pauseFlag = false;

    const changeSpeed = (speedChange:number) => {
      if (pauseFlag) {
        pauseFlag = false;
      }
      else {
        pauseFlag = (speedChange===0);
        if (pauseFlag) {
          this.animateConveyor.setDelayIn10thSeconds(0);
          return;
        }
        else if(currentSpeed-speedChange > 0) {
          currentSpeed = currentSpeed - speedChange; 
          console.log(currentSpeed)
        }
      }
      this.animateConveyor.setDelayIn10thSeconds(currentSpeed);
    };

    this.animateConveyor.setDelayIn10thSeconds(currentSpeed);
    document.getElementById("speedPlus").onclick = ()=>changeSpeed(3);
    document.getElementById("speedMinus").onclick = ()=>changeSpeed(-3);
    document.getElementById("speedPause").onclick = ()=>changeSpeed(0);
  }

  public bindSubmitCode(handler: Function) {
    var btn = document.getElementById("submit")
    btn.onclick = function() {
      handler(document.getElementById("timer").innerText);
    };
  }

  public submitResult(result: SubmitResponse) {
    switch (result.code) {
      case 'correct':
        clearInterval(this.timer);
        this.modal.innerHTML = `
          <div class="modal-content">
            <span class="close">&times;</span>
            <p>${this.winnerDetected?"YOU DID IT!":"YOU WIN!"}</p>
          </div>`;
          this.winnerDetected = true;
          const btn = document.getElementById("submit");
          btn.onclick = ()=>{
            const {origin, pathname, search } = location;
            location.replace(
              origin+pathname+'?page=home&'+search.split('?')[1]);
          };
          btn.innerHTML = btn.innerHTML.replace(
            "SUBMIT CODE", "SUCCESS! CLICK TO RETURN HOME");
        break;
      case 'exception':
        this.modal.innerHTML = `
          <div class="modal-content">
            <span class="close">&times;</span>
            <p>Your program did not compile.<br/>
              Here is the error message:<br/> 
              "${result.evalError}"
            </p>
          </div>`;
        break;
      case 'incorrect':
        this.modal.innerHTML = `
          <div class="modal-content">
            <span class="close">&times;</span>
            <p>Your program compiled!<br/>
              But it did not pass our 3 sample data / solution sets.<br/>
              Keep Trying!
            </p>
          </div>`;
        break;
    }
    this.modal.style.display = "block";
  }

  // Primarily calls service handler() to move tokens between
  // location container in model; but also handles updating
  // 'code cursor' if we are updating the code-editor window...
  public bindMoveToken(handler: HandleMoveToken) {
    locations.forEach((location) => {
      this.ulTokens[location].addEventListener('click', 
      event => 
      {
        const targ = (event.target as HTMLUListElement);
        // All LI elements contain tokens and trigger model updates,
        // any other element types are markup which do not update the model...
        if (targ.tagName.toLowerCase()==='li') 
        {
          let index : number;
          // if coming from token bank, then increment cursor after insert
          switch (location) {
            case 'token bank':
              handler(targ.id,1,this.codeCursorTokenIndex);
              index = this.findFormattedIndexOfToken(targ.id);
              // Relies on current fact that every token is followed by 
              // a cursor placholder...
              index++;
              break;
            case 'code':
              index = this.findFormattedIndexOfToken(targ.id);
              let removingOpenBracket 
                = this.formattedCodeTokens[index].gameToken.token === '{';
              handler(targ.id,1,this.codeCursorTokenIndex);
              // Relies on current fact that every token is preceeded by 
              // a cursor placholder...
              index--;
              // TODO: Review this hack to adjust cursor position after '{' removal
              if (removingOpenBracket) index-=2; 
              break;
            case 'conveyor':
              handler(targ.id,1,this.codeCursorTokenIndex);
              return; // we're done, get out
          }

          this.placeCursor(index); 
        }
      });
    });
  }

  public setBudget(budget: number)
  {
    var lbl = document.getElementById('budget');

    lbl.style.background = 'green';
    lbl.innerHTML = '<div class="credit"><br><br>CREDIT<br>$ ' + budget.toFixed(2) + '</div>';
  }

  public overBudget()
  {
    var modal = document.getElementById("myModal");
    modal.innerHTML = '<div class="modal-content"><span class="close">&times;</span><p>Not enough credit!</p></div>';
    modal.style.display = "block";
  }

  //
  // One-time callback from service to inject our exercise model 
  // data onto our game play page!
  //
  public initialize(exercise : Exercise)
  {
    const divPrompt = document.getElementById('prompt');
    divPrompt.innerText = exercise.prompt;
    const divPrologue = document.getElementById('prologue');
    divPrologue.innerText = exercise.solutions[0].prologue;
    const divEpilogue = document.getElementById('epilogue');
    divEpilogue.innerText = exercise.solutions[0].epilogue;
    //console.log(exercise.solutions[0].epilogue);
    this.setBudget(exercise.availableBudget);
  }

  public displayGameplayStats(myStats: GameplayStats, opponentStats: GameplayStats)
  {
    const divMyStats = document.getElementById('stats') as HTMLDivElement;
    const divOpponentStats = document.getElementById('opponent-stats') as HTMLDivElement;
    const myHTML = myStats.code_html;
    this.divOpponentEditor.innerHTML = opponentStats.code_html;    

    this.renderStats(divMyStats,myStats,"MY STATS",
      myStats.solution_verified, opponentStats.solution_verified);
    this.renderStats(divOpponentStats,opponentStats,"OPPONENT STATS",
      opponentStats.solution_verified, myStats.solution_verified);

  }

  private renderStats(
    div : HTMLDivElement, 
    stats : GameplayStats, 
    player: string,
    mySolutionTime:string,
    opponentSolutionTime:string)
  {
    const myTime = mySolutionTime || '';
    const urTime = opponentSolutionTime || '99:99';
    let message = '';
    const win = myTime && myTime < urTime ? "win" 
      : ( myTime===urTime ? "tie" : "");

    if (win==='win') {
      message = "<b><em>***** WINNER!!!! *****</em></b>";
      if (!this.winnerDetected) {
        this.winnerDetected = true;
        this.modal.innerHTML = `
          <div class="modal-content">
            <span class="close">&times;</span>
            <p>Your opponent won...<br/>
              But you may continue to work on your solution<br/>
              to learn and improve your ranking!
            </p>
          </div>`;
          this.modal.style.display = "block";
      }
    } else if (win==='tie') 
      // TODO: Not fully completed; overlaps with "You won"
      // endgame logic at present...
      message = "<b><em>***** TIE GAME! *****</em></b>";

    div.innerHTML = `
      <b>${player}</b><br/><br/>
      BALANCE: ${stats.budget || 'OFFLINE!' }<br/>
      TOKENS PLACED: ${stats.tokens_placed || 0}<br/>
      LINES OF CODE: ${stats.lines_of_code || 0}<br/>
      NUM. SUBMITS: ${stats.submit_attempts || 0}<br/>
      SOLUTION TIME: ${stats.solution_verified || 'NOT YET!'}<br/><br/>
      ${message}
    `;
  }

  //
  // display() gets called whenever our model changes...
  // Method ALSO returns the latest code window HTML
  // when the method is called with location parameter === 'code'
  //
  public display(location : Location, tokens : GameToken[]) 
  {
    let formattedTokens : TokenOrMarkup[];

    // clear any prior tokens
    this.ulTokens[location].innerText = '';

    if (location!=='code')
      formattedTokens = tokens.map( token =>
        ({ gameToken: token }) );
    else {
      formattedTokens = codeTokensFormatter(tokens);
      // Save formatted code tokens in class member,
      // for later usage to associate insertion locations...
      this.formattedCodeTokens = formattedTokens;
    }

    //
    // Render / Add tokens and markup to DOM...
    //
    formattedTokens.forEach((tokenOrMarkup,index) => {
      // Render game tokens...
      if (tokenOrMarkup.gameToken)
        this.tokenMarkup(
          this.ulTokens[location], 
          tokenOrMarkup.gameToken
        );
      // Render newlines with indentation...
      else if (tokenOrMarkup.markUp === newlineMarkup) { 
        this.spanMarkup(
          this.ulTokens[location], 
          tokenOrMarkup.markUp
        );
        if ((tokenOrMarkup.indentationLevel||0) > 0)
          for (let indent = (tokenOrMarkup.indentationLevel); indent--; )
            this.spanMarkup(this.ulTokens[location], indentMarkup);
      // Render other markup, like cursor placeholders...
      } else {
        this.spanMarkup(
          this.ulTokens[location], 
          tokenOrMarkup.markUp,
          index
        );
      }
    });

    return location!=='code' ? null : this.divCodeEditor.innerHTML;
  }

  public findFormattedIndexOfToken(tokenID:string)
  {
    // Convert from token location back to formatted content location...
    const index = this.formattedCodeTokens
      .findIndex( (item) => (item.gameToken?.id === tokenID) );
    return index;
  }

  private placeCursor(index: number)
  {
    // Convert and store formattedTokens index into tokens index, since
    // we may need the tokens index to pass our 'insertion point' 
    // to the model service for token placement in the code-editor...
    this.codeCursorTokenIndex = null;
    for ( let i=index; this.codeCursorTokenIndex===null 
            && i < this.formattedCodeTokens.length; i++ ) 
      if (this.formattedCodeTokens[i].gameToken) 
        this.codeCursorTokenIndex = 
          // NOTE: First valid tokenIndex is 0 which is why 
          // we test for presence of 'gameToken' above...
          this.formattedCodeTokens[i].tokenIndex; 
    this.highlightCursor(index);
  }

  private highlightCursor(index:number)
  {
    // Highlight insertion point by creating a css selector
    // with the same same css classes as the insertion placeholder
    // selected via 'click' event....
    this.dynamicStyles.innerText = `
      div.code-editor span.${this.cursorCSSclasses(index).replace(/[ ]/g,'.')} 
      {
        color: red;
        font-weight: bold;
      }
    `;
  }

  private spanMarkup(parent: HTMLUListElement, markup: string, index = 0)
  { 
    const elem = (document.createElement('span') as HTMLSpanElement);
    elem.innerHTML = markup;

    // Make cursor placeholders active in the UI
    if (markup===cursorPlaceholderMarkup) {
      elem.className = (this.cursorCSSclasses(index));
      elem.addEventListener("click", 
        this.placeCursor.bind(this,index) 
      );
    }
    parent.appendChild(elem);
  }

  private cursorCSSclasses(index:number)
  {
    return 'cursor index-'+index;
  }

  private tokenMarkup(el: HTMLUListElement, token : GameToken)
  {
    const li = document.createElement('li') as HTMLLIElement;
    li.id = token.id;
    li.innerHTML = token.token;
    li.classList.add(token.type);
    el.appendChild(li);
  }

  private initializePopup() 
  {
    // Get the button that opens the modal
    var btn = document.getElementById("submit");

    // Get the <span> element that closes the modal
    var span : HTMLSpanElement = document.getElementsByClassName("close") as any;

    // When the user clicks on <span> (x), close the modal
    span.onclick = () => {
      this.modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = (event) => {
      //if (event.target == this.modal) {
        this.modal.style.display = "none";
      //}
    }
  }

  private initializeTimer()
  {
       //TIMER
        //Define vars to hold time values
        let seconds = 0;
        let minutes = 0;
    
        //Define vars to hold "display" value
        let displaySeconds : string;
        let displayMinutes : string;
        
        //Stopwatch function (logic to determine when to increment next value, etc.)
        const stopWatch = () =>
        {
            seconds++;
            //Logic to determine when to increment next value
            if(seconds / 60 === 1){
                seconds = 0;
                 minutes++;
            }
            // If seconds/minutes/hours are only one digit, 
            // add a leading 0 to the value
            if(seconds < 10)
                displaySeconds = "0" + seconds.toString();
            else
                displaySeconds = seconds.toString();
            
            if(minutes < 10)
                displayMinutes = "0" + minutes.toString();
            else
                displayMinutes = minutes.toString();
            
            //Display updated time values to user
            document.getElementById("timer").innerHTML 
              = displayMinutes + ":" + displaySeconds;
        }
        return window.setInterval(stopWatch, 1000);    
  }
}

class AnimateConveyor
{
  // TODO:
  // This could be animate for smooth motion,
  // there are many tutorials, e.g. 
  //   https://www.sarasoueidan.com/blog/creative-list-effects/
  //
  private tick = 0; // 10 = 1 second

  constructor(
    private ulConveyor:HTMLUListElement, 
    private ticksPerRotation?:number
  ) {
    setInterval(this.rotateTokens.bind(this), 100);
  }

  public setDelayIn10thSeconds(ticksPerRotation)
  {
    this.ticksPerRotation = ticksPerRotation;
  }

  private rotateTokens()
  {     
    if ( this.ulConveyor?.children?.length > 1
      && this.ticksPerRotation > 0 // use 0 to pause!
      && (this.tick++ % this.ticksPerRotation) === 0 ) 
    {
      const LI = this.ulConveyor.children[this.ulConveyor.children.length-1];
      const liWidth = LI.clientWidth;
      
      this.ulConveyor.removeChild(LI);
      /*
      // concept for a smooth transition of movement in the conveyor:
      // in CSS we need a selector for the 1st item in the conveyor, e.g.
      // ul.conveyor li:first -tran: {
        width: 0px -> 85px;
      }
      */
      this.ulConveyor.insertBefore(LI,this.ulConveyor.children[0]);
    } 
  }
}

