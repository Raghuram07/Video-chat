import React, { useState, useEffect, useContext } from 'react';
import { Button, TextField, Grid } from '@material-ui/core';
import io from 'socket.io-client';
import { makeStyles } from '@material-ui/core/styles';
import { IoMdSend } from 'react-icons/io';
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
 sendContainer:{
    display:'flex',
    margin:'2px',
    padding:'5px',
    alignItems:'center'
 },
textArea:{
  margin:'5px',
  padding:'5px',
},
sendButton:{
    width: '30px',
    height: '100%',
    margin: '2px',
    padding: '2px',
    cursor: 'pointer'
},
msgContainer:{
  background:'lightgrey',
  padding:'5px',

},
message:{
  paddingTop:'8px',
  width: '100%',
  transition: 'color 0.3s ease', // Smooth color transition
  '&:hover': {
    background: 'white', // Change this to your desired hover color
  },
  cursor:'pointer'
}

}));

const MessagesDisplayComponent = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const { sendMessage } = useContext(SocketContext);
  const classes = useStyles();

  useEffect(() => {
    socket.on('receiveMessage', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  return (
    <div className={classes.container}>
      <Grid>
        <div className={classes.msgContainer}>
        
            {messages.map((msg, index) => (
              <div className={classes.message}>
              <p key={index}>
              <strong style={{ color: 'blue' }}>RRR: </strong>
              {msg}
              </p>
              </div>
            ))}
          
        </div>

        <div className={classes.sendContainer}>
          <TextField className={classes.textArea} label="Message" fullWidth value={message} onChange={(e) => setMessage(e.target.value)} />
          <IoMdSend className={classes.sendButton} onClick={() => { sendMessage(message); setMessage(''); }} />
        </div>
      </Grid>

    </div>
  );
};

export default MessagesDisplayComponent;
