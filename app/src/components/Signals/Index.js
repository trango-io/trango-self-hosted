import React, { Component } from "react";
import "../Dashboard/Dashboard.css";

export default class Signals extends Component {
  state = { devices: [] };

  componentWillUnmount() {
    this._isMounted = false;
  }
  componentDidMount() {
    this._isMounted = true;
  }

  componentWillReceiveProps(nextProps) {
    this.setState(
      {
        devices: nextProps.data,
      },
      () => {
      }
    );
  }

  render() {
    const { devices } = this.state;
    return (
      this.props.joinAudio&&!this.props.joinVideo?null:
      <div id="signals">
        {devices && devices.length <= 3 && devices.length > 0 ? (
          <div>
            <span className="signal s1"></span>
            <span className="signal s2"></span>
            <span className="signal s3">
              {/* <span style={{ marginTop: "-10px" }}>{devices[0].devname}</span> */}
            </span>
            <span className="signal s4"></span>
            <span className="signal s5"></span>
            <span className="signal s6"></span>
            <span className="signal s7"></span>
            <span className="signal s8"></span>
            <span className="signal s9"></span>
          </div>
        ) : devices && devices.length > 3 && devices.length <= 7 ? (
          <div>
            <span className="signal s1"></span>
            <span className="signal s2"></span>
            <span className="signal s3">
             {/* <span style={{ marginTop: "-10px" }}>
                {devices[0].devname}
              </span>
               <span style={{ marginTop: "51px",marginLeft:'-189px' }}>
                {devices[1].devname}
              </span>
              <span style={{ marginTop: "56px",marginLeft:'145px' }}>
                {devices[2].devname}
              </span> */}
            </span>
            <span className="signal s4"></span>
            <span className="signal s5"></span>
            <span className="signal s6"></span>
            <span className="signal s7"></span>
            <span className="signal s8"></span>
            <span className="signal s9"></span>
          </div>
        ) : 
        <div>
          <span className="signal s1"></span>
          <span className="signal s2"></span>
          <span className="signal s3">
            <span style={{ marginTop: "-10px" }}></span>
          </span>
          <span className="signal s4"></span>
          <span className="signal s5"></span>
          <span className="signal s6"></span>
          <span className="signal s7"></span>
            <span className="signal s8"></span>
            <span className="signal s9"></span>
        </div>
        }
      </div>
    );
  }
}
