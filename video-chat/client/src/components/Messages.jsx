import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Assuming you have a socket connection established elsewhere and imported here
const socket = io('https://video-chat-production-0903.up.railway.app/');

const MessagesDisplayComponent = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Listen for new messages
    socket.on('receiveMessage', (message) => {
      // eslint-disable-next-line
      console.log('New message received:', message);
      // Update the state with the new message
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Cleanup on component unmount
    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  return (
    <div>
      <h2>Received Messages</h2>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};

export default MessagesDisplayComponent;
