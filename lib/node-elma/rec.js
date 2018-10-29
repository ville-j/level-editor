"use strict";

require("core-js/modules/es6.object.define-property");

require("core-js/modules/es6.array.iterator");

require("core-js/modules/es6.string.iterator");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.for-each");

require("core-js/modules/es6.string.link");

require("core-js/modules/es6.promise");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var fs = require('fs');

var nullpadString = require('./util').nullpadString;

var trimString = require('./util').trimString;

var EOR_MARKER = require('./const').EOR_MARKER;
/**
 * Class containing all replay attributes.
 */


var Replay =
/*#__PURE__*/
function () {
  function Replay() {
    _classCallCheck(this, Replay);

    this.link = 0;
    this.level = '';
    this.multi = false;
    this.flagTag = false;
    this.frames = [[], []];
    this.events = [[], []];
  }
  /**
   * Loads a replay from file.
   * @static
   * @param {string} filePath Path to file
   * @returns {Promise} Promise
   */


  _createClass(Replay, [{
    key: "_parseFile",

    /**
     * Parses file buffer data into a Replay.
     * @private
     * @returns {Promise}
     */
    value: function _parseFile(buffer) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var offset = 0; // frame count

        var numFrames = buffer.readUInt32LE(offset);
        offset += 8; // + 4 unused extra bytes
        // multireplay?

        _this.multi = Boolean(buffer.readInt32LE(offset));
        offset += 4; // flag-tag replay?

        _this.flagTag = Boolean(buffer.readInt32LE(offset));
        offset += 4; // level link

        _this.link = buffer.readUInt32LE(offset);
        offset += 4; // level filename with extension

        _this.level = trimString(buffer.slice(offset, offset + 12));
        offset += 16; // + 4 unused extra bytes
        // frames

        _this.frames[0] = Replay._parseFrames(buffer.slice(offset, offset + 27 * numFrames), numFrames);
        offset += 27 * numFrames; // events

        var numEvents = buffer.readUInt32LE(offset);
        offset += 4;
        _this.events[0] = Replay._parseEvents(buffer.slice(offset, offset + 16 * numEvents), numEvents);
        offset += 16 * numEvents; // end of replay marker

        var expected = buffer.readInt32LE(offset);

        if (expected !== EOR_MARKER) {
          reject('End of replay marker mismatch');
          return;
        } // if multi rec, parse another set of frames and events while skipping
        // other fields we already gathered from the first half. probably?


        if (_this.multi) {
          offset += 4;

          var _numFrames = buffer.readUInt32LE(offset);

          offset += 36; // +32 bytes where skipping other fields

          _this.frames[1] = Replay._parseFrames(buffer.slice(offset, offset + 27 * _numFrames), _numFrames);
          offset += 27 * _numFrames;

          var _numEvents = buffer.readUInt32LE(offset);

          offset += 4;
          _this.events[1] = Replay._parseEvents(buffer.slice(offset, offset + 16 * _numEvents), _numEvents);
          offset += 16 * _numEvents;

          var _expected = buffer.readInt32LE(offset);

          if (_expected !== EOR_MARKER) {
            reject('End of multi-replay marker mismatch');
            return;
          }
        }

        resolve(_this);
      });
    }
    /**
     * Parses frame data into an array of frame objects.
     * @private
     * @static
     * @param {Buffer} buffer Frame data to parse.
     * @param {Number} numFrames Number of frames to parse.
     * @returns {Array}
     */

  }, {
    key: "_update",

    /**
     * Internal convinience method.
     * @private
     * @param {Bool} multi Process 2nd part of multi-replay data?
     * @returns {Promise}
     */
    value: function _update(multi) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        // figure out how big of a buffer to create since dynamic allocation is not a thing...
        var playerIndex = multi ? 1 : 0;
        var numFrames = _this2.frames[playerIndex].length;
        var bufferSize = 44 + 27 * numFrames + 16 * _this2.events[playerIndex].length;
        var buffer = Buffer.alloc(bufferSize);
        buffer.writeUInt32LE(numFrames, 0);
        buffer.writeUInt32LE(0x83, 4);
        buffer.writeUInt32LE(_this2.multi ? 1 : 0, 8);
        buffer.writeUInt32LE(_this2.flagTag ? 1 : 0, 12);
        buffer.writeUInt32LE(_this2.link, 16);
        buffer.write(nullpadString(_this2.level, 12), 20, 'ascii');
        buffer.writeUInt32LE(0, 32);

        for (var i = 0; i < numFrames; i++) {
          buffer.writeFloatLE(_this2.frames[playerIndex][i].bike.x, 36 + i * 4);
          buffer.writeFloatLE(_this2.frames[playerIndex][i].bike.y, 36 + i * 4 + numFrames * 4);
          buffer.writeInt16LE(_this2.frames[playerIndex][i].leftWheel.x, 36 + i * 2 + numFrames * 8);
          buffer.writeInt16LE(_this2.frames[playerIndex][i].leftWheel.y, 36 + i * 2 + numFrames * 10);
          buffer.writeInt16LE(_this2.frames[playerIndex][i].rightWheel.x, 36 + i * 2 + numFrames * 12);
          buffer.writeInt16LE(_this2.frames[playerIndex][i].rightWheel.y, 36 + i * 2 + numFrames * 14);
          buffer.writeInt16LE(_this2.frames[playerIndex][i].head.x, 36 + i * 2 + numFrames * 16);
          buffer.writeInt16LE(_this2.frames[playerIndex][i].head.y, 36 + i * 2 + numFrames * 18);
          buffer.writeInt16LE(_this2.frames[playerIndex][i].rotation, 36 + i * 2 + numFrames * 20);
          buffer.writeUInt8(_this2.frames[playerIndex][i].leftRotation, 36 + i + numFrames * 22);
          buffer.writeUInt8(_this2.frames[playerIndex][i].rightRotation, 36 + i + numFrames * 23);
          var data = Math.floor(Math.random() * 255) & 0xFC; // generate random data for rec because why not eh?

          if (_this2.frames[playerIndex][i].throttle) data |= 1;
          if (_this2.frames[playerIndex][i].right) data |= 2;
          buffer.writeUInt8(data, 36 + i + numFrames * 24);
          buffer.writeInt16LE(_this2.frames[playerIndex][i].volume, 36 + i * 2 + numFrames * 25);
        } // need to start keeping track of offset from now on


        var offset = 36 + 27 * numFrames;
        buffer.writeUInt32LE(_this2.events[playerIndex].length, offset);
        offset += 4;

        _this2.events[playerIndex].forEach(function (event) {
          buffer.writeDoubleLE(event.time, offset);
          offset += 8;

          switch (event.eventType) {
            case 'touch':
              buffer.writeUInt32LE(event.info, offset);
              buffer.writeUInt32LE(0, offset + 4);
              break;

            case 'ground1':
              buffer.writeUInt32LE(131071, offset);
              buffer.writeUInt32LE(1050605825, offset + 4);
              break;

            case 'ground2':
              buffer.writeUInt32LE(327679, offset);
              buffer.writeUInt32LE(1065185444, offset + 4);
              break;

            case 'turn':
              buffer.writeUInt32LE(393215, offset);
              buffer.writeUInt32LE(1065185444, offset + 4);
              break;

            case 'voltRight':
              buffer.writeUInt32LE(458751, offset);
              buffer.writeUInt32LE(1065185444, offset + 4);
              break;

            case 'voltLeft':
              buffer.writeUInt32LE(524287, offset);
              buffer.writeUInt32LE(1065185444, offset + 4);
              break;

            default:
              reject('Unknown event type');
              return;
          }

          offset += 8;
        });

        buffer.writeUInt32LE(EOR_MARKER, offset);
        resolve(buffer);
      });
    }
    /**
     * @typedef {Object} Time
     * @property {Number} Time in milliseconds
     * @property {Bool} Finished
     * @property {String} Reason for finished being true or false
     */

    /**
     * Get time of replay in milliseconds.
     * @returns {Time} Time and whether replay is probably finished or not.
     */

  }, {
    key: "getTime",
    value: function getTime() {
      // First check if last event was a touch event in either event data.
      var lastEvent1 = this.events[0][this.events[0].length - 1];
      var lastEvent2 = this.events[1][this.events[1].length - 1];
      var time1 = 0;
      var time2 = 0;
      if (lastEvent1 && lastEvent1.eventType === 'touch') time1 = lastEvent1.time;
      if (lastEvent2 && lastEvent2.eventType === 'touch') time2 = lastEvent2.time; // Highest frame time.

      var frames1Length = this.frames[0].length;
      var frames2Length = this.frames[1].length;
      var frameTimeMax = (frames1Length > frames2Length ? frames1Length : frames2Length) * 33.333; // If neither had a touch event, return approximate frame time.

      if (lastEvent1 && lastEvent1.eventType !== 'touch' && lastEvent2 && lastEvent2.eventType !== 'touch') {
        return {
          time: Math.round(frameTimeMax),
          finished: false,
          reason: 'notouch'
        };
      } // Set to highest event time.


      var eventTimeMax = (time1 > time2 ? time1 : time2) * 2289.37728938; // If event difference to frame time is >1 frames of time, probably not finished?

      if (frameTimeMax > eventTimeMax + 34.333) {
        return {
          time: Math.round(frameTimeMax),
          finished: false,
          reason: 'framediff'
        };
      } // Otherwise probably finished?


      return {
        time: Math.round(eventTimeMax),
        finished: true,
        reason: undefined
      };
    }
    /**
     * Returns replay data as a buffer.
     * @returns {Promise}
     */

  }, {
    key: "toBuffer",
    value: function toBuffer() {
      return this._update();
    }
    /**
     * Saves a replay to file.
     * @param {string} filePath Path to file
     * @returns {Promise} Promise
     */

  }, {
    key: "save",
    value: function save(filePath) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (!filePath) reject('No filepath specified');

        if (_this3.multi) {
          var singleBuffer = _this3._update(false);

          var multiBuffer = _this3._update(true);

          Promise.all([singleBuffer, multiBuffer]).then(function (buffers) {
            var combinedBuffer = Buffer.concat([buffers[0], buffers[1]]);
            fs.writeFile(filePath, combinedBuffer, function (error) {
              if (error) reject(error);
              resolve();
            });
          });
        } else {
          _this3._update(false).then(function (singleBuffer) {
            fs.writeFile(filePath, singleBuffer, function (error) {
              if (error) reject(error);
              resolve();
            });
          }).catch(function (error) {
            return reject(error);
          });
        }
      });
    }
  }], [{
    key: "load",
    value: function load(filePath) {
      return new Promise(function (resolve, reject) {
        fs.readFile(filePath, function (error, buffer) {
          if (error) reject(error);
          var replay = new Replay();

          replay._parseFile(buffer).then(function (results) {
            return resolve(results);
          }).catch(function (error) {
            return reject(error);
          });
        });
      });
    }
  }, {
    key: "_parseFrames",
    value: function _parseFrames(buffer, numFrames) {
      var frames = [];

      for (var i = 0; i < numFrames; i++) {
        var data = buffer.readUInt8(i + numFrames * 24); // read in data field first to process it

        var frame = {
          bike: {
            x: buffer.readFloatLE(i * 4),
            y: buffer.readFloatLE(i * 4 + numFrames * 4)
          },
          leftWheel: {
            x: buffer.readInt16LE(i * 2 + numFrames * 8),
            y: buffer.readInt16LE(i * 2 + numFrames * 10)
          },
          rightWheel: {
            x: buffer.readInt16LE(i * 2 + numFrames * 12),
            y: buffer.readInt16LE(i * 2 + numFrames * 14)
          },
          head: {
            x: buffer.readInt16LE(i * 2 + numFrames * 16),
            y: buffer.readInt16LE(i * 2 + numFrames * 18)
          },
          rotation: buffer.readInt16LE(i * 2 + numFrames * 20),
          leftRotation: buffer.readUInt8(i + numFrames * 22),
          rightRotation: buffer.readUInt8(i + numFrames * 23),
          throttle: (data & 1) !== 0,
          right: (data & 1 << 1) !== 0,
          volume: buffer.readInt16LE(i * 2 + numFrames * 25)
        };
        frames.push(frame);
      }

      return frames;
    }
    /**
     * Parses event data into an array of event objects.
     * @private
     * @static
     * @param {Buffer} buffer Event data to parse.
     * @param {Number} numEvents Number of events to parse.
     * @returns {Array}
     */

  }, {
    key: "_parseEvents",
    value: function _parseEvents(buffer, numEvents) {
      var events = [];
      var offset = 0;

      for (var i = 0; i < numEvents; i++) {
        var event = {};
        event.time = buffer.readDoubleLE(offset);
        offset += 8;
        event.info = buffer.readInt16LE(offset);
        offset += 2;
        var eventType = buffer.readUInt8(offset);
        offset += 6; // 1 + 5 unknown bytes

        switch (eventType) {
          case 0:
            event.eventType = 'touch';
            break;

          case 1:
            event.eventType = 'ground1';
            break;

          case 4:
            event.eventType = 'ground2';
            break;

          case 5:
            event.eventType = 'turn';
            break;

          case 6:
            event.eventType = 'voltRight';
            break;

          case 7:
            event.eventType = 'voltLeft';
            break;

          default:
            throw new Error('Unknown event type');
        }

        events.push(event);
      }

      return events;
    }
  }]);

  return Replay;
}();

module.exports = Replay;