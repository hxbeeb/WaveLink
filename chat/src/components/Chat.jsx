import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import Message from './Message';
import Chats from './chats';
import { useAuth } from '@clerk/clerk-react';

function Chat() {
  // ======= State =======
  const [userId, setUserId] = useState('');
  const [conversations, setConversations] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [pic, setPic] = useState('');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [socket, setSocket] = useState(null);
  const [showAudioStartButton, setShowAudioStartButton] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const [callStartTime, setCallStartTime] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCallActive, setIsCallActive] = useState({is: false, type: ""});
  const [callDuration, setCallDuration] = useState('00:00');
  const callStartTimeRef = useRef(null);
  const callTimerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [endingCall, setEndingCall] = useState(false);
  const [startingCall, setStartingCall] = useState(false);
  const iceCandidatesQueue = useRef([]);
  const remoteDescSet = useRef(false);
  const remoteAudioRef = useRef(null);
  const localAudioRef = useRef(null);

  const { getToken } = useAuth();

  // ======= Effects =======
  // Add this to your component
useEffect(() => {
  if (!isCallActive.is) return;

  const interval = setInterval(() => {
    if (!peerConnection.current) return;

    console.log("Connection check:", {
      iceState: peerConnection.current.iceConnectionState,
      signalingState: peerConnection.current.signalingState,
      hasRemoteDesc: !!peerConnection.current.remoteDescription
    });

    // If stuck in checking for too long, restart ICE
    if (peerConnection.current.iceConnectionState === "checking" && 
        Date.now() - callStartTimeRef.current > 10000) {
      console.log("Connection stuck in checking state - restarting ICE");
      peerConnection.current.restartIce();
    }
  }, 5000);

  return () => clearInterval(interval);
}, [isCallActive.is]);

  // Fetch user and initial conversations
  useEffect(() => {
    const fetchUserAndConversations = async () => {
      try {
        const token = await getToken();
        const res = await axios.get('https://back-r655.onrender.com/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const uid = res.data.id;
        setUserId(uid);

        const convoRes = await axios.get(`https://back-r655.onrender.com/conversations/${uid}`);
        const sortedConvos = convoRes.data.sort((a, b) =>
          new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        );
        setConversations(sortedConvos);
         // ✅ Join all conversations' socket rooms
      
      } catch (err) {
        console.error('Error fetching user or conversations', err);
      }
    };

    fetchUserAndConversations();
  }, []);

  // Setup socket
  useEffect(() => {
    const newSocket = io('https://back-r655.onrender.com', { 
      withCredentials: true,
      transports: ['websocket']
    });

    // Socket debug listeners
    newSocket.on('connect', () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log("Socket disconnected:", reason);
    });

    newSocket.on('connect_error', (err) => {
      console.error("Socket connection error:", err);
    });

    newSocket.on('ice-candidate', (data) => {
      console.log("ICE candidate socket event received:", data);
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && userId) {
      socket.emit("register", userId);
      console.log("Registered user on socket:", socket.id);
     
    }
  }, [socket, userId]);

  // Handle incoming messages and calls
  useEffect(() => {
    if (!socket) return;
     conversations.forEach((convo) => {
        // console.log(convo);
        socket.emit("join_conversation", convo._id);
      });

const handleReceiveMessage = (newMessage) => {
  console.log("received");
  if (newMessage.senderId === userId) return;
  // ✅ Always update conversations
setConversations((prevConvos) => {
  const updated = prevConvos.map((convo) =>
    convo._id === newMessage.conversationId
      ? { ...convo, lastMessage: newMessage, updatedAt: new Date().toISOString() }
      : convo
  );

  // ✅ Return a brand new array with forced re-sort
  const sorted = [...updated].sort((a, b) =>
    new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  );
  
  return sorted;
  
});


  // ✅ Update chatMessages if this is the currently open chat
  if (selectedChat && newMessage.conversationId === selectedChat._id) {
    setChatMessages((prev) => [...prev, newMessage]);

    // 🧠 Also force-refresh selectedChat to trigger re-render
    setSelectedChat((prevChat) => ({ ...prevChat }));
  }
};


    const handleOffer = ({ fromUserId, offer, type }) => {
      console.log("Incoming call from:", fromUserId);
      setIncomingCall({ fromUserId, offer, type });
    };

const handleAnswer = async ({answer }) => {
  console.log("peer connecting");
  if (!peerConnection.current) {
    console.warn("Cannot set answer, peer connection not initialized");
    return;
  }

  try {
    console.log("Setting remote description");
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    remoteDescSet.current = true;

    // Process queued candidates after setting remote description
    const currentPeerId = selectedChat?.user?._id;
    if (currentPeerId) {
      await processQueuedCandidates(currentPeerId);
    }
  } catch (err) {
    console.error("Error setting remote description:", err);
  }
};
// Update your handleIceCandidate function
const handleIceCandidate = async ({ from, candidate }) => {
  try {
    console.log("📩 Received ICE candidate from", from, ":", candidate);

    // Validate candidate structure
    if (!candidate || !candidate.candidate) {
      console.error("❌ Invalid ICE candidate format");
      return;
    }

    // Get current peer ID - handle both direct calls and forwarded candidates
    const currentPeerId = selectedChat?.user?._id || incomingCall?.fromUserId;
    if (!currentPeerId) {
      console.warn("⚠️ No current call in progress, ignoring candidate");
      return;
    }

    // Compare IDs as strings to avoid ObjectID comparison issues
    if (String(from) !== String(currentPeerId)) {
      console.warn(
        "🔄 ICE candidate from non-current peer - expected:",
        currentPeerId,
        "received:",
        from
      );
      return;
    }

    // If peer connection exists, add immediately
    if (peerConnection.current) {
      console.log("📌 Adding ICE candidate from", from);
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("✅ ICE candidate added successfully");
    } else {
      console.warn("⚠️ No peerConnection yet, queuing ICE candidate");
      iceCandidatesQueue.current.push({ from, candidate });
    }
  } catch (err) {
    console.error("❌ Error adding ICE candidate:", err);
    
    // Recover from errors
    if (peerConnection.current?.iceConnectionState === "disconnected") {
      console.log("Attempting ICE restart...");
      peerConnection.current.restartIce();
    }
  }
};

// Add this helper function
const processQueuedCandidates = async (peerId) => {
  if (!peerConnection.current) return;

  // Filter candidates for this peer
  const relevantCandidates = iceCandidatesQueue.current
    .filter(item => item.from === peerId)
    .map(item => item.candidate);

  if (relevantCandidates.length === 0) return;

  console.log(`Processing ${relevantCandidates.length} queued ICE candidates`);
  
  try {
    await Promise.all(relevantCandidates.map(candidate => 
      peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
    ));
    
    // Remove processed candidates
    iceCandidatesQueue.current = iceCandidatesQueue.current
      .filter(item => item.from !== peerId);
    
    console.log("✅ Queued candidates processed successfully");
  } catch (err) {
    console.error("❌ Error processing queued candidates:", err);
  }
};

    const handleRenegotiate = async ({ offer }) => {
      try {
        console.log("Received renegotiation offer");
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        
        socket.emit("renegotiate-answer", {
          to: selectedChat.user._id,
          answer: peerConnection.current.localDescription
        });
      } catch (err) {
        console.error("Renegotiation failed:", err);
      }
    };

    const handleEndCall = () => {
      endCall();
    };

    const handleCallRejected = () => {
      endCall();
      alert("Call rejected by other user.");
    };

    // Socket listeners
    socket.on("receive_message", handleReceiveMessage);
    socket.on("answer", handleAnswer);
    socket.on("offer", handleOffer);
    
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("renegotiate", handleRenegotiate);
    socket.on("renegotiate-answer", async ({ answer }) => {
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("Failed to set renegotiation answer:", err);
      }
    });
    socket.on("end-call", handleEndCall);
    socket.on("call-rejected", handleCallRejected);

    // Clean up all listeners
    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("renegotiate", handleRenegotiate);
      socket.off("renegotiate-answer");
      socket.off("end-call", handleEndCall);
      socket.off("call-rejected", handleCallRejected);
    };
  }, [socket,userId,conversations]);

  // Negotiation needed handler
  useEffect(() => {
    if (!peerConnection.current) return;

    const handleNegotiationNeeded = async () => {
      if (isNegotiating) {
        console.warn("Already negotiating, skipping");
        return;
      }

      console.log("Negotiation needed, creating new offer");
      setIsNegotiating(true);

      try {
        const offer = await peerConnection.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isCallActive.type === "video",
          iceRestart: true
        });

        await peerConnection.current.setLocalDescription(offer);
        
        socket.emit("renegotiate", {
          to: selectedChat.user._id,
          offer: peerConnection.current.localDescription
        });
      } catch (err) {
        console.error("Negotiation failed:", err);
      } finally {
        setIsNegotiating(false);
      }
    };

    peerConnection.current.onnegotiationneeded = handleNegotiationNeeded;

    return () => {
      if (peerConnection.current) {
        peerConnection.current.onnegotiationneeded = null;
      }
    };
  }, [peerConnection.current, selectedChat, isCallActive.type, isNegotiating]);

  // Scroll to latest message
  useEffect(() => {
    const el = document.getElementById('message-container');
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages]);

  // ======= Handlers =======

  const addEmoji = (emoji) => setText((prev) => prev + emoji.native);

  const setChat = async (otherUser) => {
    try {
      const convoRes = await axios.post('https://back-r655.onrender.com/conversations', {
        senderId: userId,
        receiverId: otherUser._id,
      });

      const conversation = convoRes.data;
      setSelectedChat({ ...conversation, user: otherUser });
      

      const messagesRes = await axios.get(`https://back-r655.onrender.com/messages/${conversation._id}`);
      setChatMessages(messagesRes.data);

      setPic(otherUser.image);
      setName(otherUser.name);
    } catch (err) {
      console.error('Error setting chat', err);
    }
  };

  const startCallTimer = () => {
    callStartTimeRef.current = Date.now();
    callTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - callStartTimeRef.current;
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      setCallDuration(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      
      if (!verifyICEConnection() && elapsed > 5000) {
        console.warn("ICE connection not established, attempting recovery");
        peerConnection.current.restartIce();
      }
    }, 1000);
  };

  const verifyICEConnection = () => {
    if (!peerConnection.current) return false;

    const iceState = peerConnection.current.iceConnectionState;
    const connectionState = peerConnection.current.connectionState;

    console.log("Connection verification:", {
      iceState,
      connectionState,
      hasRemoteDescription: !!peerConnection.current.remoteDescription,
      hasLocalDescription: !!peerConnection.current.localDescription
    });

    return iceState === 'connected' || iceState === 'completed';
  };

  const cleanupCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    if (localAudioRef.current) localAudioRef.current.srcObject = null;

    clearInterval(callTimerRef.current);
    setCallDuration("00:00");
    setCallStartTime(null);
    setShowAudioStartButton(false);
  };

  const sendMessages = async () => {
    if (!text.trim() || !selectedChat?._id) return;

    try {
      const msgRes = await axios.post('https://back-r655.onrender.com/messages', {
        conversationId: selectedChat._id,
        senderId: userId,
        text: text,
      });

      const message = { ...msgRes.data, updatedAt: new Date().toISOString() };
      socket.emit('send_message', message);
      setText('');
       setChatMessages((prev) => [...prev, message]);

      setConversations((prev) => {
        const updated = prev.map((convo) =>
          convo._id === selectedChat._id
            ? { ...convo, lastMessage: message, updatedAt: message.updatedAt }
            : convo
        );

        return updated.sort((a, b) =>
          new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        );
      });
    } catch (err) {
      console.error('Error sending messages', err);
    }
  };

  const searching = async (e) => {
    const query = e.target.value;
    setSearch(query);

    if (!query.trim()) {
      setSearchedUsers([]);
      return;
    }

    try {
      const res = await axios.get('https://back-r655.onrender.com/users');
      const filtered = res.data.filter(
        (user) =>
          user.name.toLowerCase().includes(query.toLowerCase()) &&
          user._id !== userId
      );
      setSearchedUsers(filtered);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat?._id) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', selectedChat._id);
    formData.append('senderId', userId);

    try {
      const res = await axios.post('https://back-r655.onrender.com/messages/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setChatMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

 

 // Update your startCall function with these changes:
const startCall = async (type) => {
  if (startingCall) return;
  setStartingCall(true);

  try {
    console.log("📞 Starting call:", type);
    cleanupCall();
    setIsCallActive({ type, is: true });

    // Get local media
    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    // Set up local preview
    if (localVideoRef.current && type === "video") {
      localVideoRef.current.srcObject = localStream.current;
    }

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = localStream.current;
      localAudioRef.current.muted = true;
      localAudioRef.current.play().catch(err => console.warn("⚠️ Local audio play failed:", err));
    }

    // Create peer connection
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302"
          ]
        },
        {
          urls: "turn:relay1.expressturn.com:3478",
          username: "000000002065507580",
          credential: "nbEnmf9DArh2pXd38I93qKdDufE="
        }
      ],
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
      iceCandidatePoolSize: 10,
      sdpSemantics: "unified-plan",
      // iceTransportPolicy:"relay"
    });

    // Error events
    peerConnection.current.onicecandidateerror = (event) => {
      console.error("❌ ICE candidate error:", event.errorCode, event.errorText);
    };

    // ICE connection state
    peerConnection.current.oniceconnectionstatechange = () => {
      const state = peerConnection.current.iceConnectionState;
      console.log("🌐 ICE connection state:", state);

      if (state === "failed") {
        console.warn("Attempting ICE restart...");
        peerConnection.current.restartIce?.();
      }
    };

    // Signaling state
    peerConnection.current.onsignalingstatechange = () => {
      console.log("🔁 Signaling state:", peerConnection.current.signalingState);
    };

    // Add tracks
    localStream.current.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    // ICE candidate handling
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 New ICE candidate:", event.candidate);
        socket.emit("ice-candidate", {
          to: selectedChat.user._id,
          from: userId,
          candidate: event.candidate.toJSON()
        });
      } else {
        console.log("✅ ICE gathering complete");
      }
    };

    // Remote stream handler
    peerConnection.current.ontrack = (event) => {
      const remoteStream = event.streams[0];
      console.log("📡 Received remote stream");

      if (remoteVideoRef.current && type === "video") {
        console.log("video setting");
        remoteVideoRef.current.srcObject = remoteStream;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(err => {
          console.warn("⚠️ Remote audio play failed:", err);
        });
      }
    };

    // Create offer with timeout
    const offer = await Promise.race([
      peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === "video",
        iceRestart: false
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Offer creation timeout")), 5000))
    ]);

    await peerConnection.current.setLocalDescription(offer);
    console.log("✅ Local description set");

    // Wait for ICE gathering complete
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        peerConnection.current.removeEventListener("icegatheringstatechange", handler);
        reject(new Error("ICE gathering timeout"));
      }, 10000);

      const handler = () => {
        if (peerConnection.current.iceGatheringState === "complete") {
          clearTimeout(timeout);
          peerConnection.current.removeEventListener("icegatheringstatechange", handler);
          resolve();
        }
      };

      if (peerConnection.current.iceGatheringState === "complete") {
        clearTimeout(timeout);
        resolve();
        return;
      }

      peerConnection.current.addEventListener("icegatheringstatechange", handler);
    });

    // Send the offer
    console.log("Emitting offer to:", selectedChat.user._id, "from:", userId);
    socket.emit("offer", {
      to: selectedChat.user._id,
      fromUserId: userId,
      offer: peerConnection.current.localDescription,
      type:type,
      
    });

    // Start timer
    startCallTimer();

  } catch (err) {
    console.error("❌ Error starting call:", err);
    cleanupCall();
    setIsCallActive({ is: false, type: "" });

    alert(err.message.includes("media")
      ? "Please allow camera and microphone access."
      : err.message);
  } finally {
    setStartingCall(false);
  }
};


  const endCall = () => {
    if (endingCall) return;
    setEndingCall(true);

    cleanupCall();

    if (selectedChat?.user?._id) {
      socket.emit("end-call", { to: selectedChat.user._id });
    }

    setIsCallActive({ type: "", is: false });
    setEndingCall(false);
  };

 const acceptCall = async ({ fromUserId, offer, type }) => {
  try {
    console.log("accept call"+fromUserId);
    setIncomingCall(null);
    setIsCallActive({ is: true, type });
    cleanupCall();

    // Get local media
    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    }).catch(err => {
      console.error("Error getting local media:", err);
      throw new Error("Could not access camera/microphone");
    });

    // Attach to local video/audio
    if (localVideoRef.current && type === "video") {
      localVideoRef.current.srcObject = localStream.current;
    }

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = localStream.current;
      localAudioRef.current.muted = true;
      localAudioRef.current.play().catch(e => console.error("Local audio play error:", e));
    }

    // Create peer connection
    const rtcConfig = {
     iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302"
          ]
        },
        {
          urls: "turn:relay1.expressturn.com:3478",
          username: "000000002065507580",
          credential: "nbEnmf9DArh2pXd38I93qKdDufE="
        }
      ],
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
      iceCandidatePoolSize: 10,
      sdpSemantics: "unified-plan",
      // iceTransportPolicy:"relay"
      iceTransportPolicy: "all"
    };

    peerConnection.current = new RTCPeerConnection(rtcConfig);

    // ICE connection state monitoring
    peerConnection.current.oniceconnectionstatechange = () => {
      const state = peerConnection.current.iceConnectionState;
      console.log("ICE connection state:", state);

      if (["failed", "disconnected"].includes(state)) {
        console.log("ICE connection unstable. Consider restarting peer connection.");
        // Full reconnection strategy can go here if needed
      }
    };

    // Add local tracks
    localStream.current.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("New ICE candidate:", {
          type: event.candidate.candidate.split(" ")[7],
          protocol: event.candidate.protocol,
          address: event.candidate.address,
          port: event.candidate.port
        });

        const targetUserId = selectedChat?.user?._id || fromUserId;
        if (!targetUserId) {
          console.error("Missing target user ID for ICE candidate");
          return;
        }

        const sendTimeout = setTimeout(() => {
          console.warn("Timeout sending ICE candidate");
        }, 5000);

        socket.emit("ice-candidate", {
          to: targetUserId,
          from: userId,
          candidate: event.candidate.toJSON()
        }, () => {
          clearTimeout(sendTimeout);
          console.log("ICE candidate sent");
        });
      } else {
        console.log("ICE candidate gathering complete");
      }
    };

    // Handle remote stream
    peerConnection.current.ontrack = (event) => {
      const remoteStream = event.streams[0];
      console.log("Remote stream received:", remoteStream.getTracks());

      if (remoteVideoRef.current && type === "video") {
        console.log("receiving video");
        remoteVideoRef.current.srcObject = remoteStream;
      }

      if (remoteAudioRef.current) {
        const setupAudio = () => {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.play()
            .then(() => {
              console.log("Remote audio playing");
              setShowAudioStartButton(false);
            })
            .catch(error => {
              console.error("Audio play failed:", error);
              setShowAudioStartButton(true);
              setTimeout(setupAudio, 500);
            });
        };
        setupAudio();
      }
    };

    // Set remote description
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
    remoteDescSet.current = true;
    console.log("Remote description set");

    // Process queued ICE candidates
    const currentPeerId = selectedChat?.user?._id || fromUserId;
    const candidatesToProcess = iceCandidatesQueue.current
      .filter(item => String(item.from) === String(currentPeerId))
      .map(item => item.candidate);

    console.log(`Processing ${candidatesToProcess.length} queued ICE candidates`);
    try {
      await Promise.all(candidatesToProcess.map(candidate =>
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
      ));
      iceCandidatesQueue.current = iceCandidatesQueue.current
        .filter(item => String(item.from) !== String(currentPeerId));
    } catch (err) {
      console.error("Error processing ICE candidates:", err);
    }

    // Create and set local answer
    const answer = await Promise.race([
      peerConnection.current.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === "video",
        voiceActivityDetection: false
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Answer creation timeout")), 10000)
      )
    ]);
    console.log("Created answer:", answer)

    await peerConnection.current.setLocalDescription(answer);
    console.log("Local description set");

    // Send answer
console.log("Emitting answer to:", fromUserId);
console.log("Answer SDP:", answer);

await new Promise((resolve, reject) => {
  socket.emit("answer", { to: fromUserId, answer }, (ack) => {
    if (ack?.error) {
      reject(new Error(ack.error));
    } else {
      console.log("Answer sent successfully");
      resolve();
    }
  });

  setTimeout(() => reject(new Error("Answer delivery timeout")), 10000);
});


    console.log("emitted");

    // Start call timer
    if (startCallTimer) startCallTimer();

    // ICE health monitor
    const healthCheck = setInterval(() => {
      if (!peerConnection.current) {
        clearInterval(healthCheck);
        return;
      }
      console.log("almost");

      const state = peerConnection.current.iceConnectionState;
      const elapsed = Date.now() - callStartTimeRef.current;

      if (state === "checking" && elapsed > 15000) {
        console.log("Stuck in checking, restarting ICE...");
        peerConnection.current.restartIce?.();
      }

      if (state === "connected") {
        console.log("Connected");
        clearInterval(healthCheck);
      }
    }, 5000);

  } catch (err) {
    console.error("Call acceptance failed:", err);
    setIsCallActive({ is: false, type: "" });
    cleanupCall();

    let errorMessage = "Failed to accept call. Please try again.";
    if (err.message.includes("camera/microphone")) {
      errorMessage = "Please allow camera/microphone access to accept the call.";
    } else if (err.message.includes("timeout")) {
      errorMessage = "Connection timed out. Please check your network.";
    }

    alert(errorMessage);
  }
};

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit("call-rejected", { to: incomingCall.fromUserId });
      setIncomingCall(null);
    }
  };

 

  // ======= UI =======
return (
  <div className="flex w-full h-screen bg-black"> {/* No padding, full height */}

    {/* Hidden audio/video elements */}
    <audio ref={localAudioRef} autoPlay playsInline muted style={{ display: 'none' }} />
    <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
    <video ref={localVideoRef} autoPlay playsInline muted hidden />
    <video ref={remoteVideoRef} autoPlay playsInline hidden />
    {incomingCall && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-2xl text-center shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Incoming {incomingCall.type} Call...</h3>
          <div className="flex justify-center gap-4">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-2xl"
              onClick={() => acceptCall(incomingCall)}
            >
              Accept
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-2xl"
              onClick={rejectCall}
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ====== Conditional Rendering: Show Chat List OR Chat Box ====== */}
    {!selectedChat ? (
      // ================== Chat List View ==================
      <div className="flex flex-col w-full h-full bg-gray-900">
        <div className="p-6 pb-2">
            <textarea
              onChange={searching}
              value={search}
              className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl p-3 h-14 resize-none focus:ring-2 focus:ring-blue-500 border-none outline-none shadow-md"
              placeholder="Search users..."
              rows={1}
              style={{ minHeight: '3.5rem', maxHeight: '6rem' }}
            ></textarea>
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-700" style={{ scrollbarColor: '#000 #374151', scrollbarWidth: 'thin' }}>
            {(search === '' ? conversations : searchedUsers).map((item, index) => (
              <button
                key={index}
                onClick={() => setChat(search === '' ? item.user : item)}
                className="flex items-center w-full bg-gray-800 hover:bg-gray-700 transition rounded-xl p-4 shadow group text-left gap-4 border border-gray-800 hover:border-blue-600"
              >
                <Chats
                  img={item.user?.image || item.image || ''}
                  last={item.lastMessage?.text || 'Start chatting...'}
                  name={item.user?.name || item.name || 'User'}
                />
              </button>
            ))}
          </div>
        </div>
    ) : (
      // ================== Chat Box View ==================
      <div className="flex flex-col w-full h-full bg-gray-900 gap-4 relative"> {/* Full width/height, no padding, no rounded/shadow */}
        {/* Back Button */}
      

        {/* Incoming call popup */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-2xl text-center shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Incoming {incomingCall.type} Call...</h3>
              <div className="flex justify-center gap-4">
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-2xl"
                  onClick={() => acceptCall(incomingCall)}
                >
                  Accept
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded-2xl"
                  onClick={rejectCall}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <nav className="flex items-center justify-between bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-4 shadow-lg">
          <div className="flex items-center gap-4">
              <button
      className="text-white text-xl font-bold mr-2"
      onClick={() => {
        setSelectedChat(null);
        setChatMessages([]);
      }}
    >
      ←
    </button>
            <img alt="dp" src={pic || ''} className="rounded-full w-14 h-14 object-cover" />
            <h2 className="text-xl font-semibold">{name}</h2>
          </div>
          <div className="flex items-center gap-4 pr-2">
            {!isCallActive.is ? (
              <>
                <button
                  className="p-3 rounded-full bg-gray-700 shadow hover:scale-110 hover:shadow-lg transition-transform duration-150 focus:outline-none text-2xl"
                  title="Start Audio Call"
                  aria-label="Start Audio Call"
                  onClick={() => startCall("audio")}
                >
                  {/* Modern phone SVG icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15 .621 0 1.125-.504 1.125-1.125v-3.375a1.125 1.125 0 0 0-1.125-1.125c-1.636 0-3.21-.26-4.687-.75a1.125 1.125 0 0 0-1.125.27l-2.25 2.25a12.042 12.042 0 0 1-5.25-5.25l2.25-2.25a1.125 1.125 0 0 0 .27-1.125c-.49-1.477-.75-3.051-.75-4.687A1.125 1.125 0 0 0 5.625 2.25H2.25A1.125 1.125 0 0 0 1.125 3.375z" />
                  </svg>
                </button>
                <button
                  className="p-3 rounded-full bg-gray-700 shadow hover:scale-110 hover:shadow-lg transition-transform duration-150 focus:outline-none text-2xl"
                  title="Start Video Call"
                  aria-label="Start Video Call"
                  onClick={() => startCall("video")}
                >
                  {/* Modern video camera SVG icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6.75A2.25 2.25 0 0 0 13.5 4.5h-7.5A2.25 2.25 0 0 0 3.75 6.75v10.5A2.25 2.25 0 0 0 6 19.5h7.5a2.25 2.25 0 0 0 2.25-2.25v-3.75l4.28 3.21a.75.75 0 0 0 1.22-.6V7.14a.75.75 0 0 0-1.22-.6l-4.28 3.21z" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex gap-6 items-center text-white">
                <h1>{callDuration}</h1>
                <button
                  className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition"
                  onClick={endCall}
                >
                  ⛔ End
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Call UI */}
        {isCallActive.is && isCallActive.type === "video" && (
          <div className="flex gap-4 p-2">
            <video ref={localVideoRef} className="w-40 h-40 rounded-lg border" autoPlay muted playsInline />
            <video ref={remoteVideoRef} className="w-96 h-64 rounded-lg border" autoPlay playsInline />
          </div>
        )}
        {showAudioStartButton && (
          <button
            onClick={() => {
              remoteAudioRef.current.play()
                .then(() => setShowAudioStartButton(false))
                .catch(e => console.error("Still blocked:", e));
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Start Audio
          </button>
        )}

        {/* Messages */}
        <div id="message-container" className="flex flex-col gap-2 overflow-y-auto px-2 flex-grow scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-700" style={{ scrollbarColor: '#000 #374151', scrollbarWidth: 'thin' }}>
          {chatMessages.map((msg, index) => (
            <Message
              key={index}
              message={msg.text}
              className={msg.senderId === userId ? 'self-end' : 'self-start'}
              side={msg.senderId === userId ? 'l' : 'r'}
              fileUrl={msg.fileUrl}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 mt-auto relative bg-gray-800 rounded-xl px-4 py-3 shadow-lg">
          <button className="text-2xl text-yellow-400 hover:scale-110 transition-transform duration-150 focus:outline-none" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            😊
          </button>
          <input type="file" id="fileInput" className="hidden" onChange={handleFileChange} />
          <button
            className="bg-gray-700 text-white px-3 py-2 rounded-xl shadow hover:shadow-xl hover:bg-gray-600 transition duration-150 focus:outline-none"
            onClick={() => document.getElementById('fileInput').click()}
          >
            📎
          </button>
          <textarea
            value={text}
            className="flex-grow border-none rounded-xl p-3 resize-none h-12 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            placeholder="Type your message..."
            onChange={(e) => setText(e.target.value)}
          ></textarea>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-500 hover:shadow-blue-400/50 focus:outline-none transition duration-150 ring-2 ring-blue-700/30 hover:ring-blue-400/60"
            onClick={sendMessages}
          >
            Send
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-20 right-4 z-50 drop-shadow-xl">
              <Picker data={data} onEmojiSelect={addEmoji} theme="dark" />
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

}

export default Chat;









