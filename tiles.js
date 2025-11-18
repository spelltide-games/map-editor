class Tile {
    constructor(id, layer, name, char, fg, bg, tags, is_walkable) {
        this.id = id;
        this.layer = layer;
        this.name = name;
        this.char = char;
        this.fg = fg;
        this.bg = bg;
        this.tags = tags;
        this.is_walkable = is_walkable;
    }

    is_void() {
        return this.id === 0;
    }
}

function hexToRgba(hex) {
    if (hex === null || hex === undefined || hex === "") {
        return null;
    }
    // #RRGGBB or #RRGGBBAA
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }
    if (hex.length !== 6 && hex.length !== 8) {
        throw new Error(`Invalid hex color: ${hex}`);
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;
    return { r, g, b, a };
}


async function initTiles() {
    const AllTiles = {0: new Tile(0, "", "无", "　", "", null, [], false)};

    const rawTileTableData = await queryGrist('select * from tile');
    for (const row of rawTileTableData.records) {
        const id = row.fields['id2'];
        const layer = row.fields['layer'];
        const name = row.fields['name'];
        const char = row.fields['char'];
        const fg = hexToRgba(row.fields['fg']);
        const bg = hexToRgba(row.fields['bg']);
        const tags = row.fields['tags'] ? row.fields['tags'].split(',').map(s => s.trim()) : [];
        const is_walkable = row.fields['is_walkable'] === 1;
        AllTiles[id] = new Tile(id, layer, name, char, fg, bg, tags, is_walkable);
    }
    return AllTiles;
}

