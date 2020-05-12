// REVIEW: Following is a hack to share model defined in client
// and may require running 'tsc' twice after initial repo download.
import { GameplayStats } from '../../../src/models/client.game.model';

export class Singleton
{
    private static instance: Singleton;

    public challengers = {};

    public games : { [user_id:string] : GameplayStats } = {};

    private constructor(){}

    public static getInstance(): Singleton
    {
        if(!Singleton.instance)
        {
            Singleton.instance = new Singleton();
        }
        return Singleton.instance;
    }
}
