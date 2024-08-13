// app/page.js or other client-side component
"use client"
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Bubblegum_Sans } from '@next/font/google';

const bubblegumSans = Bubblegum_Sans({
  weight: '400',
  subsets: ['latin'],
});

export default function Home() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hello, I am EmpathyAI willing to help you through difficult times. How may I be of assistance?"
  }]);

  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    setMessage('');
    const userMessage = {
      role: "user",
      content: message
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      userMessage,
      { role: "assistant", content: "" }
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [userMessage] })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response from server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              result += decoder.decode(value, { stream: true });
              setMessages((prevMessages) => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                const otherMessages = prevMessages.slice(0, -1);
                return [
                  ...otherMessages,
                  {
                    ...lastMessage,
                    content: lastMessage.content + result,
                  }
                ];
              });
            }
          } catch (error) {
            console.error('Stream error:', error);
          }
        },
      });
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="#ffecf2">
      <Typography variant="h1" className={bubblegumSans.className} color="#137a63">EmpathyAI</Typography>
      <Stack
        direction="column"
        width="600px"
        height="700px"
        border="1px solid black"
        padding={2}
        spacing={3}
        borderRadius={5}
        bgcolor="white">
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%">
          {
            messages.map((msg, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={
                  msg.role === 'assistant' ? 'flex-start' : 'flex-end'
                }>
                <Box
                  bgcolor={
                    msg.role === 'assistant' ? '#137a63' : 'secondary.main'
                  }
                  color="white"
                  borderRadius={16}
                  p={3}
                  className={bubblegumSans.className}
                >
                  {msg.content}
                </Box>
              </Box>
            ))
          }
        </Stack>
        <Stack
          direction="row"
          spacing={2}>
          <TextField
            label="Send Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            InputProps={{
              className: bubblegumSans.className,
            }}
            InputLabelProps={{
              className: bubblegumSans.className,
            }}
            borderRadius={2}
          />
          <Button variant="contained" onClick={sendMessage} color="secondary" className={bubblegumSans.className}>Send</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
