export interface MessageRecords {
  Records: RecordContent[];
}

interface MessageAttribute {
  stringValue?: string;
  binaryValue?: string;
  stringListValues?: any[];
  binaryListValues?: any[];
  dataType: string;
}

export interface RecordContent {
  messageId: string;
  receiptHandle: string;
  body: string;
  attributes: { [key: string]: string };
  messageAttributes: { [key: string]: MessageAttribute };
  md5OfBody: string;
  eventSource: string;
  eventSourceARN: string;
  awsRegion: string;
}
