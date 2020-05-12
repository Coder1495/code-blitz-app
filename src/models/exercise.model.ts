type ExerciseLevels = 'low' | 'medium' | 'high';

export interface Exercise {
    id : string;
    title : string;
    prompt : string;
    level : ExerciseLevels;
    estimatedTime : number; // minutes
    availableBudget : number; // $
    highBudget : number;
    lowBudget : number;
    solutions : [{
        prologue: string,
        epilogue: string,
        solutionComparison:string
    }]
    tokens : ExerciseToken[];
}

export interface SubmitSolution {
    _title: string;
    _code: string;
    session_id: string;
    challenge_id: string;
    elapsed_time: string;
}

export type SubmitResponseCode = 'exception' | 'incorrect' | 'correct';

export interface SubmitResponse {
    result : boolean; // true of false for correct or incorrect solution
    code : SubmitResponseCode; // more detailed result
    evalError : string; // only populated if code=='exception'
    solution_verified: string; // either undefined or time solved!
    submit_attempts: number;    
}

// Alias defined to help document code
export type TokenID = string;

type TokenType = 'keyword' | 'operator' | 'symbol' | 'identifier' | 'literal';

export interface Token {
    id : TokenID;
    token : string; // Text or word or symbol; 
                    // or label like 'var' or 'ident' for identifiers
    type : TokenType;
}

export interface ExerciseToken extends Token {
    cost : number;
}

