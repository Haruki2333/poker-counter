const app = getApp();

Page({
  data: {
    recentRooms: [],
    showCreateModal: false,
    showJoinModal: false,
    roomName: '',
    chipAmount: '',
    roomCode: ''
  },

  onLoad() {
    this.getRecentRooms()
  },

  // 获取最近房间列表
  async getRecentRooms() {
    try {
      const result = await app.call({
        path: '/api/room/recent',
        method: 'GET'
      })

      if (result.retCode === 'SUCCESS') {
        if (Array.isArray(result.data.rooms)) {
          // 使用 app 实例中的 formatTime 方法
          const formattedRooms = result.data.rooms.map(room => ({
            ...room,
            createdTime: app.formatTime(room.createdTime)
          }));
          
          this.setData({
            recentRooms: formattedRooms
          })
        }
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
  },

  // 显示创建房间弹窗
  onCreateRoom() {
    this.setData({
      showCreateModal: true
    })
  },

  // 关闭弹窗
  onCloseModal() {
    this.setData({
      showCreateModal: false,
      showJoinModal: false,
      roomName: '',
      chipAmount: '',
      roomCode: ''
    })
  },

  // 监听房间名称输入
  onRoomNameInput(e) {
    this.setData({
      roomName: e.detail.value
    })
  },

  // 监听码量输入
  onChipAmountInput(e) {
    this.setData({
      chipAmount: e.detail.value
    })
  },

  // 确认创建房间
  async onConfirmCreate() {
    const { roomName, chipAmount } = this.data

    if (!roomName.trim()) {
      wx.showToast({
        title: '请输入房间名称',
        icon: 'none'
      })
      return
    }

    if (!chipAmount || isNaN(chipAmount)) {
      wx.showToast({
        title: '请输入正确的码量',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({
        title: '创建中...',
        mask: true
      })

      const result = await app.call({
        path: '/api/room/create',
        method: 'POST',
        data: {
          roomName: roomName.trim(),
          chipAmount: Number(chipAmount)
        }
      })

      wx.hideLoading()

      if (result.retCode === 'SUCCESS') {
        this.onCloseModal()
        wx.navigateTo({
          url: `/pages/room/index?roomId=${result.data.roomInfo.roomId}`
        })
      } else {
        wx.showToast({
          title: '创建房间失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('创建房间失败:', error)
      wx.showToast({
        title: '创建房间失败',
        icon: 'none'
      })
    }
  },

  // 显示加入房间弹窗
  onJoinRoom() {
    this.setData({
      showJoinModal: true
    })
  },

  // 监听房间号输入
  onRoomCodeInput(e) {
    this.setData({
      roomCode: e.detail.value
    })
  },

  // 确认加入房间
  async onConfirmJoin() {
    const { roomCode } = this.data

    if (!roomCode.trim()) {
      wx.showToast({
        title: '请输入房间号',
        icon: 'none'
      })
      return
    }

    await this.joinRoom(roomCode.trim(), true)
  },

  // 点击房间号处理函数
  async onTapRoomCode(e) {
    const roomCode = e.currentTarget.dataset.roomCode
    await this.joinRoom(roomCode)
  },

  // 加入房间公共方法
  async joinRoom(roomCode, needClose = false) {
    try {
      wx.showLoading({
        title: '加入中...',
        mask: true
      })

      const result = await app.call({
        path: '/api/room/join',
        method: 'POST',
        data: { roomCode }
      })

      wx.hideLoading()

      if (result.retCode === 'SUCCESS') {
        if (needClose) {
          this.onCloseModal()
        }
        wx.navigateTo({
          url: `/pages/room/index?roomId=${result.data.roomInfo.roomId}`
        })
      } else {
        wx.showToast({
          title: '加入房间失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('加入房间失败:', error)
      wx.showToast({
        title: '加入房间失败',
        icon: 'none'
      })
    }
  }
})
