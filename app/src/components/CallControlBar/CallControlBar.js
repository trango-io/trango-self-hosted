import React, { Component } from "react";
import "./CallControlBar.css";
import Add from "../../Assets/CallControlBar/add.svg";
import Message from "../../Assets/CallControlBar/message.svg";
import Mic from "../../Assets/CallControlBar/mic.svg";
import Video from "../../Assets/CallControlBar/video.svg";
import Phone from "../../Assets/CallControlBar/phoneRed.svg";
import Tooltip from "@material-ui/core/Tooltip";
export default class CallControlBar extends Component {
  copyUrl = () => {
    var url = window.location.href;
    navigator.clipboard.writeText(url);
  };

  render() {
    return (
      <div className="call-control-bar py-2 px-2">
        <div className="row">
          <div className="col">
            <a
              id="muteButton"
              onClick={() => {
                this.props.callingControls("Mute");
              }}
              data-toggle="tooltip"
              data-placement="top"
              title="Mute"
            >
              {!this.props.isMute ? (
                <Tooltip title="Mic On">
                  <img src={Mic} className="img-fluid mic-off" />
                </Tooltip>
              ) : (
                <Tooltip title="Mic Off">
                  <img src={Mic} className="img-fluid" />
                </Tooltip>
              )}
            </a>
          </div>
          <div className="col">
            <a
              id="toggleVideo"
              onClick={() => {
                this.props.callingControls("Camera");
              }}
            >
              {!this.props.isVideo ? (
                <Tooltip title="Camera On">
                  <img src={Video} className="img-fluid cam-off" />
                </Tooltip>
              ) : (
                <Tooltip title="Camera Off">
                  <img src={Video} className="img-fluid" />
                </Tooltip>
              )}
            </a>
          </div>
          <div className="col">
            <a
              id="hangupButton"
              onClick={() => {
                this.props.callingControls("HangUp");
              }}
              data-toggle="tooltip"
              data-placement="top"
              title="Hangup"
            >
              <Tooltip title="End Call">
                <img src={Phone} className="img-fluid" />
              </Tooltip>
            </a>
          </div>
          <div
            className="col"
            onClick={() => {
              this.copyUrl();
            }}
          >
            <Tooltip title="Copy URL">
              <img src={Add} className="img-fluid tooltiptext" />
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }
}
