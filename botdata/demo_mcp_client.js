const { spawn } = require('child_process');
const path = require('path');

const cliPath = path.join(__dirname, 'playwright-mcp', 'cli.js');

const child = spawn('node', [cliPath, '--headless'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let buffer = '';

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop(); // keep last incomplete line

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line.trim());
      handleMessage(msg);
    } catch (e) {
      console.log('[RAW STDOUT]:', line);
    }
  }
});

function send(obj) {
  const json = JSON.stringify(obj);
  console.log('>>> SEND:', json);
  child.stdin.write(json + '\n');
}

function handleMessage(msg) {
  console.log('<<< RECV ID:', msg.id, msg.method || (msg.result ? 'RESULT' : ''));
  if (msg.id === 1) {
    // Initialized response
    console.log('Server Info:', msg.result.serverInfo);
    console.log('Protocol Version:', msg.result.protocolVersion);
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  } else if (msg.id === 2) {
    console.log('\n--- DANH SÁCH TOOLS TRONG PLAYWRIGHT MCP ---');
    for (const tool of msg.result.tools) {
      console.log(`- ${tool.name}: ${tool.description}`);
    }
    console.log(`Tổng cộng: ${msg.result.tools.length} công cụ.\n`);

    // Now test navigating to a website!
    console.log('Test điều hướng trình duyệt tới https://news.ycombinator.com qua MCP...');
    send({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'browser_navigate',
        arguments: { url: 'https://news.ycombinator.com' }
      }
    });
  } else if (msg.id === 3) {
    console.log('\n--- KẾT QUẢ ĐIỀU HƯỚNG BROWSER_NAVIGATE ---');
    console.log(JSON.stringify(msg.result, null, 2));
    
    // Take a screenshot
    console.log('\nTest chụp ảnh màn hình qua browser_take_screenshot...');
    send({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'browser_take_screenshot',
        arguments: {}
      }
    });
  } else if (msg.id === 4) {
    console.log('\n--- KẾT QUẢ CHỤP ẢNH MÀN HÌNH ---');
    if (msg.result && msg.result.content) {
      console.log('Đã chụp ảnh thành công! Số lượng content:', msg.result.content.length);
      for (const item of msg.result.content) {
        console.log(`Type: ${item.type}, text/data length: ${item.text ? item.text.length : (item.data ? item.data.length : 0)}`);
      }
    }
    child.kill();
    process.exit(0);
  }
}

// Start handshake
send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'antigravity-test-client', version: '1.0.0' }
  }
});
