import React, { Component } from "react";
import "./Header.css";
import { Navbar, NavbarBrand, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import uuid from "react-uuid";
import { Tooltip } from "@material-ui/core";
import SearchIcon from "../../Assets/Header/search.svg";
import TrangoLogo from "../../Assets/Logo/TrangoLogo.png";

export default class Header extends Component {
  constructor() {
    super();
    this.state = {
      devices: [],
      timer: 10,
      openTooltip: true,
      isSearch: false
    };
  }

  componentWillReceiveProps(nextProps) {
    const dataSet = [...new Set(nextProps.data.devices)];

    this.setState({
      devices: dataSet
    });
  }
  gotoRoomLink = () => {
    this.props.history.push({
      pathname: "/roomlink"
    });
  };
  startTimer = () => {
    let interval = setInterval(() => this.timer(), 1000);
    this.setState({ interval });
  };
  timer = () => {
    if (this.state.timer > 0) {
      this.setState({ timer: this.state.timer - 1 });
    } else {
      clearInterval(this.state.interval);
      this.setState({ openTooltip: false });
    }
  };
  componentDidMount = () => {
    this.startTimer();
  };
  showSearchbarHandler = () => {
    this.setState({
      isSearch: true
    });
  };

  hideSearch = () => {
    if (this.props.inputValue) {
      this.setState({
        isSearch: true
      });
    } else {
      this.setState({
        isSearch: false
      });
    }
  };

  render() {
    return (
      <div>
        <div>{/* <Sidebar /> */}</div>

        <Navbar
          className={
            this.props.joinAudio && !this.props.joinVideo ? "d-none" : "color"
          }
        >
          <NavbarBrand className="apni-pasand" style={{ zIndex: 110 }}>
            <div className="float-left d-md-none">
              <a href="https://trango.io" target="_blank">
                <img
                  src={TrangoLogo}
                  height="100px"
                  width="100px"
                  className="header-logo"
                  alt="Logo"
                />
              </a>
            </div>
            <div className="scan-local-network navbar-brand float-left">
              <div className="scan-border d-inline">Sca</div>
              <span className="local-network">n Local Network</span>
            </div>
          </NavbarBrand>

          <Nav className="ml-auto" style={{ zIndex: 111 }}>
            {this.state.isSearch ? (
              <div
                className={
                  window.innerWidth <= "600"
                    ? "input-group mt-2 mr-0"
                    : "input-group mt-2 mr-4"
                }
              >
                {this.state.isSearch ? (
                  <input
                    className={
                      window.innerWidth <= "600"
                        ? "form-control  customization "
                        : "form-control form-control-sm "
                    }
                    placeholder="Search"
                    style={{ background: "white" }}
                    type="text"
                    value={this.props.inputValue}
                    onChange={this.props.headerSearchbarHandler}
                    onBlur={this.hideSearch}
                    autoFocus
                  />
                ) : null}
              </div>
            ) : (
              <div onClick={this.showSearchbarHandler} className="mr-4 mt-3 ">
                <img src={SearchIcon} className="coloring" height="20px" />
              </div>
            )}
          </Nav>
        </Navbar>
      </div>
    );
  }
}
