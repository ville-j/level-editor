const Level = require("node-elma").Level;
const util = require("util");

class Editor {
  newLevel() {
    this.initLevel(new Level());
  }
  loadLevel(path) {
    return Level.load(path).then(level => {
      this.initLevel(level);
    });
  }
  initLevel(level) {
    level.polygons.map(p => {
      p.id = this.uuidv4();
      p.vertices.map(v => {
        v.id = this.uuidv4();
      });
    });
    level.objects.map(o => {
      o.id = this.uuidv4();
    });
    this.level = level;
  }
  setLgr(filename) {
    this.level.lgr = filename;
  }
  setGround(textureName) {
    this.level.ground = textureName;
  }
  setSky(textureName) {
    this.level.sky = textureName;
  }
  setName(name) {
    this.level.name = name;
  }
  createPolygon(x, y, grass) {
    const uid = this.uuidv4();
    this.level.polygons.push({
      id: uid,
      grass: grass || false,
      vertices: [{
        id: this.uuidv4(),
        x: x,
        y: y
      }]
    });
    return uid;
  }
  createVertex(x, y, polygon, pos) {
    if (!this.level.polygons[polygon])
      throw "polygon not found";

    const uid = this.uuidv4();

    if (pos >= 0) {
      this.level.polygons[polygon].vertices.splice(pos, 0, {
        id: uid,
        x: x,
        y: y
      });
    } else {
      this.level.polygons[polygon].vertices.push({
        id: uid,
        x: x,
        y: y
      });
    }

    return uid;
  }
  createObject(x, y, type, gravity, animation) {
    const uid = this.uuidv4();
    this.level.objects.push({
      id: uid,
      x: x,
      y: y,
      type: type,
      gravity: gravity,
      animation: animation
    });
    return uid;
  }
  deleteVertex(polygon, pos) {
    if (!this.level.polygons[polygon])
      throw "polygon not found";

    if (!this.level.polygons[polygon].vertices[pos])
      throw "polygon not found";

    this.level.polygons[polygon].vertices.splice(pos, 1);
  }
  deletePolygon(id) {
    this.level.polygons.splice(this.findPolygonIndex(id), 1);
  }
  deleteObject(id) {
    this.level.objects.splice(this.findObjectIndex(id), 1);
  }
  findPolygon(id) {
    let p = this.level.polygons.find(p => {
      return p.id === id;
    });
    if (!p)
      throw ("polygon not found");

    return p;
  }
  findPolygonIndex(id) {
    let p = this.level.polygons.findIndex(p => {
      return p.id === id;
    });
    if (!p)
      throw ("polygon not found");

    return p;
  }
  findVertex(id, polygon) {
    let v = polygon.vertices.find(v => {
      return v.id === id;
    });
    if (!v)
      throw ("vertex not found");

    return v;
  }
  findVertexIndex(id, polygon) {
    let v = polygon.vertices.findIndex(v => {
      return v.id === id;
    });
    if (!v)
      throw ("vertex not found");

    return v;
  }
  findObject(id) {
    let o = this.level.objects.find(o => {
      return o.id === id;
    });
    if (!o)
      throw ("object not found");

    return o;
  }
  findObjectIndex(id) {
    let o = this.level.objects.findIndex(o => {
      return o.id === id;
    });
    if (!o)
      throw ("object not found");

    return o;
  }
  /**
   * Generate uuid
   * https://stackoverflow.com/a/2117523
   */
  uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  log() {
    console.log(util.inspect(this.level, false, null))
  }
  exportLevel(path) {
    this.level.save(path);
  }
}

let editor = new Editor();
editor.loadLevel("test.lev").then(() => {
  editor.log();
  let p = editor.createPolygon(3, 2, 1);
  editor.log();
  editor.deletePolygon(p);
  editor.log();
});