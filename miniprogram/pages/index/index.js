const app = getApp();
Page({
  data: {
    recentRooms: []
  },

  onLoad() {
    this.getRecentRooms()
  },

  // 获取最近房间列表
  async getRecentRooms() {
    try {
      const result = await app.call({
        path: '/poker/room/recent',
        method: 'GET' 
      })
      
      if (result.retCode === 'SUCCESS') {
        const rooms = result.rooms.map(room => ({
          roomId: room.roomId,
          roomCode: room.roomCode,
          roomName: room.roomName,
          chipAmount: room.chipAmount,
          createdTime: room.createdTime
        }))
        this.setData({
          recentRooms: rooms
        })
      } else {
        wx.showToast({
          title: '获取房间列表失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取最近房间列表失败:', error)
      wx.showToast({
        title: '获取房间列表失败',
        icon: 'none'
      })
    }
  }
})
