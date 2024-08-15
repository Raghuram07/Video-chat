import React, { useState, useEffect, useContext } from 'react';
import { Button, TextField, Grid } from '@material-ui/core';
import io from 'socket.io-client';
import { makeStyles } from '@material-ui/core/styles';
import { SocketContext } from '../Context';
import config from '../config';

const socket = io(config.SOCKET_URL);
const useStyles = makeStyles((theme) => ({
  container: {
    width: '600px',
    margin: '35px 0',
    background: 'white',
    padding: 0,
    [theme.breakpoints.down('xs')]: {
      width: '80%',
    },
  },
  margin: {
    marginTop: 20,
  },
  padding: {
    padding: 20,
  },
  paper: {
    padding: '10px 20px',
    border: '2px solid black',
  },
}));

const MessagesDisplayComponent = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const { sendMessage } = useContext(SocketContext);
  const classes = useStyles();

  useEffect(() => {
    // Listen for new messages
    socket.on('receiveMessage', (msg) => {
      // eslint-disable-next-line
      console.log('New message received:', msg);
      // Update the state with the new message
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    // Cleanup on component unmount
    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  return (
    <div className={classes.container}>
      <Grid>
        <div>
          <TextField label="Message" fullWidth value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button variant="contained" color="primary" fullWidth onClick={() => { sendMessage(message); setMessage(''); }}>
            Send
          </Button>
        </div>
      </Grid>
      <div>
        <h2>Received Messages</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MessagesDisplayComponent;
