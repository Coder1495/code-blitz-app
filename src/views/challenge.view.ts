import { Challenge } from '../models/challenge.model';

interface Input {
  key: string;
  type: string;
  placeholder: string;
  name: string;
}
export class ChallengeView {
  private app: HTMLElement;
  private form: HTMLElement;
  private title: HTMLElement;
  private userData: HTMLElement;
  private userList: HTMLElement;

  constructor() {
    this.app = document.querySelector('#root');

    this.form = this.createElement('form');

    this.title = this.createElement('h1');
    this.title.textContent = 'Challenge';
    this.userData = this.createElement('div', 'userData');
    this.userList = this.createElement('ul', 'user-list');
    this.app.append(this.title, this.form, this.userData, this.userList);
  }

  createElement(tag: string, className?: string) {
    const element = document.createElement(tag);
    if (className) element.classList.add(className);
    return element;
  }

  displaySelf(user: Challenge) {
    this.userData.setAttribute('style', 'white-space: pre;');
    this.userData.style.width = '150px';
    this.userData.style.height = '100px';
    this.userData.style.background = 'white';
    this.userData.style.border = '5px solid black';
    this.userData.style.padding = '15px';
    this.userData.style.margin = '10px';
    this.userData.innerHTML = '<b>' 
      + user.name + '</b>' + '\r\n\r\n'
      + "W/L: " + user.winLossRecord;
  }

  displayUsers(users: Challenge[]) {
    // Delete all nodes
    while (this.userList.firstChild) {
      this.userList.removeChild(this.userList.firstChild);
    }

    // Show default message
    if (users.length === 0) {
      const p = this.createElement('p');
      p.textContent = 'No users are currently looking for a challenge.';
      this.userList.append(p);
    } else {
      // Create nodes
      users.forEach(user => {
        const li = this.createElement('li');
        li.id = user.id;

        const spanUser = this.createElement('span');

        const spanAge = this.createElement('span');

        spanUser.textContent = user.name;
        spanAge.textContent = user.winLossRecord;

        const challengeButton = this.createElement('button', 'challenge');
        challengeButton.textContent = 'Challenge';

        const acceptChallengeButton = this.createElement('button', 'accept');
        acceptChallengeButton.textContent = "Accept Challenge";
        acceptChallengeButton.style.visibility = user.challenged ? 'visible' : 'hidden';
        li.append(spanUser, spanAge, challengeButton, acceptChallengeButton);

        // Append nodes
        this.userList.append(li);
      });
    }
  }

  bindChallengeUser(handler: Function) {
    this.userList.addEventListener('click', event => {
      if ((event.target as any).className === 'challenge') {
        const id = (event.target as any).parentElement.id;
        
        handler(id);
      }
    });
  }

  bindAcceptChallenge(handler: Function) {
    this.userList.addEventListener('click', event => {
      if ((event.target as any).className === 'accept') {
        const id = (event.target as any).parentElement.id;

        handler(id);
      }
    })
  }
}