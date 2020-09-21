import React, { Component } from "react";
import "./AddPerson.css";
export default class AddPerson extends Component {
  render() {
    return (
      <div
        className="add-person d-inline-block"
        onClick={this.props.showSearchBar}
      >
        <div className="row">
          <div className="col-1">
            <div className="plus d-inline">+</div>
          </div>
          <div className="col-10 mb-1">
            <div className="add-person-text d-inline">Add Person</div>
          </div>
        </div>
      </div>
    );
  }
}
