import React, { Component } from "react";
import "../Dashboard/Dashboard.css";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
export default class FileAccept extends Component {
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
      <div>
        <Dialog
          open={true}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          id="downloadconfirm"
        >
          <DialogTitle id="alert-dialog-title">{"File Received"}</DialogTitle>
          <DialogContent>
            <div className="modal-body"></div>
          </DialogContent>
          <DialogActions>
            <button
              type="button"
              className="btn btn-secondary waves-effect waves-light"
              data-dismiss="modal"
              onClick={() => {
                this.props.isFileAccept(true);
              }}
            >
              Ignore
            </button>
            <a
              id="download"
              role="button"
              className="btn btn-primary waves-effect waves-light"
              href=""
              download=""
              onClick={() => {
                this.props.isFileAccept(true);
              }}
            >
              Download
            </a>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}
