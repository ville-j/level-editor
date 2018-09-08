const Level = require("node-elma").Level;

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
  createPolygon(vertices, grass) {
    const uid = this.uuidv4();
    vertices.map(v => {
      v.id = this.uuidv4()
    });
    let p = {
      id: uid,
      grass: grass || false,
      vertices: vertices
    };
    this.level.polygons.push(p);

    if (this._connected) {
      this._socket.emit("createpolygon", p);
    }

    return p;
  }
  updateVertex(vertex, polygon, x, y) {
    vertex.x = x;
    vertex.y = y;
    if (this._connected) {
      this._socket.emit("updatevertex", {
        id: vertex.id,
        polygonId: polygon.id,
        x,
        y
      });
    }
  }
  createVertex(x, y, polygon, afterVertexId, direction) {
    const uid = this.uuidv4();
    let v = {
      id: uid,
      x: x,
      y: y
    };

    if (afterVertexId) {
      polygon.vertices.splice(this.findVertexIndex(afterVertexId, polygon) + direction, 0, v);
    } else {
      polygon.vertices.push(v);
    }

    if (this._connected) {
      this._socket.emit("createvertex", {
        id: uid,
        x,
        y,
        polygonId: polygon.id,
        afterVertexId,
        direction
      });
    }
    return v;
  }
  createObject(x, y, type, gravity, animation) {
    const uid = this.uuidv4();
    let o = {
      id: uid,
      x: x,
      y: y,
      type: type,
      gravity: gravity,
      animation: animation
    };
    this.level.objects.push(o);
    return o;
  }
  createPicture(name, texture, mask, x, y, distance, clip) {
    const uid = this.uuidv4();
    let p = {
      id: uid,
      name: name,
      texture: texture,
      mask: mask,
      x: x,
      y: y,
      distance: distance,
      clip: clip
    };
    this.level.pictures.push(p);
    return p;
  }
  deletePicture(id) {
    this.level.pictures.splice(this.findPictureIndex(id), 1);
  }
  deleteVertex(polygon, id) {
    polygon.vertices.splice(this.findVertexIndex(id, polygon), 1);

    if (this._connected)
      this._socket.emit("deletevertex", {
        id: id,
        polygonId: polygon.id
      });
  }
  deletePolygon(id) {
    this.level.polygons.splice(this.findPolygonIndex(id), 1);

    if (this._connected)
      this._socket.emit("deletepolygon", id);
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
    if (p < 0)
      throw ("polygon not found");

    return p;
  }
  findPicture(id) {
    let p = this.level.pictures.find(p => {
      return p.id === id;
    });
    if (!p)
      throw ("picture not found");

    return p;
  }
  findPictureIndex(id) {
    let p = this.level.pictures.findIndex(p => {
      return p.id === id;
    });
    if (p < 0)
      throw ("picture not found");

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
    if (v < 0)
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
    if (o < 0)
      throw ("object not found");

    return o;
  }
  /**
   * Generate uuid
   * https://stackoverflow.com/a/2117523
   */
  uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c == "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  exportLevel(path) {
    this.level.save(path);
  }
  connect(server) {
    const io = require("socket.io-client");
    this._socket = io(server);
    this._socket.on("connect", () => {
      this._connected = true;
    });
    this._socket.on("createvertex", (v) => {
      let polygon = this.findPolygon(v.polygonId);

      if (v.afterVertexId) {
        polygon.vertices.splice(this.findVertexIndex(v.afterVertexId, polygon) + v.direction, 0, v);
      } else {
        polygon.vertices.push(v);
      }
    });
    this._socket.on("createpolygon", (p) => {
      this.level.polygons.push(p);
    });
    this._socket.on("deletevertex", (v) => {
      let polygon = this.findPolygon(v.polygonId);
      polygon.vertices.splice(this.findVertexIndex(v.id, polygon), 1);
    });
    this._socket.on("updatevertex", (v) => {
      let vertex = this.findVertex(v.id, this.findPolygon(v.polygonId));
      vertex.x = v.x;
      vertex.y = v.y;
    });
    this._socket.on("deletepolygon", (p) => {
      this.level.polygons.splice(this.findPolygonIndex(p), 1);
    });
  }
}

module.exports = Editor