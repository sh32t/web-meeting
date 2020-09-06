import express from 'express';
import path from 'path';
import root from 'app-root-path';

const app:express.Express = express();

// publicフォルダ配下を公開する。
app.use('/web-meeting', express.static(path.join(root.path, '/public')));

app.get('/web-meeting', function (req:express.Request, res:express.Response) {
    res.sendFile(path.join(root.path, 'public', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port || 8080, function () {  
    console.log('Server started on port ' + port);
});