// Start a Websoket connection 

function initWebSocket() {
  var pFrom = null;
  if (from != null) {
    pFrom = from;
  }
  from = faker.random.uuid();
  var result = bowser.getParser(window.navigator.userAgent);
  var myNameRTC = getCookie('myNameRTC');
  myName = myNameRTC;

  if (!myName && myName == '') {
    myName = result.parsedResult.browser.name + " " + result.parsedResult.os.name;
  }
  regStr = {
    "type": "register", "data": {
      "email": from, "privip": faker.internet.ip(),
      "devtype": result.parsedResult.os.name, "devname": result.parsedResult.browser.name, "name": myName, "registered": true
    }
  };

  ws = new WebSocket("wss://" + window.location.host +"/server/?"+ from);

  var li = document.createElement('li');
  li.classList.add("dropdown");
  li.classList.add("text-center");
  li.classList.add("progress-bar-icon");
  var img = document.createElement('img');
  img.classList.add("sysoptions");
  img.classList.add("img-fluid");
  img.classList.add("z-depth-2");
  img.classList.add("rounded");
  img.classList.add("mx-auto");
  img.classList.add("d-block");

  var imgSrc = AddImgSrc(result.parsedResult.os.name);
  if (imgSrc !== null) {
    img.setAttribute("src", imgSrc);
  }
  li.appendChild(img);
  var span = document.createElement('span');
  span.innerHTML = myName;
  span.setAttribute("onclick", "setMyName(this)");
  span.setAttribute("id", "setMyName");
  li.setAttribute("data-name", myName);
  li.appendChild(span);
  $("#myPeer li").replaceWith(li);  
    ws.onopen = function (evt) {
        clearTimeout(reconnectInterval);
        if (pFrom) {
          sendMessage({
            "type": "disconnect",
            "email": pFrom
          });
        }
        sendMessage(regStr);
    }
  
    ws.onmessage = async function(evt) {
        var message = JSON.parse(evt.data);
        if (message.type === 'offer') {
            to = message["from"];
            if (fileStatus || callStatus) {
              sendMessage({
                "type" : "userstatus",
                "status" : "busy",
                "to" : message["from"],
                "from" : from
              });
              return;
            }
            delete message.to;
            delete message.from;
            if (!isInitiator && !isStarted) {
              await maybeStart();
            }
            localConnection.signal(message);
          } else if (message.type === 'answer' && isStarted) {
            delete message.to;
            delete message.from;
            localConnection.signal(message);
          } else if (message.type === 'candidate' && isStarted) {
            if (fileStatus || callStatus) {
              return;
            }
            delete message.to;
            delete message.from;
            localConnection.signal(message);
          } else if (message.type === 'bye' && isStarted) {
            closeDataChannels();
          } else if (message.type == "responce") {
            if (message.module == "register") {
                if (message.message == "Successfully Registered") {
                  sendMessage({"type":"samenetwork"});
                }
            } else if (message.module == "samenetwork") {
               var devices = message.devices;
               if( $.isArray(devices) &&  devices.length  ) {
                  devices.forEach(function(data, index) { 
                    AddPeer(data);
                  });
              }
            }
        } else if (message.type == "addpeer") {
          AddPeer(message.data);
        } else if (message.type == "delpeer") {
          var peerID = document.getElementById(message.data.email);
          if (typeof peerID !== "undefined" && peerID !== null) {
            peerID.remove();
          }
        } else if (message.renegotiate) {
          delete message.to;
          delete message.from;
          await localConnection.signal(message);
        } else if (message.type == "userstatus") {
          if (message.status == "busy") {
            $.notify("User is Busy", { position:"top center",className: 'info'});
            closeDataChannels();
          }
        }
    }

    ws.onclose = function(evt) {
      $("#peers").empty();
      if (evt.code == 4005) {
        $.notify("Changing Name...", { position:"top center",className: 'info'});
      } else {
        $.notify("Reconnecting...", { position:"top center",className: 'info', autoHideDelay: 1000});
      }
      clearTimeout(reconnectInterval);
      reconnectInterval = setInterval(function() {
        ws = null;
        initWebSocket();
       }, 5000);
    }

    ws.onerror = function (evt) {
      ws.close();
    }
  }
  
  // add new device as a peer when ever new device attached to the network
  function AddPeer(device) {
  //  get all previous peers 
    var peer = document.getElementById("peers");
    if (peer == null) {
      return;
    }
    // add html content for peer
    if (device.hasOwnProperty("devtype") && device.hasOwnProperty("email") 
        && device.hasOwnProperty("devname")){
          var li = document.createElement('li');
          li.setAttribute("id", device.email);
          li.classList.add("dropdown");
          li.classList.add("text-center");
          li.classList.add("progress-bar-icon");
          var img = document.createElement('img');
          img.classList.add("sysoptions");
          img.classList.add("img-fluid");
          img.classList.add("z-depth-2");
          img.classList.add("rounded");
          img.classList.add("mx-auto");
          img.classList.add("d-block");
          var imgSrc = AddImgSrc(device.devtype);
          if (imgSrc !== null) {
            img.setAttribute("src", imgSrc);
          }
          li.appendChild(img);
          var span = document.createElement('span');

          span.innerHTML = device.name;
          li.appendChild(span);
          var ul = document.createElement("ul");
          ul.classList.add("submenu");
          var input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("style", "display:none");
          ul.appendChild(input);
          var liFile = document.createElement("li");
          liFile.setAttribute("onclick", "fileUpload(this);");
          liFile.setAttribute("title", "file Upload");
          var iFile = document.createElement("i");
          iFile.classList.add("fas");
          iFile.classList.add("fa-file-upload");
          liFile.appendChild(iFile);
          var liAudio = document.createElement("li");
          liAudio.setAttribute("title", "Audio Call");
          var iAudio = document.createElement("i");
          iAudio.classList.add("fas");
          iAudio.classList.add("fa-phone-alt");
          liAudio.setAttribute("onclick", "initCall('audio' , this);");
          liAudio.appendChild(iAudio);
          var liVideo = document.createElement("li");
          liVideo.setAttribute("title", "Video Call");
          var iVideo = document.createElement("i");
          iVideo.classList.add("fas");
          iVideo.classList.add("fa-video");
          liVideo.setAttribute("onclick", "initCall('video',this);");
          liVideo.appendChild(iVideo);
          ul.appendChild(liFile);
          ul.appendChild(liAudio);
          ul.appendChild(liVideo);
          li.appendChild(ul);
          peer.appendChild(li);
  
    }
  }
