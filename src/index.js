const Level = require("../lib/node-elma").Level;

class LevelEditor {
  constructor() {
    this.serverRooms = [];
  }
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
      v.id = this.uuidv4();
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
  updateObject(obj, x, y) {
    obj.x = x;
    obj.y = y;
    if (this._connected) {
      this._socket.emit("updateobject", {
        id: obj.id,
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
      polygon.vertices.splice(
        this.findVertexIndex(afterVertexId, polygon) + direction,
        0,
        v
      );
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

    if (this._connected) {
      this._socket.emit("createobject", o);
    }
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

    if (this._connected) this._socket.emit("deletepolygon", id);
  }
  deleteObject(id) {
    this.level.objects.splice(this.findObjectIndex(id), 1);

    if (this._connected) this._socket.emit("deleteobject", id);
  }
  findPolygon(id) {
    let p = this.level.polygons.find(p => {
      return p.id === id;
    });
    if (!p) throw "polygon not found";

    return p;
  }
  findPolygonIndex(id) {
    let p = this.level.polygons.findIndex(p => {
      return p.id === id;
    });
    if (p < 0) throw "polygon not found";

    return p;
  }
  findPicture(id) {
    let p = this.level.pictures.find(p => {
      return p.id === id;
    });
    if (!p) throw "picture not found";

    return p;
  }
  findPictureIndex(id) {
    let p = this.level.pictures.findIndex(p => {
      return p.id === id;
    });
    if (p < 0) throw "picture not found";

    return p;
  }
  findVertex(id, polygon) {
    let v = polygon.vertices.find(v => {
      return v.id === id;
    });
    if (!v) throw "vertex not found";

    return v;
  }
  findVertexIndex(id, polygon) {
    let v = polygon.vertices.findIndex(v => {
      return v.id === id;
    });
    if (v < 0) throw "vertex not found";

    return v;
  }
  findObject(id) {
    let o = this.level.objects.find(o => {
      return o.id === id;
    });
    if (!o) throw "object not found";

    return o;
  }
  findObjectIndex(id) {
    let o = this.level.objects.findIndex(o => {
      return o.id === id;
    });
    if (o < 0) throw "object not found";

    return o;
  }
  /**
   * Generate uuid
   * https://stackoverflow.com/a/2117523
   */
  uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  pointInPolygon(x, y, vertices) {
    let inside = false;
    for (var i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      var xi = vertices[i].x,
        yi = vertices[i].y;
      var xj = vertices[j].x,
        yj = vertices[j].y;

      var intersect =
        yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }
  isPolygonClockwise(polygon) {
    let sum = 0;
    for (let i = 0; i < polygon.vertices.length; i++) {
      let current = polygon.vertices[i];
      let next =
        polygon.vertices[i + 1 === polygon.vertices.length ? 0 : i + 1];
      sum += (next.x - current.x) * (next.y + current.y);
    }
    return sum > 0;
  }
  shouldPolygonBeGround(polygon) {
    let i = 0;
    this.level.polygons.map(pp => {
      if (pp.id !== polygon.id) {
        if (
          this.pointInPolygon(
            polygon.vertices[0].x,
            polygon.vertices[0].y,
            pp.vertices
          )
        )
          i++;
      }
    });
    return i % 2 !== 0;
  }
  exportLevel(path) {
    this.level.save(path);
  }
  createBinary() {
    let l = new Level();
    l.objects = this.level.objects;
    l.polygons = this.level.polygons.map(p => {
      let pol = { ...p };
      if (this.shouldPolygonBeGround(p) !== this.isPolygonClockwise(p)) {
        pol.vertices = pol.vertices.slice(0).reverse();
      }
      return pol;
    });
    return l.toBuffer();
  }
  joinRoom(name, password) {
    if (!this._connected) throw "client is not connected to a server";
    this._socket.emit("joinroom", { name: name, password: password });
  }
  connect(server) {
    const io = require("socket.io-client");
    this._socket = io(server);
    this.onConnectionStatusChange &&
      this.onConnectionStatusChange("connecting");
    this._socket.on("reconnect_attempt", () => {
      this.onConnectionStatusChange &&
        this.onConnectionStatusChange("reconnecting");
    });
    this._socket.on("connect", () => {
      this._connected = true;
      this.onConnectionStatusChange &&
        this.onConnectionStatusChange("connected");

      this._socket.emit("listrooms");
    });
    this._socket.on("listrooms", r => {
      this.serverRooms = r;
      this.onServerRoomsChange && this.onServerRoomsChange(this.serverRooms);
    });
    this._socket.on("createvertex", v => {
      let polygon = this.findPolygon(v.polygonId);

      if (v.afterVertexId) {
        polygon.vertices.splice(
          this.findVertexIndex(v.afterVertexId, polygon) + v.direction,
          0,
          v
        );
      } else {
        polygon.vertices.push(v);
      }
    });
    this._socket.on("createpolygon", p => {
      this.level.polygons.push(p);
    });
    this._socket.on("createobject", o => {
      this.level.objects.push(o);
    });
    this._socket.on("deletevertex", v => {
      let polygon = this.findPolygon(v.polygonId);
      polygon.vertices.splice(this.findVertexIndex(v.id, polygon), 1);
    });
    this._socket.on("updatevertex", v => {
      let vertex = this.findVertex(v.id, this.findPolygon(v.polygonId));
      vertex.x = v.x;
      vertex.y = v.y;
    });
    this._socket.on("updateobject", o => {
      let obj = this.findObject(o.id);
      obj.x = o.x;
      obj.y = o.y;
    });
    this._socket.on("deletepolygon", p => {
      this.level.polygons.splice(this.findPolygonIndex(p), 1);
    });
    this._socket.on("deleteobject", o => {
      this.level.objects.splice(this.findObjectIndex(o), 1);
    });
    this._socket.on("requestlevel", clientId => {
      this._socket.emit("responselevel", {
        level: this.level,
        clientId: clientId
      });
    });
    this._socket.on("responselevel", l => {
      let level = new Level();
      level.polygons = l.polygons;
      level.objects = l.objects;
      this.level = level;
    });
  }
}

module.exports = LevelEditor;
