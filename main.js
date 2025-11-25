const tilemapAll = document.getElementById("tilemapAll");
const tilemapContainer = document.getElementById("tilemapContainer");
const tileSelector = document.getElementById("tileSelector");
const createMapBtn = document.getElementById("createMap");
const configMapBtn = document.getElementById("configMap");
const clearMapBtn = document.getElementById("clearMap");
const draftMapBtn = document.getElementById("draftMap");
const importMapBtn = document.getElementById("importMap");
const exportMapBtn = document.getElementById("exportMap");
const mapWidthInput = document.getElementById("mapWidth");
const scaleSlider = document.getElementById("scaleSlider");
const mapHeightInput = document.getElementById("mapHeight");

const layers = ["t_water", "t_ground", "t_floor", "t_plant", "t_block"];

function createTilemap(width, height) {
  const oldTileMap = tilemap;
  tilemap = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const cell = {
        t_water: AllTiles[0],
        t_ground: AllTiles[0],
        t_floor: AllTiles[0],
        t_plant: AllTiles[0],
        t_block: AllTiles[0],
      };
      row.push(cell);
    }
    tilemap.push(row);
  }
  // 迁移旧数据
  if (oldTileMap !== null) {
    const oldWidth = oldTileMap[0].length;
    const oldHeight = oldTileMap.length;
    const minWidth = Math.min(width, oldWidth);
    const minHeight = Math.min(height, oldHeight);
    for (let y = 0; y < minHeight; y++) {
      for (let x = 0; x < minWidth; x++) {
        tilemap[y][x] = oldTileMap[y][x];
      }
    }
  }
  renderTilemap();
}

function importTilemap(data) {
  const width = data.width;
  const height = data.height;
  config = data.config || { actors: {} };
  tilemap = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const cell = {
        t_water: data.t_water === undefined ? AllTiles[0] : AllTiles[data.t_water[y][x]],
        t_ground: AllTiles[data.t_ground[y][x]] || AllTiles[0],
        t_floor: AllTiles[data.t_floor[y][x]] || AllTiles[0],
        t_plant: AllTiles[data.t_plant[y][x]] || AllTiles[0],
        t_block: AllTiles[data.t_block[y][x]] || AllTiles[0],
      };
      row.push(cell);
    }
    tilemap.push(row);
  }
  // 更新width和height
  mapWidthInput.value = width;
  mapHeightInput.value = height;
  renderTilemap();
}

function exportTilemap() {
  const width = tilemap[0].length;
  const height = tilemap.length;
  return {
    width: width,
    height: height,
    t_water: tilemap.map(row => row.map(cell => cell.t_water.id)),
    t_ground: tilemap.map(row => row.map(cell => cell.t_ground.id)),
    t_floor: tilemap.map(row => row.map(cell => cell.t_floor.id)),
    t_plant: tilemap.map(row => row.map(cell => cell.t_plant.id)),
    t_block: tilemap.map(row => row.map(cell => cell.t_block.id)),
    config: config,
  }
}

function updateTileDiv(cell, mode, tileDiv) {
  const topTile = mode === "all" ? getTopTile(cell) : cell[mode];
  tileDiv.textContent = topTile.char;

  const actorKey = `${tileDiv.dataset.x},${tileDiv.dataset.y}`;
  if (config.actors[actorKey] && mode === "all") {
    tileDiv.textContent = "⭕";
  }
  
  tileDiv.style.backgroundColor = mode === "all" ? blendCellColor(cell) : (
    topTile.bg === null ? "transparent" : removeAlpha(topTile.bg)
  );
  if (topTile.fg) {
    tileDiv.style.color = `rgb(${topTile.fg.r},${topTile.fg.g},${topTile.fg.b})`;
  } else {
    tileDiv.style.color = "white";
  }
}

function paintCellAndUpdateTileDiv(cell, mode, tileDiv) {
  if (selectedTile.is_void()) {
    if (mode === "all") {
      for (const layer of layers) {
        cell[layer] = AllTiles[0];
      }
    } else {
      cell[mode] = AllTiles[0];
    }
  } else {
    if (selectedTile.layer !== mode && mode !== "all") {
      alert("Cannot place tile: '" + selectedTile.layer + "' != '" + mode + "'");
      return false;
    }
    cell[selectedTile.layer] = selectedTile;
  }
  // 重绘tileDiv
  updateTileDiv(cell, mode, tileDiv);
  return true;
}

function floodfill(x, y, filterFunc, paintFunc) {
  const width = tilemap[0].length;
  const height = tilemap.length;
  const stack = [];
  stack.push({ x, y });
  const visited = new Set();
  while (stack.length > 0) {
    const { x, y } = stack.pop();
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (!filterFunc(x, y)) continue;
    if (!paintFunc(x, y)) break;
    stack.push({ x: x + 1, y: y });
    stack.push({ x: x - 1, y: y });
    stack.push({ x: x, y: y + 1 });
    stack.push({ x: x, y: y - 1 });
  }
}

function renderTilemap() {
  const mode = document.querySelector('input[name="renderMode"]:checked').value;
  const overlayDiv = document.getElementById("actorOverlay");
  overlayDiv.innerHTML = "";
  const xTicks = document.getElementById("xTicks");
  const yTicks = document.getElementById("yTicks");
  xTicks.innerHTML = "";
  yTicks.innerHTML = "";
  const width = tilemap[0].length;
  const height = tilemap.length;
  tilemapContainer.style.gridTemplateColumns = `repeat(${width}, 24px)`;
  tilemapContainer.innerHTML = "";
  for (let x = 0; x < width; x++) {
    const tick = document.createElement("div");
    tick.style.width = "24px";
    tick.style.height = "16px";
    tick.style.color = "black";
    tick.style.fontSize = "12px";
    tick.style.textAlign = "center";
    tick.textContent = x;
    xTicks.appendChild(tick);
  }

  // yTicks append a space height the same as xTicks
  yTicks.appendChild(document.createElement("div")).style.height = "16px";
  for (let y = 0; y < height; y++) {
    const yTick = document.createElement("div");
    yTick.style.height = "24px";
    yTick.style.width = "16px";
    yTick.style.color = "black";
    yTick.style.fontSize = "12px";
    yTick.style.textAlign = "right";
    // center vertically and right align
    yTick.style.display = "flex";
    yTick.style.alignItems = "center";
    yTick.style.justifyContent = "flex-end";
    // add some padding to the right
    yTick.style.paddingRight = "4px";
    yTick.textContent = y;
    yTicks.appendChild(yTick);

    for (let x = 0; x < width; x++) {
      const cell = tilemap[y][x];
      const tileDiv = document.createElement("div");
      tileDiv.className = "tile";
      tileDiv.id = `tile-${x}-${y}`;
      tileDiv.dataset.x = x;
      tileDiv.dataset.y = y;
      tileDiv.title = `(${x}, ${y})`;
      tilemapContainer.appendChild(tileDiv);

      updateTileDiv(cell, mode, tileDiv);

      if (mode === "all") {
        const actorKey = `${x},${y}`;
        if (config.actors[actorKey]) {
          const label = document.createElement("div");
          label.textContent = config.actors[actorKey];
          label.style.position = "absolute";
          label.style.left = `${x * 24 - 12}px`;
          label.style.top = `${y * 24 - 12 - 3}px`;
          label.style.width = "24px";
          label.style.textAlign = "center";
          label.style.fontSize = "14px";
          label.style.color = "white";
          overlayDiv.appendChild(label);
        }
      }

      tileDiv.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });

      tileDiv.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
          const ok = paintCellAndUpdateTileDiv(cell, mode, e.currentTarget);
          isPainting = ok;
          return;
        }

        if (e.button === 2) {
          isPainting = false;

          const paintFunc = (fx, fy) => {
            const fcell = tilemap[fy][fx];
            const fdiv = document.getElementById(`tile-${fx}-${fy}`);
            return paintCellAndUpdateTileDiv(fcell, mode, fdiv);
          };

          if (mode === "all") {
            floodfill(x, y,
              (fx, fy) => {
                const fcell = tilemap[fy][fx];
                const actorKey = `${fx},${fy}`;
                for (const layer of layers) {
                  if (!fcell[layer].is_void()) {
                    return false;
                  }
                  if (config.actors[actorKey]) {
                    return false;
                  }
                }
                return true;
              },
              paintFunc,
            );
          } else {
            const cellModeId = cell[mode].id;
            floodfill(x, y,
              (fx, fy) => {
                const fcell = tilemap[fy][fx];
                const actorKey = `${fx},${fy}`;
                if (config.actors[actorKey]) {
                  return false;
                }
                return fcell[mode].id === cellModeId;
              },
              paintFunc,
            );
          }
          return;
        }
      });

      tileDiv.addEventListener("mouseup", () => {
        isPainting = false;
      });

      tileDiv.addEventListener("mouseenter", (e) => {
        if (!isPainting) return;
        const ok = paintCellAndUpdateTileDiv(cell, mode, e.currentTarget);
        isPainting = ok;
      });
    }
  }
}

function getTopTile(cell) {
  for (let i = layers.length - 1; i >= 0; i--) {
    const tile = cell[layers[i]];
    if (!tile.is_void()) return tile;
  }
  return AllTiles[0];
}

function blendColor(src, dst_or_null) {
  if (dst_or_null === null) return src;
  const dst = dst_or_null;
  const alpha = src.a / 255.0;
  const r = Math.round(src.r * alpha + dst.r * (1 - alpha));
  const g = Math.round(src.g * alpha + dst.g * (1 - alpha));
  const b = Math.round(src.b * alpha + dst.b * (1 - alpha));
  const a = Math.round((src.a + dst.a * (1 - alpha)));
  return { r, g, b, a };
}

function removeAlpha(dst) {
  const alpha = dst.a / 255.0;
  let r = Math.round(dst.r * alpha);
  let g = Math.round(dst.g * alpha);
  let b = Math.round(dst.b * alpha);
  return `rgb(${r},${g},${b})`;
}

function blendCellColor(cell) {
  let dst = null;
  for (const layer of layers) {
    const tile = cell[layer];
    if (tile.bg === null) continue;
    dst = blendColor(tile.bg, dst);
  }
  if (dst === null) return "transparent";
  return removeAlpha(dst);
}

function renderTileSelector() {
  for (const id in AllTiles) {
    const tile = AllTiles[id];
    // if (!tile.layer) continue;
    const btn = document.createElement("div");
    btn.style.width = "20px";
    btn.style.height = "24px";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";

    btn.className = "tile-option";
    btn.textContent = tile.char;
    if (tile.fg) {
      btn.style.color = `rgb(${tile.fg.r},${tile.fg.g},${tile.fg.b})`;
    }
    if (tile.bg) {
      btn.style.backgroundColor = `rgba(${tile.bg.r},${tile.bg.g},${tile.bg.b},${tile.bg.a})`;
    }
    btn.title = `${tile.name} #${tile.id}`;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tile-option").forEach(el => el.classList.remove("selected"));
      btn.classList.add("selected");
      selectedTile = tile;
    });
    tileSelector.appendChild(btn);
  }
}

let tilemap = null;
let config = { actors: {} };

let selectedTile = null;
let isPainting = false;
let AllTiles = null;

initTiles().then((loadedTiles) => {
  console.log(`已加载 ${Object.keys(loadedTiles).length} 种图块。`);
  AllTiles = loadedTiles;
  selectedTile = AllTiles[1];

  document.addEventListener("mouseup", () => {
    isPainting = false;
  });

  createMapBtn.addEventListener("click", () => {
    const width = parseInt(mapWidthInput.value);
    const height = parseInt(mapHeightInput.value);
    createTilemap(width, height);
  });

  configMapBtn.addEventListener("click", () => {
    // make a popup and open a textarea to edit config as json
    const text = JSON.stringify(config, null, 2);
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

    const popup = document.createElement('div');
    popup.style.background = '#fff';
    popup.style.padding = '20px';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    popup.style.textAlign = 'center';
    popup.innerHTML = `
      <textarea id="configTextarea" style="width: 600px; height: 400px; padding: 8px;">${text}</textarea>
      <div style="margin-top: 10px;">
        <button id="saveConfigBtn">Save</button>
        <button id="closeConfigBtn">Close</button>
      </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    popup.querySelector('#saveConfigBtn').onclick = function () {
      const textarea = popup.querySelector('#configTextarea');
      try {
        config = JSON.parse(textarea.value);
        document.body.removeChild(overlay);
        renderTilemap();
      } catch (e) {
        alert("Invalid JSON: " + e.message);
      }
    };

    popup.querySelector('#closeConfigBtn').onclick = function () {
      document.body.removeChild(overlay);
    };
  });

  clearMapBtn.addEventListener("click", () => {
    tilemap = null;
    config.actors = {};
    createTilemap(parseInt(mapWidthInput.value), parseInt(mapHeightInput.value));
  });

  draftMapBtn.addEventListener("click", () => {
    const data = exportTilemap();
    localStorage.setItem('draft', JSON.stringify(data));
    alert("Draft saved!");
  });

  importMapBtn.addEventListener("click", async () => {
    // const data = prompt("Paste tilemap JSON data:");
    const data = await selectFileAndRead();
    if (data) {
      const obj = JSON.parse(data);
      importTilemap(obj);
    }
  });

  exportMapBtn.addEventListener("click", () => {
    const data = exportTilemap();
    // copyPopup(JSON.stringify(data));
    downloadAsFile(JSON.stringify(data));
  });

  document.querySelectorAll('input[name="renderMode"]').forEach(radio => {
    radio.addEventListener("change", () => {
      isPainting = false;
      renderTilemap();
    });
  });

  scaleSlider.addEventListener("input", () => {
    const scale = parseInt(scaleSlider.value) / 100;
    tilemapAll.style.transform = `scale(${scale})`;
  });

  document.addEventListener('keydown', function (event) {
    const mapping = {
      'w': { dx: 0, dy: -1 },
      'a': { dx: -1, dy: 0 },
      's': { dx: 0, dy: 1 },
      'd': { dx: 1, dy: 0 },
    };
    mapping['W'] = mapping['w'];
    mapping['A'] = mapping['a'];
    mapping['S'] = mapping['s'];
    mapping['D'] = mapping['d'];
    mapping['ArrowUp'] = mapping['w'];
    mapping['ArrowLeft'] = mapping['a'];
    mapping['ArrowDown'] = mapping['s'];
    mapping['ArrowRight'] = mapping['d'];

    const delta = mapping[event.key];
    if (event.ctrlKey && delta) {
      event.preventDefault();
      // 移动所有tile，超出边界舍弃
      const width = tilemap[0].length;
      const height = tilemap.length;
      const newTilemap = [];
      for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
          const srcX = x - delta.dx;
          const srcY = y - delta.dy;
          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            row.push(tilemap[srcY][srcX]);
          } else {
            // out of bound, use void tile
            const cell = {
              t_water: AllTiles[0],
              t_ground: AllTiles[0],
              t_floor: AllTiles[0],
              t_plant: AllTiles[0],
              t_block: AllTiles[0],
            };
            row.push(cell);
          }
        }
        newTilemap.push(row);
      }
      tilemap = newTilemap;
      renderTilemap();
    }
  });

  renderTileSelector();

  // check draft
  const draft = localStorage.getItem('draft');
  if (draft !== null) {
    importTilemap(JSON.parse(draft));
  } else {
    createTilemap(parseInt(mapWidthInput.value), parseInt(mapHeightInput.value));
  }
});
