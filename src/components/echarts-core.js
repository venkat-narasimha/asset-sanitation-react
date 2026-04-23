import * as echarts from 'echarts/core'

import { BarChart, PieChart } from 'echarts/charts'

import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'

import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
])

export default echarts

export { BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent }