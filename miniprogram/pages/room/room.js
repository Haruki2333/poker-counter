// pages/room/index.js
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    roomInfo: {},
    userDetail: {},
    transactionRecords: [],
    allPlayerDetails: [],
    activeTab: 'transactions',
    showNicknameModal: false,
    newNickname: '',
    showSettleModal: false,
    settleAmount: '',
    showBuyInModal: false,
    buyInAmount: '',
    touchStartX: 0, // 触摸开始位置
    touchEndX: 0,   // 触摸结束位置
    refreshingTransactions: false, // 流水记录刷新状态
    refreshingPlayers: false      // 玩家列表刷新状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.roomData) {
      const roomData = JSON.parse(decodeURIComponent(options.roomData));
      // 格式化时间并添加是否最近10分钟的标记
      const formattedRecords = roomData.transactionRecords ? roomData.transactionRecords.map(record => {
        const now = new Date();
        // 将 yyyyMMddHHmmss 转换为 Date 对象
        const recordTime = new Date(
          record.timestamp.substring(0, 4),   // 年
          record.timestamp.substring(4, 6)-1,  // 月(0-11)
          record.timestamp.substring(6, 8),    // 日
          record.timestamp.substring(8, 10),   // 时
          record.timestamp.substring(10, 12),  // 分
          record.timestamp.substring(12, 14)   // 秒
        );
        const isRecent = (now - recordTime) <= 10 * 60 * 1000; // 10分钟内
        return {
          ...record,
          formattedTime: app.formatTime(record.timestamp),
          isRecent
        };
      }) : [];
      
      this.setData({
        roomInfo: roomData.roomInfo,
        userDetail: roomData.userDetail,
        transactionRecords: formattedRecords,
        allPlayerDetails: roomData.allPlayerDetails
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const roomCode = this.data.roomInfo.roomCode;
    const roomName = this.data.roomInfo.roomName || '好友房间';
    return {
      title: `邀请你加入【${roomName}】`,
      path: `/pages/index/index?roomCode=${roomCode}`,
      success: function(res) {
        wx.showToast({
          title: '分享成功',
          icon: 'success'
        });
      }
    }
  },

  // 加入房间刷新数据
  async joinRoom(roomId) {
    try {
      wx.showLoading({
        title: '刷新中...',
        mask: true
      })

      const result = await app.call({
        path: '/api/room/join',
        method: 'POST',
        data: { roomId }
      })

      wx.hideLoading()

      if (result.retCode === 'SUCCESS') {
        const now = new Date();
        const formattedRecords = result.data.transactionRecords.map(record => {
          // 将 yyyyMMddHHmmss 转换为 Date 对象
          const recordTime = new Date(
            record.timestamp.substring(0, 4),   // 年
            record.timestamp.substring(4, 6)-1,  // 月(0-11)
            record.timestamp.substring(6, 8),    // 日
            record.timestamp.substring(8, 10),   // 时
            record.timestamp.substring(10, 12),  // 分
            record.timestamp.substring(12, 14)   // 秒
          );
          return {
            ...record,
            formattedTime: app.formatTime(record.timestamp),
            isRecent: (now - recordTime) <= 10 * 60 * 1000
          };
        });
        
        // 更新页面数据
        this.setData({
          roomInfo: result.data.roomInfo,
          userDetail: result.data.userDetail,
          transactionRecords: formattedRecords,
          allPlayerDetails: result.data.allPlayerDetails
        });
      } else {
        wx.showToast({
          title: '刷新数据失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('刷新房间数据失败:', error)
      wx.showToast({
        title: '刷新数据失败',
        icon: 'none'
      })
    }
  },

  // 带入操作
  async handleBuyIn() {
    this.setData({
      showBuyInModal: true,
      buyInAmount: ''
    });
  },

  // 结算操作
  async handleSettle() {
    this.setData({
      showSettleModal: true,
      settleAmount: ''
    });
  },

  // 取消结算
  async handleCancelSettle() {
    try {
      wx.showLoading({
        title: '取消结算中...',
        mask: true
      });

      const result = await app.call({
        path: '/api/room/cancelSettle', 
        method: 'POST',
        data: {
          roomId: this.data.roomInfo.roomId
        }
      });

      wx.hideLoading();

      if (result.retCode === 'SUCCESS') {
        wx.showToast({
          title: '取消结算成功',
          icon: 'success'
        });
        // 刷新房间数据
        this.joinRoom(this.data.roomInfo.roomId);
      } else {
        wx.showToast({
          title: '取消结算失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('取消结算操作失败:', error);
      wx.showToast({
        title: '取消结算失败',
        icon: 'none'
      });
    }
  },

  // 新增：切换标签方法
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
  },

  // 在 Page 对象中添加以下方法
  handleUpdateNickname() {
    this.setData({
      showNicknameModal: true,
      newNickname: ''
    });
  },

  // 在 Page 对象中添加以下方法
  handleFinalAmountInput(e) {
    const finalAmount = Number(e.detail.value) || 0;
    const buyIn = Number(this.data.userDetail.buyIn) || 0;
    const profitLoss = finalAmount - buyIn;

    this.setData({
      'userDetail.finalAmount': finalAmount,
      'userDetail.profitLoss': profitLoss
    });
  },

  onCloseModal() {
    this.setData({
      showNicknameModal: false,
      newNickname: ''
    });
  },

  onNicknameInput(e) {
    const value = e.detail.value;
    let validStr = '';
    let currentLen = 0;
    
    for (let char of value) {
      const charLen = app.getStringLength(char);
      if (currentLen + charLen <= 12) {
        validStr += char;
        currentLen += charLen;
      } else {
        break;
      }
    }
    
    this.setData({
      newNickname: validStr
    });
  },

  async onConfirmUpdateNickname() {
    const { newNickname } = this.data;
    
    if (!newNickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    const len = app.getStringLength(newNickname.trim());
    if (len > 12) {
      wx.showToast({
        title: '昵称长度不能超过12个字符',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({
        title: '更新中...',
        mask: true
      });

      const result = await app.call({
        path: '/api/user/update-nickname',
        method: 'POST',
        data: {
          nickname: newNickname.trim()
        }
      });

      wx.hideLoading();

      if (result.retCode === 'SUCCESS') {
        this.onCloseModal();
        wx.showToast({
          title: '昵称修改成功',
          icon: 'success'
        });
        // 刷新房间数据以更新显示
        this.joinRoom(this.data.roomInfo.roomId);
      } else {
        wx.showToast({
          title: '昵称修改失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('修改昵称失败:', error);
      wx.showToast({
        title: '修改昵称失败',
        icon: 'none'
      });
    }
  },

  onSettleAmountInput(e) {
    this.setData({
      settleAmount: e.detail.value
    });
  },

  onCloseSettleModal() {
    this.setData({
      showSettleModal: false,
      settleAmount: ''
    });
  },

  async onConfirmSettle() {
    const { settleAmount } = this.data;
    const finalAmount = Number(settleAmount);
    
    if (!settleAmount.trim()) {
      wx.showToast({
        title: '请输入筹码数量',
        icon: 'none'
      });
      return;
    }

    if (isNaN(finalAmount)) {
      wx.showToast({
        title: '请输入有效数字',
        icon: 'none'
      });
      return;
    }

    if (finalAmount > 100000000) {
      wx.showToast({
        title: '结算金额不能超过1亿',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({
        title: '结算中...',
        mask: true
      });

      const result = await app.call({
        path: '/api/room/settle',
        method: 'POST',
        data: {
          roomId: this.data.roomInfo.roomId,
          finalAmount: finalAmount
        }
      });

      wx.hideLoading();

      if (result.retCode === 'SUCCESS') {
        this.onCloseSettleModal();
        wx.showToast({
          title: '结算成功',
          icon: 'success'
        });
        // 刷新房间数据
        this.joinRoom(this.data.roomInfo.roomId);
      } else {
        wx.showToast({
          title: '结算失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('结算操作失败:', error);
      wx.showToast({
        title: '结算失败',
        icon: 'none'
      });
    }
  },

  onBuyInAmountInput(e) {
    this.setData({
      buyInAmount: e.detail.value
    });
  },

  onCloseBuyInModal() {
    this.setData({
      showBuyInModal: false,
      buyInAmount: ''
    });
  },

  async onConfirmBuyIn() {
    const { buyInAmount } = this.data;
    const amount = Number(buyInAmount);
    
    if (!buyInAmount.trim()) {
      wx.showToast({
        title: '请输入带入筹码',
        icon: 'none'
      });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      wx.showToast({
        title: '请输入有效数字',
        icon: 'none'
      });
      return;
    }

    if (amount > 100000000) {
      wx.showToast({
        title: '带入金额不能超过1亿',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({
        title: '处理中...',
        mask: true
      });

      const result = await app.call({
        path: '/api/room/buyIn',
        method: 'POST',
        data: {
          roomId: this.data.roomInfo.roomId,
          buyInAmount: amount
        }
      });

      wx.hideLoading();

      if (result.retCode === 'SUCCESS') {
        this.onCloseBuyInModal();
        wx.showToast({
          title: '带入成功',
          icon: 'success'
        });
        // 刷新房间数据
        this.joinRoom(this.data.roomInfo.roomId);
      } else {
        wx.showToast({
          title: '带入失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('带入操作失败:', error);
      wx.showToast({
        title: '带入失败',
        icon: 'none'
      });
    }
  },

  // 添加触摸事件处理函数
  handleTouchStart(e) {
    this.setData({
      touchStartX: e.touches[0].clientX
    });
  },

  handleTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const moveX = touchEndX - this.data.touchStartX;
    
    // 判断滑动方向和距离(大于50像素才触发)
    if (Math.abs(moveX) > 50) {
      if (moveX > 0) {
        // 向右滑动，切换到前一个tab
        if (this.data.activeTab === 'players') {
          this.setData({ activeTab: 'transactions' });
        }
      } else {
        // 向左滑动，切换到后一个tab
        if (this.data.activeTab === 'transactions') {
          this.setData({ activeTab: 'players' });
        }
      }
    }
  },

  // 流水记录下拉刷新
  async onTransactionsRefresh() {
    this.setData({ refreshingTransactions: true });
    try {
      await this.joinRoom(this.data.roomInfo.roomId);
    } finally {
      this.setData({ refreshingTransactions: false });
    }
  },

  // 玩家列表下拉刷新
  async onPlayersRefresh() {
    this.setData({ refreshingPlayers: true });
    try {
      await this.joinRoom(this.data.roomInfo.roomId);
    } finally {
      this.setData({ refreshingPlayers: false });
    }
  }
})