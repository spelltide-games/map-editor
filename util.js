function copyPopup(text) {
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.2)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 9999;

  // 创建弹窗容器
  const popup = document.createElement('div');
  popup.style.background = '#fff';
  popup.style.padding = '20px';
  popup.style.borderRadius = '8px';
  popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
  popup.style.textAlign = 'center';
  popup.innerHTML = `
      <input type="text" id="copyInput" style="width: 500px; padding: 8px;" readonly />
      <div style="margin-top: 10px;">
        <button id="copyBtn">Copy</button>
        <button id="closeBtn">Close</button>
      </div>
    `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // 自动选中文本
  const input = popup.querySelector('#copyInput');
  input.value = text;
  input.select();

  // 复制按钮事件
  popup.querySelector('#copyBtn').onclick = function () {
    input.select();
    input.setSelectionRange(0, 999999); // 兼容移动端
    document.execCommand('copy');
    document.body.removeChild(overlay);
  };

  // 关闭按钮事件
  popup.querySelector('#closeBtn').onclick = function () {
    document.body.removeChild(overlay);
  };
}


async function selectFileAndRead() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.lz4';

    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }

      const fileName = file.name.toLowerCase();
      const isJson = fileName.endsWith('.json');
      const isMpkLz4 = fileName.endsWith('.mpk.lz4');
      if (!isJson && !isMpkLz4) {
        alert("!isJson && !isMpkLz4")
        return;
      }

      const reader = new FileReader();
      reader.onload = event => {
        let res = event.target.result;
        if (isJson) {
          resolve(res);
        } else {
          // 否则发送到后端进行解压
          fetch(API_HOST + '/tools/json-decompress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream'
            },
            body: res,
          })
            .then(response => {
              return response.text();
            })
            .then(text => {
              resolve(text);
            })
            .catch(err => {
              reject(err);
            });
        }
      };
      reader.onerror = error => {
        reject(error);
      };

      if (isJson) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file)
      }
    }
    input.click();
  });
}

function downloadAsFile(content) {
  fetch(API_HOST + '/tools/json-compress', {
    method: 'POST',
    body: content,
  })
    .then(function (response) {
      return response.blob()
    })
    .then(function (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "data.mpk.lz4"
      a.style.display = 'none';
      a.click();
      URL.revokeObjectURL(url);
    })
}
