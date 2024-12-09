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
    isFirstShow: true  // 添加标记位
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
    // 只有非首次显示时才刷新房间列表
    if (!this.data.isFirstShow) {
      this.joinRoom(this.data.roomInfo.roomId);
    }
    this.setData({
      isFirstShow: false
    })
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
    const roomName = this.data.roomInfo.roomName || '德州扑克房间';
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
    try {
      wx.showLoading({
        title: '处理中...',
        mask: true
      });

      const result = await app.call({
        path: '/api/room/buyIn',
        method: 'POST',
        data: {
          roomId: this.data.roomInfo.roomId
        }
      });

      wx.hideLoading();

      if (result.retCode === 'SUCCESS') {
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

  // 结算操作
  async handleSettle() {
    wx.showModal({
      title: '结算',
      editable: true,
      placeholderText: '请输入最终筹码',
      success: async (res) => {
        if (res.confirm) {
          const finalAmount = Number(res.content);
          if (isNaN(finalAmount)) {
            wx.showToast({
              title: '请输入有效数字',
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
        }
      }
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
  async handleUpdateNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新的昵称',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            wx.showLoading({
              title: '更新中...',
              mask: true
            });

            const result = await app.call({
              path: '/api/user/update-nickname',
              method: 'POST',
              data: {
                nickname: res.content
              }
            });

            wx.hideLoading();

            if (result.retCode === 'SUCCESS') {
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
        }
      }
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
})