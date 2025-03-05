export interface Observer {
  update(data: any): void;
}

export interface Subject {
  attach(observer: Observer): void;

  detach(observer: Observer): void;

  notify(data: any): void;
}

export abstract class AbstractObserver implements Observer {
  constructor(protected subject: Subject) {
    this.subject = subject;
    this.subject.attach(this);
  }

  abstract update(data: any): void;

  unsubscribe(): void {
    this.subject.detach(this);
  }
}
