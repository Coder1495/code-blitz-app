export class Challenge {
  public id: string;
  public name: string;
  public winLossRecord: string;
  public challenged: boolean;

  constructor(
    { id, name, winLossRecord, challenged } = {
      id: null,
      name: null,
      winLossRecord: null,
      challenged: false
    }
  ) {
    this.id = id;
    this.name = name;
    this.winLossRecord = winLossRecord;
    this.challenged = challenged;
  }
}
