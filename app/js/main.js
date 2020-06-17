'use strict';

let localConnection;
let fileReader;
let fileInput = null;
const downloadAnchor = document.querySelector('a#download');
let myName='';
let receiveBuffer = [];
let sendBuffer = [];
let receivedSize = 0;

let to = null;
let from = null;
let isStarted = false;
let isInitiator = false;

var localStream;
var remoteStream;

var localVideo = document.getElementById("localVideo");
localVideo.volume = 0;
let remoteVideo = document.getElementById("remoteVideo");
let audio = new Audio('media/ring.mp3');


let ws = null;
let fileSize = 0 ;
let fileName = null;
let regStr = null;

let webRTCPaused = false;

let BUFFER_FULL_THRESHOLD = 15000000;

let callType = null;
let isAudioMuted = false;

let interval = null;
let gotLocalStream =  false;
let reconnectInterval = null;

let fileStatus = false;
let callStatus = false;

let config = {"iceServers":[]};

function fileUpload(li) {
  if (isStarted == true) {
    $.notify("A Session is already in progress", { position:"top center",className: 'warning'});
    return;
  }
  to = $(li).parent().parent().attr('id');
  if (to == null) {
      return;
  }
  fileInput = document.getElementById(to).getElementsByTagName("input");
  fileInput = fileInput[0];
  fileInput.value = '';
  fileInput.click();
  fileInput.addEventListener('change', handleFileInputChange, false);
  return false;
}

async function handleFileInputChange() {
  const file = fileInput.files[0];
  if (!file) {
    fileInput = null;
  } else {
    onSendFile();
  }
}

const isEmpty = str => !str.trim().length;

async function onSendFile() {
  if (!isEmpty(to)) {
    isInitiator = true;
    await maybeStart(); 
  } else {
    alert("Please Enter ID of User to Send File");
  }
}



async function maybeStart() {
  if (!isStarted) {
      if (isInitiator) {
        await createConnectionSender();
      } else {
        await createConnectionReceiver();
      }
      isStarted = true;
  }
}

function setLocalStream() {
  if (gotLocalStream) {
    localConnection.addStream(localStream);
    clearInterval(interval)
  }
}

async function createConnectionSender() {
  localConnection = null;

  localConnection = new SimplePeer({ initiator: true, objectMode: true, config: config});

  localConnection.on('signal', data => {
    delete data.to;
    delete data.from;
    sendSignalling(data);
  })

  localConnection.on('connect', () => {
    if ((typeof fileInput !== "undefined" && fileInput !== null)) {
      const file = fileInput.files[0];
      if (typeof file !== "undefined" && file !== null) {
      var fileMeta = {
        type: "filemeta",
        filesize: file.size,
        filename: file.name
      };
      localConnection.send(JSON.stringify(fileMeta));
      return;
    }
    } 
    if (typeof callType !== "undefined" && callType !== null) {
      if (callType == "audio") {
        var resp = {
          type: "callrequest",
          calltype: "audio",
          from:from
        };
        localConnection.send(JSON.stringify(resp));
        var constraints = {video: {width: { min: 320,max: 1280},height: {min: 240,max: 720}}, audio: {echoCancellation: true} };
        navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;
        navigator.mediaDevices.getUserMedia(constraints).then(gotMedia).catch(function(error) {
          var errorString = error.toString();

          if( errorString.includes('device not found')){
			      $.notify("Device (Mic/Camera) not Found", { position:"top center",className: 'warning'});
          } else {
            $.notify("Device (Mic/Camera) Not Accessible", { position:"top center",className: 'warning'});
          }
            closeDataChannels();
        });
      } else {
        var resp = {
          type: "callrequest",
          calltype: "video",
          from:from
        };
        localConnection.send(JSON.stringify(resp));

        var constraints='';
        constraints = {video: {width: { min: 320,max: 1280},height: {min: 240,max: 720}}, audio: { echoCancellation: true }
      };

        navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;
        navigator.mediaDevices.getUserMedia(constraints).then(gotMedia).catch(function(error) {
          var errorString = error.toString();

          if( errorString.includes('device not found')) {
			      $.notify("Device (Mic/Camera) not Found",{ position:"top center",className: 'warning'});
          } else {
            $.notify("Device (Mic/Camera) Not Accessible", { position:"top center",className: 'warning'});
          }
            closeDataChannels();
        });
      }
    }
  })
  
  localConnection.on('data', data => {
    try {
      var sData = JSON.parse(data);
      if (sData.type === "fileaccept" ) {
        if (sData.message == "accept") {
          sendData();
        } else if (sData.message == "ignore") {
          closeDataChannels();
          $.notify("File Transfer Declined", {position:"top center",className: 'info'});
        }
      } else if (sData.type == "callaccept") {
        if (sData.message == "accept") {
          interval = setInterval(setLocalStream, 50);
          $("#callscreens").modal('show');
          $("#callscreens").modal('show');
          $('.requestcall').hide(0);
          audio.pause(); audio.currentTime = 0;
        } else if (sData.message === "deviceNotFound"){
		        $.notify("Receiver does not have a Mic/Camera", { position:"top center",className: 'info'});
            closeDataChannels();
        } else if (sData.message === "deviceNotAccessible") {
          $.notify("Receiver (Mic/Camera) Not Accessible", { position:"top center",className: 'info'});
          closeDataChannels();
        } else if (sData.message === "ignore"){
          closeDataChannels();
		        $.notify("Call Declined by User",{ position:"top center",className: 'info'});
        } else {
          closeDataChannels();
        }
      } else if (sData.type == "progress"){
        setProgress(sData.value);
      } else {
        console.log("Invalid Message Received");
      }
      } catch (e) {
        console.log(e);
        return;
      }
  })

  localConnection.on('stream', stream => {
    if ('srcObject' in remoteVideo) {
      remoteVideo.srcObject = stream
    } else {
      remoteVideo.src = window.URL.createObjectURL(stream)
    }
    callStatus = true;
  })

  localConnection.on('error', err => {
    closeDataChannels();
  })

  localConnection.on('close', () => {
    closeDataChannels();
  })
  
}

async function createConnectionReceiver() {
  localConnection = null;

  localConnection = new SimplePeer({ objectMode: true, config: config});

  localConnection.on('signal', data => {
    delete data.to;
    delete data.from;
    sendSignalling(data);
  })

  localConnection.on('connect', () => {
  receivedSize = 0;
  downloadAnchor.removeAttribute('download');
  if (downloadAnchor.href) {
    URL.revokeObjectURL(downloadAnchor.href);
    downloadAnchor.removeAttribute('href');
  }
  })
  
  localConnection.on('data', data => {
    onReceiveMessage(data);
  })

  localConnection.on('stream', stream => {
    if ('srcObject' in remoteVideo) {
      remoteVideo.srcObject = stream
    } else {
      remoteVideo.src = window.URL.createObjectURL(stream)
    }
    callStatus = true;
  })

  localConnection.on('error', err => {
    closeDataChannels();
  })

  localConnection.on('close', () => {
    closeDataChannels();
  })
}

async function sendSignalling(sData) {
  if (sData.candidate) {
    sData.type = 'candidate';
  }
  sData.to = to;
  sData.from = from;
   sendMessage(sData);
}

function sendMessage(message) {
  ws.send(JSON.stringify(message));
}

function sendData() {
  const file = fileInput.files[0];
  if (file.size === 0) {
    $.notify("File is Empty, Please Select a Non-Empty File", { position:"top center",className: 'warning'});
    closeDataChannels();
    sendMessage({
      type: "bye",
      to: to,
      from: from
    });
    return;
  }
  initProgressBar();
  const chunkSize = 32000;
  fileReader = new FileReader();
  let offset = 0;
  let percentage = 0;
  sendBuffer = [];
  webRTCPaused = false;
  fileStatus = true;
  fileReader.addEventListener('error', error => console.error('Error reading file:', error));
  fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
  fileReader.addEventListener('load', e => {
    sendChunk(e.target.result);
    offset += e.target.result.byteLength;
    if (offset < file.size) {

      readSlice(offset);
    }

  });
  const readSlice = o => {
    const slice = file.slice(offset, o + chunkSize);
    fileReader.readAsArrayBuffer(slice);
  };
  readSlice(0);
}

function sendChunk(data) {
 
  sendBuffer.push(data)
  if (webRTCPaused) {
      return;
  }

  sendMessageQueued();
}

function sendMessageQueued() {
  webRTCPaused = false;
  let message = sendBuffer.shift();

  while (message) {
      if (localConnection._channel.bufferedAmount && localConnection._channel.bufferedAmount > BUFFER_FULL_THRESHOLD) {
          webRTCPaused = true;
          sendBuffer.push(message);

          const listener = () => {
              localConnection._channel.removeEventListener('bufferedamountlow', listener);
              sendMessageQueued();
          };
          localConnection._channel.addEventListener('bufferedamountlow', listener);
          return;
      }

      try {
          localConnection.send(message);
          message = sendBuffer.shift();
      } catch (error) {
          console.log(`Error sending message, reason: ${error.name} - ${error.message}`);
      }
  }
}

async function setProgress(value) {
  var left = $("#"+to).find('.progress-left .progress-bar');
  var right = $("#"+to).find('.progress-right .progress-bar');
  if (value > 0) {
    if (value <= 50) {
      right.css('transform', 'rotate(' + percentageToDegrees(value) + 'deg)')
    } else {
      right.css('transform', 'rotate(180deg)')
      left.css('transform', 'rotate(' + percentageToDegrees(value - 50) + 'deg)')
    }
  }
}

function percentageToDegrees(percentage) {

  return percentage / 100 * 360;

}

//close the data chanel

function closeDataChannels() {
  localConnection.destroy();

  if (typeof localStream !== "undefined" && localStream !== null) {
    $("#callscreens").modal('hide');
    localStream.getTracks().forEach(function(track) {
    track.stop();
    });
    localStream = null;
  }
  receiveBuffer = [];
  sendBuffer = [];
  $('#'+ to + ' .progress').remove();
  $('#'+ to + ' img').removeClass("progress-bar-img");
  isStarted = false;
  isInitiator = false;
  callStatus = false;
  fileStatus = false;
  gotLocalStream = false;
  fileInput = null;
  var checkRequest =false;
  audio.pause(); audio.currentTime = 0;

  $('.receivecall').hide(0);
  $('.requestcall').hide(0);
  //pause or stope audio riing tune
  $('#toggleVideo img').attr("src", "img/cam-icon.png");
  $('#muteButton i').addClass("fa-microphone");
  $('#muteButton i').addClass("mic");
  $('#muteButton i').removeClass("fa-microphone-slash");
  $('#muteButton i').removeClass("mic-mute");
}

function isJSON(str) {
  try {
      return (JSON.parse(str) && !!str);
  } catch (e) {
      return false;
  }
}

function onReceiveMessage(data) {
  if (typeof data.byteLength !== "undefined") {
    fileStatus = true;
    let percentage = 0;
    receiveBuffer.push(data);
    receivedSize += data.byteLength;
    percentage = ((receivedSize/fileSize) * 100).toFixed(3);
    setProgress(percentage);
    localConnection.send(JSON.stringify({
      type: "progress",
      value: percentage
    }));
    if (fileSize !== 0 && fileName) {
      if (receivedSize === fileSize) {
        const received = new Blob(receiveBuffer);
        receiveBuffer = [];
        downloadAnchor.href = URL.createObjectURL(received);
        downloadAnchor.download = fileName;
        $("#downloadconfirm .modal-body").empty();
        $("#downloadconfirm .modal-body").append(fileName + '<br/>' + formatBytes(fileSize));
        $('#downloadconfirm').modal('show');
        closeDataChannels();
        sendMessage({
          type: "bye",
          to: to,
          from: from
        });
      } 
    }
  } else {
    if (isJSON(data)) {
      var pData = JSON.parse(data);
      if (pData.type === "filemeta") {
        fileSize = pData.filesize;
        fileName = pData.filename;
        $("#filerequest .modal-body").empty();
        $("#filerequest .modal-body").append(fileName + '<br/>' + formatBytes(fileSize));
        $('#filerequest').modal('show');
        return;
      } else if (pData.type === "callrequest") {
        if (pData.calltype == "audio") {
            callType = "audio";
            var spancallerCallType = document.createElement('span');
            spancallerCallType.setAttribute("id", "callerCallType");
            spancallerCallType.textContent = "Audio";
            $("#callerCallType").replaceWith(spancallerCallType);
  
            var spancallerName = document.createElement('span');
            spancallerName.setAttribute("id", "callerName");
            let dataName = $("#" + pData.from + " " + "span").text();
            let dataAvatarSrc = document.getElementById(pData.from).firstChild.getAttribute('src');
            $("#avatarview div img").attr('src',dataAvatarSrc);

            spancallerName.textContent = dataName;
            $("#callerName").replaceWith(spancallerName);
            $('.receivecall').show(0);
            audio.volume = 1;
            audio.loop= true;
            audio.play();
            setTimeout(function() {audio.pause(); audio.currentTime = 0;}, 20000);

        } else {
            callType = "video";
            var spancallerCallType = document.createElement('span');
            spancallerCallType.setAttribute("id", "callerCallType");
            spancallerCallType.textContent = "Video";
            $("#callerCallType").replaceWith(spancallerCallType);
            var spancallerName = document.createElement('span');
            spancallerName.setAttribute("id", "callerName");
            let dataName = $("#" + pData.from + " " + "span").text();
            let dataAvatarSrc = document.getElementById(pData.from).firstChild.getAttribute('src');
            $("#avatarview div img").attr('src',dataAvatarSrc);

            spancallerName.textContent = dataName;
            $("#callerName").replaceWith(spancallerName);
            $('.receivecall').show(0);
            audio.volume = 1;
            audio.loop= true;
            audio.play();
            // disable audio call after 20 second 
            setTimeout(function() {audio.pause(); audio.currentTime = 0;}, 20000);
        }
      }  else if (pData.type === "calldecline") {
        if (pData.message == "decline") {
					$.notify("Call Declined by User", { position:"top center",className: 'info'});
          closeDataChannels();
        } 
      } else {
        return;
      }
    }
  }
}

// send message if reciver accepted or rejected the file 
function sendStatus(status) {
  if (status == "ignore") {
    var resp = {
      type: "fileaccept",
      message: "ignore"
    };
    localConnection.send(JSON.stringify(resp));
    isStarted = false;
    isInitiator = false;
  } else if (status == "accept") {
    var resp = {
      type: "fileaccept",
      message: "accept"
    };
    localConnection.send(JSON.stringify(resp));
    initProgressBar();
  }
  $('#filerequest').modal('hide');
}

// get meda streams
function gotMedia(stream) {

  if ('srcObject' in localVideo) {
      localVideo.srcObject = stream
  } else {
      localVideo.src = window.URL.createObjectURL(stream);
  }
  localVideo.play()
  localStream = stream;
  if(callType=="audio"){
    localStream.getVideoTracks()[0].enabled = !(localStream.getVideoTracks()[0].enabled); 
  }
  
  if (!isInitiator) {
  localConnection.addStream(localStream);
  var resp = {
    type: "callaccept",
    message: "accept",
    calltype : callType
  };
  localConnection.send(JSON.stringify(resp));
    // show call popup(modal) in case of accpt receiver
  $("#callscreens").modal('show');

  } else {
    gotLocalStream = true;
  }
  
}

function hangUp() {
  sendMessage({
    type: "bye",
    to: to,
    from: from
  });
  closeDataChannels();
}

// send message if call accpted or rejected 
function sendCallStatus(status) {
  if(isInitiator && status =="ignore"){
    var resp = {
      type: "calldecline",
      message: "decline",
      calltype : callType
    };

    if (typeof localConnection != "undefined" && localConnection != null) {
      if (localConnection.connected) {
        localConnection.send(JSON.stringify(resp));
      } else {
        closeDataChannels();
      }
    } else {
      closeDataChannels();
    }
  }

  if (status == "accept") {
    var constraints="";
    // check if app is running on ios and reduce the resolution in case 
   // var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    // check if call is audio or video 
    if (callType == "audio") {
      constraints = {video: {width: { min: 320,max: 1280},height: {min: 240,max: 720}}, audio: { echoCancellation: true }
    };
    }else if (callType=="video"){
       constraints = {video: {width: { min: 320,max: 1280},height: {min: 240,max: 720}}, audio: { echoCancellation: true }
      };
    } else{
	 
	    $.notify("Can't Perform any Call at this Moment", { position:"top center",className: 'error'});
    }

    // browser compatibility 
    navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
    navigator.mediaDevices.getUserMedia(constraints).then(gotMedia).catch(function(error) {
      
      var errorString = error.toString();

      if( errorString.includes('device not found')){
		    $.notify("Device (Mic/Camera) Not Found", { position:"top center",className: 'warning'});
        localConnection.send(JSON.stringify({ type: "callaccept", message: "deviceNotFound", calltype : callType }));
      } else {
        $.notify("Device (Mic/Camera) Not Accessible", { position:"top center",className: 'warning'});
        localConnection.send(JSON.stringify({ type: "callaccept", message: "deviceNotAccessible", calltype : callType }));
      }
        closeDataChannels();
    });
  } else {
    var resp = {
      type: "callaccept",
      message: "ignore",
      calltype : callType
    };

    if (typeof localConnection !== "undefined" && localConnection !== null) {
      if (localConnection.connected) {
        localConnection.send(JSON.stringify(resp));
      } else {
        closeDataChannels();
      }
    } else {
      closeDataChannels();
    }
  }
  $('.requestcall').hide(0);
  $('.receivecall').delay(500).hide(0);
  audio.pause(); audio.currentTime = 0;
}

var initCall= debounce((calltype)=> {
  if (calltype == "audio") {
    isInitiator = true;
    let initCallFunction = async() => await maybeStart();
    initCallFunction(); 
    callType = "audio";

  } else {
    isInitiator = true;
    let initCallFunction = async() => await maybeStart();
    initCallFunction(); 
    callType = "video";
  }
  $(".requestcall").show(0);

  audio.loop= true;
  audio.volume = .1;

  audio.play();
  //stop call ringer after 20 seconds
  setTimeout(function() {audio.pause(); audio.currentTime = 0;}, 20000);


 }, 250); 

  // to prevent the function immediate multipule calls  
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };
  
    
function initProgressBar() {
  var html = `<div class="progress md-progress blue">
              <span class="progress-left">
                  <span class="progress-bar"></span>
                </span>
                <span class="progress-right">
                  <span class="progress-bar"></span>
                </span>
              </div>`;
  var li = document.getElementById(to);
  li.insertAdjacentHTML("afterbegin", html);
  var img = li.getElementsByTagName("img");
  img[0].classList.add("progress-bar-img");
}



function toggleAudioMute() {
  $('#muteButton i').toggleClass("fa-microphone-slash");
  $('#muteButton i').toggleClass("mic-mute");
  $('#muteButton i').toggleClass("fa-microphone");
  $('#muteButton i').toggleClass("mic");

  localStream.getAudioTracks()[0].enabled = !(localStream.getAudioTracks()[0].enabled); 

}


// toggleAudioVideo 
function toggleAudioVideo() {
  localStream.getVideoTracks()[0].enabled = !(localStream.getVideoTracks()[0].enabled); 
  if(localStream.getVideoTracks()[0].enabled){
    $('#toggleVideo img').attr("src", "img/cam-icon.png");
  }else{
    $('#toggleVideo img').attr("src", "img/cam-icon-disable.png");
  }

}

function AddImgSrc(devType) {
  var dType = devType.toLowerCase();
  if (dType == "android") {
    return "img/coming-soon/android.png";
  } else if (dType == "windows" || dType == "linux") {
    return "img/coming-soon/window.png";
  } else if (dType == "macos") {
    return "img/coming-soon/mac.png";
  } else if (dType == "ios") {
    return "img/coming-soon/ios.png";
  } else {
    return null;
  }
}
$('#peers').on('click','li',function(evt){
  to = this.id || null;
})

$("#download").on('click', function(evt) {
  $('#downloadconfirm').modal('hide');
})

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


window.onclose = function(){
      ws.close();
}

document.onload = function() {
  if (SimplePeer.WEBRTC_SUPPORT) {
    initWebSocket();
  } else {
    $.notify("Browser is not Compatible", {position:"top center",className: 'error'});
  }
  
}

window.onload = function() {
  if (SimplePeer.WEBRTC_SUPPORT) {
    initWebSocket();
  } else {
    $.notify("Browser is not Compatible", { position:"top center",className: 'error'});
  }
}


function loginValidate(){
  var username = $("#usernameModal").val();
  var password = $("#passwordModal").val();
  if(username === "admin" && password === "dev@Trango123"){
      $("#modalLoginForm").modal('hide');
      setCookie("username", username);
      setCookie("password", password);
      setCookie("logedIn", "true");


  }else{
    document.cookie = "logedIn=false";
  }

}

//SET Cookie 
function setCookie(cname, cvalue) {
  let d = new Date();
  d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
// Filter Specific Cookies if exist 
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

function setMyName(e) {
  var input = document.createElement("input");
  input.type = "text";
  input.setAttribute('maxlength', 8);
  input.setAttribute('onchange', "setMyNameEvent(this)");
  input.setAttribute("onfocusout", "setMyNameEvent(this)");
  input.setAttribute('id', "set-my-name-input");
  input.setAttribute('placeholder', "Enter Name");

  input.className = "set-myname";
  $("#setMyName").replaceWith(input);
  var inputFocus = document.getElementById('set-my-name-input');
  inputFocus.focus();
  inputFocus.select();
}
function setMyNameEvent(e) {

  var person = e.value;
  if (person && person !== "") {
    setCookie("myNameRTC", e.value);
    var myNameRTC = getCookie('myNameRTC');
    if (ws != null) {
      from = null;
      ws.close(4005);
      ws = null;
    }
  }else{
    var myPeerName = document.querySelector('#myPeer li');

    var span = document.createElement('span');
    span.innerHTML = myPeerName.getAttribute('data-name');
    span.setAttribute("onclick", "setMyName(this)");
    span.setAttribute("id", "setMyName");
    span.setAttribute("data-name", myPeerName.getAttribute('data-name'));
    $("#set-my-name-input").replaceWith(span);
  }
}

window.addEventListener("offline", function(e) {
  console.log("offline");
  $("#peers").empty();
  ws.close();
});

window.addEventListener("online", function(e) {
  console.log("online");
  $("#peers").empty();
  ws.close();
});