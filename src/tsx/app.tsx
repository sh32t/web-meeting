import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Query from 'query-string';
import { Login } from 'tsx/parts/login';

// URLからルームIDを取得
const url = location.href;
const wmUrl = Query.parseUrl(url);
let roomId: string = '';
if (typeof wmUrl.query.roomId == 'string') {
  roomId = wmUrl.query.roomId;
}

// URLにルームIDが指定されている⇒ゲスト
// URLにルームIDが指定されていない⇒オーナー
ReactDOM.render(<Login roomId={roomId} />, document.getElementById('root'));

