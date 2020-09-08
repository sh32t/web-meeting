import * as React from 'react';
import Peer, { SfuRoom, RoomStream } from 'skyway-js';

export class Main extends React.Component<MainProps> {

  MAX_CONNECTION_COUNT = 8;

  state: MainState

  localStream: SkyWayMediaStream = new MediaStream() as SkyWayMediaStream;
  localDisplayStream: SkyWayMediaStream = new MediaStream() as SkyWayMediaStream;
  peer: Peer | null = null;
  displayPeer: Peer | null = null;
  room: SfuRoom | null = null;
  displayRoom: SfuRoom | null = null;

  // 初回処理
  constructor(props: MainProps) {
    super(props);
    this.state = {
      videoList: []
      , textList: []
      , isSpeech: false
      , speechStatus: '停止中'
      , startButton: '開始'
      , microphoneButton: 'マイクOFF'
      , cameraButton: 'カメラOFF'
      , shareDisplayButton: '画面共有ON'
    }
    // 自端末のストリームをセット
    this.setLocalStream();
    // バインドすることでthisを使用可能にする
    this.switchRoom = this.switchRoom.bind(this);
    this.switchMicrophone = this.switchMicrophone.bind(this);
    this.switchCamera = this.switchCamera.bind(this);
    this.switchShareDisplay = this.switchShareDisplay.bind(this);
    this.setLocalStream = this.setLocalStream.bind(this);
    this.setVideo = this.setVideo.bind(this);
    this.setUpRoom = this.setUpRoom.bind(this);
    this.setUpSpeech = this.setUpSpeech.bind(this);
  }

  render() {

    // thisをコールバック関数で使用するための処理
    const myClass = this;

    // ビデオリストの描画
    const videoList = myClass.state.videoList.map(function (video, index) {
      return (
        <video id={video.id} key={index} className="video-contents" autoPlay playsInline onClick={myClass.switchDisplayAll}></video>
      );
    })

    // 議事録テキストの描画
    const textList = myClass.state.textList.map(function (text, index) {
      return (
        <div key={index} >{text}</div>
      );
    })

    // 全体の描画
    return (
      <div id="main">
        <div id="video-box">{videoList}</div>
        <div id="minutes-box">
          <div id="title">議事録</div>
          <div id="status">{myClass.state.speechStatus}</div>
          <div id="text">
            {textList}
          </div>
        </div>
        <div id="menu-box">
          <div className="button" onClick={myClass.switchRoom}>{myClass.state.startButton}</div>
          <div className="button" onClick={myClass.switchMicrophone}>{myClass.state.microphoneButton}</div>
          <div className="button" onClick={myClass.switchCamera}>{myClass.state.cameraButton}</div>
          <div className="button" onClick={myClass.switchShareDisplay}>{myClass.state.shareDisplayButton}</div>
        </div>
      </div>
    )
  }

  // 入退室の切り替え
  switchRoom() {

    const myClass = this;

    if (myClass.state.startButton == '終了') {

      myClass.room?.close();
      myClass.setState({ videoList: [] });

      // 画面共有している場合は、画面共有も接続を切る
      if (myClass.state.shareDisplayButton == '画面共有OFF') {

        myClass.setState({ startButton: '開始', shareDisplayButton: '画面共有ON' });
        myClass.displayRoom?.close();
        myClass.localDisplayStream.getVideoTracks()[0].stop();

      } else {

        myClass.setState({ startButton: '開始' });

      }


    } else {

      myClass.setState({ startButton: '終了' });

      // ルーム接続機能を操作するためのオブジェクトを取得
      myClass.peer = new Peer({ key: 'f9e9b17f-474a-4576-a93a-c86f6453314e' });

      myClass.peer.on('open', function () {

        // PeerIDを設定、要素のIDとなる
        if (myClass.peer != null) {
          myClass.localStream.peerId = myClass.peer?.id;
          console.log('My Peer ID:' + myClass.peer?.id);
        }

        // 自分のビデオはミュート
        const isMute = true;
        myClass.setVideo(myClass.localStream, isMute);

        // ルームのセットアップ
        myClass.setUpRoom();

        // 音声認識のセットアップ
        myClass.setUpSpeech();
      });

    }
  };
  // マイクのON・OFF切り替え
  switchMicrophone() {
    if (this.localStream.getAudioTracks()[0].enabled) {
      this.setState({ microphoneButton: 'マイクON' });
      this.localStream.getAudioTracks()[0].enabled = false;
    } else {
      this.setState({ microphoneButton: 'マイクOFF' });
      this.localStream.getAudioTracks()[0].enabled = true;
    }
  }
  // カメラのON・OFF切り替え
  switchCamera() {
    if (this.localStream.getVideoTracks()[0].enabled) {
      this.setState({ cameraButton: 'カメラON' });
      this.localStream.getVideoTracks()[0].enabled = false;
    } else {
      this.setState({ cameraButton: 'カメラOFF' });
      this.localStream.getVideoTracks()[0].enabled = true;
    }
  }
  // 画面共有のON・OFF切り替え
  switchShareDisplay() {

    const myClass = this;

    if (myClass.state.shareDisplayButton == '画面共有OFF') {

      myClass.setState({ shareDisplayButton: '画面共有ON' });
      myClass.displayRoom?.close();
      myClass.localDisplayStream.getVideoTracks()[0].stop();

    } else {

      myClass.setState({ shareDisplayButton: '画面共有OFF' });

      myClass.displayPeer = new Peer({ key: 'f9e9b17f-474a-4576-a93a-c86f6453314e' });

      myClass.displayPeer.on('open', function () {
        // ディスプレイにアクセス
        const mediaDev = navigator.mediaDevices as any;
        mediaDev.getDisplayMedia().then(
          function (displayStream: SkyWayMediaStream) {

            // ローカルディスプレイを保持
            myClass.localDisplayStream = displayStream;
            if (myClass.room != null && myClass.displayPeer != null) {
              myClass.localDisplayStream.peerId = myClass.displayPeer.id;
              myClass.displayRoom = myClass.displayPeer.joinRoom(
                myClass.props.roomId, { mode: 'sfu', stream: myClass.localDisplayStream }
              ) as SfuRoom;
            }

            // 共有終了時の処理
            myClass.localDisplayStream.getVideoTracks()[0].onended = function (event: Event) {
              myClass.switchShareDisplay();
            };

          }
        );
      });

    }

  };
  // 全表示のON・OFF切り替え
  switchDisplayAll(event: React.MouseEvent<HTMLVideoElement, MouseEvent>) {
    event.currentTarget.classList.toggle('maxview');
  };

  // ローカルストリームのセット
  setLocalStream() {
    let myClass = this;
    // カメラやマイクにアクセス
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(
      function (stream: MediaStream) {
        // ローカルストリームからマイクやカメラのON・OFFを制御するためにオブジェクトを保持する
        myClass.localStream = stream as SkyWayMediaStream;
      }
    ).catch(error => {
      console.error('mediaDevice.getUserMedia() error:', error);
    });
  }

  // ビデオを画面に追加
  setVideo(stream: SkyWayMediaStream, isMute: boolean) {
    const myClass = this;
    const video: Video = {
      id: stream.peerId
      , stream: stream
    };
    // videoタグを追加
    myClass.setState({ videoList: myClass.state.videoList.concat([video]) }, function () {
      console.log(stream.peerId + ' set');
      // レンダリング終了後にDOMを取得する
      const videoElement = document.getElementById(stream.peerId);
      if (videoElement instanceof HTMLVideoElement) {
        videoElement.srcObject = stream;
        videoElement.muted = isMute;
        videoElement.play();
      }
    });
  }

  // ルームのイベント処理を記述
  setUpRoom() {

    const myClass = this;
    const peer = myClass.peer;

    // ルーム作成
    myClass.room = peer?.joinRoom(myClass.props.roomId, { mode: 'sfu', stream: myClass.localStream }) as SfuRoom;

    if (myClass.room != null) {

      // ルームの開始イベント
      myClass.room.on('open', function () {
        console.log(myClass.props.roomId + ' open');
      });
      // ルームの終了イベント
      myClass.room.on('close', function () {
        console.log(myClass.props.roomId + ' close');
      });
      // メンバーの入室イベント
      myClass.room.on('peerJoin', function (peerId) {
        console.log(peerId + ' join');
      });
      // メンバーの退室イベント
      myClass.room.on('peerLeave', function (peerId) {
        console.log(peerId + ' leave');

        // 指定されたIDを除外して配列を作り直す
        const newVideoList = myClass.state.videoList.filter(function (video) {
          if (peerId == video.id) {
            return video;
          }
        });

        // ビデオリストを更新
        myClass.setState({ videoList: newVideoList });

      });
      // 動画や音声データの受信イベント
      myClass.room.on('stream', function (roomStream) {
        //　レイアウトの都合で8台以上はビデオを追加しない
        if (myClass.state.videoList.length < myClass.MAX_CONNECTION_COUNT) {
          // 他人の音声はミュートしない
          const isMute = false;
          myClass.setVideo(roomStream, isMute);
        }
      });
      // データの受信イベント
      myClass.room.on('data', function ({ src, data }) {
        // 発言を受け取って議事録に書き込む
        myClass.setState({ textList: myClass.state.textList.concat(data.text) })
      });

    }

  }

  // 議事録作成のセットアップ
  setUpSpeech() {
    const myClass = this;
    const speech = new webkitSpeechRecognition();
    // 日本語を認識させる
    speech.lang = 'ja-JP';

    // 音声認識にイベント
    speech.onsoundstart = function () {
      myClass.setState({ speechStatus: '認識中' });
    };

    // 認識できない音声のイベント
    speech.onnomatch = function () {
      myClass.setState({ speechStatus: 'もう一度試してください' });
    };

    // エラーイベント
    speech.onerror = function () {
      myClass.setState({ speechStatus: 'エラー' }, function () {
        if (myClass.state.isSpeech == false) {
          myClass.setUpSpeech();
        }
      });
    };

    // 音声が止まった時のイベント
    speech.onsoundend = function () {
      myClass.setState({ speechStatus: '停止中' }, function () {
        myClass.setUpSpeech();
      });
    };

    // 音声解析終了時のイベント
    speech.onresult = function (event: SpeechRecognitionEvent) {
      for (var i = event.resultIndex; i < event.results.length; i++) {
        // 最後の解析結果を判定
        if (event.results[i].isFinal) {
          // [名前]：[発言]
          const text: string[] = [myClass.props.name + ':' + event.results[i][0].transcript];
          // データとしてルームの参加者へ送信する
          myClass.room?.send({ text: text });
          // 自分の議事録に追記する
          myClass.setState({ textList: myClass.state.textList.concat(text) }, function () {
            myClass.setUpSpeech();
          });
        } else {
          myClass.setState({ isSpeech: true });
        }
      }
    };

    myClass.setState({ isSpeech: false }, function () {
      speech.start();
    });

  }

}

type MainProps = {
  roomId: string
  name: string;
}

type MainState = {
  videoList: Video[];
  textList: string[];
  speechStatus: string;
  isSpeech: boolean;
  startButton: string;
  microphoneButton: string;
  cameraButton: string;
  shareDisplayButton: string;
}

type Video = {
  id: string;
  stream: RoomStream | MediaStream;
}

interface SkyWayMediaStream extends MediaStream {
  peerId: string
}

