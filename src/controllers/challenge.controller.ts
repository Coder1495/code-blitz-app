import { Challenge } from '../models/challenge.model';
import { ChallengeService } from '../services/challenge.service';
import { ChallengeView } from '../views/challenge.view';
import { UserService } from '../services/user.service';

export class ChallengeController {
  constructor(
      private session_id: string,
      private userService: UserService,
      private challengeService: ChallengeService, 
      private challengeView: ChallengeView
  ) {
    // Add user to challengers
    this.update();

    // Explicit this binding
    this.challengeService.bindUserListChanged(this.onUserListChanged);

    this.challengeView.bindChallengeUser(this.handleChallengeUser);

    this.challengeView.bindAcceptChallenge(this.handleAcceptChallenge);

    setInterval(() => this.update(), 3000);

    // Display initial users
    this.onUserListChanged(this.challengeService.users);
  }

  update = () => {
    this.userService.updateChallengers(this.session_id)
    .then(res =>{
      let active = []
      if(res)
      {
        res.forEach(element => {
          active.push(element._id);

          if (element._id === this.session_id && element.accepted.length)
          {
              this.StartChallenge(element.accepted[0]);
          }

          let challenger: Challenge = {
            id: element._id, 
            name: element.name, 
            winLossRecord: element.wins + '/' + element.losses,
            challenged: element.challenged 
          }
          this.challengeService.add(challenger);
        });
        this.challengeService.delete(active);
      }
    })
  }

  onUserListChanged = (challenge: Challenge[]) => {
    this.challengeView.displaySelf(challenge.find(self => self.id === this.session_id));
    this.challengeView.displayUsers(challenge.filter(users => users.id !== this.session_id));
  };

  StartChallenge = (id: string) => {
    // TODO: call this.challengeService to 
    // initialize and record (in Mongo) the 
    // start of a challenge, e.g...
    //this.challengeService.startChallenge(challenge)...

    // And route to game play page...
    const { origin, pathname } = location;
    location.replace(origin+pathname+'?page=game&session_id='+this.session_id
                    +'&challenge_id='+id);    
  }

  handleAddUser = (challenge: Challenge) => {
    this.challengeService.add(challenge);
  };

  handleChallengeUser = (id: string) => {
    this.userService.updateChallengers(this.session_id, id)
  }

  handleAcceptChallenge = (id: string) => {
    this.userService.updateChallengers(this.session_id, id, true);
    this.StartChallenge(id);
  }

  handleEditUser = (id: string, challenge: Challenge) => {
    this.challengeService.edit(id, challenge);
  };

  handleToggleUser = (id: string) => {
    this.challengeService.toggle(id);
  };
}
