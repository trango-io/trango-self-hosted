import React, { Component } from "react";
import "../Dashboard/Dashboard.css";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";

const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
export default class FileRequest extends Component {
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
  niceBytes = x => {
    let l = 0,
      n = parseInt(x, 10) || 0;

    while (n >= 1024 && ++l) {
      n = n / 1024;
    }
    //include a decimal point and a tenths-place digit if presenting
    //less than ten of KB or greater units
    return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
  };

  render() {
    return (
      <div>
        <Dialog
          open={true}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"File Request"}</DialogTitle>
          <DialogContent>
            {this.props.fileRequestData.filename.toUpperCase()}
            <br />
            {this.niceBytes(this.props.fileRequestData.filesize)}
          </DialogContent>
          <DialogActions>
            <button
              type="button"
              className="btn btn-secondary waves-effect waves-light"
              onClick={() => {
                this.props.fileControls(false, this.props.fileRequestData);
              }}
            >
              Ignore
            </button>
            <button
              type="button"
              className="btn btn-primary waves-effect waves-light"
              onClick={() => {
                this.props.fileControls(true, this.props.fileRequestData);
              }}
            >
              Accept
            </button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}
