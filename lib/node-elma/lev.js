"use strict";

require("core-js/modules/es6.array.sort");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.for-each");

require("core-js/modules/es6.function.name");

require("core-js/modules/es6.string.link");

require("core-js/modules/es6.regexp.to-string");

require("core-js/modules/es6.date.to-string");

require("core-js/modules/es6.promise");

require("core-js/modules/es6.object.define-property");

require("core-js/modules/es6.object.define-property");

require("core-js/modules/es6.array.sort");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.for-each");

require("core-js/modules/es6.function.name");

require("core-js/modules/es6.string.link");

require("core-js/modules/es6.regexp.to-string");

require("core-js/modules/es6.date.to-string");

require("core-js/modules/es6.promise");

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var fs = require('fs');

var DEFS = require('./const');

var trimString = require('./util').trimString;

var nullpadString = require('./util').nullpadString;

var EOD_MARKER = require('./const').EOD_MARKER;

var EOF_MARKER = require('./const').EOF_MARKER;
/**
 * Class containing all level attributes.
 * @example
 * let level = new Level()
 */


var Level =
/*#__PURE__*/
function () {
  /**
  * Represents a level.
  * @constructor
  */
  function Level() {
    _classCallCheck(this, Level);

    this.version = 'Elma';
    this.link = 0;
    this.integrity = [0.0, 0.0, 0.0, 0.0];
    this.lgr = 'default';
    this.name = 'New level';
    this.ground = 'ground';
    this.sky = 'sky';
    this.polygons = [{
      grass: false,
      vertices: [{
        x: 10.0,
        y: 0.0
      }, {
        x: 10.0,
        y: 7.0
      }, {
        x: 0.0,
        y: 7.0
      }, {
        x: 0.0,
        y: 0.0
      }]
    }];
    this.objects = [{
      x: 2.0,
      y: 7.0 - DEFS.OBJECT_RADIUS,
      type: 'start'
    }, {
      x: 8.0,
      y: 7.0 - DEFS.OBJECT_RADIUS,
      type: 'exit'
    }];
    this.pictures = [];
    this.top10 = {
      single: [],
      multi: []
    };
  }
  /**
   * Loads a level from file.
   * @static
   * @param {string} filePath Path to file
   * @returns {Promise}
   */


  _createClass(Level, [{
    key: "_parseFile",

    /**
     * Parses file buffer data into a Level.
     * @private
     * @returns {Promise}
     */
    value: function _parseFile(buffer) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var offset = 0; // check version

        var version = buffer.toString('ascii', 0, 5);

        switch (version) {
          case 'POT06':
            reject('Across levels are not supported');
            return;

          case 'POT14':
            _this.version = 'Elma';
            break;

          default:
            reject('Not valid Elma level.');
            return;
        }

        offset += 7; // 2 extra garbage bytes
        // link

        _this.link = buffer.readUInt32LE(offset);
        offset += 4; // integrity sums

        for (var i = 0; i < 4; i++) {
          _this.integrity[i] = buffer.readDoubleLE(offset);
          offset += 8;
        } // level name


        _this.name = trimString(buffer.slice(offset, offset + 51));
        offset += 51; // lgr

        _this.lgr = trimString(buffer.slice(offset, offset + 16));
        offset += 16; // ground

        _this.ground = trimString(buffer.slice(offset, offset + 10));
        offset += 10; // sky

        _this.sky = trimString(buffer.slice(offset, offset + 10));
        offset += 10; // polygons

        var polyCount = buffer.readDoubleLE(offset) - 0.4643643;
        offset += 8;

        for (var _i = 0; _i < polyCount; _i++) {
          var polygon = {};
          polygon.grass = Boolean(buffer.readInt32LE(offset));
          polygon.vertices = [];
          offset += 4;
          var vertexCount = buffer.readInt32LE(offset);
          offset += 4;

          for (var j = 0; j < vertexCount; j++) {
            var vertex = {};
            vertex.x = buffer.readDoubleLE(offset);
            offset += 8;
            vertex.y = buffer.readDoubleLE(offset);
            offset += 8;
            polygon.vertices.push(vertex);
          }

          _this.polygons.push(polygon);
        } // objects


        var objectCount = buffer.readDoubleLE(offset) - 0.4643643;
        offset += 8;

        for (var _i2 = 0; _i2 < objectCount; _i2++) {
          var object = {};
          object.x = buffer.readDoubleLE(offset);
          offset += 8;
          object.y = buffer.readDoubleLE(offset);
          offset += 8;
          var objType = buffer.readInt32LE(offset);
          offset += 4;
          var gravity = buffer.readInt32LE(offset);
          offset += 4;
          var animation = buffer.readInt32LE(offset) + 1;
          offset += 4;

          switch (objType) {
            case 1:
              object.type = 'exit';
              break;

            case 2:
              object.type = 'apple';

              switch (gravity) {
                case 0:
                  object.gravity = 'normal';
                  break;

                case 1:
                  object.gravity = 'up';
                  break;

                case 2:
                  object.gravity = 'down';
                  break;

                case 3:
                  object.gravity = 'left';
                  break;

                case 4:
                  object.gravity = 'right';
                  break;

                default:
                  reject('Invalid gravity value');
                  return;
              }

              object.animation = animation;
              break;

            case 3:
              object.type = 'killer';
              break;

            case 4:
              object.type = 'start';
              break;

            default:
              reject('Invalid object value');
              return;
          }

          _this.objects.push(object);
        } // pictures


        var picCount = buffer.readDoubleLE(offset) - 0.2345672;
        offset += 8;

        for (var _i3 = 0; _i3 < picCount; _i3++) {
          var picture = {};
          picture.name = trimString(buffer.slice(offset, offset + 10));
          offset += 10;
          picture.texture = trimString(buffer.slice(offset, offset + 10));
          offset += 10;
          picture.mask = trimString(buffer.slice(offset, offset + 10));
          offset += 10;
          picture.x = buffer.readDoubleLE(offset);
          offset += 8;
          picture.y = buffer.readDoubleLE(offset);
          offset += 8;
          picture.distance = buffer.readInt32LE(offset);
          offset += 4;
          var clip = buffer.readInt32LE(offset);
          offset += 4;

          switch (clip) {
            case 0:
              picture.clip = 'unclipped';
              break;

            case 1:
              picture.clip = 'ground';
              break;

            case 2:
              picture.clip = 'sky';
              break;

            default:
              reject('Invalid clip value');
              return;
          }

          _this.pictures.push(picture);
        } // end of data marker


        if (buffer.readInt32LE(offset) !== EOD_MARKER) {
          reject('End of data marker error');
          return;
        }

        offset += 4; // top10 lists

        var top10Data = Level.cryptTop10(buffer.slice(offset, offset + 688));
        _this.top10.single = _this._parseTop10(top10Data.slice(0, 344));
        _this.top10.multi = _this._parseTop10(top10Data.slice(344));
        offset += 688; // EOF marker

        if (buffer.readInt32LE(offset) !== EOF_MARKER) {
          reject('End of file marker error');
          return;
        }

        resolve(_this);
      });
    }
    /**
     * Encrypts and decrypts top10 list data.
     * @static
     * @param {Buffer} buffer Data to encrypt or decrypt
     * @returns {Buffer} Buffer with binary data
     */

  }, {
    key: "_parseTop10",

    /**
     * Parses top10 list data and returns array with times.
     * @private
     * @param {Buffer} buffer
     * @returns {Array} times
     */
    value: function _parseTop10(buffer) {
      var top10Count = buffer.readInt32LE();
      var output = [];

      for (var i = 0; i < top10Count; i++) {
        var timeOffset = 4 + i * 4;
        var timeEnd = timeOffset + 4;
        var nameOneOffset = 44 + i * 15;
        var nameOneEnd = nameOneOffset + 15;
        var nameTwoOffset = 194 + i * 15;
        var nameTwoEnd = nameTwoOffset + 15;
        var entry = {};
        entry.time = buffer.slice(timeOffset, timeEnd).readInt32LE();
        entry.name1 = trimString(buffer.slice(nameOneOffset, nameOneEnd));
        entry.name2 = trimString(buffer.slice(nameTwoOffset, nameTwoEnd));
        output.push(entry);
      }

      return output;
    }
    /**
     * Internal convinience method.
     * @private
     * @returns {Promise}
     */

  }, {
    key: "_update",
    value: function _update() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        // figure out how big of a buffer to create since dynamic allocation is not a thing...
        var bufferSize = 850; // all known level attributes' size

        for (var i = 0; i < _this2.polygons.length; i++) {
          bufferSize += 8 + 16 * _this2.polygons[i].vertices.length;
        }

        bufferSize += 28 * _this2.objects.length + 54 * _this2.pictures.length;
        var buffer = Buffer.alloc(bufferSize);

        if (_this2.version !== 'Elma') {
          reject('Only Elma levels are supported');
          return;
        }

        buffer.write('POT14', 0, 'ascii');
        buffer.writeUInt16LE(_this2.link & 0xFFFF, 5);
        buffer.writeUInt32LE(_this2.link, 7);

        for (var _i4 = 0; _i4 < _this2.integrity.length; _i4++) {
          buffer.writeDoubleLE(_this2.integrity[_i4], 11 + _i4 * 8);
        }

        var name = nullpadString(_this2.name, 51);
        buffer.write(name, 43, 'ascii');
        var lgr = nullpadString(_this2.lgr, 16);
        buffer.write(lgr, 94, 'ascii');
        var ground = nullpadString(_this2.ground, 10);
        buffer.write(ground, 110, 'ascii');
        var sky = nullpadString(_this2.sky, 10);
        buffer.write(sky, 120, 'ascii');
        buffer.writeDoubleLE(_this2.polygons.length + 0.4643643, 130);
        var offset = 138; // unknown territory, time to keep track of offset!

        _this2.polygons.forEach(function (polygon) {
          buffer.writeInt32LE(polygon.grass ? 1 : 0, offset);
          offset += 4;
          buffer.writeInt32LE(polygon.vertices.length, offset);
          offset += 4;
          polygon.vertices.forEach(function (vertex) {
            buffer.writeDoubleLE(vertex.x, offset);
            offset += 8;
            buffer.writeDoubleLE(vertex.y, offset);
            offset += 8;
          });
        });

        buffer.writeDoubleLE(_this2.objects.length + 0.4643643, offset);
        offset += 8;

        _this2.objects.forEach(function (object) {
          var objectType;
          var gravity = 0;
          var animation = 0;

          switch (object.type) {
            case 'exit':
              objectType = 1;
              break;

            case 'apple':
              objectType = 2;

              switch (object.gravity) {
                case 'normal':
                  gravity = 0;
                  break;

                case 'up':
                  gravity = 1;
                  break;

                case 'down':
                  gravity = 2;
                  break;

                case 'left':
                  gravity = 3;
                  break;

                case 'right':
                  gravity = 4;
                  break;

                default:
                  reject('Invalid gravity');
                  return;
              }

              animation = object.animation - 1;
              break;

            case 'killer':
              objectType = 3;
              break;

            case 'start':
              objectType = 4;
              break;

            default:
              reject('Invalid object value');
              return;
          }

          buffer.writeDoubleLE(object.x, offset);
          offset += 8;
          buffer.writeDoubleLE(object.y, offset);
          offset += 8;
          buffer.writeInt32LE(objectType, offset);
          offset += 4;
          buffer.writeInt32LE(gravity, offset);
          offset += 4;
          buffer.writeInt32LE(animation, offset);
          offset += 4;
        });

        buffer.writeDoubleLE(_this2.pictures.length + 0.2345672, offset);
        offset += 8;

        _this2.pictures.forEach(function (picture) {
          var name = nullpadString(picture.name, 10);
          buffer.write(name, offset, 'ascii');
          offset += 10;
          var texture = nullpadString(picture.texture, 10);
          buffer.write(texture, offset, 'ascii');
          offset += 10;
          var mask = nullpadString(picture.mask, 10);
          buffer.write(mask, offset, 'ascii');
          offset += 10;
          buffer.writeDoubleLE(picture.x, offset);
          offset += 8;
          buffer.writeDoubleLE(picture.y, offset);
          offset += 8;
          buffer.writeInt32LE(picture.distance, offset);
          offset += 4;
          var clip;

          switch (picture.clip) {
            case 'unclipped':
              clip = 0;
              break;

            case 'ground':
              clip = 1;
              break;

            case 'sky':
              clip = 2;
              break;

            default:
              reject('Invalid clip value');
              return;
          }

          buffer.writeInt32LE(clip, offset);
          offset += 4;
        });

        buffer.writeInt32LE(EOD_MARKER, offset);
        offset += 4;

        _this2._top10ToBuffer().copy(buffer, offset);

        offset += 688;
        buffer.writeInt32LE(EOF_MARKER, offset);
        resolve(buffer);
      });
    }
    /**
     * Parse top10 lists from Level class and return buffer with data.
     * @private
     * @returns {Buffer} buffer
     */

  }, {
    key: "_top10ToBuffer",
    value: function _top10ToBuffer() {
      var self = this;

      function parse(multi) {
        var list = multi ? 'multi' : 'single';
        self.top10[list].sort(function (a, b) {
          if (a.time > b.time) return 1;
          if (a.time < b.time) return -1;
          return 0;
        });
        var buffer = Buffer.alloc(344);
        buffer.writeUInt32LE(self.top10[list].length >= 10 ? 10 : self.top10[list].length);

        for (var i = 0; i < self.top10[list].length; i++) {
          if (i < 10) {
            buffer.writeUInt32LE(self.top10[list][i].time, 4 + 4 * i);
            buffer.write(nullpadString(self.top10[list][i].name1, 15), 44 + 15 * i);
            buffer.write(nullpadString(self.top10[list][i].name2, 15), 194 + 15 * i);
          }
        }

        return buffer;
      }

      var single = parse(false);
      var multi = parse(true);
      return Level.cryptTop10(Buffer.concat([single, multi], 688));
    } // /**
    //  * Topology check.
    //  * @returns {Promise}
    //  */
    // checkTopology () {
    //   return new Promise((resolve, reject) => {
    //     resolve()
    //     reject()
    //   })
    // }

    /**
     * Returns level as buffer data.
     * @returns {Promise}
     */

  }, {
    key: "toBuffer",
    value: function toBuffer() {
      return this._update();
    }
    /**
     * Generate new link number.
     */

  }, {
    key: "generateLink",
    value: function generateLink() {
      var max32 = Math.pow(2, 32) - 1;
      this.link = Math.floor(Math.random() * max32);
    }
    /**
     * Saves a level to file.
     * @param {string} filePath Path to file
     * @returns {Promise}
     */

  }, {
    key: "save",
    value: function save(filePath) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (!filePath) reject('No filepath specified');

        _this3._update().then(function (buffer) {
          fs.writeFile(filePath, buffer, function (error) {
            if (error) reject(error);
            resolve();
          });
        }).catch(function (error) {
          return reject(error);
        });
      });
    }
  }], [{
    key: "load",
    value: function load(filePath) {
      return new Promise(function (resolve, reject) {
        fs.readFile(filePath, function (error, buffer) {
          if (error) reject(error);
          var level = new Level(); // remove default polygons and objects

          level.polygons = [];
          level.objects = [];

          level._parseFile(buffer).then(function (results) {
            return resolve(results);
          }).catch(function (error) {
            return reject(error);
          });
        });
      });
    }
  }, {
    key: "cryptTop10",
    value: function cryptTop10(buffer) {
      var output = Buffer.from(buffer); // copy buffer to not modify reference?

      var ebp8 = 0x15;
      var ebp10 = 0x2637;

      for (var i = 0; i < 688; i++) {
        output[i] ^= ebp8 & 0xFF; // sick domi modifications to work with JS

        ebp10 += ebp8 % 0xD3D * 0xD3D;
        ebp8 = ebp10 * 0x1F + 0xD3D;
        ebp8 = (ebp8 & 0xFFFF) - 2 * (ebp8 & 0x8000);
      }

      return output;
    }
  }]);

  return Level;
}();

module.exports = Level;