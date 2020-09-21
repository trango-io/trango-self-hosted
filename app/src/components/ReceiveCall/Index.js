import React, { Component } from "react";
import "../Dashboard/Dashboard.css";

export default class RecieveCall extends Component {
  constructor() {
    super();
    this.state = {};
  }
  componentWillUnmount() {
    this._isMounted = false;
  }
  componentDidMount() {
    this._isMounted = true;
  }

  render() {
    return (
      <div className="receivecall flex-center mask  rgba-black-strong">
        <div className="receivercallcontent">
          <p className="encrpted">
            <i className="fas fa-lock"></i> Encrypted
          </p>
          <p>
            <span id="callerCallType">
              {this.props.callRequestEvent.calltype}
            </span>
          </p>

          <div id="avatarview" className="text-center profile-card">
            <div className="avatar z-depth-1-half mb-4">
              <img
                src="https://d2irivnnic7w8c.cloudfront.net/img/coming-soon/mac.png"
                className="rounded-circle"
                alt="sample-avatar"
              />
            </div>
          </div>
          <div id="callername">
            <div className="callingname">
              <span id="callerName">
                {this.props.callRequestEvent.callername}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary waves-effect waves-light"
          onClick={() => {
            this.props.eventReceiveCall(
              "rejected",
              this.props.callRequestEvent
            );
          }}
        >
          <i className="Phone is-animating rejected"></i>
        </button>
        <button
          type="button"
          className="btn btn-primary waves-effect waves-light"
          onClick={() => {
            this.props.eventReceiveCall(
              "accepted",
              this.props.callRequestEvent
            );
          }}
        >
          <i className="Phone is-animating accepted"></i>
        </button>
      </div>
    );
  }
}
