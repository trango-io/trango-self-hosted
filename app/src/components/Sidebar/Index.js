import React, { Component } from "react";
import "./Sidebar.css";
import logo_s from "../../Assets/Sidebar/logoIcon.png";
import logo_m from "../../Assets/Sidebar/logoIcon@2x.png";
import logo_l from "../../Assets/Sidebar/logoIcon@3x.png";
import info from "../../Assets/Sidebar/info.svg";
import { Dialog, DialogTitle } from "@material-ui/core";

export default class Sidebar extends Component {
  constructor() {
    super();
    this.state = {
      openLogin: false,
      showPassword: false,
      setPrivacy: false,
      showPrivacy: false,
      openSignup: false,
      openForget: false
    };
  }
  closeLogin = () => {
    this.setState({ openLogin: !this.state.openLogin });
  };
  handleClickShowPassword = () => {
    this.setState({ showPassword: !this.state.showPassword });
  };

  loginData = e => {
    if (e === "signup") {
      this.setState({ openLogin: false, openSignup: true });
    } else if (e === "close") {
      this.setState({ openLogin: false });
    } else if (e === "forget") {
      this.setState({ openLogin: false, openForget: true });
    }
  };
  signupData = e => {
    if (e === "login") {
      this.setState({ openLogin: true, openSignup: false });
    } else if (e === "close") {
      this.setState({ openLogin: false });
    }
  };
  forgetData = e => {
    if (e === "forget") {
      this.setState({ openForget: false });
    }
  };

  render() {
    return (
      <div className="Sidebar d-none d-md-block">
        <Dialog open={this.state.showPrivacy} fullWidth fullScreen>
          <DialogTitle>
            Privacy
            <span
              className="float-right"
              onClick={() => {
                this.setState({ setPrivacy: false });
              }}
            >
              <i className="px-2 fas fa-times"></i>
            </span>
          </DialogTitle>
        </Dialog>
        <a href="https://trango.io" target="_blank">
          <img
            src={logo_s}
            srcSet={`${logo_s} 35w,${logo_m} 70w,${logo_l} 105w`}
            height="50px"
            width="50px"
            className="img-fluid mt-4"
            alt="Logo"
          />
        </a>
        <div className="sidebar-lower-section">
          <div className="pb-5 mb-3">
            <a href="https://trango.io" target="_blank">
              <img src={info} alt="info" />
            </a>
          </div>
        </div>
      </div>
    );
  }
}
