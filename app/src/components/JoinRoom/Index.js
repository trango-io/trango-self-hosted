import React, { Component } from "react";
import "../Dashboard/Dashboard.css";
import "./JoinRoom.css";

export default class JoinRoom extends Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    return (
      <div className="requestcall flex-center mask  rgba-black-strong">
        <div className="receivercallcontent">
          <p>Calling...</p>
          <p className="encrpted">
            <i className="fas fa-lock"></i> Encrypted
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary waves-effect waves-light"
          onClick={() => {
            this.props.updateJoinRoom("close");
          }}
        >
          <i className="Phone is-animating rejected"></i>
        </button>
      </div>
    );
  }
}
