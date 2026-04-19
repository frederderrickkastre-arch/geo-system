// Thin ECharts entry that only registers the chart types / components we
// actually use. Replaces `import * as echarts from 'echarts'` which pulls
// in every renderer, chart, and theme. Typical savings: ~60% of the
// minified ECharts chunk after gzip.
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer,
])

export const graphic = echarts.graphic
export const init = echarts.init
export type EChartsType = echarts.ECharts
export default echarts
