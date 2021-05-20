/*!
* rete-selection-plugin v0.1.1 
* (c) 2021 nix 
* Released under the GPL-3.0-or-later license.
*/
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? Object(arguments[i]) : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var MOUSE_LEFT_BUTTON = 0;

function drawSelectionArea(area, position, size) {
  area.style.left = "".concat(position.x, "px");
  area.style.top = "".concat(position.y, "px");
  area.style.width = "".concat(size.width, "px");
  area.style.height = "".concat(size.height, "px");
  area.style.opacity = '0.2';
}

function cleanSelectionArea(area) {
  area.style.left = '0px';
  area.style.top = '0px';
  area.style.width = '0px';
  area.style.height = '0px';
  area.style.opacity = '0';
}

function applyTransform(translateX, translateY, scale, position) {
  return {
    x: (position.x - translateX) / scale,
    y: (position.y - translateY) / scale
  };
}

function install(editor, params) {
  editor.bind('multiselection');
  var cfg = params !== null && params !== void 0 ? params : {}; // #region Статус плагина

  var accumulate = false;
  var pressing = false;
  var selection = [{
    x: 0,
    y: 0
  }, {
    x: 0,
    y: 0
  }]; // #endregion
  // Объект холста

  var canvas = editor.view.container.firstElementChild; // #region Получить узлы в диапазоне выбора кадра

  var getNodesFromSelectionArea = function getNodesFromSelectionArea() {
    if (!cfg.enabled) {
      return [];
    }

    var _editor$view$area$tra = editor.view.area.transform,
        translateX = _editor$view$area$tra.x,
        translateY = _editor$view$area$tra.y,
        scale = _editor$view$area$tra.k;
    var areaStart = applyTransform(translateX, translateY, scale, _objectSpread({}, selection[0]));
    var areaEnd = applyTransform(translateX, translateY, scale, _objectSpread({}, selection[1])); // Отрегулируйте порядок точек

    if (areaEnd.x < areaStart.x) {
      var num = areaStart.x;
      areaStart.x = areaEnd.x;
      areaEnd.x = num;
    }

    if (areaEnd.y < areaStart.y) {
      var _num = areaStart.y;
      areaStart.y = areaEnd.y;
      areaEnd.y = _num;
    }

    return editor.nodes.filter(function (item) {
      var _item$position = _slicedToArray(item.position, 2),
          x = _item$position[0],
          y = _item$position[1];

      return x >= areaStart.x && x <= areaEnd.x && y >= areaStart.y && y <= areaEnd.y;
    });
  }; // #endregion
  // #region Создать выбор


  var selectionArea = document.createElement('div');
  selectionArea.classList.add('selection-area');
  selectionArea.style.position = 'absolute';
  selectionArea.style.boxSizing = 'border-box';
  selectionArea.style.pointerEvents = 'none';
  cleanSelectionArea(selectionArea); // #region Настройка внешнего вида

  {
    var _cfg$selectionArea;

    var className = (_cfg$selectionArea = cfg.selectionArea) === null || _cfg$selectionArea === void 0 ? void 0 : _cfg$selectionArea.className;

    if (className) {
      var _selectionArea$classL;

      (_selectionArea$classL = selectionArea.classList).add.apply(_selectionArea$classL, _toConsumableArray(className.split(' ')));
    } else {
      selectionArea.style.backgroundColor = '#E3F2FD';
      selectionArea.style.border = 'solid 1px #42A5F5';
      selectionArea.style.borderRadius = '4px';
    }
  } // #endregion
  // #region Выберите мероприятие

  var handleMouseDown = function handleMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!cfg.enabled) {
      return;
    }

    if (e.button !== MOUSE_LEFT_BUTTON) {
      return;
    }

    if (!e.ctrlKey) {
      return;
    }

    pressing = true; // Защищайте события мыши от других элементов

    canvas.style.pointerEvents = 'none';
    Array.from(canvas.querySelectorAll('path')).forEach(function (item) {
      item.style.pointerEvents = 'none';
    }); // Инициализировать связанное состояние

    cleanSelectionArea(selectionArea);
    selection[0] = {
      x: e.offsetX,
      y: e.offsetY
    };
    selection[1] = {
      x: e.offsetX,
      y: e.offsetY
    };
  };

  var handleMouseUp = function handleMouseUp(e) {
    e.preventDefault();
    e.stopPropagation();
    var selectedNodes = getNodesFromSelectionArea();
    pressing = false; // Восстановить события мыши других элементов

    canvas.style.pointerEvents = 'auto';
    Array.from(canvas.querySelectorAll('path')).forEach(function (item) {
      item.style.pointerEvents = 'auto';
    });
    cleanSelectionArea(selectionArea);
    selection[0] = {
      x: 0,
      y: 0
    };
    selection[1] = {
      x: 0,
      y: 0
    };

    if (!cfg.enabled) {
      return;
    }

    if (!e.ctrlKey) {
      return;
    }

    selectedNodes.forEach(function (node) {
      editor.selectNode(node, accumulate);
    });
  };

  var handleMouseMove = function handleMouseMove(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!cfg.enabled) {
      return;
    }

    if (!e.ctrlKey) {
      return;
    }

    if (!pressing) {
      return;
    }
    /*  if (editor.selected.list.length > 0) {
        return
      }*/


    selection[1] = {
      x: e.offsetX,
      y: e.offsetY
    };
    var size = {
      width: Math.abs(selection[1].x - selection[0].x),
      height: Math.abs(selection[1].y - selection[0].y)
    };

    var position = _objectSpread({}, selection[0]);

    if (selection[1].x < selection[0].x) {
      position.x = selection[1].x;
    }

    if (selection[1].y < selection[0].y) {
      position.y = selection[1].y;
    } // Если какой-либо узел не выбран, необходимо нарисовать диапазон выбора кадра.


    drawSelectionArea(selectionArea, position, size);
  }; // #endregion
  // #region Инициализировать стили и события


  editor.view.container.style.position = 'relative';
  editor.view.container.appendChild(selectionArea);
  editor.view.container.addEventListener('mousedown', handleMouseDown);
  editor.view.container.addEventListener('mouseup', handleMouseUp);
  editor.view.container.addEventListener('mouseout', handleMouseUp);
  editor.view.container.addEventListener('mousemove', handleMouseMove);
  editor.on('destroy', function () {
    editor.view.container.removeChild(selectionArea);
    editor.view.container.removeEventListener('mousedown', handleMouseDown);
    editor.view.container.removeEventListener('mouseup', handleMouseUp);
    editor.view.container.removeEventListener('mouseout', handleMouseUp);
    editor.view.container.removeEventListener('mousemove', handleMouseMove);
  });
  editor.on('multiselection', function (enabled) {
    cfg.enabled = enabled;
  });
  editor.on('keydown', function (e) {
    if (e.ctrlKey) {
      accumulate = true;
      editor.view.container.classList.add("multi-select");
    }
  });
  editor.on('keyup', function () {
    if (accumulate) {
      accumulate = false;
      editor.view.container.classList.remove("multi-select");
    }
  });
  editor.on('translate', function () {
    return !accumulate;
  }); // #endregion
}

var index = {
  name: 'rete-selection-plugin',
  install: install
};

exports.default = index;
//# sourceMappingURL=rete-selection-plugin.common.js.map
