const configuration = {
  iceServers: [
    { 
      urls: "stun:stun.l.google.com:19302" 
    },
    {
      urls: "turn:neonchat.metered.live:80",
      username: "af68e8eed57dfed3c3326f65",
      credential: "MsftfXoRHfM5nTwo"
    },
    {
      urls: "turn:neonchat.metered.live:443?transport=tcp",
      username: "af68e8eed57dfed3c3326f65",
      credential: "MsftfXoRHfM5nTwo"
    }
  ]
};

// Application mein PeerConnection banate waqt:
const peerConnection = new RTCPeerConnection(configuration);

