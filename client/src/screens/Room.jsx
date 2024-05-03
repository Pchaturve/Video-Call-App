/* eslint-disable no-unused-vars */
import React, { useEffect, useCallback, useState} from 'react';
import ReactPlayer from 'react-player';
import peer from "../service/peer";
import './RoomScreen.css';
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(undefined);
    const[myStream , setMyStream] = useState(null);
    const[remoteStream , setRemoteStream] = useState(null);

    const handleUserJoined = useCallback(({ email, id}) => {
        console.log(`Email ${email} joined room`);
        setRemoteSocketId(id)
    }, []);

    const handleCallUser = useCallback(async () =>{
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });

        const offer = await peer.getOffer();
        socket.emit("user:call" , { to: remoteSocketId, offer });
        setMyStream(stream);
    }, [remoteSocketId, socket]);

    const handleIncomingCall = useCallback(
        async ({from, offer }) => {
           setRemoteSocketId(from);
            const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,  
    });
    setMyStream(stream);
    console.log(`Incoming Call`, from, offer); 
    const ans = await peer.getAnswer(offer)
    socket.emit("call:accepted", { to: from, ans });
    }, 
    [socket]
    );

    const sendStreams = useCallback(() => {
        if (myStream) {
            const tracks = myStream.getTracks();
            tracks.forEach(track => {
                if (!peer.peer.getSenders().some(sender => sender.track === track)) {
                    peer.peer.addTrack(track, myStream);
                }
            });
    
            
            socket.emit('stream:sent', { message: 'We both are joined in this link!' });
        }
    }, [myStream, socket]);
    
    
    const handleCallAccepted = useCallback(
    ({from , ans}) => {
    peer.setLocalDescription(ans);
    console.log("Call Accepted!");
    sendStreams();
}, 
[sendStreams]
);

const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId});
}, [remoteSocketId, socket]);

useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
        peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    }
}, [handleNegoNeeded]);

const handleNegoNeedIncoming = useCallback(
  async  ({from,offer}) => {
    const ans = await peer.getAnswer(offer);
    socket.emit('peer:nego:done', { to: from, ans });
},
[socket]
);

const handleNegoNeedFinal = useCallback(
    async ({ ans }) => {
    await peer.setLocalDescription(ans)
}, [])



useEffect(() => {
    peer.peer.addEventListener('track', async ev => {
        const remoteStream = ev.streams;
        console.log("GOT TRACKS!!");
        setRemoteStream(remoteStream[0]);
    });
}, []);


 
    useEffect(() => {
        socket.on('user:joined', handleUserJoined);
        socket.on('incoming:call', handleIncomingCall);
        socket.on('call:accepted', handleCallAccepted);
        socket.on('peer:nego:needed', handleNegoNeedIncoming);
        socket.on('peer:nego:final', handleNegoNeedFinal); 


        return () => {
        socket.off("user:joined", handleUserJoined);
        socket.off("incoming:call", handleIncomingCall);
        socket.off('call:accepted', handleCallAccepted);
        socket.off('peer:nego:needed', handleNegoNeedIncoming);
        socket.off('peer:nego:final', handleNegoNeedFinal); 

    };
    }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegoNeedIncoming, handleNegoNeedFinal]);
        
    return(
        <div className="video-wrapper">
            <h1 className="heading">Room Page</h1>
            <h4 className="heading">{remoteSocketId ? "Connected" : "No one in room"}</h4>
            {myStream && <button className="button" onClick={sendStreams}>Send Stream</button>}
            {remoteSocketId && <button className="button" onClick={handleCallUser}>CALL</button>}
            {myStream && (
            <div className="video-wrapper">
            <div className="video-player">
            <h1 className="heading">My Stream</h1>
            <ReactPlayer
             playing
              muted
               height="400px"
                width="600px"
                 url={myStream} 
                 />
                 </div>
                 </div>
                 )}
                {remoteStream && (
                 <div className="video-wrapper">
                <h1 className="heading">RemoteStream</h1>
                <div className="video-player">
                 <ReactPlayer
                playing
                muted
                height="400px"
                width="600px"
                 url={remoteStream} 
                 />
                 </div> 
                 </div>
                 )}
        </div>
    );
}; 

export default RoomPage;