import * as express from "express";
import * as bodyParser from "body-parser";
import { ExerciseInfoRoutes } from "./routes/exerciseInfoRoutes";
import { UserInfoRoutes } from "./routes/userInfoRoutes";
import { GameRoutes } from "./routes/gameRoutes";
import * as mongoose from "mongoose";
import * as dotenv from 'dotenv';

dotenv.config();

class App { 

    public app: express.Application = express();
    private exerciseInfoRoutes = new ExerciseInfoRoutes();
    private userInfoRoutes = new UserInfoRoutes();
    private gameRoutes = new GameRoutes();
    private mongoUrl = process.env.mongodb_url;

    constructor() {
        this.config();
        this.mongoSetup();
        this.exerciseInfoRoutes.routes(this.app);
        this.userInfoRoutes.routes(this.app);
        this.gameRoutes.routes(this.app);
    }

    private config(): void{
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        // serving static files 
        this.app.use(express.static('./dist/public'));
    }

    private mongoSetup(): void{
        //mongoose.Promise = global.Promise; // ??
        mongoose.connect(this.mongoUrl, {useNewUrlParser: true});        
    }

}

export default new App().app;
