export const html = 
`
<head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
  <div class='game-page'>
    <style id='dynamic-styles'>
    </style>
    <div class='flex5'>
      <div id='prompt'>PROMPT: Write a program to print out 10 numbers</div>
      <div id='language'> Javascript </div> 
      <div id='timeName'> TIME </div>
      <div id='timer'> </div>
    </div>
    <div class='flex10'>
      <div class='conveyor-container'>
        <ul id='conveyor' />
      </div>
    </div>
    <div class='flex2'>
      <div class='flex3'>
        <div class='prologue' id='prologue'>Prologue</div>
        <div id='code-editor' class='code-editor'>
          <ul style='display: block' id='code' />
        </div>
        <div class='epilogue' id='epilogue'>Epilogue</div>

        <div id='label'>TOKEN BANK</div>
        <div class='token-container'>
          <ul id='token_bank' />
        </div> 
      </div>
      <div class='flex4'>
        <div class='flex11'>
          <div class='conveyorSpeed' id='speedPause'><i class="fa fa-pause-circle"></i></div>
          <div class='conveyorSpeed' id='speedPlus'><i class="fa fa-plus-circle"></i></div>
          <div class='conveyorSpeed' id='speedMinus'><i class="fa fa-minus-circle"></i></div>
        </div>
        <div class="stats-container">
          <div class='flex9'>
          <div id='stats' class='stats'></div>
          </div>
          <div class='flex9'>
          <div id='opponent-stats' class='stats'></div>
          </div>
        </div>
        <div id='opponent-editor' class='code-editor'>
        </div>

        <div id="submit"><div class='submitButton'><div class='submit'>SUBMIT CODE</div>
        </div></div>
        <div id="myModal" class="modal">
        </div>

        <div class='flex6'>
          <div class='flex7'>
            <div id='label'>RETURN TOKEN</div>
            <div class='sellBack'>
            </div>
          </div>
          <div class='flex8'>
            <div id='budget'>Budget</div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;
