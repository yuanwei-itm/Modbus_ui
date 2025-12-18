<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" label-width="68px">
      <el-form-item label="设备ID" prop="deviceId">
        <el-input
          v-model="queryParams.deviceId"
          placeholder="请输入设备ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="['00:00:00', '23:59:59']"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row style="background:#fff;padding:16px 16px 0;margin-bottom:32px;">
       <div id="chart-container" style="width: 100%; height: 350px;"></div>
    </el-row>

    <el-table v-loading="loading" :data="dataList">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="设备ID" align="center" prop="deviceId" />
      <el-table-column label="设备名称" align="center" prop="deviceName" />
      <el-table-column label="温度(℃)" align="center" prop="temperature" />
      <el-table-column label="湿度(%RH)" align="center" prop="humidity" />
      <el-table-column label="采集时间" align="center" prop="readTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.readTime) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
// 引入定义的 API
import { listModbusData } from "@/api/datacontrol/modbus";
// 引入 ECharts
import * as echarts from 'echarts';

export default {
  name: "ModbusHistory",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 总条数
      total: 0,
      // 表格数据
      dataList: [],
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        deviceId: undefined
      },
      // 图表实例
      chart: null
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询列表 */
    getList() {
      this.loading = true;
      // 若依封装的添加日期范围方法
      listModbusData(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.dataList = response.rows;
        this.total = response.total;
        this.loading = false;
        
        // 数据回来后，更新图表
        this.initChart();
      });
    },
    /** 初始化图表 (简单的 ECharts 示例) */
   /** 初始化图表 */
    initChart() {
      // 1. 数据处理
      const reversedData = this.dataList.slice().reverse();
      
      const xData = reversedData.map(item => item.readTime);
      // 提取温度数据
      const yTemp = reversedData.map(item => item.temperature);
      // 提取湿度数据
      const yHum = reversedData.map(item => item.humidity);

      // 2. 初始化 dom
      if (!this.chart) {
        this.chart = echarts.init(document.getElementById('chart-container'));
      }
      
      // 3. 设置配置项
      this.chart.setOption({
        title: { text: '温湿度趋势图' },
        tooltip: { trigger: 'axis' },
        // 显示图例，点击可以隐藏/显示特定线条
        legend: { 
          data: ['温度', '湿度'] 
        },
        xAxis: { type: 'category', data: xData },
        // 配置双 Y 轴
        yAxis: [
          {
            type: 'value',
            name: '温度(℃)',
            axisLabel: { formatter: '{value} °C' }
          },
          {
            type: 'value',
            name: '湿度(%RH)',
            axisLabel: { formatter: '{value} %' },
            // 将湿度轴放在右侧
            position: 'right', 
            // 避免刻度线重叠
            splitLine: { show: false } 
          }
        ],
        series: [
          {
            // 温度线条配置
            name: '温度',
            type: 'line',
            smooth: true,
            data: yTemp,
            yAxisIndex: 0, // 对应左侧第一个 Y 轴
            itemStyle: { color: '#ff4949' } // 设为红色代表温度
          },
          {
            // 湿度线条配置
            name: '湿度',
            type: 'line',
            smooth: true,
            data: yHum,
            yAxisIndex: 1, 
            itemStyle: { color: '#409EFF' } // 设为蓝色代表湿度
          }
        ]
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    }
  }
};
</script>