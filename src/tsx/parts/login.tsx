import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Main} from 'tsx/parts/main';

export class Login extends React.Component<LoginProps> {

  state: LoginState;

  // 初期処理
  constructor(props: LoginProps) {
    super(props);
    this.state = {
      // ルームID
      roomId: props.roomId
      // 名前
      , name: ''
    };
    // バインドすることでthisを使用可能にする
    this.enter = this.enter.bind(this);
    this.changeRoomId = this.changeRoomId.bind(this);
    this.changeName = this.changeName.bind(this);
  }

  // 画面のレンダリング
  render() {
    return (
      <div id="login">
        <div id="room-id-box">
          <span className="label">ルームID：</span>
          <input type="text" value={this.state.roomId} onChange={this.changeRoomId} />
          </div>
        <div id="name-box">
          <span className="label">名前：</span>
          <input type="text" value={this.state.name} onChange={this.changeName} />
        </div>
        <div className="button" onClick={this.enter}>参加</div>
      </div>
    )
  }

  // 参加ボタンクリック
  enter() {
    // メイン画面へ遷移
    ReactDOM.render(<Main roomId={this.state.roomId} name={this.state.name} />, document.getElementById('root'));
  }

  // ルームIDの変更
  changeRoomId(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ roomId: event.target.value });
  }

  // 名前の変更
  changeName(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ name: event.target.value });
  }

}

type LoginProps = {
  roomId: string
}

type LoginState = {
  roomId: string;
  name: string;
}
