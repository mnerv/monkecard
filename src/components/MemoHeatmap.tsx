import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { IActivity } from '@models/user'

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const BOX_SIZE    = 10
const BOX_PADDING = 3
const BOX_R       = 1.5

function mapRange(x: number, in_min: number, in_max: number, out_min: number, out_max: number) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
}

interface DayProps {
  data: IActivity
  color: number
  x: number
  y: number
}

const Day: React.FC<DayProps> = (props) => {
  const { data, color, x, y } = props
  return (
    <rect width={BOX_SIZE} height={BOX_SIZE} x={x} y={y}
      rx={BOX_R} ry={BOX_R}
      data-date={data.date.toLocaleDateString('en-SE')}
      data-count={data.count.toString()}
      data-active={data.active.toFixed(2)}
      fill={`#${color.toString(16)}`}
    ></rect>
  )
}

interface IWeek {
  activities: IActivity[],
  colors: number[]
  x: number
  y: number
}

const Week: React.FC<IWeek> = (props) => {
  const { activities, colors, x, y } = props
  return (
    <g x={x} y={y}>
      {activities.map((data, i) => {
        const index = Math.round(mapRange(data.active, 0, 1, 0, colors.length - 1))
        const color = index === 0 && data.count > 0 ? colors[1] : colors[index]
        return (<Day data={data} key={i}
          x={x} y={i * (BOX_PADDING + BOX_SIZE) + y}
          color={color} />
        )})}
    </g>
  )
}

const WeekNames: React.FC = (props) => {
  return (
    <div className="flex flex-col mr-[5px] text-mtext-dim-1 text-xs mt-[20px]">
      {['mon', '', 'wed', '', 'fri', '', ''].map((v, i) => (
        <div className="h-[10px] rounded-sm mb-[3px] last:m-0" key={i}>
          {v}
        </div>
      ))}
    </div>
  )
}

interface MemoHeatmapProps {
  heats: IActivity[]
  colors: [number, number]
  startWeekday?: number
}

/**
 * Linear interpolation
 * @param colorA Hex color
 * @param colorB Hex color
 * @param ratio Interpolation ratio
 * @returns Interpolated hex color
 */
function linearInterpolate(colorA: number, colorB: number, ratio: number) {
  const ar = (colorA >> 16) & 0xFF
  const ag = (colorA >> 8)  & 0xFF
  const ab = colorA & 0xFF
  const br = (colorB >> 16) & 0xFF
  const bg = (colorB >> 8)  & 0xFF
  const bb = colorB & 0xFF
  return Math.floor((br - ar) * ratio + ar) << 16 |  // red
         Math.floor((bg - ag) * ratio + ag) << 8  |  // green
         Math.floor((bb - ab) * ratio + ab)          // blue
}

const Component: React.FC<MemoHeatmapProps> = (props) => {
  const { heats, colors } = props
  const [heatmap, setHeatmap] = useState<ReactElement[]>()
  const startWeekday = props.startWeekday ?? 1  // Default: Monday
  const colorLevels  = useMemo(() => {
    return Array(5).fill(0).map((_, i) => {
      const ratio = i / 4
      return linearInterpolate(colors[0], colors[1], ratio)
    })
  }, [colors])
  const weeks = useMemo(() => {
    let dayCount = 0
    return heats.reduce((acc, day, i, arr) => {
      dayCount++
      if (day.date.getDay() === startWeekday) {  // start of week
        acc.push(arr.slice(i, i + dayCount))
        dayCount = 0
      }
      return acc
    }, [] as IActivity[][])
  }, [heats, startWeekday])
  const months = useMemo(() => {
    // NOTE: This needs to be optimized
    return weeks.reduce((acc, week, i) => {
      const dayIndex = week.findIndex(d => d.date.getDate() === 1)
      if (dayIndex !== -1) {
        const day = week[dayIndex]
        acc.push(day.date.getMonth())
      } else {
        acc.push(-1)
      }
      return acc
    }, [] as number[])
      .map((m, i) => [m, i]).filter(([m]) => m !== -1)
  }, [weeks])
  const conRef = useRef<HTMLDivElement>(null)
  const toolRef = useRef<HTMLDivElement>(null)

  const onMouseHover = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target) return
    const date = target.getAttribute('data-date')
    const count = target.getAttribute('data-count')
    if (!date || !count) return
    if (toolRef.current) {
      const block = target.getBoundingClientRect()
      const toolblock = toolRef.current.getBoundingClientRect()
      toolRef.current.textContent = `${count} on ${date} `
      toolRef.current.style.display = 'block'

      if (block.x + toolblock.width > window.innerWidth)
        toolRef.current.style.left = `${block.x - toolblock.width + block.width}px`
      else
        toolRef.current.style.left = `${block.x}px`
      toolRef.current.style.top = `${block.y - 3 * block.height}px`
    }
  }, [])
  const onMouseLeave = useCallback((e: MouseEvent) => {
    if (toolRef.current) {
      toolRef.current.style.display = 'none'
    }
  }, [])

  useEffect(() => {
    if (!conRef.current) return
    const el = conRef.current
    el.addEventListener('mousemove', onMouseHover)
    el.addEventListener('mouseleave', onMouseLeave)
    return () => {
      el.removeEventListener('mousemove', onMouseHover)
      el.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [onMouseHover, onMouseLeave])

  useEffect(() => {
    setHeatmap(
      weeks.map((week, i) => (
        <Week activities={week} key={i}
          colors={colorLevels}
          x={i * (BOX_SIZE + BOX_PADDING) + 2}
          y={20} />
      ))
    )
    if (conRef.current)
      conRef.current.scrollLeft = conRef.current.scrollWidth
  }, [heats, weeks, colorLevels])

  return (
    <div className="bg-mbg-1 px-3 pb-2 pt-2 mx-auto rounded">
      <div className="flex m-1">
        <WeekNames />
        <div className="overflow-auto scroll-hide" ref={conRef}>
          <div className="absolute bg-mbg-3 px-3 py-1 rounded overflow-auto hidden
                          pointer-events-none min-w-min whitespace-nowrap" ref={toolRef}>
          </div>
          <svg className="text-mtext-dim-1"
            width={`${weeks.length * (BOX_SIZE + BOX_PADDING) + 2}px`}
            height={`${7 * (BOX_SIZE + BOX_PADDING) + 20}px`}>
            {months.map(([month, i]) => (
              <text key={i} x={i * (BOX_SIZE + BOX_PADDING) + 2} y={12}
                fontSize='11px'
                fill='currentColor'>
                {MONTH_NAMES[month]}
              </text>
            ))}
            {heatmap}
          </svg>
        </div>
      </div>
      <div className='flex text-sm justify-end text-mtext-dim-1 mr-auto'>
        <span className='mr-2'>less</span>
        <div className='flex'>
          {colorLevels.map((color, i) => (
            <span key={i}
              className="h-[10px] w-[10px] rounded-sm mr-[3px] my-auto last:mr-0"
              style={{ backgroundColor: `#${color.toString(16)}` }} />
          ))}
        </div>
        <span className='ml-2'>more</span>
      </div>
    </div>
  )
}

export const MemoHeatmap = React.memo(Component)
