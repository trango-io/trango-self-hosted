import React, { Component } from "react";
export default class AddPeopleSearch extends Component {
  state = { devices: [] };

  componentWillReceiveProps(nextProps) {
    this.setState({
      devices: [...new Set(nextProps.devices)]
    });
  }

  render() {
    return (
      <div className="add-people-search">
        <ul>
          {this.state.devices
            ? this.state.devices.map((device, index) => {
                return <li key={index}>{device.devname}</li>;
              })
            : null}
        </ul>
      </div>
    );
  }
}
