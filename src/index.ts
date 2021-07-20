import { NodeEditor } from 'rete'

declare module 'rete/types/events' {
  interface EventsTypes {
    multiselection: boolean;
  }
}

export interface Cfg {
  selectionArea?: {
    className?: string;
  };
  enabled?: boolean;
  mode?: [string, string];
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

const MOUSE_LEFT_BUTTON = 0

function drawSelectionArea(area: HTMLDivElement, position: Position, size: Size) {
  area.style.left = `${position.x}px`
  area.style.top = `${position.y}px`
  area.style.width = `${size.width}px`
  area.style.height = `${size.height}px`
  area.style.opacity = '0.2'
}

function cleanSelectionArea(area: HTMLDivElement) {
  area.style.left = '0px'
  area.style.top = '0px'
  area.style.width = '0px'
  area.style.height = '0px'
  area.style.opacity = '0'
}

function applyTransform(translateX: number, translateY: number, scale: number, position: Position): Position {
  return {
    x: (position.x - translateX) / scale,
    y: (position.y - translateY) / scale
  }
}

function install(editor: NodeEditor, params: Cfg) {
  editor.bind('multiselection')

  const cfg = params ?? {}

  // #region Статус плагина
  let accumulate = false
  let pressing = false
  const selection: [Position, Position] = [{ x: 0, y: 0 }, { x: 0, y: 0 }]
  // #endregion

  // Объект холста
  const canvas = editor.view.container.firstElementChild as HTMLDivElement

  // #region Получить узлы в диапазоне выбора кадра
  const getNodesFromSelectionArea = () => {
    if (!cfg.enabled) {
      return []
    }

    const { x: translateX, y: translateY, k: scale } = editor.view.area.transform
    const areaStart = applyTransform(translateX, translateY, scale, { ...selection[0] })
    const areaEnd = applyTransform(translateX, translateY, scale, { ...selection[1] })

    // Отрегулируйте порядок точек
    if (areaEnd.x < areaStart.x) {
      const num = areaStart.x
      areaStart.x = areaEnd.x
      areaEnd.x = num
    }
    if (areaEnd.y < areaStart.y) {
      const num = areaStart.y
      areaStart.y = areaEnd.y
      areaEnd.y = num
    }

    return editor.nodes.filter(item => {
      const [x, y] = item.position
      return (x >= areaStart.x && x <= areaEnd.x && y >= areaStart.y && y <= areaEnd.y)
    })
  }
  // #endregion

  // #region Создать выбор
  const selectionArea = document.createElement('div')
  selectionArea.classList.add('selection-area')
  selectionArea.style.position = 'absolute'
  selectionArea.style.boxSizing = 'border-box'
  selectionArea.style.pointerEvents = 'none'
  cleanSelectionArea(selectionArea)


  // #region Настройка внешнего вида
  {
    const className = cfg.selectionArea?.className
    if (className) {
      selectionArea.classList.add(...className.split(' '))
    } else {
      selectionArea.style.backgroundColor = '#E3F2FD'
      selectionArea.style.border = 'solid 1px #42A5F5'
      selectionArea.style.borderRadius = '4px'
    }
  }
  // #endregion

  // #region Выберите мероприятие
  const handleMouseDown = (e: MouseEvent) => {
/*    e.preventDefault()
    e.stopPropagation()*/

    if (!cfg.enabled) {
      return
    }

    if (e.button !== MOUSE_LEFT_BUTTON) {
      return
    }
    if (!e.ctrlKey) {
      return
    }
    if (editor.selected.list.length > 0) {
      return
    }

    pressing = true

    // Защищайте события мыши от других элементов
    canvas.style.pointerEvents = 'none'
    Array.from(canvas.querySelectorAll('path')).forEach(item => {
      (item as SVGElement).style.pointerEvents = 'none'
    })

    // Инициализировать связанное состояние
    cleanSelectionArea(selectionArea)
    selection[0] = { x: e.offsetX, y: e.offsetY }
    selection[1] = { x: e.offsetX, y: e.offsetY }
  }

  const handleMouseUp = (e: MouseEvent) => {
/*    e.preventDefault()
    e.stopPropagation()*/

    const selectedNodes = getNodesFromSelectionArea()

    pressing = false

    // Восстановить события мыши других элементов
    canvas.style.pointerEvents = 'auto'
    Array.from(canvas.querySelectorAll('path')).forEach(item => {
      (item as SVGElement).style.pointerEvents = 'auto'
    })

    cleanSelectionArea(selectionArea)
    selection[0] = { x: 0, y: 0 }
    selection[1] = { x: 0, y: 0 }

    if (!cfg.enabled) {
      return
    }
    if (!e.ctrlKey) {
      return
    }

    selectedNodes.forEach((node) => {
      editor.selectNode(node, accumulate)
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
 /*   e.preventDefault()
    e.stopPropagation()*/

    if (!cfg.enabled) {
      return
    }
    if (!e.ctrlKey) {
      return
    }
    if (!pressing) {
      return
    }
    if (editor.selected.list.length > 0) {
      return
    }

    selection[1] = { x: e.offsetX, y: e.offsetY }

    const size: Size = {
      width: Math.abs(selection[1].x - selection[0].x),
      height: Math.abs(selection[1].y - selection[0].y)
    }
    const position = { ...selection[0] }

    if (selection[1].x < selection[0].x) {
      position.x = selection[1].x
    }
    if (selection[1].y < selection[0].y) {
      position.y = selection[1].y
    }

    // Если какой-либо узел не выбран, необходимо нарисовать диапазон выбора кадра.
    drawSelectionArea(selectionArea, position, size)
  }
  // #endregion

  // #region Инициализировать стили и события
  editor.view.container.style.position = 'relative'
  editor.view.container.appendChild(selectionArea)

  editor.view.container.addEventListener('mousedown', handleMouseDown)
  editor.view.container.addEventListener('mouseup', handleMouseUp)
  editor.view.container.addEventListener('mouseout', handleMouseUp)
  editor.view.container.addEventListener('mousemove', handleMouseMove)

  editor.on('destroy', () => {
    editor.view.container.removeChild(selectionArea)


    editor.view.container.removeEventListener('mousedown', handleMouseDown)
    editor.view.container.removeEventListener('mouseup', handleMouseUp)
    editor.view.container.removeEventListener('mouseout', handleMouseUp)
    editor.view.container.removeEventListener('mousemove', handleMouseMove)
  })

  editor.on('multiselection', enabled => {
    cfg.enabled = enabled
  })

  editor.on('keydown', (e) => {
    if (e.ctrlKey) {
      accumulate = true
      editor.view.container.classList.add("multi-select")
    }
  })

  editor.on('keyup', () => {
    if (accumulate) {
      accumulate = false
      editor.view.container.classList.remove("multi-select")
    }
  })

  editor.on('translate', () => {
    return !accumulate
  })
  // #endregion
}

export default {
  name: 'rete-selection-plugin',
  install
}
