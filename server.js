const express = require('express');
const path = require('path');

const app = express();

// Sử dụng thư mục build của Jitsi Meet để phục vụ tài nguyên tĩnh
app.use(express.static(path.join(__dirname, 'build')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

// Đặt cổng mặc định cho máy chủ HTTP
const port = process.env.PORT || 8443;

// Tạo máy chủ HTTP
const server = app.listen(port, () => {
  console.log(`Máy chủ HTTP đang chạy tại cổng ${port}`);
});
