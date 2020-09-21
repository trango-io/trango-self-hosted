import React, { Component } from "react";
import "./Dashboard.css";
import Header from "../Header/Index";
import Home from "../Home/index";
import JoinRoom from "../JoinRoom/Index";
import ReceiveCall from "../ReceiveCall/Index";
import CallScreen from "../CallScreen/Index";
import FileRequestComponent from "../FileRequest/Index";
import Bowser from "bowser";
import uuid from "react-uuid";
import faker from "faker";
import SimplePeer from "simple-peer";
import ReactNotification from "react-notifications-component";
import "react-notifications-component/dist/theme.css";
import { store } from "react-notifications-component";
import SideBar from "../Sidebar/Index";
import $ from "jquery";
import "webrtc-adapter";
import FileAccept from "../FileAccept/Index";
import Ringtone from "../../Assets/music/incoming_call_ring.mp3";
const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
var ringTone = new Audio(Ringtone);
var int;
var ws = null;
let reconnectInterval = null;
var result = Bowser.getParser(window.navigator.userAgent);
var url = window.location.href;
var from = uuid();
var fakerIp = faker.internet.ip();
var thisName = localStorage.getItem("myName")
  ? localStorage.getItem("myName")
  : result.parsedResult.os.name;
var register = {
  type: "register",
  data: {
    email: from,
    privip: fakerIp,
    devtype: result.parsedResult.os.name,
    devname: result.parsedResult.browser.name,
    name: thisName,
    registered: true
  }
};
var peerReq = {
  type: "samenetwork"
};
var SimpleConnections = {};
var SimpleConnectionsFile = {};
var localStream = null;
var sendBuffer = [];
var receiveBuffer = [];
var webRTCPaused = false;
var BUFFER_FULL_THRESHOLD = 15000000;
var receivedSize = 0;

export default class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      data: [],
      joinRoom: false,
      roomid: "",
      to: "",
      receiveCall: false,
      callRequestEvent: [],
      enableFileRequestComponent: false,
      fileRequestData: [],
      openCallScreen: false,
      stream: false,
      endCall: false,
      callType: "",
      showSearchbar: false,
      isBusy: false,
      isVideo: false,
      remoteVideo: false,
      isMute: false,
      devices: [],
      file: [],
      fileAccept: false,
      isBusyFile: false,
      remoteLength: 0,
      headerSearhBarValue: "",
      headerSearchedDevices: []
    };
  }
  componentDidUpdate() {
    if (this.state.data.type === "register") {
      this.sendMessage(peerReq);
    }
  }
  componentWillUnmount() {
    this._isMounted = false;
    var disconnect = {
      type: "disconnect",
      email: from
    };
    this.sendMessage(disconnect);
    clearInterval(int);
  }
  callRinger = () => {
    int = setInterval(() => {
      ringTone.play();
    }, 1000);
  };
  onClose = () => {
    this.setState({ data: [] });
    this.notification("Disconnect", "You are reconnecting", "success");
    clearTimeout(reconnectInterval);
    reconnectInterval = setInterval(() => {
      ws = null;
      this.initWebSocket();
    }, 5000);
  };
  initWebSocket = () => {
    ws = new WebSocket("wss://" + window.location.host +"/server/?"+ from);
    ws.onclose = event => {
      if (event.code === 4005) {
        this.setState({ data: [] });
      } else {
        this.onClose();
      }
    };
    ws.onerror = event => {};

    this._isMounted = true;
    ws.onmessage = event => {
      var data = JSON.parse(event.data);
      if (
        data.type.toLowerCase() === "addpeer" ||
        data.type.toLowerCase() === "delpeer" ||
        data.type.toLowerCase() === "samenetwork" ||
        data.type.toLowerCase() === "register"
      ) {
        if (data.type.toLowerCase() === "register") {
          if (data.status) {
            this.sendMessage(peerReq);
          } else {
            this.notification("ERROR", "Unable to register", "success");
          }
        }
        if (data.type === "samenetwork") {
          const dataSet = [...new Set(data.devices)];
          this.setState({
            devices: data.devices
          });
        } else if (data.type === "delpeer") {
          if (!data.data.registered) {
            return;
          }
          if (data.data) {
            this.setState({
              devices: this.state.devices.filter(devices => {
                return data.data.email !== devices.email;
              })
            });
          }
        } else if (data.type === "addpeer") {
          if (!data.data.registered) {
            return;
          }
          if (data.data) {
            this.setState({
              devices: this.state.devices.concat([data.data])
            });
          }
        }
      } else if (
        data.type.toLowerCase() === "joinroom" &&
        data.full === false
      ) {
        if (!this.state.isBusy) {
          this.setState({ joinRoom: true }, () => {
            var callRequest = {
              type: "callrequest",
              calltype: this.state.callType,
              callername: localStorage.getItem("myName")
                ? localStorage.getItem("myName")
                : result.parsedResult.os.name,
              roomid: this.state.roomid,
              from: from,
              to: this.state.to
            };
            this.sendMessage(callRequest);
          });
        }
      } else if (data.type.toLowerCase() === "callrequest") {
        if (!this.state.isBusy) {
          this.setState(
            {
              callRequestEvent: data,
              receiveCall: true,
              callType: data.calltype,
              isBusy: true,
              roomid: data.roomid
            },
            () => {
              if (this.state.callType.toLowerCase() === "audio") {
                console.log("AudioCallRequest");
              } else {
                console.log("VideoCallRequest");
              }
              this.callRinger();
            }
          );
        } else {
          var rejectCall = {
            type: "callresponce",
            accepted: false,
            busy: true,
            from: from,
            to: data.from
          };
          this.sendMessage(rejectCall);
          clearInterval(int);
        }
      } else if (data.type.toLowerCase() === "peerjoined") {
        if (!data.should_create_offer) {
          this.setState({
            joinRoom: false,
            openCallScreen: true
          });
        }
        if (!this.state.stream) {
          const video = document.getElementById("selfVideo");
          video.setAttribute("autoplay", "");
          video.setAttribute("muted", "");
          video.setAttribute("playsinline", "");
          video.volume = 0;
          const container = document.getElementsByClassName(
            "videoContainer"
          )[0];
          const nameDiv = container
            .getElementsByClassName("overlay")[0]
            .getElementsByTagName("span")[0];
          if ("srcObject" in video) {
            if (nameDiv) {
              nameDiv.innerHTML = thisName;
              var avadiv = document.createElement("div");
              avadiv.classList.add("set-canvas");
              var canvas = document.createElement("canvas");
              canvas.setAttribute("width", 100);
              canvas.setAttribute("height", 100);
              canvas.classList.add("round");
              if (this.state.callType === "audio") {
                video.classList.add("displayNone");
                avadiv.classList.remove("displayNone");
              } else {
                video.classList.remove("displayNone");
                avadiv.classList.add("displayNone");
              }
              canvas = this.avatarFunc(canvas, thisName);
              avadiv.appendChild(canvas);
              container.appendChild(avadiv);
            }
            this.state.callType === "audio"
              ? (localStream.getVideoTracks()[0].enabled = false)
              : (localStream.getVideoTracks()[0].enabled = true);
            this.setState({ stream: true }, () => {
              video.srcObject = localStream;
              this.simplePeer(data);
            });
          } else {
            if (nameDiv) {
              nameDiv.innerHTML = thisName;
              var canvas = document.createElement("canvas");
              canvas.setAttribute("width", 100);
              canvas.setAttribute("height", 100);
              canvas.classList.add("round");
              if (this.state.callType === "audio") {
                video.classList.add("displayNone");
                canvas.classList.remove("displayNone");
              } else {
                video.classList.remove("displayNone");
                canvas.classList.add("displayNone");
              }
              canvas = this.avatarFunc(canvas, thisName);
              container.appendChild(canvas);
            }
            this.state.callType === "audio"
              ? (localStream.getVideoTracks()[0].enabled = false)
              : (localStream.getVideoTracks()[0].enabled = true);
            this.setState({ stream: true }, () => {
              video.src = window.URL.createObjectURL(localStream);
              this.simplePeer(data);
            });
          }
        } else {
          this.simplePeer(data);
        }
      } else if (
        data.type.toLowerCase() === "offer" ||
        data.type.toLowerCase() === "answer"
      ) {
        var offer = {
          type: data.type,

          sdp: data.sdp
        };
        if (data.from in SimpleConnections) {
          SimpleConnections[data.from].signal(JSON.stringify(offer));
          return;
        }
        if (data.from in SimpleConnectionsFile) {
          SimpleConnectionsFile[data.from].signal(JSON.stringify(offer));
        }
      } else if (data.type.toLowerCase() === "candidate") {
        var offer = {
          type: data.type,
          candidate: data.candidate
        };
        if (data.from in SimpleConnections) {
          try {
            SimpleConnections[data.from].signal(offer);
          } catch (error) {
            console.log("error", error);
          }
        }
        if (data.from in SimpleConnectionsFile) {
          try {
            SimpleConnectionsFile[data.from].signal(offer);
          } catch (error) {
            console.log("error", error);
          }
        }
      } else if (data.type.toLowerCase() === "filerequest") {
        if (!this.state.isBusyFile) {
          this.setState({
            enableFileRequestComponent: true,
            fileRequestData: data,
            isBusyFile: true
          });
        } else {
          var fileControl = {
            type: "fileresponce",
            accepted: false,
            from: data.to,
            to: data.from
          };
          this.sendMessage(fileControl);
        }
      } else if (data.type.toLowerCase() === "fileresponce") {
        if (data.accepted) {
          var fileInitiator = {
            file: this.state.file,
            from: data.from,
            initiator: true,
            to: data.to
          };
          this.simplePeerFile(fileInitiator);
        } else {
          this.notification("Bla Bla", "File Rejected by User", "success");
          this.setState({ file: [] });
        }
      } else if (data.type.toLowerCase() === "namechanged") {
        var peer = document.getElementById(data.peerid);
        if (peer) {
          var spans = peer.getElementsByTagName("span");
          if (spans) {
            spans[0].innerHTML = data.name;
          }
        }
        peer = document.getElementById("container_" + data.peerid);
        if (peer) {
          const nameDiv = peer
            .getElementsByClassName("overlay")[0]
            .getElementsByTagName("span")[0];
          if (nameDiv) {
            nameDiv.innerHTML = data.name;
          }
          var canvas = peer
            .getElementsByClassName("set-canvas")[0]
            .getElementsByTagName("canvas")[0];
          if (canvas) {
            canvas.setAttribute("width", 100);
            canvas.setAttribute("height", 100);
            canvas = this.avatarFunc(canvas, data.name);
          }
        }
        const index = this.state.devices.findIndex(
          device => device.email === data.peerid
        );
        if (index !== -1) {
          var devices = [...this.state.devices]; // important to create a copy, otherwise you'll modify state outside of setState call
          devices[index].name = data.name;
          this.setState({ devices: devices });
        }
      } else if (data.type.toLowerCase() === "callresponce") {
        if (data.accepted) {
          this.setState({
            receiveCall: false,
            joinRoom: false
          });
        } else {
          if (data.busy) {
            this.setState({ joinRoom: false, receiveCall: false });
            this.notification("Busy", "User is busy", "success");
          } else {
            this.setState({
              joinRoom: false,
              isBusy: false,
              receiveCall: false
            });
            this.notification("Rejected", "Call rejected by User", "success");
            clearInterval(int);
            if (Object.keys(SimpleConnections).length > 0) {
              return;
            }
            if (localStream !== null) {
              localStream.getTracks().forEach(function(track) {
                track.stop();
              });
              localStream = null;
            }
          }
        }
      } else if (data.type.toLowerCase() === "peerparted") {
        var remotes = document.getElementById("remotes");
        if (!remotes) {
          return;
        }
        var remoteVideos = document
          .getElementById("remotes")
          .getElementsByTagName("video").length;
        var el = document.getElementById("container_" + data.peerid);
        if (remotes && el) {
          if (remoteVideos === 3 || remoteVideos === 2) {
            $(".w-100").remove();
            $(".videoContainer video").css("height", "100vh");
            $(".videoContainer .set-canvas").css("height", "100vh");
          }
          remotes.removeChild(el.parentElement);
        }

        if (data.peerid in SimpleConnections) {
          SimpleConnections[data.peerid].destroy();
          this.setState({
            remoteLength: Object.keys(SimpleConnections).length
          });
          delete SimpleConnections[data.peerid];
        }
        if (document.getElementById("remotes")) {
          remoteVideos = document
            .getElementById("remotes")
            .getElementsByTagName("video").length;
        } else {
          return;
        }
        if (remoteVideos === 1) {
          this.setState({
            openCallScreen: false,
            joinRoom: false,
            isBusy: false,
            roomid: uuid()
          });
          this.closing();
        }
      } else if (data.type === "video") {
        var peerVideo = document
          .getElementById("container_" + data.peerid)
          .getElementsByTagName("video")[0];
        const canvas = document
          .getElementById("container_" + data.peerid)
          .getElementsByClassName("set-canvas")[0];
        if (peerVideo) {
          if (data.enabled) {
            peerVideo.classList.remove("displayNone");
            canvas.classList.add("displayNone");
          } else {
            peerVideo.classList.add("displayNone");
            canvas.classList.remove("displayNone");
          }
        }
      } else if (data.type === "completed") {
        $("#" + data.from + " .progress").remove();
        $("#" + data.from + " img").removeClass("progress-bar-img");
      } else if (data.type === "ping") {
        if (data.peerid) {
          var pong = {
            type: "pong",
            peerid: data.peerid
          };
          this.sendMessage(pong);
        }
      }
    };
    this.socketRequests();
  };
  componentDidMount() {
    if (!SimplePeer.WEBRTC_SUPPORT) {
      this.notification(
        "Compatibility",
        "Your Browser is not Supported",
        "success"
      );
    }
    if (result.parsedResult.os.name.toLowerCase() === "ios") {
      if (result.parsedResult.browser.name.toLowerCase() !== "safari") {
        this.notification("OKay", "Only Safari is supported on iOS", "success");
      }
    }
    this.initWebSocket();

    window.addEventListener("offline", function(e) {
      ws.close();
    });

    window.addEventListener("online", function(e) {
      ws.close();
    });
  }
  socketRequests = () => {
    ws.onopen = () => {
      clearTimeout(reconnectInterval);
      this.sendMessage(register);
    };
  };

  sendMessage = e => {
    ws.send(JSON.stringify(e));
  };

  subMenu = (e, f, g) => {
    if (e.toLowerCase() === "audio" || e.toLowerCase() === "video") {
      if (localStream === null) {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: { echoCancellation: true } })
          .then(stream => {
            localStream = stream;
            stream = null;

            if (f) {
              this.setState({
                to: f,
                callType: e.toLowerCase()
              });
            } else {
              this.setState({ callType: e.toLowerCase() });
            }
            this.setState({ roomid: uuid() }, () => {
              var joinRoom = {
                type: "joinroom",
                roomid: this.state.roomid,
                calltype: this.state.callType
              };

              this.sendMessage(joinRoom);
            });
          })
          .catch(error => {
            var errorString = error.toString();
            if (errorString.includes("device not found")) {
              this.notification(
                "Mic/Camera",
                "Device (Mic/Camera) not Found",
                "success"
              );
            } else {
              this.notification(
                "Mic/Camera",
                "Device (Mic/Camera) Not Accessible",
                "success"
              );
            }
          });
      } else {
        if (f) {
          this.setState({
            to: f,
            callType: e.toLowerCase()
          });
        } else {
          this.setState({ callType: e.toLowerCase() });
        }
        this.setState({ roomid: uuid() }, () => {
          var joinRoom = {
            type: "joinroom",
            roomid: this.state.roomid,
            calltype: this.state.callType
          };

          this.sendMessage(joinRoom);
        });
      }
    } else if (e.toLowerCase() === "fileupload") {
      if (e && f && g) {
        var fileRequest = {
          type: "filerequest",
          filename: g.name,
          filesize: JSON.stringify(g.size),
          fileext: g.type,
          from: from,
          to: f
        };
        this.setState({ file: g });
        this.sendMessage(fileRequest);
      }
    }
    if (e.toLowerCase() === "audio") {
    }
    if (e.toLowerCase() === "video") {
      this.setState({ isVideo: true, remoteVideo: true });
    }
    if (e.toLowerCase() === "audiopeer") {
      var callRequest = {
        type: "callrequest",
        calltype: this.state.callType,
        callername: localStorage.getItem("myName")
          ? localStorage.getItem("myName")
          : result.parsedResult.os.name,
        roomid: this.state.roomid,
        from: from,
        to: f
      };
      this.sendMessage(callRequest);
    }
  };
  updateJoinRoom = e => {
    if (e) {
      var rejectCall = {
        type: "callresponce",
        accepted: false,
        busy: false,
        from: from,
        to: this.state.to
      };
      this.setState({
        joinRoom: false,
        roomid: uuid(),
        receiveCall: false,
        isBusy: false
      });
      this.sendMessage(rejectCall);
      clearInterval(int);
      if (localStream !== null) {
        localStream.getTracks().forEach(function(track) {
          track.stop();
        });
        localStream = null;
      }
    }
  };
  eventReceiveCall = (e, f) => {
    clearInterval(int);
    if (f) {
      var acceptCall = {
        type: "callresponce",
        accepted: true,
        busy: false,
        from: f.to,
        to: f.from
      };

      var joinRoomAfterAccept = {
        type: "joinroom",
        roomid: f.roomid,
        calltype: this.state.callType
      };
    }
    if (e === "accepted") {
      if (localStream === null) {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: { echoCancellation: true } })
          .then(stream => {
            localStream = stream;
            stream = null;
            this.setState({
              openCallScreen: true,
              receiveCall: false,
              joinRoom: false
            });
            this.sendMessage(acceptCall);
            this.sendMessage(joinRoomAfterAccept);
          });

      } else {
        this.setState({
          openCallScreen: true,
          receiveCall: false,
          joinRoom: false
        });
        this.sendMessage(acceptCall);
        this.sendMessage(joinRoomAfterAccept);
      }
    } else if (e === "rejected") {
      var rejectCall = {
        type: "callresponce",
        accepted: false,
        busy: false,
        from: f.to,
        to: f.from
      };
      this.setState({
        receiveCall: false,
        joinRoom: false,
        roomid: uuid(),
        isBusy: false
      });
      this.sendMessage(rejectCall);
    }
  };

  avatarFunc = (canvas, myName) => {
    var colours = [
      "#1abc9c",
      "#2ecc71",
      "#3498db",
      "#9b59b6",
      "#34495e",
      "#16a085",
      "#27ae60",
      "#2980b9",
      "#8e44ad",
      "#2c3e50",
      "#f1c40f",
      "#e67e22",
      "#e74c3c",
      "#95a5a6",
      "#f39c12",
      "#d35400",
      "#c0392b",
      "#bdc3c7",
      "#7f8c8d"
    ];
    var initials;
    var name = myName;
    var nameSplit = name.split(" ");
    if (nameSplit.length === 1) {
      initials = nameSplit[0].charAt(0).toUpperCase();
    } else {
      initials =
        nameSplit[0].charAt(0).toUpperCase() +
        nameSplit[1].charAt(0).toUpperCase();
    }

    var charIndex = initials.charCodeAt(0) - 65,
      colourIndex = charIndex % 19;

    var context = canvas.getContext("2d");

    var canvasWidth = $(canvas).attr("width"),
      canvasHeight = $(canvas).attr("height"),
      canvasCssWidth = canvasWidth,
      canvasCssHeight = canvasHeight;

    if (window.devicePixelRatio) {
      $(canvas).attr("width", canvasWidth * window.devicePixelRatio);
      $(canvas).attr("height", canvasHeight * window.devicePixelRatio);
      $(canvas).css("width", canvasCssWidth);
      $(canvas).css("height", canvasCssHeight);
      context.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = colours[colourIndex];
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = "50px Arial";
    context.textAlign = "center";
    context.fillStyle = "#FFF";
    context.fillText(initials, canvasCssWidth / 2, canvasCssHeight / 1.5);

    return canvas;
  };

  simplePeer = e => {
    var localConnection = new SimplePeer({
      initiator: e.should_create_offer,
      stream: localStream,
    });
    this.setState({ isBusy: true });
    localConnection.on("signal", data => {
      this.sendSignalling(data, e.peerid);
    });
    localConnection.on("stream", stream => {
      var remotes = document.getElementById("remotes");

      if (remotes) {
        var outerContainer = document.createElement("div");
        outerContainer.classList.add("col-6");
        outerContainer.classList.add("border-black");

        var container = document.createElement("div");
        container.className = "videoContainer";
        container.id = "container_" + e.peerid;
        var video = document.createElement("video");
        var nameDiv = document.createElement("div");
        nameDiv.classList.add("overlay");
        var nameSpan = document.createElement("span");
        nameSpan.innerHTML = e.name;
        nameDiv.appendChild(nameSpan);
        var avatarDiv = document.createElement("div");
        avatarDiv.classList.add("set-canvas");
        var canvas = document.createElement("canvas");
        var signaldiv = document.createElement("div");
        signaldiv.id = "signals";
        canvas.setAttribute("width", 100);
        canvas.setAttribute("height", 100);
        canvas = this.avatarFunc(canvas, e.name);
        canvas.classList.add("round");
        video.setAttribute("playsinline", "");
        video.autoplay = true;
        var span = document.createElement("span");
        container.appendChild(video);
        container.appendChild(nameDiv);
        avatarDiv.appendChild(canvas);
        outerContainer.appendChild(avatarDiv);
        container.appendChild(avatarDiv);
        if (e.video) {
          avatarDiv.classList.add("displayNone");
          video.classList.remove("displayNone");
        } else {
          avatarDiv.classList.remove("displayNone");
          video.classList.add("displayNone");
        }

        // Suppress right-clicks on the video.
        video.oncontextmenu = function() {
          return false;
        };

        outerContainer.appendChild(container);
        if ($(".w-100").prevAll(".col").length == 1) {
          $(outerContainer).insertBefore(".w-100");
        } else {
          remotes.appendChild(outerContainer);
        }

        // If we're adding a new video we need to modify bootstrap so we
        // only get two videos per row.
        var remoteVideos = document
          .getElementById("remotes")
          .getElementsByTagName("video").length;

        if (remoteVideos == 2) {
          var spacer = document.createElement("div");
          spacer.className = "w-100";
          remotes.appendChild(spacer);
        }
        if (remoteVideos >= 3) {
          $(".videoContainer video").css("height", "50vh");
          $(".videoContainer .set-canvas").css("height", "50vh");
        }
        if ("srcObject" in video) {
          video.srcObject = stream;
        } else {
          video.src = window.URL.createObjectURL(stream);
        }
      }
    });
    localConnection.on("error", err => {
      if (Object.keys(SimpleConnections).length === 2) {
        this.notification(
          "Okay",
          "Disconnected. Please refresh your browser",
          "success"
        );
      }
    });
    localConnection.on("connect", connect => {});
    localConnection.on("data", data => {});
    localConnection.on("close", () => {
      var remotes = document.getElementById("remotes");
      var remoteVideos = document
        .getElementById("remotes")
        .getElementsByTagName("video").length;
      var el = document.getElementById("container_" + e.peerid);
      if (remotes && el) {
        if (remoteVideos == 3 || remoteVideos == 2) {
          $(".w-100").remove();
          $(".videoContainer video").css("height", "100vh");
          $(".videoContainer .set-canvas").css("height", "100vh");
        }
        remotes.removeChild(el.parentElement);
      }
      if (e.peerid in SimpleConnections) {
        SimpleConnections[e.peerid].destroy();
        this.setState({ remoteLength: Object.keys(SimpleConnections).length });
        delete SimpleConnections[e.peerid];
      }
      remoteVideos = document
        .getElementById("remotes")
        .getElementsByTagName("video").length;
      if (remoteVideos === 1) {
        this.setState({
          openCallScreen: false,
          joinRoom: false,
          isBusy: false,
          roomid: uuid()
        });

        this.closing();
      }
    });
    if (localConnection) {
      SimpleConnections[e.peerid] = localConnection;
      this.setState({ remoteLength: Object.keys(SimpleConnections).length });
    }
  };
  initProgressBar = peerid => {
    var html = `<div class="progress md-progress blue">
                <span class="progress-left">
                    <span class="progress-bar"></span>
                  </span>
                  <span class="progress-right">
                    <span class="progress-bar"></span>
                  </span>
                </div>`;
    var li = document.getElementById(peerid);
    li.insertAdjacentHTML("afterbegin", html);
    var img = li.getElementsByTagName("img");
    img[0].classList.add("progress-bar-img");
  };
  setProgress = (value, to) => {
    var left = $("#" + to).find(".progress-left .progress-bar");
    var right = $("#" + to).find(".progress-right .progress-bar");
    if (value > 0) {
      if (value <= 50) {
        right.css(
          "transform",
          "rotate(" + this.percentageToDegrees(value) + "deg)"
        );
      } else {
        right.css("transform", "rotate(180deg)");
        left.css(
          "transform",
          "rotate(" + this.percentageToDegrees(value - 50) + "deg)"
        );
      }
    }
  };
  percentageToDegrees = percentage => {
    return (percentage / 100) * 360;
  };

  simplePeerFile = e => {
    var localConnection = new SimplePeer({
      initiator: e.initiator,
      objectMode: true,
    });
    localConnection.on("signal", data => {
      this.sendSignalling(data, e.from);
    });

    localConnection.on("error", err => {
    });
    localConnection.on("connect", () => {
      if (e.initiator) {
        this.initProgressBar(e.from);
        this.sendData(e.file, e.from);
      } else {
        this.initProgressBar(e.from);
      }
    });
    localConnection.on("data", data => {
      if (typeof data.byteLength !== "undefined") {
        let percentage = 0;
        receiveBuffer.push(data);
        receivedSize += data.byteLength;
        percentage = ((receivedSize / e.fileSize) * 100).toFixed(3);
        this.setProgress(percentage, e.from);
        localConnection.send(
          JSON.stringify({
            type: "progress",
            value: percentage
          })
        );
        if (e.fileSize !== 0 && e.fileName) {
          if (receivedSize == e.fileSize) {
            const received = new Blob(receiveBuffer);
            receiveBuffer = [];
            this.setState({ fileAccept: true });
            var downloadAnchor = document.getElementById("download");
            downloadAnchor.href = URL.createObjectURL(received);
            downloadAnchor.download = e.fileName;
            // addFileRecord();
            $("#downloadconfirm .modal-body").empty();
            $("#downloadconfirm .modal-body").append(
              e.fileName + "<br/>" + this.niceBytes(e.fileSize)
            );
            receivedSize = 0;
            if (e.from in SimpleConnectionsFile) {
              SimpleConnectionsFile[e.from].destroy();
              this.setState({ isBusyFile: false });
              delete SimpleConnectionsFile[e.from];
            }
            //For Mobile
            var fileCompleted = { type: "completed", from: from, to: e.from };
            this.sendMessage(fileCompleted);
          }
        }
      } else {
        try {
          if (this.isJSON(data)) {
            var sData = JSON.parse(data);

            if (sData.type == "progress") {
              this.setProgress(sData.value, e.from);
            }
          }
        } catch (error) {
          console.log("TryCatch", error);
        }
      }
    });
    localConnection.on("close", () => {
      receiveBuffer = [];
      sendBuffer = [];
      receivedSize = 0;
      if (e.from in SimpleConnectionsFile) {
        SimpleConnectionsFile[e.from].destroy();
        this.setState({ isBusyFile: false });
        delete SimpleConnectionsFile[e.from];
      }
      $("#" + e.from + " .progress").remove();
      $("#" + e.from + " img").removeClass("progress-bar-img");
    });
    if (localConnection) {
      SimpleConnectionsFile[e.from] = localConnection;
    }
  };

  sendSignalling = (e, f) => {
    if (e.candidate) {
      e.type = "candidate";
    }
    e.to = f;
    e.from = from;
    this.sendMessage(e);
  };
  isJSON = str => {
    try {
      return JSON.parse(str) && !!str;
    } catch (e) {
      return false;
    }
  };
  niceBytes = x => {
    let l = 0,
      n = parseInt(x, 10) || 0;

    while (n >= 1024 && ++l) {
      n = n / 1024;
    }
    //include a decimal point and a tenths-place digit if presenting
    //less than ten of KB or greater units
    return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
  };
  callingControls = e => {
    if (e === "HangUp") {
      var callEnd = {
        type: "partroom",
        roomid: this.state.roomid
      };
      this.sendMessage(callEnd);
      this.setState({
        endCall: true,
        openCallScreen: false,
        joinRoom: false,
        isBusy: false
      });
      this.closing();
    } else if (e === "Mute") {
      this.state.isMute
        ? this.setState({ isMute: false })
        : this.setState({ isMute: true });
      localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0]
        .enabled;
    } else if (e === "Camera") {
      localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0]
        .enabled;
      this.state.isVideo
        ? this.setState({ isVideo: false })
        : this.setState({ isVideo: true });
      this.sendMessage({ type: "video" });
      const video = document.getElementById("selfVideo");
      video.volume = 0;
      const canvas = document
        .getElementsByClassName("videoContainer")[0]
        .getElementsByClassName("set-canvas")[0];
      if (!localStream.getVideoTracks()[0].enabled) {
        video.classList.add("displayNone");
        canvas.classList.remove("displayNone");
      } else {
        video.classList.remove("displayNone");
        canvas.classList.add("displayNone");
      }
    }
  };
  fileControls = (e, data) => {
    var fileControl = {
      type: "fileresponce",
      accepted: e,
      from: data.to,
      to: data.from
    };
    if (e) {
      var fileReciever = {
        fileName: data.filename,
        fileSize: data.filesize,
        fileExt: data.fileext,
        from: data.from,
        initiator: false,
        to: data.to
      };
      this.setState({ enableFileRequestComponent: false, isBusyFile: true });
      this.simplePeerFile(fileReciever);
      this.sendMessage(fileControl);

    } else {
      this.setState({ enableFileRequestComponent: false, isBusyFile: false });
      this.sendMessage(fileControl);
    }
  };

  searchBarHandler = () => {
    this.setState({
      showSearchbar: !this.state.showSearchbar
    });
  };
  sendData = (file, peerid) => {
    if (file.size === 0) {
      this.notification(
        "sad",
        "File is Empty, Please Select a Non-Empty File",
        "success"
      );
      // TODO: Destroy local connection here
    }
    const chunkSize = 64000;
    var fileReader = new FileReader();
    let offset = 0;
    let percentage = 0;

    sendBuffer = [];
    webRTCPaused = false;
    fileReader.addEventListener("error", error =>
      console.error("Error reading file:", error)
    );
    fileReader.addEventListener("abort", event =>
      console.log("File reading aborted:", event)
    );
    fileReader.addEventListener("load", e => {
      this.sendChunk(e.target.result, peerid);
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
  };
  sendChunk = (data, peerid) => {
    sendBuffer.push(data);
    if (webRTCPaused) {
      return;
    }

    this.sendMessageQueued(peerid);
  };

  sendMessageQueued = peerid => {
    webRTCPaused = false;
    let message = sendBuffer.shift();

    while (message) {
      if (
        SimpleConnectionsFile[peerid]._channel.bufferedAmount &&
        SimpleConnectionsFile[peerid]._channel.bufferedAmount >
          BUFFER_FULL_THRESHOLD
      ) {
        webRTCPaused = true;
        sendBuffer.push(message);

        const listener = () => {
          SimpleConnectionsFile[peerid]._channel.removeEventListener(
            "bufferedamountlow",
            listener
          );
          this.sendMessageQueued(peerid);
        };
        SimpleConnectionsFile[peerid]._channel.addEventListener(
          "bufferedamountlow",
          listener
        );
        return;
      }

      try {
        SimpleConnectionsFile[peerid].send(message);
        message = sendBuffer.shift();
      } catch (error) {
        console.log(
          `Error sending message, reason: ${error.name} - ${error.message}`
        );
      }
    }
  };

  changeName = e => {
    if (e) {
      var changeNameRequest = {
        type: "changename",
        name: e
      };
      var peer = document.getElementsByClassName("videoContainer")[0];
      if (peer) {
        var canvas = peer
          .getElementsByClassName("set-canvas")[0]
          .getElementsByTagName("canvas")[0];
        if (canvas) {
          canvas.setAttribute("width", 100);
          canvas.setAttribute("height", 100);
          canvas = this.avatarFunc(canvas, e);
        }
      }
      this.sendMessage(changeNameRequest);
    }
  };
  closing = () => {
    if (localStream !== null) {
      localStream.getTracks().forEach(function(track) {
        track.stop();
      });
      localStream = null;
    }
    this.setState({ stream: false });

    if (SimpleConnections) {
      Object.values(SimpleConnections).forEach(value => {
        value.destroy();
      });
    }
    SimpleConnections = {};
  };
  notification = (title, message, type) => {
    store.addNotification({
      title: "",
      message: message,
      type: type,
      container: "top-center",
      insert: "top",
      dismiss: {
        duration: 2000
      }
    });
  };
  isFileAccept = e => {
    if (e) {
      this.setState({ fileAccept: false });
    }
  };
  headerSearchbarHandler = e => {
    this.setState({
      headerSearhBarValue: e.target.value
    });
    this.setState({ searchValue: e.target.value }, () => {
      const searchedDevices = this.state.devices.filter(device => {
        return device.name
          .toLowerCase()
          .trim()
          .includes(this.state.headerSearhBarValue.toLowerCase().trim());
      });
      this.setState({ headerSearchedDevices: searchedDevices });
    });
  };

  render() {
    return (
      <div>
        <ReactNotification />
        <SideBar />
        <Header
          showSearchBar={this.state.showSearchbar}
          joinAudio={this.state.joinAudio}
          joinVideo={this.state.joinVideo}
          data={this.state.data}
          inputValue={this.state.headerSearhBarValue}
          headerSearchbarHandler={e => this.headerSearchbarHandler(e)}
          searchedDevices={this.state.headerSearchedDevices}
        />

        <Home
          headerSearchedDevices={this.state.headerSearchedDevices}
          data={this.state.devices}
          subMenu={this.subMenu}
          joinAudio={this.state.joinAudio}
          joinVideo={this.state.joinVideo}
          changeName={this.changeName}
          openCallScreen={this.state.openCallScreen}
          searchBarValue={this.state.headerSearhBarValue}
        />

        {this.state.joinRoom && (
          <JoinRoom updateJoinRoom={this.updateJoinRoom} />
        )}
        {this.state.receiveCall && (
          <ReceiveCall
            eventReceiveCall={this.eventReceiveCall}
            callRequestEvent={this.state.callRequestEvent}
          />
        )}
        {this.state.openCallScreen && (
          <CallScreen
            callingControls={this.callingControls}
            subMenu={this.subMenu}
            isVideo={this.state.isVideo}
            showSearchBar={this.searchBarHandler}
            data={this.state.devices}
            remoteVideo={this.state.remoteVideo}
            isMute={this.state.isMute}
            roomId={this.state.roomid}
            changeName={this.changeName}
            remoteLength={this.state.remoteLength}
          />
        )}
        {this.state.enableFileRequestComponent && (
          <FileRequestComponent
            fileRequestData={this.state.fileRequestData}
            fileControls={this.fileControls}
          />
        )}
        {this.state.fileAccept && (
          <FileAccept isFileAccept={this.isFileAccept} />
        )}
      </div>
    );
  }
}
