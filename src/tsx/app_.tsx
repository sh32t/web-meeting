import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Peer, { SfuRoom, RoomStream } from 'skyway-js';

const hostId = 'sample-room';
let connectCount = 0;
const maxConnectCount = 8;
let peer: Peer;
let localStream: SkyWayMediaStream;
let room: SfuRoom;

class Login extends React.Component {

  name: React.RefObject<HTMLInputElement>
  state: { val: string }

  constructor(props: {}) {
    super(props);
    this.name = React.createRef();
    this.state = { val: '' }
    this.enter = this.enter.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  enter() {
    let name = 'guest';
    if (this.name.current?.value != undefined) {
      name = this.name.current?.value
    }
    ReactDOM.render(<Main name={name} />, document.getElementById('root'));
  }

  handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      val: event.target.value
    });
  }

  render() {
    return (
      <div id="login">
        <div id="name-box">
          <span className="label">名前：</span>
          <input type="text" ref={this.name} value={this.state.val} onChange={this.handleChange} />
        </div>
        <div className="button" onClick={this.enter}>参加</div>
      </div>
    )
  }

}

type Video = {
  id: string;
  stream: RoomStream | MediaStream;
}

interface SkyWayMediaStream extends MediaStream {
  peerId: string
}



class Main extends React.Component<{ name: string }> {

  name: string
  state: {
    videoList: Video[]
    , textList: string[]
    , status: string
    , flagSpeech: boolean
    , startButton: string
    , microphoneButton: string
    , cameraButton: string
    , shareDisplayButton: string
  }

  constructor(props: { name: string }) {
    super(props);
    this.name = this.props.name;
    this.state = {
      videoList: []
      , textList: []
      , status: '停止中'
      , flagSpeech: false
      , startButton: '開始'
      , microphoneButton: 'マイクOFF'
      , cameraButton: 'カメラOFF'
      , shareDisplayButton: '画面共有ON'
    };
    this.init = this.init.bind(this);
    this.shareDisplay = this.shareDisplay.bind(this);
    this.switchMicrophone = this.switchMicrophone.bind(this);
    this.switchCamera = this.switchCamera.bind(this);
  }

  init() {

    peer = new Peer({ key: 'f9e9b17f-474a-4576-a93a-c86f6453314e' });

    const myClass = this;

    peer.on('open', function () {
      localStream.peerId = peer.id;

      console.log('My Peer ID:' + peer.id);

      if (connectCount == 0) {
        setVideo(myClass, localStream, true);
      }

      createRoom(peer, myClass);

      setUpSpeech(myClass);
    });
  }

  switchMicrophone() {
    // マイクのON/OFF
    if (localStream.getAudioTracks()[0].enabled) {
      this.setState({ microphoneButton: 'マイクON' });
      localStream.getAudioTracks()[0].enabled = false;
    } else {
      this.setState({ microphoneButton: 'マイクOFF' });
      localStream.getAudioTracks()[0].enabled = true;
    }
  }

  switchCamera() {
    // カメラのON/OFF
    if (localStream.getVideoTracks()[0].enabled) {
      this.setState({ cameraButton: 'カメラON' });
      localStream.getVideoTracks()[0].enabled = false;
    } else {
      this.setState({ cameraButton: 'カメラOFF' });
      localStream.getVideoTracks()[0].enabled = true;
    }
  }

  shareDisplay() {

    if (this.state.shareDisplayButton == '画面共有OFF') {
      this.setState({ shareDisplayButton: '画面共有ON' });
      room.close();

    } else {
      this.setState({ shareDisplayButton: '画面共有OFF' });

      const mediaDev = navigator.mediaDevices as any;
      const myClass = this;
      mediaDev.getDisplayMedia().then(
        function (stream: SkyWayMediaStream) {
          room = peer.joinRoom(hostId, { mode: 'sfu', stream: stream });
          stream.peerId = peer.id + '-share'
          setVideo(myClass, stream, true);
        }
      );

    }

  }

  displayAll(e: React.MouseEvent<HTMLVideoElement, MouseEvent>) {
    e.currentTarget.classList.toggle('maxview');
  }

  render() {

    const myClass = this;

    const videoList = this.state.videoList.map(function (video, index) {
      const elementId = video.id;
      return (
        <video id={elementId} key={index} className="video-contents" autoPlay playsInline onClick={myClass.displayAll}></video>
      );
    })

    const textList = this.state.textList.map(function (text, index) {
      return (
        <div key={index} >{text}</div>
      );
    })

    return (
      <div id="main">
        <div id="video-box">{videoList}</div>
        <div id="minutes-box">
          <div id="title">議事録</div>
          <div id="status">{this.state.status}</div>
          <div id="text">
            {textList}
          </div>
        </div>
        <div id="menu-box">
          <div className="button" onClick={this.init}>{this.state.startButton}</div>
          <div className="button" onClick={this.switchMicrophone}>{this.state.microphoneButton}</div>
          <div className="button" onClick={this.switchCamera}>{this.state.cameraButton}</div>
          <div className="button" onClick={this.shareDisplay}>{this.state.shareDisplayButton}</div>
        </div>
      </div>
    )

  }

}

function setVideo(myClass: Main, stream: SkyWayMediaStream, isMute: boolean) {
  connectCount++;
  const video: Video[] = [{ id: stream.peerId, stream: stream }];
  myClass.setState({ videoList: myClass.state.videoList.concat(video) }, function () {
    console.log(stream.peerId + ' set');
    const videoElement = document.getElementById(stream.peerId);
    if (videoElement instanceof HTMLVideoElement) {
      videoElement.srcObject = stream;
      videoElement.muted = isMute;
      videoElement.play();
    }
  });
}

function setLocalStream() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(
    function (stream: MediaStream) {
      localStream = stream as SkyWayMediaStream;
      ReactDOM.render(<Login />, document.getElementById('root'));
    }
  ).catch(error => {
    // 失敗時にはエラーログを出力
    console.error('mediaDevice.getUserMedia() error:', error);
  });
}

function createRoom(peer: Peer, myClass: Main) {
  // ルーム作成
  room = peer.joinRoom(hostId, { mode: 'sfu', stream: localStream });
  room.on('open', function () {
    console.log(hostId + ' open');
  });
  room.on('close', function () {
    console.log(hostId + ' close');
  });
  // クライアント参加
  room.on('peerJoin', function (peerId) {
    console.log(peerId + ' join');
  });
  room.on('peerLeave', function (peerId) {
    console.log(peerId + ' leave');
    myClass.setState({ videoList: myClass.state.videoList });
  });
  room.on('stream', function (roomStream) {
    if (connectCount < maxConnectCount) {
      setVideo(myClass, roomStream, false);
    }
    roomStream.onaddtrack = function(event){
      roomStream.addTrack(event.track);
      roomStream.peerId = roomStream.peerId;
      setVideo(myClass, roomStream, false);
    }
  });
  room.on('data', ({ src, data }) => {
    myClass.setState({ textList: myClass.state.textList.concat(data.text) })
  });
}

function setUpSpeech(myClass: Main) {
  const speech = new webkitSpeechRecognition();
  speech.lang = 'ja-JP';

  speech.onsoundstart = function (e) {
    myClass.setState({ status: '認識中' });
  };

  speech.onnomatch = function () {
    myClass.setState({ status: 'もう一度試してください' });
  };

  speech.onerror = function (e) {
    myClass.setState({ status: 'エラー' }, function () {
      if (myClass.state.flagSpeech == false) {
        setUpSpeech(myClass);
      }
    });
  };

  speech.onsoundend = function (e) {
    myClass.setState({ status: '停止中' }, function () {
      setUpSpeech(myClass);
    });
  };

  speech.onresult = function (e) {
    for (var i = e.resultIndex; i < e.results.length; i++) {
      console.log(e.results);
      if (e.results[i].isFinal) {
        const text: string[] = [myClass.name + ':' + e.results[i][0].transcript];
        room.send({ text: text });
        myClass.setState({ textList: myClass.state.textList.concat(text) }, function () {
          setUpSpeech(myClass);
        });
      } else {
        myClass.setState({ flagSpeech: true });
      }
    }
  };

  myClass.setState({ flagSpeech: false }, function () {
    speech.start();
  });

}

setLocalStream();

