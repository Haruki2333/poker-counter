const app = getApp();

Page({
  data: {
    recentRooms: [],
    showCreateModal: false,
    showJoinModal: false,
    roomName: '',
    chipAmount: '',
    roomCode: '',
    isFirstShow: true  // 添加标记位
  },

  onLoad(options) {
    // 处理分享进入的情况
    if (options.roomCode) {
      // 通过分享链接进入，直接加入房间
      this.joinRoom(options.roomCode);
      return;
    }

    this.getRecentRooms()
  },

  onShow() {
    // 只有非首次显示时才刷新房间信息
    if (!this.data.isFirstShow) {
      this.getRecentRooms()
    }
    this.setData({
      isFirstShow: false
    })
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
    const value = e.detail.value;
    const len = app.getStringLength(value);
    
    if (len > 32) {
      // 如果超出长度限制，截取合适长度的字符串
      let validStr = '';
      let currentLen = 0;
      
      for (let i = 0; i < value.length; i++) {
        const char = value[i];
        const charLen = app.getStringLength(char);
        
        if (currentLen + charLen <= 32) {
          validStr += char;
          currentLen += charLen;
        } else {
          break;
        }
      }
      
      this.setData({
        roomName: validStr
      });
    } else {
      this.setData({
        roomName: value
      });
    }
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
        title: '请输入正确的筹码',
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
        // 将接口返回的数据编码后通过 URL 参数传递
        const roomData = encodeURIComponent(JSON.stringify(result.data))
        wx.navigateTo({
          url: `/pages/room/room?roomData=${roomData}`
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
    const { roomCode } = this.data;
    
    if (!roomCode.trim()) {
      wx.showToast({
        title: '请输入房间号',
        icon: 'none'
      });
      return;
    }
    
    // 添加房间号格式校验
    if (!/^\d{6}$/.test(roomCode)) {
      wx.showToast({
        title: '房间号必须是6位数字',
        icon: 'none'
      });
      return;
    }
    
    await this.joinRoom(roomCode, true);
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
        // 将接口返回的数据编码后通过 URL 参数传递
        const roomData = encodeURIComponent(JSON.stringify(result.data))
        wx.navigateTo({
          url: `/pages/room/room?roomData=${roomData}`
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
