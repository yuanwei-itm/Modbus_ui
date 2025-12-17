<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-refresh"
          size="mini"
          :loading="btnLoading"
          @click="handleManualRefresh"
        >立即刷新</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-tag v-if="loading">数据加载中...</el-tag>
        <el-tag type="success" v-else>数据已更新 (每30秒自动刷新)</el-tag>
      </el-col>
    </el-row>

    <el-row :gutter="20" v-loading="loading" element-loading-text="正在读取硬件数据，请稍候...">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in deviceList" :key="item.deviceId" style="margin-bottom: 20px;">
        <el-card class="box-card" shadow="hover">
          <div slot="header" class="clearfix">
            <span style="font-weight: bold">
              <i class="el-icon-monitor"></i> {{ item.deviceName || '未知设备' }}
            </span>
            <el-tag size="mini" :type="getStatusType(item.readTime)" style="float: right">
              {{ getStatusText(item.readTime) }}
            </el-tag>
          </div>
          
          <div class="monitor-content">
            <div class="monitor-item">
              <span class="label">温度</span>
              <span class="value" :class="getTempColor(item.temperature)">
                {{ item.temperature }} ℃
              </span>
            </div>
            <el-divider direction="vertical"></el-divider>
            <div class="monitor-item">
              <span class="label">湿度</span>
              <span class="value" style="color: #409EFF">
                {{ item.humidity }} %RH
              </span>
            </div>
          </div>

          <div class="monitor-footer">
            <i class="el-icon-time"></i> 上次更新：{{ parseTime(item.readTime) }}
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-empty v-if="deviceList.length === 0" description="暂无在线设备"></el-empty>
  </div>
</template>

<script>
// 引入两个接口
import { getRealTimeData, triggerHardwareCollection } from "@/api/datacontrol/modbus";

export default {
  name: "RealTimeData",
  data() {
    return {
      deviceList: [],
      timer: null,
      loading: false,    // 全局遮罩
      btnLoading: false  // 按钮转圈
    };
  },
  created() {
    this.getList();
    this.startPolling();
  },
  beforeDestroy() {
    this.stopPolling();
  },
  methods: {
    /** 1. 点击“立即刷新”按钮 */
    handleManualRefresh() {
      // 停止自动轮询，防止冲突
      this.stopPolling();
      
      this.btnLoading = true;
      this.loading = true; // 开启大遮罩，因为硬件读取可能需要几秒
      
      // 调用后端触发采集
      triggerHardwareCollection().then(() => {
        this.$message.success("硬件采集完成，正在更新数据...");
        
        // 采集完了，再去查库获取最新结果
        this.getList();
        
        // 恢复按钮状态
        this.btnLoading = false;
        // 重新开启自动轮询
        this.startPolling();
      }).catch(err => {
        this.loading = false;
        this.btnLoading = false;
        this.$message.error("采集指令超时或失败");
        this.startPolling();
      });
    },

    /** 2. 获取数据 (定时任务用) */
    getList() {
      getRealTimeData().then(response => {
        this.deviceList = response.data || [];
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },

    /** 开启轮询 */
    startPolling() {
      // 避免重复开启
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => {
        // 定时只拉数据，不触发采集
        this.getList();
      }, 5000);
    },
    
    /** 停止轮询 */
    stopPolling() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },

    // --- 以下是辅助方法 ---
    getStatusType(timeStr) {
      if (!timeStr) return 'info';
      const lastTime = new Date(timeStr).getTime();
      const now = new Date().getTime();
      return (now - lastTime) < 300000 ? 'success' : 'danger';
    },
    getStatusText(timeStr) {
      return this.getStatusType(timeStr) === 'success' ? '在线' : '离线';
    },
    getTempColor(val) {
      if (val > 30) return 'text-danger';
      if (val < 10) return 'text-primary';
      return 'text-success';
    }
  }
};
</script>

<style scoped>
.monitor-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 15px 0;
}
.monitor-item {
  text-align: center;
}
.monitor-item .label {
  display: block;
  font-size: 13px;
  color: #909399;
  margin-bottom: 5px;
}
.monitor-item .value {
  font-size: 24px;
  font-weight: bold;
}
.monitor-footer {
  border-top: 1px solid #ebeef5;
  padding-top: 10px;
  font-size: 12px;
  color: #909399;
  text-align: right;
}
.text-danger { color: #F56C6C; }
.text-success { color: #67C23A; }
.text-primary { color: #409EFF; }
</style>