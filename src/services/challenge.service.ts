import { Challenge } from '../models/challenge.model';

export class ChallengeService {
  public users: Challenge[];
  private onUserListChanged: Function;

  constructor() {
    const users: Challenge[] = [];
    this.users = users.map(user => new Challenge(user));
  }

  bindUserListChanged(callback: Function) {
    this.onUserListChanged = callback;
  }

  _commit(users: Challenge[]) {
    this.onUserListChanged(users);
  }

  add(user: Challenge) {
    let usr = this.users.find(({ id }) => id === user.id)
    if (usr === undefined)
    {
      this.users.push(new Challenge(user));
      this._commit(this.users);
    }
    else if (usr.challenged !== user.challenged)
    {
      this.edit(usr.id, user);
    }
  }

  delete(_id: string[]) {
    this.users = this.users.filter(({ id }) => _id.includes(id));

    this._commit(this.users);
  }

  edit(id: string, userToEdit: Challenge) {
    let user = this.users
      .find(({id:user_id})=>user_id===id);
    Object.assign(user,userToEdit);

    this._commit(this.users);
  }

  toggle(_id: string) {
    this.users = this.users.map(user =>
      user.id === _id ? new Challenge({ ...user }) : user
    );

    this._commit(this.users);
  }
}
