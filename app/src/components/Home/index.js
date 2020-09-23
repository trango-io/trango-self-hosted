import React, { Component } from "react";
import Bowser from "bowser";
import Signals from "../Signals/Index";
import "../Dashboard/Dashboard.css";
import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import { Avatar } from "@material-ui/core";
import videoCall from "../../Assets/CallCard/002-video-camera.svg";
import Attachments from "../../Assets/CallCard/007-paperclip.svg";
import audioCall from "../../Assets/CallCard/phone.svg";
import Cross from "../../Assets/CallCard/close.svg";
import Pencil from "../../Assets/CallCard/pencil.svg";
import Android from "../../Assets/Os/android.png";
import Ios from "../../Assets/Os/ios.png";
import Mac from "../../Assets/Os/mac.png";
import Windows from "../../Assets/Os/window.png";

const result = Bowser.getParser(window.navigator.userAgent);
const macImg = Mac;
const androidImg = Android;
const windowsImg = Windows;
const iOSImg = Ios;

export default class Home extends Component {
  constructor() {
    super();
    this.state = {
      imgUrl: "",
      sameNetwork: false,
      devices: [],
      fileUpload: [],
      email: "",
      myName: "",
      isInput: false,
      open: false,
      toolTip: true,
      openModal: false,
      activeItem: ""
    };
  }
  componentWillUnmount() {
    this._isMounted = false;
  }
  componentDidMount() {
    this._isMounted = true;
    if (result.parsedResult.os.name) {
      if (result.parsedResult.os.name === "macOS") {
        this.setState({
          imgUrl: macImg,
          myName: "Mac OS"
        });
      } else if (result.parsedResult.os.name.toLowerCase() === "android") {
        this.setState({
          imgUrl: androidImg,
          myName: "Android"
        });
      } else if (
        result.parsedResult.os.name.toLowerCase() === "windows" ||
        result.parsedResult.os.name.toLowerCase() === "linux"
      ) {
        this.setState({
          imgUrl: windowsImg,
          myName: "Windows"
        });
      } else if (result.parsedResult.os.name.toLowerCase() === "ios") {
        this.setState({
          imgUrl: iOSImg,
          myName: "iOS"
        });
      }
    }
  }
  componentWillReceiveProps(nextProps) {
    this.setState({ devices: nextProps.data, sameNetwork: true });
  }
  uploadFile = e => {
    this.setState(
      {
        fileUpload: e.target.files[0]
      },
      () => {
        this.props.subMenu(
          "FileUpload",
          this.state.email,
          this.state.fileUpload
        );
      }
    );
  };
  changeEmail = e => {
    this.setState({
      email: e
    });
  };
  test = e => {
    if (e) {
      this.props.subMenu("FileUpload", this.state.email, e.target.files[0]);
      this.setState({ openModal: false });
    }
  };
  inputName = e => {
    this.setState({
      myName: e.target.value
    });
  };

  changeEvent = e => {
    if (e && e.target.value.length) {
      localStorage.setItem("myName", e.target.value);
      this.props.changeName(e.target.value);
    }
    if (e.keyCode === 13) {
      this.setState({ isInput: false });
    }
    this.setState({ isInput: false });
  };

  handleKeyPress = target => {
    if (target.charCode === 13) {
      localStorage.setItem("myName", target.target.value);
      this.props.changeName(target.target.value);
      this.setState({ isInput: false });
    }
  };
  handleShow = item => {
    this.setState({ activeItem: item }, () =>
      this.setState({ openModal: true })
    );
  };
  render() {
    const { imgUrl } = this.state;
    return (
      <div>
        <Dialog
          open={this.state.openModal}
          className="control-modal w3-animate-bottom"
        >
          <DialogTitle className="d-inline">
            <div className="row">
              <div className="col-3  float-right person-avatar">
                {" "}
                <Avatar className="fa  fa-user"></Avatar>
              </div>
              <div
                className="col float-left mt-3 mr-2"
                style={{ fontFamily: "axiforma", fontWeight: "bold" }}
              >
                <span className=" ml-3">{this.state.activeItem.name}</span>
              </div>
              <div className="col">
                <div
                  className="float-right text-muted cross-dialogue"
                  onClick={() => {
                    this.setState({ openModal: false });
                  }}
                >
                  <Avatar>
                    <img src={Cross} alt="Attachments" />
                  </Avatar>
                </div>
              </div>
            </div>
          </DialogTitle>
          <DialogContent>
            <div className="row mt-4 my-controls">
              <div className="col-4">
                <input
                  type="file"
                  id="img"
                  onChange={this.test}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => {
                    this.changeEmail(this.state.activeItem.email);
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "transparent"
                  }}
                >
                  <label htmlFor="img">
                    <Avatar>
                      <img src={Attachments} alt="Attachments" />
                    </Avatar>
                    <span
                      className="float-left pt-2 controls-fonts"
                      style={{ fontWeight: 100 }}
                    >
                      Attachments
                    </span>
                  </label>
                </button>
              </div>
              <div
                className="col-4"
                onClick={() => {
                  this.props.subMenu("Audio", this.state.activeItem.email);
                  this.setState({ openModal: false });
                }}
              >
                <Avatar>
                  <img src={audioCall} alt="Audio Call" />
                </Avatar>
                <span
                  className="float-left pt-2 controls-fonts"
                  style={{ fontWeight: 100 }}
                >
                  Audio Call
                </span>
              </div>
              <div
                className="col-4"
                onClick={() => {
                  this.props.subMenu("Video", this.state.activeItem.email);
                  this.setState({ openModal: false });
                }}
              >
                <Avatar>
                  <img src={videoCall} alt="videoCall" />
                </Avatar>
                <span
                  className="float-left pt-2 controls-fonts"
                  style={{ fontWeight: 100 }}
                >
                  Video Call
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {this.state.sameNetwork && (
          <div className="sysicons align-self-center">
            {
              <ul id="peers">
                {this.props.searchBarValue && this.props.headerSearchedDevices
                  ? this.props.headerSearchedDevices.map((item, index) => (
                      <li
                        className="dropdown text-center progress-bar-icon"
                        key={item.email}
                        id={item.email}
                      >
                        <img
                          className="sysoptions img-fluid z-depth-2 rounded mx-auto d-block"
                          src={
                            item.devtype.toLowerCase() === "macOS"
                              ? macImg
                              : item.devtype.toLowerCase() === "android"
                              ? androidImg
                              : item.devtype.toLowerCase() === "windows" ||
                                item.devtype === "Linux"
                              ? windowsImg
                              : item.devtype.toLowerCase() === "ios"
                              ? iOSImg
                              : macImg
                          }
                          alt="OS"
                          onClick={() => {
                            this.handleShow(item);
                          }}
                        />
                        <span>{item.name}</span>
                      </li>
                    ))
                  : this.state.devices.map((item, index) => (
                      <li
                        className="dropdown text-center progress-bar-icon"
                        key={item.email}
                        id={item.email}
                      >
                        <img
                          className="sysoptions img-fluid z-depth-2 rounded mx-auto d-block"
                          src={
                            item.devtype.toLowerCase() === "macOS"
                              ? macImg
                              : item.devtype.toLowerCase() === "android"
                              ? androidImg
                              : item.devtype.toLowerCase() === "windows" ||
                                item.devtype === "Linux"
                              ? windowsImg
                              : item.devtype.toLowerCase() === "ios"
                              ? iOSImg
                              : macImg
                          }
                          alt="OS"
                          onClick={() => {
                            this.handleShow(item);
                          }}
                        />
                        <span>{item.name}</span>
                      </li>
                    ))}
              </ul>
            }
          </div>
        )}
        {this.props.openCallScreen ? null : (
          <div>
            <div
              className="sysicons-myPeer align-self-center bottom-myName"
              style={{ zIndex: 1222 }}
            >
              <ul>
                <li className="dropdown text-center progress-bar-icon">
                  <img
                    className="sysoptions img-fluid z-depth-2 rounded mx-auto d-block"
                    alt="OSImg"
                    src={imgUrl}
                  />
                </li>
                {!this.state.isInput ? (
                  <span
                    onClick={() => {
                      this.setState({ isInput: true, toolTip: false });
                    }}
                    id="setMyName"
                  >
                    {localStorage.getItem("myName")
                      ? localStorage.getItem("myName")
                      : this.state.myName}{" "}
                    <img src={Pencil} className="img-fluid px-2 pencil-icon" alt="Edit" />
                  </span>
                ) : (
                  ""
                )}
                {this.state.isInput ? (
                  <input
                    type="text"
                    autoFocus
                    className="set-myname"
                    placeholder="Enter Name"
                    maxLength="7"
                    onBlur={this.changeEvent}
                    onKeyPress={this.handleKeyPress}
                  />
                ) : (
                  ""
                )}
              </ul>
            </div>
            <h5 className="bottom-intro text-center">
              Make audio and video calls or transfer data without going through
              the internet.
              <span>
                Users on the same network (LAN) with this page opened will be
                displayed here.
              </span>
            </h5>
          </div>
        )}
        {!this.state.sameNetwork && (
          <div className="sysicons align-self-center">
            <ul id="peers"></ul>
          </div>
        )}
        {this.props.openCallScreen ? null : (
          <div className="my-signal">
            <Signals
              data={this.state.devices}
              joinAudio={this.props.joinAudio}
              joinVideo={this.props.joinVideo}
            />
          </div>
        )}
      </div>
    );
  }
}
