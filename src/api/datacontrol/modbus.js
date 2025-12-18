import request from '@/utils/request'


// 查询历史数据列表
export function listModbusData(query) 
{
  return request({
    url: '/api/history-data/query',
    method: 'get',
    params: query
  })
}



// 获取实时监控数据 (只读缓存)
export function getRealTimeData() 
{
  return request({
    url: '/api/realtime-data/realtime',
    method: 'get'
  })
}

// 触发硬件采集最新数据
export function triggerHardwareCollection() 
{
  return request({
    url: '/api/realtime-data/trigger',
    method: 'post'
  })
}