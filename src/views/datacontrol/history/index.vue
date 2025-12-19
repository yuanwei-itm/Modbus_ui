<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" label-width="68px">
      <el-form-item label="设备选择" prop="deviceId">
        <el-select 
          v-model="queryParams.deviceId" 
          placeholder="请选择或输入设备ID" 
          clearable 
          filterable 
          allow-create 
          default-first-option
          @change="handleQuery"
        >
          <el-option
            v-for="item in deviceOptions"
            :key="item.deviceId"
            :label="item.deviceName"
            :value="item.deviceId"
          />
        </el-select>
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
// 引入设备列表 API 
import { listDevice } from "@/api/datacontrol/device";
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
      // 设备下拉选项数据
      deviceOptions: [],
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
    // 页面加载时，优先获取设备列表
    this.getDeviceList();
  },
  methods: {
    //获取设备列表并设置默认值 
    getDeviceList() {
      // 查询所有设备，pageSize 设置大一点以获取全部
      listDevice({ pageNum: 1, pageSize: 1000 }).then(response => {
        this.deviceOptions = response.rows;
        
        // 逻辑：如果有设备数据，默认选中第一个
        if (this.deviceOptions && this.deviceOptions.length > 0) {
          this.queryParams.deviceId = this.deviceOptions[0].deviceId;
          // 选中后，触发查询加载数据和图表
          this.getList();
        } else {
          // 如果没有设备，也把 loading 去掉
          this.loading = false;
        }
      });
    },

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

    /** 初始化图表 (双Y轴配置) */
    initChart() {
      // 1. 确保实例存在
      if (!this.chart) {
        this.chart = echarts.init(document.getElementById('chart-container'));
      }

      // 2. 空状态保护：如果没选设备，显示提示
      if (!this.queryParams.deviceId) {
          this.chart.clear();
          this.chart.setOption({
             title: { 
               text: '请在上方选择设备，以查看趋势图', 
               left: 'center', 
               top: 'center', 
               textStyle: { color: '#909399', fontSize: 16 } 
             },
             xAxis: { show: false },
             yAxis: { show: false }
          });
          return;
      }

      // 3. 准备数据
      const reversedData = this.dataList.slice().reverse();
      const xData = reversedData.map(item => item.readTime);
      const yTemp = reversedData.map(item => item.temperature);
      const yHum = reversedData.map(item => item.humidity);
      
      // 4. 设置配置项 (双 Y 轴)
      this.chart.setOption({
        title: { text: '温湿度趋势图', left: 'left', top: 'top' },
        tooltip: { trigger: 'axis' },
        legend: { data: ['温度', '湿度'] },
        xAxis: { type: 'category', data: xData, show: true },
        yAxis: [
          { 
            type: 'value', 
            name: '温度(℃)', 
            show: true, 
            axisLabel: { formatter: '{value} °C' } 
          },
          { 
            type: 'value', 
            name: '湿度(%RH)', 
            show: true, 
            position: 'right', // 放在右侧
            axisLabel: { formatter: '{value} %' }, 
            splitLine: { show: false } 
          }
        ],
        series: [
          { 
            name: '温度', 
            type: 'line', 
            smooth: true, 
            data: yTemp, 
            yAxisIndex: 0, 
            itemStyle: { color: '#ff4949' } 
          },
          { 
            name: '湿度', 
            type: 'line', 
            smooth: true, 
            data: yHum, 
            yAxisIndex: 1, 
            itemStyle: { color: '#409EFF' } 
          }
        ]
      }, true); // true 表示不合并，完全重置配置
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
      // 重置后重新获取一下设备列表，保证回到默认选中状态
      this.getDeviceList();
    }
  }
};
</script>