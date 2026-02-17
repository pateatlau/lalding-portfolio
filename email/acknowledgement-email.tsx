import React from 'react';
import {
  Html,
  Body,
  Head,
  Heading,
  Hr,
  Container,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

type AcknowledgementEmailProps = {
  senderName?: string;
  message: string;
};

export default function AcknowledgementEmail({ senderName, message }: AcknowledgementEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Thanks for reaching out — I&apos;ll get back to you soon</Preview>
      <Tailwind>
        <Body className="bg-gray-100 text-black">
          <Container>
            <Section className="borderBlack my-10 rounded-md bg-white px-10 py-4">
              <Heading className="leading-tight">
                {senderName ? `Hi ${senderName},` : 'Hi,'}
              </Heading>
              <Text>
                Thank you for reaching out through my portfolio site. I&apos;ve received your
                message and will get back to you as soon as possible.
              </Text>
              <Hr />
              <Text className="text-sm font-medium text-gray-500">Your message:</Text>
              <Text className="text-sm text-gray-600">{message}</Text>
              <Hr />
              <Text className="text-sm text-gray-500">
                — Lalding
                <br />
                <a href="https://lalding.in">lalding.in</a>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
