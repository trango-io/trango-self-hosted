import React, { Component } from "react";
import "../Dashboard/Dashboard.css";
import { Avatar } from "@material-ui/core";
import Add from "../../Assets/CallControlBar/add.svg";
import Mic from "../../Assets/CallControlBar/mic.svg";
import Video from "../../Assets/CallControlBar/video.svg";
import Phone from "../../Assets/CallControlBar/phoneRed.svg";
import Copy from "../../Assets/CallControlBar/copy (1).svg";
import Link from "../../Assets/CallControlBar/link.svg";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import Bowser from "bowser";
import ReactNotification from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'
import { store } from 'react-notifications-component';
import PhoneCall from '../../Assets/CallCard/phone.svg'
import VideoCall from '../../Assets/CallCard/002-video-camera.svg'
import Close from '../../Assets/CallCard/close.svg'
import Pencil from '../../Assets/CallCard/pencil.svg'
import Tooltip from '@material-ui/core/Tooltip';

var result = Bowser.getParser(window.navigator.userAgent);
export default class RecieveCall extends Component {
  constructor() {
    super();
    this.state = {
      showSearchList: false,
      devices: [],
      videoJoin: false,
      open: false,
      openCopyLink: false,
      searchValue:'',
      searchedDevices:[],
      isInput: false,
      myName: '',
      remoteLengthFromDashboard: 0,
      openTooltip: true,
      timer: 10
    };
  }
  showSearchBar = () => {
    if(this.state.remoteLengthFromDashboard >= 3){
      this.notification("blabla","Room is full", "success")
      if(this.state.open){
        this.setState({
          open: !this.state.open,
        });
      }
    } else {
      this.setState({
        showSearchList: !this.state.showSearchList,
        open: !this.state.open,
      });
    }
  };
  componentWillReceiveProps(nextProps) {
    this.setState({remoteLengthFromDashboard: nextProps.remoteLength})
    if (nextProps.joinVideo !== this.props.joinVideo || nextProps.joinVideo) {
      this.setState({videoJoin: nextProps.joinVideo}
      );
    }
    this.setState({devices: nextProps.data})
    if(this.props.data !== nextProps.data){
      this.setState({devices: this.props.data})
    }
}


  copyLinkHandler = () => {
    this.setState({
      openCopyLink: !this.state.openCopyLink,
    });
  };

  searchHandler = (e) => {
    this.setState({searchValue: e.target.value}, () => {
      const searchedDevices=this.state.devices.filter(device=>{
              return device.name.toLowerCase().trim().includes(this.state.searchValue.toLowerCase().trim())
              })
              this.setState({searchedDevices: searchedDevices})
    })
  }

  copyLinkHandler = () => {
    this.setState({
      openCopyLink:!this.state.openCopyLink,
    })
  }
  copyUrl = () => {
    var url = window.location.href+"roomlink?roomid="+this.props.roomId
    navigator.clipboard.writeText(url)
    this.notification("Copied", "URL has been copied", "success")
}
notification = (title,message,type) => {
  store.addNotification({
    title: '',
    message: message,
    type: type,
    container: "top-center",
    insert: 'top',
    dismiss: {
      duration: 5000
    }
  })
}
changeEvent = e => {
  if(e && e.target.value.length > 0){
    localStorage.setItem('myName', e.target.value)
    this.props.changeName(e.target.value)
    this.setState({isInput: false})
  }
  else {
    localStorage.setItem('myName',(localStorage.getItem('myName') ? localStorage.getItem('myName') : result.parsedResult.os.name))
    this.setState({isInput: false})
  }
  if (e.keyCode === 13) {
    this.setState({isInput: false})
  }
}

handleKeyPress = (target) => {
  
  if(target.charCode === 13){
    if(target.target.value.length > 0){
      localStorage.setItem('myName', target.target.value)
      this.props.changeName(target.target.value)
      this.setState({isInput: false})
    }
    else {
      localStorage.setItem('myName', (localStorage.getItem('myName') ? localStorage.getItem('myName') : result.parsedResult.os.name))
      this.setState({isInput: false})
    }
  } 
}
  startTimer = () => {
    let interval = setInterval(() => this.timer(), 1000);
    this.setState({ interval });
  };
  timer = () => {
    if (this.state.timer >0){
      this.setState({ timer: this.state.timer -1 });
    }
    else {
      clearInterval(this.state.interval);
      this.setState({openTooltip: false})
    }
  };
  componentDidMount = () => {
    this.startTimer()
  }

  render() {
    return (
      <div
        className="modal fade show"
        id="callscreens"
        data-backdrop="static"
        data-keyboard="false"
        tabindex="-1"
        role="dialog"
        aria-labelledby="myModalLabel"
        aria-modal="true"
        style={{ display: "block" }}
      >
      <ReactNotification/>
        <div>
          <div
            className={
              this.state.showSearchList ? "set-person-adjust" : "set-person"
            }
            onClick={this.showSearchBar}
          ></div>

          <Dialog
            className="d-inline"
            open={this.state.open}
            aria-labelledby="scroll-dialog-title"
            aria-describedby="scroll-dialog-description"
          >
            <DialogTitle className="list-title copy-dialog" id="simple-dialog-title" >
              Contacts
              <span className="float-right" onClick={this.showSearchBar}>
                <img src={Close} className="img-fluid px-2" 
                          style={{filter: "invert(100%) sepia(70%) saturate(2358%) hue-rotate(346deg) contrast(10%)"}} alt="close" />
              </span>
              <div className='input-group pt-2' >
                <input className='form-control form-control-sm ' style={{background:'white',borderColor:'#bdbdbd', borderWidth: "1px", borderStyle: "solid" }} placeholder='Search' value={this.state.searchValue} onChange={(e)=>{this.searchHandler(e)}}/>

              </div>
            </DialogTitle>
          
            <DialogContent dividers={"paper"} className='copy-dialog'>
              <DialogContentText id="scroll-dialog-description" tabIndex={-1}>
                
              </DialogContentText>

              {!this.state.searchValue?this.state.devices.map((item) => (
                <List>
                  <ListItem button>
                    <ListItemAvatar>
                      <Avatar></Avatar>
                    </ListItemAvatar>
                    <ListItemText>
                      <span className="float-left">{item.name}</span>
                      <span className="float-right">
                        <img alt="Audio" onClick={() => {
                            this.props.subMenu("AudioPeer", item.email);
                          }} 
                          src={PhoneCall} className="img-fluid px-2" 
                          style={{filter: "invert(100%) sepia(70%) saturate(2358%) hue-rotate(346deg) contrast(10%)"}} />
                          <img alt="Audio" onClick={() => {
                            this.props.subMenu("AudioPeer", item.email);
                          }} 
                          src={VideoCall} className="img-fluid px-2" 
                          style={{filter: "invert(100%) sepia(70%) saturate(2358%) hue-rotate(346deg) contrast(10%)"}} />
                      </span>
                    </ListItemText>
                  </ListItem>
                </List>
              )):this.state.searchedDevices.map((item) => (
                <List>
                  <ListItem button>
                    <ListItemAvatar>
                      <Avatar></Avatar>
                    </ListItemAvatar>
                    <ListItemText>
                      <span className="float-left">{item.name}</span>
                      <span className="float-right">
                      <img alt="Audio" onClick={() => {
                            this.props.subMenu("AudioPeer", item.email);
                          }} 
                          src={PhoneCall} className="img-fluid px-2" 
                          style={{filter: "invert(100%) sepia(70%) saturate(2358%) hue-rotate(346deg) contrast(10%)"}} />
                        <img alt="Audio" onClick={() => {
                            this.props.subMenu("AudioPeer", item.email);
                          }} 
                          src={VideoCall} className="img-fluid px-2" 
                          style={{filter: "invert(100%) sepia(70%) saturate(2358%) hue-rotate(346deg) contrast(10%)"}} />
                      </span>
                    </ListItemText>
                  </ListItem>
                </List>
              ))}
            </DialogContent>
          </Dialog>

            <Dialog className='d-inline '
              open={this.state.openCopyLink}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description">
            <DialogTitle  id="alert-dialog-title" className='copy-dialog'>
              <img src={Link} alt="copylink" />
              <span className='float-right' onClick={this.copyLinkHandler}>
              <img src={Close} className="img-fluid px-2" alt="close"
                          style={{filter: "invert(100%) sepia(70%) saturate(2358%) hue-rotate(346deg) contrast(10%)"}} />
              </span>

              </DialogTitle>
              <DialogContent className='copy-dialog'>
                <DialogContentText id="alert-dialog-description">
                  <div className='invite pt-2'>Invite with Link</div>
                  <div className='link-text pt-3'>Share this link with people you want in the meeting</div>
                  <div className='link-span'>
                  <div className='link-spn-text float-left'>
                  {window.location.href}roomlink?roomid={this.props.roomId}
                  </div>
                  <div className='float-right' onClick={() => {this.copyUrl()}}><img src={Copy} alt="Copy" /></div>
                  </div>
                  
                </DialogContentText>
              </DialogContent>
            </Dialog>
        </div>
        <div
          className={"modal-dialog modal-fluid" }
          role="document"
          style={{ Width: "100%" }}
        >
          <div className="modal-content">
            <div className="modal-body">
              <div class="container-fluid">
                <div id="remotes" class="row">
                  <div class="col-6 border-black">
                    <div class="videoContainer">
                      <video id="selfVideo" style={{objectFit: "cover"}}></video>
                  <div class="overlay">
                  { !this.state.isInput ? <span onClick={() => {this.setState({isInput: true})}} id="setMyName">{localStorage.getItem('myName') ? localStorage.getItem('myName') :  this.state.myName}</span> : ''}
                  { !this.state.isInput ? <img src={Pencil} alt="Pencil" className="img-fluid px-2 pencil-icon-call" /> : ''}
                  { this.state.isInput ? <input type="text" autoFocus className= "set-myname" placeholder="Enter Name" maxLength="7" onBlur={this.changeEvent} onKeyPress={this.handleKeyPress} /> : ''}
                </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="controls">
          <div className="controls-icons">
            <div className="call-control-bar py-2 px-2">
              <div className="row">
                <div className="col">
                  <a
                    id="muteButton"
                    onClick={() => {
                      this.props.callingControls("Mute");
                    }}
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Mute"
                  >
                    {!this.props.isMute ? (
                      <img src={Mic} className="img-fluid mic-off" alt="Mic" />
                    ) : (
                      <img src={Mic} className="img-fluid" alt="Mic" />
                    )}
                  </a>
                </div>
                <div className="col">
                  <a
                    id="toggleVideo"
                    onClick={() => {
                      this.props.callingControls("Camera");
                    }}
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Camera On/Off"
                  >
                    {!this.props.isVideo ? (
                      <img src={Video} className="img-fluid cam-off" alt="Video"/>
                    ) : (
                      <img src={Video} className="img-fluid" alt="Video" />
                    )}
                  </a>
                </div>
                <div className="col">
                  <a
                    id="hangupButton"
                    onClick={() => {
                      this.props.callingControls("HangUp");
                    }}
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Hangup"
                  >
                    <img src={Phone} className="img-fluid" />
                  </a>
                </div>
                <div className="col" onClick={this.showSearchBar}>
                <Tooltip open={this.state.openTooltip} title="Add another person" leaveDelay={200}>
                  <img src={Add} className="img-fluid" alt="Add" />
                </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
