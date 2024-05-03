/* eslint-disable no-unused-vars */
import React, { useCallback, useState, useEffect } from 'react';
import {useNavigate} from 'react-router-dom';

import { useSocket } from "../context/SocketProvider";
import './LobbyScreen.css';
const LobbyScreen = () => {
    const [email,setEmail] = useState("");
    const [room, setRoom] = useState("");
     
const socket = useSocket();
const navigate = useNavigate();

    const handleSubmitForm = useCallback(
        (e) => {
            e.preventDefault();
           socket.emit("room:join", { email, room });
        },
        [email, room, socket]
    );

const handleJoinRoom = useCallback((data) => {
    const { email, room } = data;
    navigate(`/room/${room}`);
}, 
[navigate]
);


useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
        socket.off('room:join', handleJoinRoom)
    }
}, [socket, handleJoinRoom]);

    return (
        <div className="lobby-container">
            <h1 className="lobby-heading"> LOBBY</h1>
            <form onSubmit={handleSubmitForm} className="lobby-form">
                <label htmlFor="email" className="form-label">Email Id</label>
                <input
                 type="email" 
                 id="email" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="form-input form-input-email"/>
                <br />
                <label htmlFor="room" className="form-label">Room Number</label>
                <input
                 type="text"
                 id="room" 
                 value={room}
                 onChange={(e) => setRoom(e.target.value)}
                 className="form-input" />
                <br />
                <button type="submit" className="form-button">Join</button>
            </form>
        </div>
    );
};

export default LobbyScreen;