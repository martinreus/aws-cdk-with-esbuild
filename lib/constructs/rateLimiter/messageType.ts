import { MessageBodyAttributeMap } from "aws-sdk/clients/sqs";

export interface MessageRecords {
  Records: RecordContent[];
}

export interface MessageAttribute {
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

export interface RateLimiterPayload<Payload, Context> {
  payload: Payload;
  context: Context;
}

export function toSqsMessageAttributes(messageAttributes?: {
  [key: string]: MessageAttribute;
}): MessageBodyAttributeMap | undefined {
  if (!messageAttributes || Object.keys(messageAttributes).length == 0) {
    return;
  }

  return Object.keys(messageAttributes)
    .map((messageAttrKey) => ({
      [messageAttrKey]: {
        DataType: messageAttributes[messageAttrKey].dataType,
        StringValue: messageAttributes[messageAttrKey]?.stringValue,
        BinaryValue: messageAttributes[messageAttrKey]?.binaryValue,
      },
    }))
    .reduce((prev, curr) => ({ ...prev, ...curr }));
}
