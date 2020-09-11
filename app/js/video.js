let room = null;
let localStream = null;
let ws = null;
let isStarted = false;
let uuid = null;
let localConnections = {};

let config = {"iceServers":[]};

// Determine the room name and public URL for this chat session.
function getRoom() {
  var query = location.search && location.search.split("?")[1];

  if (query) {
    return (location.search && decodeURIComponent(query.split("=")[1]));
  }

  if (room) {
    return room;
  } else {
    room = faker.random.uuid();
    return room;
  }
}

// Retrieve the absolute room URL.
function getRoomURL() {
  return location.protocol + "//" + location.host + (location.pathname || "") + "?room=" + getRoom();
}

// Enable video on the page.
async function enableVideo() {
  document.getElementById("remotes").style.visibility = "visible";
  await getLocalVideo();
}


function getLocalVideo() {
  navigator.mediaDevices.getUserMedia({video: true,
    audio: true}).then(gotMedia).catch(function(error) {
    var errorString = error.toString();
    $.notify("Device (Mic/Camera) Not Accessible", { position:"top center",className: 'warning'});
  });
}

function gotMedia(stream) {
  var localVideo = document.getElementById("selfVideo");
  localVideo.volume = 0;
  if ('srcObject' in localVideo) {
      localVideo.srcObject = stream
  } else {
      localVideo.src = window.URL.createObjectURL(stream);
  }
  localVideo.play();
  localStream = stream;
  initWebSocket();
}

function initWebSocket() {
  uuid = faker.random.uuid();
  ws = new WebSocket("wss://" + window.location.host +"/server/?"+ uuid);
  ws.onopen = function (evt) {
    var result = bowser.getParser(window.navigator.userAgent);
    var myNameRTC = getCookie('myNameRTC');

    if (!myNameRTC && myNameRTC == '') {
      myNameRTC = result.parsedResult.browser.name + " " + result.parsedResult.os.name;
    }
    var regStr = {
      "type": "register", "data": {
        "email": uuid, "privip": faker.internet.ip(),
        "devtype": result.parsedResult.os.name, "devname": result.parsedResult.browser.name, "name": myNameRTC, "registered": true
      }
    };
    sendMessage(regStr);
  }
  ws.onmessage = async function (evt) {
    var message = JSON.parse(evt.data);
    console.log("Received ", message);
    if (message.type === 'offer') {
      var peer = message["from"];
      delete message.to;
      delete message.from;
      localConnections[peer].signal(message);
    } else if (message.type === 'answer' && isStarted) {
      var peer = message["from"];
      delete message.to;
      delete message.from;
      localConnections[peer].signal(message);
    } else if (message.type === 'candidate' && isStarted) {
      var peer = message["from"];
      delete message.to;
      delete message.from;
      localConnections[peer].signal(message);
    }  else if (message.type == "responce") {
      handleResponce(message);
      if(message.module=="joinroom" && message.full==true){
        $.notify("Room Already Full, Redirecting", { position: "top center", className: 'info'});
        setTimeout(function() { window.location.replace("index.html"); }, 5000);
      }
    } else if (message.renegotiate) {
      var peer = message["from"];
      delete message.to;
      delete message.from;
      await localConnection[peer].signal(message);
    }  else if (message.type == "peerjoined") {
      console.log('peer joined :: ', message);
      if (message.should_create_offer) {
        isStarted = true;
        await createConnection(message.peerid, message.should_create_offer);
      } else {
        isStarted = true;
        createConnection(message.peerid, message.should_create_offer);
      }
    } else if (message.type == "ping") {
      if (message.peerid) {
        sendMessage({
          type : "pong",
          peerid: message.peerid
        });
      }
    }
  }
}

function handleResponce(message) {
  if (message.module == "register") {
    if (message.message == "Successfully Registered") {
      sendMessage({
        type: "joinroom",
        roomid: getRoom()
      });
    }
  } 
}

function sendMessage(message) {
  console.log("Sent ", message);
  ws.send(JSON.stringify(message));
}

async function sendSignalling(sData, peerid) {
  if (sData.candidate) {
    sData.type = 'candidate';
  }
  sData.to = peerid;
  sData.from = uuid;
  sendMessage(sData);
}


async function createConnection(peerid, initiator) {
  console.log('createConnection');
  var localConnection = new SimplePeer({ initiator: initiator, stream: localStream, config: config});

  localConnection.on('signal', data => {
    console.log("Sender Signal");
    delete data.to;
    delete data.from;
    sendSignalling(data, peerid);
  })

  localConnection.on('stream', stream => {
    var remotes = document.getElementById("remotes");

    if (remotes) {
      var outerContainer = document.createElement("div");
      outerContainer.classList.add("col");
      outerContainer.classList.add("border");
      outerContainer.classList.add("border-black");

      var container = document.createElement("div");
      container.className = "videoContainer";
      container.id = "container_" + peerid;
      var video = document.createElement('video');
      video.setAttribute('playsinline','');
      video.autoplay = true;
      container.appendChild(video);
      
      // Suppress right-clicks on the video.
      video.oncontextmenu = function() { return false; };

      outerContainer.appendChild(container);
      if ($('.w-100').prevAll('.col').length == 1) {
        $(outerContainer).insertBefore('.w-100');
      } else {
        remotes.appendChild(outerContainer);
      }

      // If we're adding a new video we need to modify bootstrap so we
      // only get two videos per row.
      var remoteVideos = document.getElementById("remotes").getElementsByTagName("video").length;
      

      if (remoteVideos == 2) {
        var spacer = document.createElement("div");
        spacer.className = "w-100";
        remotes.appendChild(spacer);
      }
      if (remoteVideos >= 3) {
        $('.videoContainer video').css('height','50vh')
      }
      if ('srcObject' in video) {
        video.srcObject = stream
      } else {
        video.src = window.URL.createObjectURL(stream)
      }
      // video.play();
    }
  });

  localConnection.on('error', err => {
  })

  localConnection.on('close', () => {
    var remotes = document.getElementById("remotes");
    var remoteVideos = document.getElementById("remotes").getElementsByTagName("video").length;
    var el = document.getElementById("container_" + peerid);
    if (remotes && el) {
      
      if (remoteVideos == 3 || remoteVideos == 2) { 
        $('.w-100').remove();
        $('.videoContainer video').css('height','100vh');
      }
      remotes.removeChild(el.parentElement);
    }
    if (peerid in localConnections) {
      localConnections[peerid].destroy();
      delete localConnections[peerid];
    }
    isStarted = false;
  })

  if (localConnection) {
    localConnections[peerid] = localConnection;
  }

}

function hangUp() {
  ws.close();
  if (localConnections) {
    Object.values(localConnections).forEach( (value) => {
      value.destroy();
      delete value;
    });
  }
  window.location.replace("index.html");
}

function toggleAudioVideo() {
  localStream.getVideoTracks()[0].enabled = !(localStream.getVideoTracks()[0].enabled); 
  if(localStream.getVideoTracks()[0].enabled){
    $('#toggleVideo img').attr("src", "img/cam-icon.png");
  }else{
    $('#toggleVideo img').attr("src", "img/cam-icon-disable.png");
  }

}

function toggleAudioMute() {
  $('#muteButton i').toggleClass("fa-microphone-slash");
  $('#muteButton i').toggleClass("mic-mute");
  $('#muteButton i').toggleClass("fa-microphone");
  $('#muteButton i').toggleClass("mic");

  localStream.getAudioTracks()[0].enabled = !(localStream.getAudioTracks()[0].enabled); 

}

window.onunload = window.onbeforeunload = closing;
function closing(){
  ws.close();
  if (localConnections) {
    Object.values(localConnections).forEach( (value) => {
      value.destroy();
      delete value;
    });
  }
  if (localStream) {
    localStream = null;
  }
   return null;
}

function copyURL() {
  if(document.getElementById("remotes").getElementsByTagName("video").length>3){
    $.notify("Can't Copy url 4 peaople already in Room ", { position: "top center", className: 'info', autoHideDelay: 4000 });

  }else{
  navigator.clipboard.writeText(getRoomURL());
  $.notify("URL copied on clipboard", { position: "top center", className: 'info', autoHideDelay: 4000 });
  }

}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
          c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
          return c.substring(name.length, c.length);
      }
  }
  return "";
}