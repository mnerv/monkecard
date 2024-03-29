import React, {
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react'
import Fuse from 'fuse.js'
import { BsTerminalFill } from 'react-icons/bs'
import { ECommandMode, TCommand } from '@models/command'

const DEFAULT_PLACEHOLDER = 'search command'

interface IRestore {
  fn: () => void
}
interface ICommand {
  fn: TCommand
}

interface Props {
  isHidden: boolean
  isLoading: boolean
  commandList: string[]
  onCommand: TCommand
  onHide: () => void
}

export interface CommandPaletteRef {
  target: HTMLDivElement | null
  onKeyDown: (e: KeyboardEvent) => void
  onReset: () => void
}

const Component = React.forwardRef<CommandPaletteRef, Props>((props, ref) => {
  const { isHidden, onCommand, commandList, onHide } = props
  const [filtered, setFiltered] = useState(commandList)
  const [mode, setMode]         = useState(ECommandMode.Normal)
  const [inputBox, setInputBox] = useState('')
  const [select, setSelect]     = useState(0)
  const [restore, setRestore]   = useState<IRestore>()
  const [command, setCommand]   = useState<ICommand>()
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER)
  const commandRef = useRef<HTMLDivElement>(null)
  const listRef    = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const fuse = useMemo(() => new Fuse(commandList), [commandList])

  useImperativeHandle(ref, () => ({
    target: commandRef.current,
    onKeyDown: onKeyDown,
    onReset: onReset
  }))

  const onReset = useCallback(() => {
    setSelect(0)
    setMode(ECommandMode.Normal)
    setInputBox('')
    setPlaceholder(DEFAULT_PLACEHOLDER)
  }, [])

  // Reset to default value when isHidden changes
  useEffect(() => {
    setSelect(0)
    setMode(ECommandMode.Normal)
    setInputBox('')
    if (isHidden && restore) {
      restore.fn()
      setRestore(undefined)
    }
    if (isHidden) setPlaceholder(DEFAULT_PLACEHOLDER)
    if (!isHidden)
      inputRef.current?.focus({ preventScroll: true })
  }, [isHidden, restore])

  useEffect(() => {
    if (mode === ECommandMode.Input) return

    const res = fuse.search(inputBox)
    if (res.length > 0) {
      const list = res.map(({ item }) => item)
      setFiltered(list)
      setSelect(0)
      fuse.setCollection(list)
    } else if (inputBox !== '') {
      setFiltered([])
      setSelect(-1)
    } else {
      setFiltered(commandList)
      setSelect(0)
      fuse.setCollection(commandList)
    }
  }, [commandList, fuse, inputBox, mode])

  useEffect(() => {
    const element = listRef.current?.children[select]
    if (!element || isHidden) return
    element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [select, isHidden])

  const onKey = useCallback((e: KeyboardEvent) => {
    const input = inputRef.current
    if (!input) return
    setInputBox(input.value)
  }, [inputRef])

  const onSelectCommand = useCallback((index: number) => {
    if (filtered.length === 0) return
    if (!inputRef.current) return
    const cmd = filtered[index]
    const input = inputRef.current
    onCommand(cmd).then(s => {
      if (!s) {  // Handle if s is void
        onHide()
        return
      }
      if (s.success) onHide()
      if (s.fn) setCommand({ fn: s.fn })
      if (s.mode) setMode(s.mode)
      if (s.hint) setPlaceholder(s.hint)
      else setPlaceholder(DEFAULT_PLACEHOLDER)

      if (s.restore) setRestore({ fn: s.restore })
      if (s.value) input.value = s.value
      else input.value = ''
      input.focus()
    })
  }, [filtered, onCommand, onHide])

  const onInputEnter = useCallback(() => {
    if (!inputRef.current) return
    command?.fn(inputRef.current.value)
      .then(s => {
        if (!s) onHide()
        if (s && s.success) onHide()
      })
  }, [onHide, command])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (!inputRef.current) return
    switch (e.key) {
    case 'Enter': {
      switch (mode) {
      case ECommandMode.Input:
        onInputEnter()
        break
      default:
        onSelectCommand(select)
      }
      break
    }
    case 'ArrowUp': {
      e.preventDefault()
      const newSelect = (select + filtered.length - 1) % filtered.length
      setSelect(newSelect)
      break
    }
    case 'ArrowDown': {
      e.preventDefault()
      const newSelect = (select + 1) % filtered.length
      setSelect(newSelect)
      break
    }
    case 'Escape': {
      onHide()
      break
    }
    }
  }, [select, filtered, mode, onInputEnter, onSelectCommand, onHide])

  return (
    <div className="fixed top-0 left-0">
      {!isHidden &&
      <div ref={commandRef} className="w-screen h-screen bg-opacity-50
                                     bg-black flex font-light">
        <div className="w-full mx-5 md:mx-auto md:mt-56 mt-8 mb-auto
                        md:w-[500pt] rounded-memo overflow-hidden">
          <div className="flex bg-mbg-1 space-x-3 px-3">
            {mode !== ECommandMode.Input &&
             <div className='my-auto'>
               <BsTerminalFill />
             </div>
            }
            <input ref={inputRef}
              className="text-mt-0 bg-mbg-1 md:text-base font-light text-mbase
                         py-2 w-full outline-none rounded-none"
              placeholder={placeholder}
              type="text"
              onKeyUp={e => onKey(e.nativeEvent)}
            />
            {/* <button className="md:hidden w-16 bg-mbg-2 text-mtext-dim-1">run</button> */}
          </div>
          {mode !== ECommandMode.Input &&
          <div ref={listRef} className="max-h-[336px] bg-mbg-base rounded-b-memo
                                        overflow-y-auto snap-y scroll-auto">
            {filtered.map((cmd, index) => (
              <div key={`${cmd}-${index.toString().padStart(2, '0')}`}
                className={`md:h-[28px] h-10 w-full pl-3 select-none 
                            flex snap-start hover:bg-mbg-hover 
                            cursor-pointer border-none active:bg-mbg-active
                            ${index === select ? 'bg-mbg-active' : ''}`}
                onClick={_ => onSelectCommand(index)}>
                <span className="my-auto overflow-x-auto whitespace-nowrap">{cmd}</span>
              </div>
            ))}
            {filtered.length === 0 && commandList.length !== 0 &&
            <div className="h-[28px] pl-3 flex">
              <span className='my-auto'>no result...</span>
            </div>
            }
          </div>
          }
        </div>
      </div>
      }
    </div>
  )
})

Component.displayName = 'CommandPalette'
export const CommandPalette = React.memo(Component)
