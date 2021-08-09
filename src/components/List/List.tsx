import React, {
  useState,
  ReactElement,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import {
  ChevronRight,
  Circle,
  CircleFill,
  XCircle
} from '@assets/BootstrapIcons'

interface IListComponent {
  header?: string
}

export const ListComponent: React.FC<IListComponent> = (props) => {
  const { header } = props
  return (
    <div className="list__component">
      {header && <div className="list__header">{header}</div>}
      <div className="list__body">
        {props.children}
      </div>
    </div>
  )
}

interface IListItem {
  text: string
  icon?: ReactElement
  hideIcon?: boolean
  hideRightIcon?: boolean
}

export const ListItemText: React.FC<IListItem> = (props) => {
  const hideIcon = props.hideIcon || false
  return (
    <div className="list__item">
      {!hideIcon && <div className="icon">
        {props.icon}
      </div>}
      <div className="container">
        <div className="display">
          <span className="text">{props.text}</span>
        </div>
      </div>
    </div>
  )
}

interface IListItemButton {
  text: string
  preview?: string
  onButton?: () => void
  onMouseEnter?: () => void
  isEnable?: boolean
  title?: string

  onDragOver?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void

  iconL?: ReactElement
  iconR?: ReactElement
  iconEmptyR?: boolean
  hideIconL?: boolean
  hideIconR?: boolean
}

export const ListItemButton: React.FC<IListItemButton> = (props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hideIconL = props.hideIconL || false
  const hideIconR = props.hideIconR || false

  const iconL = props.iconL
  const iconR = props.iconEmptyR  ? undefined : props.iconR || ChevronRight
  const isEnable = props.isEnable !== undefined ? props.isEnable : true

  useEffect(() => {
    if (buttonRef.current) {
      const button = buttonRef.current
      if (props.onDragOver)
        button.addEventListener('dragover', props.onDragOver)
      if (props.onDrop)
        button.addEventListener('drop', props.onDrop)
    }
    return () => {
      if (buttonRef.current) {
        const button = buttonRef.current
        if (props.onDragOver)
          button.removeEventListener('dragover', props.onDragOver)
        if (props.onDrop)
          button.removeEventListener('drop', props.onDrop)
      }
    }
  }, [])

  return (
    <button
      ref={buttonRef}
      disabled={!isEnable}
      className="list__item"
      onMouseEnter={props.onMouseEnter}
      onClick={props.onButton}
      title={props.title}>
      {!hideIconL && <div className="icon-l">{iconL}</div>}
      <div className="container">
        <div className="display">
          <div className="text"><span>{props.text}</span></div>
          <div className="preview"><span>{props.preview}</span></div>
          {!hideIconR && <div className="icon-r">
            {iconR}
          </div>}
        </div>
      </div>
    </button>
  )
}

interface IListItemInputText {
  default?: string
  placeholder?: string
  isFocus?: boolean
  onChange?: (text: string) => void
  onConfirm?: (text: string) => void
  onCancel?: () => void
}

export const ListItemInputText: React.FC<IListItemInputText> = (props) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const onDone = useCallback(() => {
    if (!inputRef.current) return
    const text = inputRef.current.value.trim()
    if (text.length > 0 && props.onConfirm)
      props.onConfirm(text)
  }, [inputRef])

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  return (
    <div className="list__item">
      <input
        type="text"
        ref={inputRef}
        defaultValue={props.default}
        placeholder={props.placeholder}
        onChange={(e) => {
          if (props.onChange) props.onChange(e.target.value)
        }}
        onKeyUp={(event) => {
          if (event.key === 'Enter') onDone()
        }}
      />
      <div className="options">
        <button title="Cancel" className="cancel" onClick={props.onCancel}>
          <div className="icon">{XCircle}</div>
        </button>
        <button title="Confirm" className="confirm" onClick={onDone}>
          <div className="icon">{Circle}</div>
        </button>
      </div>
    </div>
  )
}

interface IListItemInputFile {
  accept: string
  onChange: (e: Event) => void

  iconL?: ReactElement
}

export const ListItemInputFile: React.FC<IListItemInputFile> = (props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.addEventListener('change', props.onChange)
    }
    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener('change', props.onChange)
      }
    }
  }, [])

  return (
    <div className="list__item">
      <div className="icon-l">{props.iconL}</div>
      <div className="container">
        <input
          ref={inputRef}
          type="file" accept={props.accept}
        />
      </div>
    </div>
  )
}

interface IListItemMark {
  text: string
  preview?: string
  isMarked: boolean
  onMark: (mark: boolean) => void

  stateLorR?: boolean                   // false: left, true: right
  icons?: [ReactElement, ReactElement]  // [ON, OFF]
  icon?: ReactElement
  hideIconL?: boolean
  hideIconR?: boolean
}

export const ListItemMark: React.FC<IListItemMark> = (props) => {
  const [isMarked, setIsMarked] = useState(props.isMarked || false)
  const [ON, OFF] = props.icons || [CircleFill, Circle]
  const lor = props.stateLorR || false
  return (
    <ListItemButton
      text={props.text}
      preview={props.preview}
      iconL={!lor ? isMarked ? ON : OFF : props.icon}
      hideIconL={props.hideIconL}
      iconR={lor ? isMarked ? ON : OFF : props.icon}
      hideIconR={props.hideIconR}
      onButton={() => {
        const mark = !isMarked
        setIsMarked(mark)
        props.onMark(mark)
      }}
    />
  )
}

interface IListItemInputSwitch {
  text: string
  isInput?: boolean
  preview?: string
  onConfirm?: (value: string) => void
  icon?: ReactElement
  isEnable?: boolean
}

export const ListItemInputSwitch: React.FC<IListItemInputSwitch> = (props) => {
  const [isInput, setIsInput] = useState(props.isInput || false)
  const isEnable = props.isEnable !== undefined ? props.isEnable : true

  return isInput ?
    <ListItemInputText
      default={props.preview}
      onConfirm={(text) => {
        if (props.onConfirm) props.onConfirm(text)
        setIsInput(false)
      }}
      onCancel={() => setIsInput(false)}
    />
    :
    <ListItemButton
      isEnable={isEnable}
      iconL={props.icon}
      text={props.text}
      preview={props.preview}
      onButton={() => setIsInput(true)}
    />
}
