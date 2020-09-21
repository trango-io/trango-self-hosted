import React, { Component } from "react";
import "./CallSignals.css";
import "../Dashboard/Dashboard.css";
export default class CallSignals extends Component {
  render() {
    return (
      <div id="signals-call">
        <span className="signal s1">{/* <Avatar >W</Avatar> */}</span>
        <span className="signal s2"></span>
        <span className="signal s3"></span>
        <span className="signal s4"></span>
        <span className="signal s5"></span>
        <span className="signal s6"></span>
        <span className="signal s7"></span>
        <span className="signal s8"></span>
        <span className="signal s9"></span>
      </div>
    );
  }
}
