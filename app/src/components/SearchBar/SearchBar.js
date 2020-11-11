import React, { Component } from "react";
import "./SearchBar.css";
export default class SearchBar extends Component {
  state = { devices: [] };

  componentWillReceiveProps(nextProps) {
    this.setState({
      devices: [...new Set(nextProps.devices)]
    });
  }

  render() {
    return (
      <div className="search-bar">
        {this.state.devices
          ? this.state.devices.map((device, index) => {
              return <span key={index}>{device.devname}</span>;
            })
          : null}
      </div>
    );
  }
}
