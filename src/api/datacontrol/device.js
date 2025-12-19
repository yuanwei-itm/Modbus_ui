import request from '@/utils/request'

// 查询设备列表
export function listDevice(query) {
  return request({
    url: '/datacontrol/device/list', 
    params: query
  })
}