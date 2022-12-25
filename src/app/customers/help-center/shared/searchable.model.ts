import { Observable } from 'rxjs';

export class Searchable {
  keywords: {
    keywordId: string;
    keyId: string;
    keyType: number;
    keyword: string;
  }[];
  screens: {
    screenId: string;
    keyId: string;
    keyType: number;
    screenName: string;
  }[];
}

export class QuestionData extends Searchable {
  questionId: string;
  question: string;
  answer: string;
  linkText: string;
  linkAction: string;
  linkNum: number;
}

export class TermData extends Searchable {
  termId: string;
  subject: string;
  details: string;
}

export class VideoData extends Searchable {
  videoId: string;
  subject: string;
  url: string;
  vimeoData: Observable<any>;
}
